import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { createServerApp } from '../../server/app';
import { ServerDatabase } from '../../server/db';
import { MAX_ATTACHMENT_BYTES } from '../../server/uploads';

interface StartedUploadServer {
  baseUrl: string;
  db: ServerDatabase;
  uploadDir: string;
  close: () => Promise<void>;
}

async function startUploadServer(): Promise<StartedUploadServer> {
  const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stavparta-phase3-uploads-'));
  const db = new ServerDatabase(':memory:', { uploadDir });
  const { app } = createServerApp({
    db,
    disableRateLimit: true,
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const addr = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${addr.port}`,
    db,
    uploadDir,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      db.close();
      fs.rmSync(uploadDir, { recursive: true, force: true });
    },
  };
}

const VALID_PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
]);
const VALID_JPG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const VALID_PDF_BYTES = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF\n', 'ascii');

const VALID_LEAD_PAYLOAD = {
  name: 'Petra Dvořáková',
  email: 'petra.dvorakova@example.cz',
  phone: '+420 777 123 456',
  serviceId: 'srv-bytova-jadra',
  serviceTitle: 'Kompletní renovace bytových jader',
  location: 'Zábřeh na Moravě',
  description: 'Prosím o nacenění renovace jádra podle přiloženého půdorysu.',
  gdprConsent: true,
};

describe('Phase 3 Lead Attachments (multer, magic bytes, private download, cleanup)', () => {
  const servers: StartedUploadServer[] = [];

  afterEach(async () => {
    while (servers.length > 0) {
      const srv = servers.pop();
      if (srv) await srv.close();
    }
  });

  it('stores valid JPG/PNG/PDF attachments outside public folder, requires admin auth to download, and deletes disk files on lead deletion', async () => {
    const srv = await startUploadServer();
    servers.push(srv);

    const setupRes = await fetch(`${srv.baseUrl}/api/admin/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
      },
      body: JSON.stringify({ password: 'UploadTestPassword2026!' }),
    });
    expect(setupRes.status).toBe(201);
    const cookieHeader = setupRes.headers.get('set-cookie')?.split(';')[0] ?? '';

    const formData = new FormData();
    formData.append('payload', JSON.stringify(VALID_LEAD_PAYLOAD));
    formData.append('attachments', new Blob([VALID_PNG_BYTES], { type: 'image/png' }), '../../koupelna.png');
    formData.append('attachments', new Blob([VALID_JPG_BYTES], { type: 'image/jpeg' }), 'stav.jpg');
    formData.append('attachments', new Blob([VALID_PDF_BYTES], { type: 'application/pdf' }), 'pudorys.pdf');

    const createRes = await fetch(`${srv.baseUrl}/api/leads`, {
      method: 'POST',
      body: formData,
    });
    expect(createRes.status).toBe(201);

    const createBody = (await createRes.json()) as {
      lead: {
        id: string;
        attachments?: Array<{ id?: string; name: string; type: string; url?: string }>;
      };
    };

    const attachments = createBody.lead.attachments ?? [];
    expect(attachments.length).toBe(3);
    expect(attachments[0].name).toBe('koupelna.png');
    expect(attachments[0].url).toMatch(/^\/api\/admin\/attachments\/att-/);

    const filesOnDisk = fs.readdirSync(srv.uploadDir);
    expect(filesOnDisk.length).toBe(3);
    expect(filesOnDisk.some((f) => f.includes('koupelna'))).toBe(false);

    // Unauthenticated download must fail with 401
    const unauthDownload = await fetch(`${srv.baseUrl}${attachments[2].url}`);
    expect(unauthDownload.status).toBe(401);

    // Authenticated download returns file with nosniff
    const authPngRes = await fetch(`${srv.baseUrl}${attachments[0].url}`, {
      headers: { Cookie: cookieHeader },
    });
    expect(authPngRes.status).toBe(200);
    expect(authPngRes.headers.get('x-content-type-options')).toBe('nosniff');
    expect(authPngRes.headers.get('content-type')).toContain('image/png');
    const downloadedPng = Buffer.from(await authPngRes.arrayBuffer());
    expect(downloadedPng.equals(VALID_PNG_BYTES)).toBe(true);

    const authPdfRes = await fetch(`${srv.baseUrl}${attachments[2].url}`, {
      headers: { Cookie: cookieHeader },
    });
    expect(authPdfRes.status).toBe(200);
    expect(authPdfRes.headers.get('content-disposition')).toContain('attachment');

    // Deleting lead removes files from disk as well
    const delRes = await fetch(`${srv.baseUrl}/api/admin/leads/${createBody.lead.id}`, {
      method: 'DELETE',
      headers: {
        'X-Requested-With': 'fetch',
        Cookie: cookieHeader,
      },
    });
    expect(delRes.status).toBe(200);
    expect(fs.readdirSync(srv.uploadDir).length).toBe(0);
  });

  it('rejects spoofed magic bytes, oversized files (>5 MB), and more than 5 files without writing to disk', async () => {
    const srv = await startUploadServer();
    servers.push(srv);

    // Spoofed executable disguised as image/png
    const spoofedForm = new FormData();
    spoofedForm.append('payload', JSON.stringify(VALID_LEAD_PAYLOAD));
    spoofedForm.append(
      'attachments',
      new Blob([Buffer.from('MZ<script>alert(1)</script>')], { type: 'image/png' }),
      'trojan.png'
    );
    const spoofRes = await fetch(`${srv.baseUrl}/api/leads`, {
      method: 'POST',
      body: spoofedForm,
    });
    expect(spoofRes.status).toBe(400);
    expect(fs.readdirSync(srv.uploadDir).length).toBe(0);

    // Oversized file (>5 MB)
    const bigBuffer = Buffer.alloc(MAX_ATTACHMENT_BYTES + 1024, 0x00);
    VALID_PNG_BYTES.copy(bigBuffer, 0);
    const bigForm = new FormData();
    bigForm.append('payload', JSON.stringify(VALID_LEAD_PAYLOAD));
    bigForm.append('attachments', new Blob([bigBuffer], { type: 'image/png' }), 'huge.png');
    const bigRes = await fetch(`${srv.baseUrl}/api/leads`, {
      method: 'POST',
      body: bigForm,
    });
    expect(bigRes.status).toBe(400);
    expect(fs.readdirSync(srv.uploadDir).length).toBe(0);

    // More than 5 files
    const manyForm = new FormData();
    manyForm.append('payload', JSON.stringify(VALID_LEAD_PAYLOAD));
    for (let i = 0; i < 6; i++) {
      manyForm.append(
        'attachments',
        new Blob([VALID_PNG_BYTES], { type: 'image/png' }),
        `img-${i}.png`
      );
    }
    const manyRes = await fetch(`${srv.baseUrl}/api/leads`, {
      method: 'POST',
      body: manyForm,
    });
    expect(manyRes.status).toBe(400);
    expect(fs.readdirSync(srv.uploadDir).length).toBe(0);
  });
});
