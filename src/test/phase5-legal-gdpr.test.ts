import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { createServerApp } from '../../server/app';
import { ServerDatabase } from '../../server/db';

interface StartedPhase5Server {
  baseUrl: string;
  db: ServerDatabase;
  tempDir: string;
  uploadDir: string;
  close: () => Promise<void>;
}

async function startPhase5Server(): Promise<StartedPhase5Server> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stavparta-phase5-'));
  const uploadDir = path.join(tempDir, 'uploads');
  const db = new ServerDatabase(path.join(tempDir, 'stavparta.db'), { uploadDir });
  const { app } = createServerApp({ db, disableRateLimit: true });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const addr = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${addr.port}`,
    db,
    tempDir,
    uploadDir,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      db.close();
      fs.rmSync(tempDir, { recursive: true, force: true });
    },
  };
}

describe('Phase 5 Legal, Font Hosting, Map Consent & GDPR Erasure', () => {
  const servers: StartedPhase5Server[] = [];

  afterEach(async () => {
    while (servers.length > 0) {
      const srv = servers.pop();
      if (srv) await srv.close();
    }
  });

  it('hosts Plus Jakarta Sans locally with zero Google Fonts links in index.html', () => {
    const rootDir = path.resolve(__dirname, '../..');
    const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
    const mainTsx = fs.readFileSync(path.join(rootDir, 'src/main.tsx'), 'utf-8');

    expect(html).not.toContain('fonts.googleapis.com');
    expect(html).not.toContain('fonts.gstatic.com');
    expect(mainTsx).toContain('@fontsource/plus-jakarta-sans');
  });

  it('requires explicit consent before loading CARTO map tiles and uses accurate VAT/scope disclosures', () => {
    const rootDir = path.resolve(__dirname, '../..');
    const mapSrc = fs.readFileSync(
      path.join(rootDir, 'src/components/ServiceAreaMapSection.tsx'),
      'utf-8'
    );
    const quoteSrc = fs.readFileSync(
      path.join(rootDir, 'src/components/QuotationGeneratorModal.tsx'),
      'utf-8'
    );

    expect(mapSrc).toContain('mapConsentGranted');
    expect(mapSrc).toContain('Načíst interaktivní mapu');
    expect(quoteSrc).toContain('Sazbu DPH a režim přenesené daňové povinnosti potvrďte s daňovým poradcem');
    expect(quoteSrc).not.toContain('12% pro bydlení dle zákona ČR');
    expect(quoteSrc).toContain('certificationNumber');
  });

  it('enforces auth on /api/admin/gdpr/erase and erases matching leads, attachments on disk, and subscribers', async () => {
    const srv = await startPhase5Server();
    servers.push(srv);

    // Unauthenticated GDPR erase attempt must be rejected
    const unauthRes = await fetch(`${srv.baseUrl}/api/admin/gdpr/erase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
      },
      body: JSON.stringify({ email: 'klient@example.com' }),
    });
    expect(unauthRes.status).toBe(401);

    // Setup admin session
    const setupRes = await fetch(`${srv.baseUrl}/api/admin/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
      },
      body: JSON.stringify({ password: 'Phase5TestPassword!' }),
    });
    expect(setupRes.status).toBe(201);
    const cookieHeader = setupRes.headers.get('set-cookie')?.split(';')[0] ?? '';

    // Submit target lead with valid PNG attachment + target newsletter subscriber
    const targetEmail = 'Vymaz.Klient@Example.CZ';
    const pngBytes = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);
    const formData = new FormData();
    formData.append(
      'payload',
      JSON.stringify({
        name: 'Petr Výmaz',
        email: targetEmail,
        serviceId: 'srv-bytova-jadra',
        serviceTitle: 'Kompletní renovace bytových jader',
        location: 'Zábřeh na Moravě',
        description: 'Žádost o kompletní renovaci koupelny včetně podlahy.',
        gdprConsent: true,
        formLoadedAt: Date.now() - 5000,
      })
    );
    formData.append('attachments', new Blob([pngBytes], { type: 'image/png' }), 'koupelna.png');

    const leadRes = await fetch(`${srv.baseUrl}/api/leads`, {
      method: 'POST',
      body: formData,
    });
    expect(leadRes.status).toBe(201);

    // Unrelated lead that must survive erasure
    const keepLeadRes = await fetch(`${srv.baseUrl}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jana Ponechat',
        email: 'ponechat@example.com',
        serviceId: 'srv-sadrokartony',
        serviceTitle: 'Sádrokartony a konstrukce',
        location: 'Olomouc',
        description: 'Montáž akustických podhledů v obývacím pokoji.',
        gdprConsent: true,
        formLoadedAt: Date.now() - 5000,
      }),
    });
    expect(keepLeadRes.status).toBe(201);

    // Subscribe target email to newsletter
    const subRes = await fetch(`${srv.baseUrl}/api/newsletter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'vymaz.klient@example.cz',
        consent: true,
        source: 'footer_newsletter',
      }),
    });
    expect(subRes.status).toBe(201);

    const filesBefore = fs.existsSync(srv.uploadDir) ? fs.readdirSync(srv.uploadDir) : [];
    expect(filesBefore.length).toBe(1);

    // Invalid email must fail Zod validation
    const invalidRes = await fetch(`${srv.baseUrl}/api/admin/gdpr/erase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    expect(invalidRes.status).toBe(400);

    // Execute authenticated GDPR erasure
    const eraseRes = await fetch(`${srv.baseUrl}/api/admin/gdpr/erase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ email: 'vymaz.klient@example.cz' }),
    });
    expect(eraseRes.status).toBe(200);
    const eraseBody = (await eraseRes.json()) as {
      ok: boolean;
      normalizedEmail: string;
      deletedLeadsCount: number;
      deletedAttachmentsCount: number;
      deletedSubscribersCount: number;
    };

    expect(eraseBody.ok).toBe(true);
    expect(eraseBody.normalizedEmail).toBe('vymaz.klient@example.cz');
    expect(eraseBody.deletedLeadsCount).toBe(1);
    expect(eraseBody.deletedAttachmentsCount).toBe(1);
    expect(eraseBody.deletedSubscribersCount).toBe(1);

    // Attachment removed from disk
    const filesAfter = fs.existsSync(srv.uploadDir) ? fs.readdirSync(srv.uploadDir) : [];
    expect(filesAfter.length).toBe(0);

    // Unrelated lead survived
    const remainingLeads = srv.db.listLeads();
    expect(remainingLeads.some((l) => l.email === 'vymaz.klient@example.cz')).toBe(false);
    expect(remainingLeads.some((l) => l.email === 'ponechat@example.com')).toBe(true);
  });
});
