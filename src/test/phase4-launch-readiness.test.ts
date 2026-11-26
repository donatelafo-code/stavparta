import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { AddressInfo } from 'node:net';
import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
import { createServerApp } from '../../server/app';
import { ServerDatabase } from '../../server/db';
import { INITIAL_PROJECTS, INITIAL_SETTINGS, INITIAL_TESTIMONIALS } from '../shared/seedData';
import { getLaunchReadinessMissingItems } from '../shared/launchReadiness';

interface StartedPhase4Server {
  baseUrl: string;
  db: ServerDatabase;
  tempDir: string;
  close: () => Promise<void>;
}

async function startPhase4Server(dbPath?: string): Promise<StartedPhase4Server> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stavparta-phase4-'));
  const resolvedDbPath = dbPath || path.join(tempDir, 'stavparta.db');
  const db = new ServerDatabase(resolvedDbPath, { uploadDir: path.join(tempDir, 'uploads') });
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
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      db.close();
      fs.rmSync(tempDir, { recursive: true, force: true });
    },
  };
}

describe('Phase 4 Demo Removal, Hardcoded Data Cleanup & Launch Readiness', () => {
  const servers: StartedPhase4Server[] = [];

  afterEach(async () => {
    while (servers.length > 0) {
      const srv = servers.pop();
      if (srv) await srv.close();
    }
  });

  it('has no hardcoded fake phone or placeholder ICO/DIC in seed settings and reports missing launch items', () => {
    expect(INITIAL_SETTINGS.phone).toBe('');
    expect(INITIAL_SETTINGS.ico).toBe('');
    expect(INITIAL_SETTINGS.dic).toBe('');
    expect(INITIAL_SETTINGS.isPublicLaunchReady).toBe(false);

    const missingInitial = getLaunchReadinessMissingItems(
      INITIAL_SETTINGS,
      INITIAL_PROJECTS,
      INITIAL_TESTIMONIALS
    );
    expect(missingInitial).toContain('Telefonní číslo firmy');
    expect(missingInitial).toContain('IČO');
    expect(missingInitial).toContain('DIČ (nebo uveďte „neplátce DPH“)');
    expect(missingInitial.some((item) => item.includes('DEMO realizace'))).toBe(true);
    expect(missingInitial.some((item) => item.includes('DEMO reference'))).toBe(true);

    const readyItems = getLaunchReadinessMissingItems(
      {
        ...INITIAL_SETTINGS,
        phone: '+420 603 111 222',
        email: 'info@stavparta.cz',
        ico: '12345678',
        dic: 'neplátce DPH',
        addressNotice: 'Hlavní 10, Zábřeh na Moravě',
      },
      [],
      []
    );
    expect(readyItems).toEqual([]);
  });

  it('strips legacy +420 777 000 000 and placeholder ICO/DIC from pre-existing SQLite databases', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stavparta-legacy-db-'));
    const dbFile = path.join(tempDir, 'legacy.db');

    // Create a legacy database containing old placeholder values
    const rawDb = new Database(dbFile);
    rawDb.exec(`
      CREATE TABLE settings (id INTEGER PRIMARY KEY CHECK (id = 1), json TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      INSERT INTO meta (key, value) VALUES ('seed_initialized', '1');
    `);
    rawDb
      .prepare('INSERT INTO settings (id, json, updated_at) VALUES (1, ?, ?)')
      .run(
        JSON.stringify({
          ...INITIAL_SETTINGS,
          phone: '+420 777 000 000',
          ico: 'Údaj k doplnění před spuštěním',
          dic: 'CZ (k doplnění)',
        }),
        new Date().toISOString()
      );
    rawDb.close();

    const srv = await startPhase4Server(dbFile);
    servers.push(srv);

    const settings = srv.db.getSettings();
    expect(settings.phone).toBe('');
    expect(settings.ico).toBe('');
    expect(settings.dic).toBe('');
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('deletes all demo projects and testimonials on /api/admin/maintenance/clear-demo and verifies clean state + settings launch readiness', async () => {
    const srv = await startPhase4Server();
    servers.push(srv);

    const setupRes = await fetch(`${srv.baseUrl}/api/admin/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
      },
      body: JSON.stringify({ password: 'LaunchCheckPassword2026!' }),
    });
    expect(setupRes.status).toBe(201);
    const cookieHeader = setupRes.headers.get('set-cookie')?.split(';')[0] ?? '';

    // Saving empty required phone field must fail validation with 400
    const badSettingsRes = await fetch(`${srv.baseUrl}/api/admin/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ phone: '   ' }),
    });
    expect(badSettingsRes.status).toBe(400);

    // Save real company data
    const validSettingsRes = await fetch(`${srv.baseUrl}/api/admin/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        phone: '+420 608 222 333',
        email: 'kontakt@stavparta.cz',
        ico: '87654321',
        dic: 'neplátce DPH',
        addressNotice: 'Nádražní 15, 789 01 Zábřeh na Moravě',
      }),
    });
    expect(validSettingsRes.status).toBe(200);
    // Still not launch ready until demo items are cleared
    const savedBody = (await validSettingsRes.json()) as {
      settings: { isPublicLaunchReady: boolean };
    };
    expect(savedBody.settings.isPublicLaunchReady).toBe(false);

    // Clear demo items via maintenance endpoint
    const clearRes = await fetch(`${srv.baseUrl}/api/admin/maintenance/clear-demo`, {
      method: 'POST',
      headers: {
        'X-Requested-With': 'fetch',
        Cookie: cookieHeader,
      },
    });
    expect(clearRes.status).toBe(200);
    const clearBody = (await clearRes.json()) as {
      settings: { isPublicLaunchReady: boolean };
      projects: Array<{ isDemo: boolean }>;
      testimonials: Array<{ isDemo: boolean }>;
      remainingDemoProjects: number;
      remainingDemoTestimonials: number;
      verifiedClean: boolean;
    };

    expect(clearBody.verifiedClean).toBe(true);
    expect(clearBody.remainingDemoProjects).toBe(0);
    expect(clearBody.remainingDemoTestimonials).toBe(0);
    expect(clearBody.projects.some((p) => p.isDemo)).toBe(false);
    expect(clearBody.testimonials.some((t) => t.isDemo)).toBe(false);
    expect(clearBody.settings.isPublicLaunchReady).toBe(true);

    // Public bootstrap also reflects clean state
    const bootstrapRes = await fetch(`${srv.baseUrl}/api/public/bootstrap`);
    expect(bootstrapRes.status).toBe(200);
    const bootstrapBody = (await bootstrapRes.json()) as {
      projects: unknown[];
      testimonials: unknown[];
      settings: { isPublicLaunchReady: boolean; phone: string };
    };
    expect(bootstrapBody.projects.length).toBe(0);
    expect(bootstrapBody.testimonials.length).toBe(0);
    expect(bootstrapBody.settings.isPublicLaunchReady).toBe(true);
    expect(bootstrapBody.settings.phone).toBe('+420 608 222 333');
  });
});
