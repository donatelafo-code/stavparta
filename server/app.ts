import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { PublicAdminUser, ServerDatabase } from './db';
import { dispatchNewLeadNotifications } from './notifications';
import {
  addLeadNoteSchema,
  adminChangePasswordSchema,
  adminLoginSchema,
  adminSetupSchema,
  chatPayloadSchema,
  createLeadPayloadSchema,
  extractZodFieldErrors,
  fullDatabaseDumpSchema,
  newsletterSubscribeSchema,
  updateLeadStatusSchema,
} from '../src/shared/schemas';

const ADMIN_SESSION_COOKIE = 'stavparta_admin_session';

interface AuthenticatedRequest extends Request {
  adminUser?: PublicAdminUser;
  adminSessionToken?: string;
}

interface AppServiceContext {
  id: string;
  title: string;
  category: string;
  shortDescription: string;
  features: string[];
}

interface AppContextPayload {
  companyName?: string;
  headquarters?: string;
  operatingRegion?: string;
  primaryLocations?: string[];
  phone?: string;
  email?: string;
  workingHours?: string;
  services?: AppServiceContext[];
}

export interface CreateServerAppOptions {
  db?: ServerDatabase;
  disableRateLimit?: boolean;
  nowFn?: () => number;
  initialAdminPassword?: string;
}

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

const isHttpsRequest = (req: Request): boolean => {
  if (req.secure) return true;
  const forwardedProto = req.headers['x-forwarded-proto'];
  if (typeof forwardedProto === 'string') {
    return forwardedProto.split(',')[0].trim().toLowerCase() === 'https';
  }
  return false;
};

