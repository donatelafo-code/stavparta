import http from 'node:http';
import { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { createServerApp } from '../../server/app';
import { ServerDatabase } from '../../server/db';

interface StartedServer {
  baseUrl: string;
  db: ServerDatabase;
  close: () => Promise<void>;
}

async function startTestServer(options?: {
  disableRateLimit?: boolean;
  nowFn?: () => number;
}): Promise<StartedServer> {
  const db = new ServerDatabase(':memory:');
  const { app } = createServerApp({
    db,
    disableRateLimit: options?.disableRateLimit ?? true,
    nowFn: options?.nowFn,
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const addr = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${addr.port}`,
    db,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      db.close();
    },
  };
}

describe('Phase 1 Backend API (leads, newsletter, rate-limit, bootstrap)', () => {
  const activeServers: StartedServer[] = [];

  afterEach(async () => {
    while (activeServers.length > 0) {
      const srv = activeServers.pop();
      if (srv) await srv.close();
    }
  });

  it('rejects invalid lead payload with fieldErrors (400)', async () => {
    const srv = await startTestServer();
    activeServers.push(srv);

    const res = await fetch(`${srv.baseUrl}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'A',
        email: 'spatny-email',
        location: '',
        description: 'krátké',
        gdprConsent: false,
      }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as {
      error: string;
      fieldErrors?: Record<string, string>;
    };
    expect(body.fieldErrors?.name).toBeTruthy();
    expect(body.fieldErrors?.email).toBeTruthy();
    expect(body.fieldErrors?.location).toBeTruthy();
    expect(body.fieldErrors?.description).toBeTruthy();
  });

  it('blocks honeypot bots and ultra-fast form submissions (400)', async () => {
    let fakeNow = 10_000;
    const srv = await startTestServer({ nowFn: () => fakeNow });
    activeServers.push(srv);

    const validBase = {
      name: 'Karel Horák',
      email: 'karel@example.cz',
      phone: '+420 777 123 456',
      serviceId: 'srv-bytova-jadra',
      serviceTitle: 'Kompletní renovace bytových jader',
      location: 'Zábřeh na Moravě',
      description: 'Rekonstrukce bytového jádra včetně nové sanity a obkladů.',
      gdprConsent: true,
    };

    const honeypotRes = await fetch(`${srv.baseUrl}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validBase, honeypot: 'http://spam.invalid' }),
    });
    expect(honeypotRes.status).toBe(400);

    const fastRes = await fetch(`${srv.baseUrl}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validBase, formLoadedAt: 9_500 }),
    });
    expect(fastRes.status).toBe(400);

    fakeNow = 12_000;
    const okRes = await fetch(`${srv.baseUrl}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validBase, formLoadedAt: 9_500 }),
    });
    expect(okRes.status).toBe(201);
  });

  it('persists new leads, updates status and notes, and deletes cleanly', async () => {
    const srv = await startTestServer();
    activeServers.push(srv);

    const setupRes = await fetch(`${srv.baseUrl}/api/admin/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
      },
      body: JSON.stringify({ password: 'TestPassword123!' }),
    });
    expect(setupRes.status).toBe(201);
    const cookieHeader = setupRes.headers.get('set-cookie')?.split(';')[0] ?? '';
    expect(cookieHeader).toContain('stavparta_admin_session=');

    const createRes = await fetch(`${srv.baseUrl}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Petr Malý',
        email: 'petr.maly@example.cz',
        phone: '+420 603 222 333',
        serviceId: 'srv-rekonstrukce-bytu',
        serviceTitle: 'Rekonstrukce bytů a domů',
        location: 'Olomouc',
        preferredTimeline: 'Červen 2026',
        description: 'Celková rekonstrukce bytu 2+kk včetně podlah a omítek.',
        gdprConsent: true,
      }),
    });

    expect(createRes.status).toBe(201);
    const createdBody = (await createRes.json()) as { lead: { id: string; status: string } };
    const createdId = createdBody.lead.id;
    expect(createdId).toMatch(/^lead-/);
    expect(createdBody.lead.status).toBe('nova');

    const statusRes = await fetch(`${srv.baseUrl}/api/admin/leads/${createdId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ status: 'kontaktovano' }),
    });
    expect(statusRes.status).toBe(200);
    const statusBody = (await statusRes.json()) as { lead: { status: string; notes: unknown[] } };
    expect(statusBody.lead.status).toBe('kontaktovano');
    expect(statusBody.lead.notes.length).toBe(2);

    const noteRes = await fetch(`${srv.baseUrl}/api/admin/leads/${createdId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ text: 'Domluveno zaměření na úterý 14:00.' }),
    });
    expect(noteRes.status).toBe(201);

    const listRes = await fetch(`${srv.baseUrl}/api/admin/leads`, {
      headers: { Cookie: cookieHeader },
    });
    expect(listRes.status).toBe(200);
    const listBody = (await listRes.json()) as { leads: Array<{ id: string }> };
    expect(listBody.leads.some((l) => l.id === createdId)).toBe(true);

    const delRes = await fetch(`${srv.baseUrl}/api/admin/leads/${createdId}`, {
      method: 'DELETE',
      headers: {
        'X-Requested-With': 'fetch',
        Cookie: cookieHeader,
      },
    });
    expect(delRes.status).toBe(200);
  });

  it('enforces rate limit on POST /api/leads (429)', async () => {
    const srv = await startTestServer({ disableRateLimit: false });
    activeServers.push(srv);

    const payload = {
      name: 'Test Klient',
      email: 'klient@example.cz',
      serviceId: 'srv-bytova-jadra',
      serviceTitle: 'Kompletní renovace bytových jader',
      location: 'Šumperk',
      description: 'Testovací poptávka pro ověření rate limitu.',
      gdprConsent: true,
    };

    let lastStatus = 0;
    for (let i = 0; i < 11; i++) {
      const res = await fetch(`${srv.baseUrl}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      lastStatus = res.status;
    }

    expect(lastStatus).toBe(429);
  });

  it('persists newsletter subscriptions, blocks duplicates (409), and leaks no PII in bootstrap', async () => {
    const srv = await startTestServer();
    activeServers.push(srv);

    const subRes = await fetch(`${srv.baseUrl}/api/newsletter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'novinky@example.cz',
        consent: true,
      }),
    });
    expect(subRes.status).toBe(201);

    const dupRes = await fetch(`${srv.baseUrl}/api/newsletter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'NOVINKY@example.cz',
        consent: true,
      }),
    });
    expect(dupRes.status).toBe(409);

    const bootRes = await fetch(`${srv.baseUrl}/api/public/bootstrap`);
    expect(bootRes.status).toBe(200);
    const bootBody = (await bootRes.json()) as Record<string, unknown>;
    expect(bootBody.leads).toBeUndefined();
    expect(bootBody.subscribers).toBeUndefined();
    expect(Array.isArray(bootBody.services)).toBe(true);
  });
});
