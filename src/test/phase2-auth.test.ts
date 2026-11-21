import http from 'node:http';
import { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { createServerApp } from '../../server/app';
import { ServerDatabase } from '../../server/db';

interface StartedAuthServer {
  baseUrl: string;
  db: ServerDatabase;
  close: () => Promise<void>;
}

async function startAuthServer(options?: {
  initialAdminPassword?: string;
  nowFn?: () => number;
}): Promise<StartedAuthServer> {
  const nowFn = options?.nowFn ?? (() => Date.now());
  const db = new ServerDatabase(':memory:', {
    initialAdminPassword: options?.initialAdminPassword ?? '',
    nowFn,
  });
  const { app } = createServerApp({
    db,
    disableRateLimit: true,
    nowFn,
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

describe('Phase 2 Admin Authentication, Sessions, Lockout & CSRF', () => {
  const servers: StartedAuthServer[] = [];

  afterEach(async () => {
    while (servers.length > 0) {
      const srv = servers.pop();
      if (srv) await srv.close();
    }
  });

  it('returns 401 on protected admin endpoints for unauthenticated callers and rejects legacy passwords', async () => {
    const srv = await startAuthServer({ initialAdminPassword: 'StrongInitPassword99!' });
    servers.push(srv);

    const endpoints: Array<{ method: string; path: string }> = [
      { method: 'GET', path: '/api/admin/leads' },
      { method: 'GET', path: '/api/admin/newsletter' },
      { method: 'PATCH', path: '/api/admin/settings' },
      { method: 'POST', path: '/api/admin/maintenance/clear-demo' },
      { method: 'POST', path: '/api/admin/change-password' },
    ];

    for (const ep of endpoints) {
      const res = await fetch(`${srv.baseUrl}${ep.path}`, {
        method: ep.method,
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'fetch',
        },
        body: ep.method === 'GET' ? undefined : JSON.stringify({}),
      });
      expect(res.status).toBe(401);
    }

    // Legacy backdoors must always fail
    for (const legacyPass of ['admin', 'stavparta2026']) {
      const res = await fetch(`${srv.baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'fetch',
        },
        body: JSON.stringify({ username: 'admin', password: legacyPass }),
      });
      expect(res.status).toBe(401);
    }
  });

  it('requires setup when no admin exists, locks setup with 409 afterward, and enforces CSRF', async () => {
    const srv = await startAuthServer();
    servers.push(srv);

    const meBefore = await fetch(`${srv.baseUrl}/api/admin/me`);
    expect(meBefore.status).toBe(200);
    const meBeforeBody = (await meBefore.json()) as {
      authenticated: boolean;
      setupRequired: boolean;
    };
    expect(meBeforeBody.authenticated).toBe(false);
    expect(meBeforeBody.setupRequired).toBe(true);

    // Setup succeeds once
    const setupRes = await fetch(`${srv.baseUrl}/api/admin/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
      },
      body: JSON.stringify({ password: 'MyOwnerPassword2026!' }),
    });
    expect(setupRes.status).toBe(201);
    const setCookie = setupRes.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('HttpOnly');
    const cookieHeader = setCookie.split(';')[0];

    // Second setup attempt must fail with 409
    const secondSetup = await fetch(`${srv.baseUrl}/api/admin/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
      },
      body: JSON.stringify({ password: 'AnotherPassword123!' }),
    });
    expect(secondSetup.status).toBe(409);

    // State-changing request without Origin or X-Requested-With fails CSRF (403)
    const noCsrfRes = await fetch(`${srv.baseUrl}/api/admin/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ workingHours: 'Po–Pá: 8:00–16:00' }),
    });
    expect(noCsrfRes.status).toBe(403);

    // With CSRF header + cookie it succeeds
    const validPatch = await fetch(`${srv.baseUrl}/api/admin/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ workingHours: 'Po–Pá: 8:00–16:00' }),
    });
    expect(validPatch.status).toBe(200);
  });

  it('forces password change on ADMIN_INITIAL_PASSWORD bootstrap and invalidates session on logout/expiry', async () => {
    let fakeNow = 1_700_000_000_000;
    const srv = await startAuthServer({
      initialAdminPassword: 'TempEnvPassword1!',
      nowFn: () => fakeNow,
    });
    servers.push(srv);

    const loginRes = await fetch(`${srv.baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
      },
      body: JSON.stringify({ username: 'admin', password: 'TempEnvPassword1!' }),
    });
    expect(loginRes.status).toBe(200);
    const loginBody = (await loginRes.json()) as {
      user: { mustChangePassword: boolean };
    };
    expect(loginBody.user.mustChangePassword).toBe(true);
    const cookieHeader = loginRes.headers.get('set-cookie')?.split(';')[0] ?? '';

    // Blocked until password is changed
    const blockedLeads = await fetch(`${srv.baseUrl}/api/admin/leads`, {
      headers: { Cookie: cookieHeader },
    });
    expect(blockedLeads.status).toBe(403);

    // Change password
    const changeRes = await fetch(`${srv.baseUrl}/api/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        currentPassword: 'TempEnvPassword1!',
        newPassword: 'PermanentOwnerPass#2026',
      }),
    });
    expect(changeRes.status).toBe(200);

    // Now leads accessible
    const allowedLeads = await fetch(`${srv.baseUrl}/api/admin/leads`, {
      headers: { Cookie: cookieHeader },
    });
    expect(allowedLeads.status).toBe(200);

    // Logout destroys session on server
    const logoutRes = await fetch(`${srv.baseUrl}/api/admin/logout`, {
      method: 'POST',
      headers: {
        'X-Requested-With': 'fetch',
        Cookie: cookieHeader,
      },
    });
    expect(logoutRes.status).toBe(200);

    const afterLogout = await fetch(`${srv.baseUrl}/api/admin/leads`, {
      headers: { Cookie: cookieHeader },
    });
    expect(afterLogout.status).toBe(401);

    // Login again and verify 12h session expiration
    const login2 = await fetch(`${srv.baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
      },
      body: JSON.stringify({ username: 'admin', password: 'PermanentOwnerPass#2026' }),
    });
    expect(login2.status).toBe(200);
    const cookie2 = login2.headers.get('set-cookie')?.split(';')[0] ?? '';

    fakeNow += 13 * 60 * 60 * 1000;
    const expiredRes = await fetch(`${srv.baseUrl}/api/admin/leads`, {
      headers: { Cookie: cookie2 },
    });
    expect(expiredRes.status).toBe(401);
  });

  it('locks admin account after 5 consecutive bad passwords and recovers after lockout period', async () => {
    let fakeNow = 1_700_000_000_000;
    const srv = await startAuthServer({
      initialAdminPassword: 'CorrectPassword123!',
      nowFn: () => fakeNow,
    });
    servers.push(srv);

    for (let i = 0; i < 4; i++) {
      const bad = await fetch(`${srv.baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'fetch',
        },
        body: JSON.stringify({ username: 'admin', password: `WrongPass${i}` }),
      });
      expect(bad.status).toBe(401);
    }

    const fifthBad = await fetch(`${srv.baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
      },
      body: JSON.stringify({ username: 'admin', password: 'WrongPass4' }),
    });
    expect(fifthBad.status).toBe(429);
    expect(fifthBad.headers.get('retry-after')).toBeTruthy();

    // Even valid password must be blocked during lockout window
    const validWhileLocked = await fetch(`${srv.baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
      },
      body: JSON.stringify({ username: 'admin', password: 'CorrectPassword123!' }),
    });
    expect(validWhileLocked.status).toBe(429);

    // Advance 16 minutes -> unlocked
    fakeNow += 16 * 60 * 1000;
    const unlockedOk = await fetch(`${srv.baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
      },
      body: JSON.stringify({ username: 'admin', password: 'CorrectPassword123!' }),
    });
    expect(unlockedOk.status).toBe(200);
  });
});