const setSessionCookie = (
  req: Request,
  res: Response,
  token: string,
  maxAgeSeconds: number
): void => {
  const attrs = [
    `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
    'HttpOnly',
  ];
  if (isHttpsRequest(req)) {
    attrs.push('Secure', 'SameSite=None', 'Partitioned');
  } else {
    attrs.push('SameSite=Lax');
  }
  res.setHeader('Set-Cookie', attrs.join('; '));
};

const clearSessionCookie = (req: Request, res: Response): void => {
  const attrs = [`${ADMIN_SESSION_COOKIE}=`, 'Path=/', 'Max-Age=0', 'HttpOnly'];
  if (isHttpsRequest(req)) {
    attrs.push('Secure', 'SameSite=None', 'Partitioned');
  } else {
    attrs.push('SameSite=Lax');
  }
  res.setHeader('Set-Cookie', attrs.join('; '));
};

const extractSessionCookie = (req: Request): string => {
  const cookies = (req as Request & { cookies?: Record<string, unknown> }).cookies;
  const raw = cookies?.[ADMIN_SESSION_COOKIE];
  return typeof raw === 'string' ? raw : '';
};

const verifyCsrf = (req: Request, res: Response, next: NextFunction): void => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    next();
    return;
  }

  const xRequestedWith = String(req.headers['x-requested-with'] || '').toLowerCase();
  if (xRequestedWith === 'fetch' || xRequestedWith === 'xmlhttprequest') {
    next();
    return;
  }

  const originHeader = req.headers.origin;
  const hostHeader = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  if (typeof originHeader === 'string' && hostHeader) {
    try {
      const originHost = new URL(originHeader).host;
      if (originHost === hostHeader) {
        next();
        return;
      }
    } catch {
      // Invalid origin falls through to 403
    }
  }

  res.status(403).json({
    error: 'Chybí nebo nesouhlasí CSRF ověření požadavku.',
  });
};

const buildSystemInstruction = (appContext?: AppContextPayload): string => {
  const company = appContext?.companyName || 'STAVPARTA – Stavební práce a rekonstrukce';
  const headquarters = appContext?.headquarters || 'Zábřeh na Moravě (PSČ 789 01)';
  const region = appContext?.operatingRegion || 'Olomoucký kraj';
  const locations =
    appContext?.primaryLocations?.join(', ') ||
    'Zábřeh na Moravě, Šumperk, Mohelnice, Olomouc, Litovel, Prostějov, Přerov, Šternberk';
  const phone = appContext?.phone || '';
  const email = appContext?.email || 'poptavky@stavparta.cz';
  const hours = appContext?.workingHours || 'Po–Pá: 7:00 – 17:00';

  const servicesText =
    appContext?.services && appContext.services.length > 0
      ? appContext.services
          .map(
            (s) =>
              `- [${s.id}] ${s.title} (${s.category}): ${s.shortDescription} | Hlavní body: ${s.features.slice(0, 4).join('; ')}`
          )
          .join('\n')
      : `- [srv-rekonstrukce-bytu] Rekonstrukce bytů a domů
- [srv-bytova-jadra] Kompletní renovace bytových jader
- [srv-zednicke-prace] Zednické a stavební práce
- [srv-sadrokartony] Sádrokartony a konstrukce
- [srv-obklady-dlazby] Obklady, dlažby a podlahy
- [srv-dokoncovaci-prace] Další dokončovací práce`;

  return `Jsi přátelský, věcný a odborný kontextový asistent stavební party ${company}.
Odpovídej VÝHRADNĚ v českém jazyce, stručně a srozumitelně (ideálně 2–5 vět nebo přehledné odrážky).

ZÁKLADNÍ FAKTA Z WEBU:
- Sídlo / centrála: ${headquarters}
- Působnost: ${region} (${locations})
- Kontakt: ${phone ? `Telefon: ${phone} | ` : ''}E-mail: ${email} | Pracovní doba: ${hours}
- První zaměření na místě a položkový rozpočet (rozpadnutý na materiál a práci) jsou v celém Olomouckém kraji zdarma a nezávazně.
- Záruka na provedené stavební dílo je 36 měsíců na základě písemné smlouvy o dílo.
- Platební podmínky: bez placení celé částky předem; platba probhá po etapách (záloha na materiál při zahájení cca 30–40 %, průběžná platba po hrubých rozvodech, doplatek po předání s protokolem).
- Legislativa & SVJ: při běžné renovaci bytového jádra bez zásahu do nosných stěn není potřeba stavební povolení, je však nutné oznámit práce výboru SVJ / bytovému družstvu.

ORIENTAČNÍ CENY A DOBY Z KALKULAČKY NA WEBU (vždy zdůrazni, že jde o orientační odhad před zaměřením):
- Kompletní renovace bytového jádra: 10–15 pracovních dní, orientačně cca 105 000 – 165 000 Kč dle velikosti, sanity a volby obkladů.
- Celková rekonstrukce bytu na klíč: 1+kk cca 140–210 tis. Kč (14–21 dní), 2+kk cca 260–390 tis. Kč (3–4 týdny), 3+kk/3+1 cca 380–540 tis. Kč (4–6 týdnů), 4+kk cca 490–720 tis. Kč (6–8 týdnů).
- Orientační ceny materiálů (vč. práce): lepený vinyl LVT 1 150–1 550 Kč/m², SPC vinyl 1 250–1 680 Kč/m², keramická dlažba 1 450–2 200 Kč/m², laminát AC5 790–1 150 Kč/m², velkoformát 60×120+ cm 2 100–2 950 Kč/m², Ytong příčky 1 450–1 950 Kč/m², akustický SDK 1 350–1 850 Kč/m².
- Na webu najdou klienti také sekci Realizace s krátkými časosběrnými videi přímo ze stavby a sekci Blog & Aktuality (trendy v rekonstrukcích, tipy na údržbu interiéru a průvodce výběrem materiálů pro bytová jádra – Ytong vs. sádrokarton, hydroizolace).

NABÍZENÉ SLUŽBY NA WEBU:
${servicesText}

PRAVIDLA ODPOVĚDI:
1. Vycházej výhradně z výše uvedených informací o službách STAVPARTA. Nevymýšlej služby ani lokality mimo Olomoucký kraj, které parta nedělá. Pokud se uživatel ptá na řemeslo či práci mimo výše uvedených služeb, zdvořile uveď, že tyto práce nezajišťujeme, a nabídni naše stavební, zednické, sádrokartonářské, obkladačské a rekonstrukční služby.
2. Pokud se uživatel ptá na konkrétní zakázku ve svém bytě/domě, poptávku, termín, přesnou cenu nebo zaměření, nastav "suggestLeadForm": true a uveď nejvhodnější "suggestedServiceId" z výše uvedených ID (např. "srv-bytova-jadra", "srv-rekonstrukce-bytu", "srv-obklady-dlazby", "srv-sadrokartony" nebo "srv-zednicke-prace").
3. Do "suggestedPrefillSummary" vlož krátké 1věté shrnutí uživatelova záměru v češtině (prázdný řetězec, pokud suggestLeadForm je false).`;
};

export function createServerApp(options: CreateServerAppOptions = {}) {
  const db =
    options.db ??
    new ServerDatabase(undefined, {
      initialAdminPassword: options.initialAdminPassword,
      nowFn: options.nowFn,
    });
  const now = options.nowFn ?? (() => Date.now());
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    helmet({
      frameguard: false,
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));

  const skipRateLimit = () => Boolean(options.disableRateLimit);

  const leadsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: skipRateLimit,
    message: {
      error: 'Příliš mnoho odeslaných poptávek z vaší adresy. Zkuste to prosím za několik minut.',
    },
  });

  const newsletterLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 15,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: skipRateLimit,
    message: {
      error: 'Příliš mnoho pokusů o registraci novinek. Zkuste to prosím později.',
    },
  });

  const chatLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: skipRateLimit,
    message: {
      error: 'Asistent je dočasně přetížen vaší relací. Zkuste to prosím za chvíli.',
    },
  });

  const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: skipRateLimit,
    message: {
      error: 'Příliš mnoho pokusů o přihlášení z vaší adresy. Zkuste to prosím za několik minut.',
    },
  });

  const requireAdminAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const rawToken = extractSessionCookie(req);
    const user = db.getSessionUser(rawToken);
    if (!user) {
      res.status(401).json({
        error: 'Pro přístup k této části administrace se musíte přihlásit.',
      });
      return;
    }
    req.adminUser = user;
    req.adminSessionToken = rawToken;
    next();
  };

  const requirePasswordUpdated = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (req.adminUser?.mustChangePassword) {
      res.status(403).json({
        error: 'Před pokračováním do administrace si prosím změňte výchozí heslo.',
        code: 'password_change_required',
      });
      return;
    }
    next();
  };

  // Healthcheck
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // Public bootstrap (no PII)
  app.get('/api/public/bootstrap', (_req: Request, res: Response) => {
    res.json(db.getPublicBootstrap());
  });

  // Public Lead Submission
  app.post('/api/leads', leadsLimiter, async (req: Request, res: Response) => {
    const raw = (req.body || {}) as Record<string, unknown>;

    if (typeof raw.honeypot === 'string' && raw.honeypot.trim().length > 0) {
      res.status(400).json({ error: 'Neplatné odeslání formuláře.' });
      return;
    }

    if (typeof raw.formLoadedAt === 'number' && now() - raw.formLoadedAt < 1200) {
      res.status(400).json({
        error: 'Formulář byl odeslán příliš rychle. Počkejte prosím vteřinu a zkuste to znovu.',
        fieldErrors: {
          submit:
            'Formulář byl odeslán příliš rychle. Počkejte prosím vteřinu a zkuste to znovu.',
        },
      });
      return;
    }

    const parsed = createLeadPayloadSchema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors = extractZodFieldErrors(parsed.error);
      const firstError = Object.values(fieldErrors)[0] || 'Zkontrolujte prosím vyplněná pole.';
      res.status(400).json({
        error: firstError,
        fieldErrors,
      });
      return;
    }

    try {
      const lead = db.createLead(parsed.data);
      const notificationResult = await dispatchNewLeadNotifications(lead, db.getSettings());
      res.status(201).json({
        lead,
        notifications: {
          ownerEmailSent: notificationResult.ownerEmailSent,
          customerEmailSent: notificationResult.customerEmailSent,
          telegramSent: notificationResult.telegramSent,
        },
      });
    } catch (err) {
      console.error('Failed to persist lead:', err);
      res.status(500).json({
        error: 'Nepodařilo se uložit poptávku na serveru. Zkuste to prosím znovu.',
      });
    }
  });

  // Public Newsletter Subscription
  app.post('/api/newsletter', newsletterLimiter, (req: Request, res: Response) => {
    const raw = (req.body || {}) as Record<string, unknown>;
    if (typeof raw.honeypot === 'string' && raw.honeypot.trim().length > 0) {
      res.status(400).json({ error: 'Neplatné odeslání formuláře.' });
      return;
    }

    const parsed = newsletterSubscribeSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message || 'Zadejte prosím platnou e-mailovou adresu.';
      res.status(400).json({ error: firstError });
      return;
    }

    const result = db.addSubscriber(
      parsed.data.email,
      parsed.data.source || 'footer_newsletter'
    );
    if (!result.ok) {
      res.status(409).json({
        error: 'Tento e-mail je již k odběru novinek přihlášen.',
      });
      return;
    }

    res.status(201).json({
      subscriber: result.subscriber,
      message: 'Váš e-mail byl úspěšně zaevidován. Děkujeme za zájem!',
    });
  });

  // --- Admin Auth Routes ---
  app.get('/api/admin/me', (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const rawToken = extractSessionCookie(req);
    const user = db.getSessionUser(rawToken);
    if (!user) {
      res.json({
        authenticated: false,
        setupRequired: !db.hasAdminAccount(),
        user: null,
      });
      return;
    }
    res.json({
      authenticated: true,
      setupRequired: false,
      user,
    });
  });

  app.post('/api/admin/setup', verifyCsrf, (req: Request, res: Response) => {
    const parsed = adminSetupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Zadejte prosím platné heslo.',
      });
      return;
    }

    const claim = db.claimInitialAdmin(parsed.data.password);
    if (!claim.ok) {
      res.status(409).json({
        error: 'Účet administrátora je již vytvořen. Použijte standardní přihlášení.',
      });
      return;
    }

    const session = db.createSession(claim.user.id);
    const maxAgeSec = Math.max(1, Math.floor((session.expiresAt - now()) / 1000));
    setSessionCookie(req, res, session.rawToken, maxAgeSec);
    res.status(201).json({ user: claim.user });
  });

  app.post('/api/admin/login', verifyCsrf, adminLoginLimiter, (req: Request, res: Response) => {
    const parsed = adminLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Zadejte přihlašovací údaje.',
      });
      return;
    }

    const loginResult = db.verifyLogin(parsed.data.username, parsed.data.password);
    if ('code' in loginResult) {
      if (loginResult.code === 'locked') {
        res.setHeader('Retry-After', String(loginResult.retryAfterSeconds));
        res.status(429).json({
          error: `Příliš mnoho neúspěšných pokusů. Účet je dočasně uzamčen na ${Math.ceil(loginResult.retryAfterSeconds / 60)} min.`,
        });
        return;
      }
      res.status(401).json({
        error: 'Neplatné uživatelské jméno nebo heslo.',
      });
      return;
    }

    const session = db.createSession(loginResult.user.id);
    const maxAgeSec = Math.max(1, Math.floor((session.expiresAt - now()) / 1000));
    setSessionCookie(req, res, session.rawToken, maxAgeSec);
    res.json({ user: loginResult.user });
  });

  app.post('/api/admin/logout', verifyCsrf, (req: Request, res: Response) => {
    const rawToken = extractSessionCookie(req);
    if (rawToken) {
      db.deleteSession(rawToken);
    }
    clearSessionCookie(req, res);
    res.json({ ok: true });
  });

  app.post(
    '/api/admin/change-password',
    verifyCsrf,
    requireAdminAuth,
    (req: AuthenticatedRequest, res: Response) => {
      const parsed = adminChangePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Zadejte platné stávající a nové heslo.',
        });
        return;
      }

      if (!req.adminUser) {
        res.status(401).json({ error: 'Nejste přihlášeni.' });
        return;
      }

      const changed = db.changePassword(
        req.adminUser.id,
        parsed.data.currentPassword,
        parsed.data.newPassword,
        req.adminSessionToken
      );

      if (!changed.ok) {
        res.status(400).json({
          error: 'Stávající heslo nesouhlasí.',
        });
        return;
      }

      res.json({ user: changed.user });
    }
  );

  // --- Protected Admin Data Routes ---
  const adminRouter = express.Router();
  adminRouter.use(verifyCsrf, requireAdminAuth, requirePasswordUpdated);

  adminRouter.get('/leads', (_req: Request, res: Response) => {
    res.json({ leads: db.listLeads() });
  });

  adminRouter.patch('/leads/:id/status', (req: Request, res: Response) => {
    const parsed = updateLeadStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Neplatný stav poptávky.' });
      return;
    }
    const leadId = String(req.params.id);
    const updated = db.updateLeadStatus(
      leadId,
      parsed.data.status,
      parsed.data.author || 'Admin'
    );
    if (!updated) {
      res.status(404).json({ error: 'Poptávka nebyla nalezena.' });
      return;
    }
    res.json({ lead: updated });
  });

  adminRouter.post('/leads/:id/notes', (req: Request, res: Response) => {
    const parsed = addLeadNoteSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstMsg = parsed.error.issues[0]?.message || 'Neplatná poznámka.';
      res.status(400).json({ error: firstMsg });
      return;
    }
    const leadId = String(req.params.id);
    const updated = db.addLeadNote(leadId, parsed.data.text, parsed.data.author || 'Admin');
    if (!updated) {
      res.status(404).json({ error: 'Poptávka nebyla nalezena.' });
      return;
    }
    res.status(201).json({ lead: updated });
  });

  adminRouter.delete('/leads/:id', (req: Request, res: Response) => {
    const deleted = db.deleteLead(String(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: 'Poptávka nebyla nalezena.' });
      return;
    }
    res.json({ ok: true });
  });

  adminRouter.get('/newsletter', (_req: Request, res: Response) => {
    res.json({ subscribers: db.listSubscribers() });
  });

  adminRouter.delete('/newsletter/:id', (req: Request, res: Response) => {
    const deleted = db.deleteSubscriber(String(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: 'Odběratel nebyl nalezen.' });
      return;
    }
    res.json({ ok: true });
  });

  adminRouter.patch('/settings', (req: Request, res: Response) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      res.status(400).json({ error: 'Neplatný formát nastavení.' });
      return;
    }
    const updated = db.updateSettings(body);
    res.json({ settings: updated });
  });

  adminRouter.post('/services', (req: Request, res: Response) => {
    const created = db.addService(req.body);
    res.status(201).json({ service: created });
  });

  adminRouter.patch('/services/:id', (req: Request, res: Response) => {
    const updated = db.updateService(String(req.params.id), req.body);
    if (!updated) {
      res.status(404).json({ error: 'Služba nebyla nalezena.' });
      return;
    }
    res.json({ service: updated });
  });

  adminRouter.delete('/services/:id', (req: Request, res: Response) => {
    const deleted = db.deleteService(String(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: 'Služba nebyla nalezena.' });
      return;
    }
    res.json({ ok: true });
  });

  adminRouter.post('/projects', (req: Request, res: Response) => {
    const created = db.addProject(req.body);
    res.status(201).json({ project: created });
  });

  adminRouter.patch('/projects/:id', (req: Request, res: Response) => {
    const updated = db.updateProject(String(req.params.id), req.body);
    if (!updated) {
      res.status(404).json({ error: 'Realizace nebyla nalezena.' });
      return;
    }
    res.json({ project: updated });
  });

  adminRouter.delete('/projects/:id', (req: Request, res: Response) => {
    const deleted = db.deleteProject(String(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: 'Realizace nebyla nalezena.' });
      return;
    }
    res.json({ ok: true });
  });

  adminRouter.post('/testimonials', (req: Request, res: Response) => {
    const created = db.addTestimonial(req.body);
    res.status(201).json({ testimonial: created });
  });

  adminRouter.patch('/testimonials/:id', (req: Request, res: Response) => {
    const updated = db.updateTestimonial(String(req.params.id), req.body);
    if (!updated) {
      res.status(404).json({ error: 'Reference nebyla nalezena.' });
      return;
    }
    res.json({ testimonial: updated });
  });

  adminRouter.delete('/testimonials/:id', (req: Request, res: Response) => {
    const deleted = db.deleteTestimonial(String(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: 'Reference nebyla nalezena.' });
      return;
    }
    res.json({ ok: true });
  });

  adminRouter.post('/blog-posts', (req: Request, res: Response) => {
    const created = db.addBlogPost(req.body);
    res.status(201).json({ post: created });
  });

  adminRouter.patch('/blog-posts/:id', (req: Request, res: Response) => {
    const updated = db.updateBlogPost(String(req.params.id), req.body);
    if (!updated) {
      res.status(404).json({ error: 'Článek nebyl nalezen.' });
      return;
    }
    res.json({ post: updated });
  });

  adminRouter.delete('/blog-posts/:id', (req: Request, res: Response) => {
    const deleted = db.deleteBlogPost(String(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: 'Článek nebyl nalezen.' });
      return;
    }
    res.json({ ok: true });
  });

  adminRouter.post('/maintenance/clear-demo', (_req: Request, res: Response) => {
    const settings = db.clearDemoForProduction();
    res.json({
      settings,
      projects: db.listProjects(),
      testimonials: db.listTestimonials(),
    });
  });

  adminRouter.post('/maintenance/reset-demo', (_req: Request, res: Response) => {
    db.resetToDefaults();
    res.json(db.getPublicBootstrap());
  });

  adminRouter.post('/maintenance/restore', (req: Request, res: Response) => {
    const parsed = fullDatabaseDumpSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Soubor neodpovídá platnému formátu zálohy STAVPARTA.' });
      return;
    }
    db.restoreFromDump(parsed.data);
    res.json({
      ok: true,
      bootstrap: db.getPublicBootstrap(),
      leads: db.listLeads(),
      subscribers: db.listSubscribers(),
    });
  });

  app.use('/api/admin', adminRouter);

  // Contextual Chat API
  app.post('/api/chat', chatLimiter, async (req: Request, res: Response) => {
    const parsedChat = chatPayloadSchema.safeParse(req.body);
    if (!parsedChat.success) {
      const firstErr = parsedChat.error.issues[0]?.message || 'Zadejte prosím svůj dotaz.';
      res.status(400).json({ error: firstErr });
      return;
    }

    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error:
          'Asistent není momentálně připojen ke službě Gemini API (chybí konfigurace GEMINI_API_KEY v nastavení Secrets). Můžete ale rovnou využít náš poptávkový formulář.',
      });
      return;
    }

    const validMessages = parsedChat.data.messages.slice(-12);
    const appContext = parsedChat.data.appContext;

    const contents = validMessages.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    const callModelWithRetry = async (attempt = 0): Promise<string> => {
      try {
        const response = await ai.models.generateContent({
          model: process.env.GEMINI_MODEL?.trim() || 'gemini-4-hydrogen',
          contents,
          config: {
            systemInstruction: buildSystemInstruction(appContext),
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reply: {
                  type: Type.STRING,
                  description: 'Stručná a věcná odpověď v češtině na dotaz návštěvníka.',
                },
                suggestLeadForm: {
                  type: Type.BOOLEAN,
                  description:
                    'True pokud uživatel poptává práce, chce zaměření, konkrétní kalkulaci nebo nasměrování do formuláře.',
                },
                suggestedServiceId: {
                  type: Type.STRING,
                  description:
                    'Nejvhodnější ID služby pro formulář (např. srv-bytova-jadra, srv-rekonstrukce-bytu, srv-obklady-dlazby, srv-sadrokartony, srv-zednicke-prace) nebo prázdný řetězec.',
                },
                suggestedPrefillSummary: {
                  type: Type.STRING,
                  description: 'Stručné shrnutí uživatelova požadavku pro předvyplnění formuláře.',
                },
              },
              required: [
                'reply',
                'suggestLeadForm',
                'suggestedServiceId',
                'suggestedPrefillSummary',
              ],
            },
          },
        });
        return (response.text ?? '').trim();
      } catch (err: unknown) {
        const status =
          typeof err === 'object' && err !== null && 'status' in err
            ? Number((err as { status?: number }).status)
            : 0;
        if ((status === 429 || status === 503) && attempt < 1) {
          await new Promise((resolve) => setTimeout(resolve, 650));
          return callModelWithRetry(attempt + 1);
        }
        throw err;
      }
    };

    try {
      const rawJson = await callModelWithRetry();
      if (!rawJson) {
        res
          .status(502)
          .json({ error: 'Asistent nevrátil žádnou odpověď. Zkuste dotaz prosím zopakovat.' });
        return;
      }

      const parsed = JSON.parse(rawJson) as {
        reply?: string;
        suggestLeadForm?: boolean;
        suggestedServiceId?: string;
        suggestedPrefillSummary?: string;
      };

      res.json({
        reply:
          parsed.reply || 'Rád vám pomohu s vašimi dotazy k rekonstrukci nebo stavebním pracím.',
        suggestLeadForm: Boolean(parsed.suggestLeadForm),
        suggestedServiceId: parsed.suggestedServiceId || '',
        suggestedPrefillSummary: parsed.suggestedPrefillSummary || '',
      });
    } catch (err: unknown) {
      console.error('Gemini chat endpoint error:', err);
      const message =
        err instanceof Error ? err.message : 'Neočekávaná chyba komunikace s AI asistentem.';
      const status =
        typeof err === 'object' && err !== null && 'status' in err
          ? Number((err as { status?: number }).status)
          : 500;

      if (status === 400 || status === 403 || message.includes('API_KEY_INVALID')) {
        res.status(status || 400).json({
          error:
            'Konfigurace klíče Gemini API v Settings > Secrets není platná nebo chybí oprávnění.',
        });
        return;
      }

      if (status === 429) {
        res.status(429).json({
          error:
            'Asistent je momentálně dočasně vytížený. Zkuste to prosím za chvíli nebo přejděte rovnou do poptávky.',
        });
        return;
      }

      res.status(500).json({
        error: 'Nepodařilo se získat odpověď od asistenta. Zkuste dotaz odeslat znovu.',
      });
    }
  });

  // Catch-all for unknown /api routes so SPA HTML is never returned for missing endpoints
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Požadovaný API endpoint neexistuje.' });
  });

  return { app, db };
}
