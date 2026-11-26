import fs from 'node:fs';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { PublicAdminUser, ServerDatabase } from './db';
import { dispatchNewLeadNotifications } from './notifications';
import {
  inspectMagicBytes,
  isDeclaredMimeCompatible,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENT_COUNT,
  removeStoredAttachmentFile,
  resolveSafeUploadPath,
  saveValidatedAttachment,
  StoredAttachmentRecord,
} from './uploads';
import {
  addLeadNoteSchema,
  adminChangePasswordSchema,
  adminLoginSchema,
  adminSetupSchema,
  chatPayloadSchema,
  createLeadPayloadSchema,
  extractZodFieldErrors,
  fullDatabaseDumpSchema,
  gdprEraseSchema,
  newsletterSubscribeSchema,
  updateLeadStatusSchema,
} from '../src/shared/schemas';
import {
  buildServerSystemInstruction,
  hashVisitorIdentifier,
  isSuspiciousPromptInjection,
  sanitizeChatText,
  validateAndSanitizeChatModelOutput,
} from './chatSecurity';
import { CITY_PAGES } from '../src/shared/cityPages';

const ADMIN_SESSION_COOKIE = 'stavparta_admin_session';

interface AuthenticatedRequest extends Request {
  adminUser?: PublicAdminUser;
  adminSessionToken?: string;
}

export interface CreateServerAppOptions {
  db?: ServerDatabase;
  disableRateLimit?: boolean;
  nowFn?: () => number;
  initialAdminPassword?: string;
  chatDailyIpLimit?: number;
  chatDailyGlobalLimit?: number;
  geminiModel?: string;
  appUrl?: string;
  trustProxy?: boolean | number | string;
  generateChatReply?: (params: {
    model: string;
    systemInstruction: string;
    contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
  }) => Promise<string>;
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

const parseTrustProxy = (raw?: boolean | number | string): boolean | number | string => {
  if (typeof raw === 'boolean' || typeof raw === 'number') {
    return raw;
  }
  const normalized = (raw ?? process.env.TRUST_PROXY ?? '').trim().toLowerCase();
  if (!normalized) {
    return 1;
  }
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  if (/^\d+$/.test(normalized)) {
    return Number.parseInt(normalized, 10);
  }
  return normalized;
};

const parseAllowedOrigins = (explicitAppUrl?: string): Set<string> => {
  const origins = new Set<string>();
  const rawCandidates = [
    explicitAppUrl ?? process.env.APP_URL ?? '',
    ...(process.env.ALLOWED_ORIGINS || '').split(','),
  ];

  for (const candidate of rawCandidates) {
    const trimmed = candidate.trim();
    if (!trimmed || trimmed === 'MY_APP_URL') continue;
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        origins.add(parsed.origin);
      }
    } catch {
      // Ignore malformed origin entries
    }
  }
  return origins;
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

  app.set('trust proxy', parseTrustProxy(options.trustProxy));

  app.use(
    helmet({
      frameguard: false,
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'same-origin' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      dnsPrefetchControl: { allow: false },
      xContentTypeOptions: true,
      hsts: process.env.NODE_ENV === 'production',
    })
  );

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
    next();
  });

  const configuredAllowedOrigins = parseAllowedOrigins(options.appUrl);

  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    const originHeader = req.headers.origin;
    if (typeof originHeader === 'string' && originHeader.trim().length > 0) {
      let normalizedOrigin: string;
      try {
        normalizedOrigin = new URL(originHeader).origin;
      } catch {
        res.status(403).json({ error: 'Neplatná hlavička Origin.' });
        return;
      }

      const forwardedHost = String(req.headers['x-forwarded-host'] || req.headers.host || '')
        .split(',')[0]
        .trim();
      const proto = isHttpsRequest(req) ? 'https' : req.protocol || 'http';
      const sameServerOrigin = forwardedHost ? `${proto}://${forwardedHost}` : '';

      const isAllowed =
        configuredAllowedOrigins.has(normalizedOrigin) ||
        (sameServerOrigin !== '' && normalizedOrigin === sameServerOrigin);

      if (!isAllowed) {
        res.status(403).json({ error: 'Přístup z nepovolené domény (CORS).' });
        return;
      }

      res.setHeader('Access-Control-Allow-Origin', normalizedOrigin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, X-Requested-With'
      );

      if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
      }
    }
    next();
  });

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

  const uploadMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: MAX_ATTACHMENT_BYTES,
      files: MAX_ATTACHMENT_COUNT,
    },
  });

  const handleOptionalLeadAttachments = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.is('multipart/form-data')) {
      next();
      return;
    }

    uploadMiddleware.array('attachments', MAX_ATTACHMENT_COUNT)(req, res, (err: unknown) => {
      if (!err) {
        next();
        return;
      }

      if (err instanceof multer.MulterError) {
        let message = 'Chyba při nahrávání příloh.';
        if (err.code === 'LIMIT_FILE_SIZE') {
          message = 'Každý přiložený soubor může mít maximálně 5 MB.';
        } else if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
          message = 'Můžete přiložit maximálně 5 souborů.';
        }
        res.status(400).json({
          error: message,
          fieldErrors: { attachments: message },
        });
        return;
      }

      res.status(400).json({
        error: 'Nepodařilo se zpracovat přiložené soubory.',
        fieldErrors: { attachments: 'Nepodařilo se zpracovat přiložené soubory.' },
      });
    });
  };

  // Public Lead Submission (supports application/json or multipart/form-data with attachments)
  app.post(
    '/api/leads',
    leadsLimiter,
    handleOptionalLeadAttachments,
    async (req: Request, res: Response) => {
      let raw: Record<string, unknown>;
      if (req.is('multipart/form-data') && typeof req.body?.payload === 'string') {
        try {
          const decoded = JSON.parse(req.body.payload) as unknown;
          if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) {
            res.status(400).json({ error: 'Neplatný formát odeslaných dat poptávky.' });
            return;
          }
          raw = decoded as Record<string, unknown>;
        } catch {
          res.status(400).json({ error: 'Neplatný formát odeslaných dat poptávky.' });
          return;
        }
      } else {
        raw = (req.body || {}) as Record<string, unknown>;
      }

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

      const uploadedFiles =
        (req as Request & { files?: Express.Multer.File[] }).files ?? [];

      if (uploadedFiles.length > MAX_ATTACHMENT_COUNT) {
        const msg = 'Můžete přiložit maximálně 5 souborů.';
        res.status(400).json({ error: msg, fieldErrors: { attachments: msg } });
        return;
      }

      const validatedFiles: Array<{
        file: Express.Multer.File;
        detected: NonNullable<ReturnType<typeof inspectMagicBytes>>;
      }> = [];

      for (const file of uploadedFiles) {
        if (file.size > MAX_ATTACHMENT_BYTES) {
          const msg = 'Každý přiložený soubor může mít maximálně 5 MB.';
          res.status(400).json({ error: msg, fieldErrors: { attachments: msg } });
          return;
        }

        const detected = inspectMagicBytes(file.buffer);
        if (!detected || !isDeclaredMimeCompatible(file.mimetype, detected.mime)) {
          const msg =
            'Nepodporovaný nebo neplatný obsah souboru. Povoleny jsou pouze platné soubory JPG, PNG, WebP nebo PDF.';
          res.status(400).json({ error: msg, fieldErrors: { attachments: msg } });
          return;
        }

        validatedFiles.push({ file, detected });
      }

      const savedAttachments: StoredAttachmentRecord[] = [];
      try {
        for (const item of validatedFiles) {
          savedAttachments.push(
            saveValidatedAttachment(
              db.getUploadDir(),
              item.file.buffer,
              item.file.originalname,
              item.detected
            )
          );
        }

        const lead = db.createLead(parsed.data, savedAttachments);
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
        for (const saved of savedAttachments) {
          removeStoredAttachmentFile(db.getUploadDir(), saved.storedName);
        }
        console.error('Failed to persist lead:', err);
        res.status(500).json({
          error: 'Nepodařilo se uložit poptávku na serveru. Zkuste to prosím znovu.',
        });
      }
    }
  );

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

  adminRouter.get('/attachments/:id', (req: Request, res: Response) => {
    const attachment = db.getAttachmentById(String(req.params.id));
    if (!attachment) {
      res.status(404).json({ error: 'Příloha nebyla nalezena.' });
      return;
    }
    const filePath = resolveSafeUploadPath(db.getUploadDir(), attachment.storedName);
    if (!filePath || !fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Soubor přílohy nebyl nalezen na disku.' });
      return;
    }

    const isInlineImage = attachment.mimeType.startsWith('image/');
    const dispositionType =
      isInlineImage && req.query.download !== '1' ? 'inline' : 'attachment';
    const asciiFallback = attachment.originalName
      .replace(/[^\x20-\x7E]/g, '_')
      .replace(/["\\]/g, '_');
    const encodedName = encodeURIComponent(attachment.originalName);

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader(
      'Content-Disposition',
      `${dispositionType}; filename="${asciiFallback}"; filename*=UTF-8''${encodedName}`
    );
    res.sendFile(filePath);
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

  adminRouter.post('/gdpr/erase', (req: Request, res: Response) => {
    const parsed = gdprEraseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Zadejte prosím platnou e-mailovou adresu.',
      });
      return;
    }
    const result = db.erasePersonalDataByEmail(parsed.data.email);
    res.json({
      ok: true,
      ...result,
    });
  });

  adminRouter.patch('/settings', (req: Request, res: Response) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      res.status(400).json({ error: 'Neplatný formát nastavení.' });
      return;
    }

    const requiredLabels: Record<string, string> = {
      phone: 'Telefonní číslo firmy',
      email: 'Kontaktní e-mail',
      ico: 'IČO',
      dic: 'DIČ (nebo uveďte „neplátce DPH“)',
      addressNotice: 'Sídlo a adresa centrály',
    };

    const record = body as Record<string, unknown>;
    for (const [key, label] of Object.entries(requiredLabels)) {
      if (key in record && (typeof record[key] !== 'string' || record[key].trim().length === 0)) {
        res.status(400).json({ error: `Povinné pole nemůže být prázdné: ${label}.` });
        return;
      }
    }

    const updated = db.updateSettings(record);
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
    const result = db.clearDemoForProduction();
    res.json(result);
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

  adminRouter.get('/chat-logs', (req: Request, res: Response) => {
    const rawLimit = Number(req.query.limit ?? 100);
    const limit = Number.isFinite(rawLimit) ? rawLimit : 100;
    res.json({ logs: db.listChatLogs(limit) });
  });

  adminRouter.delete('/chat-logs/:id', (req: Request, res: Response) => {
    const deleted = db.deleteChatLog(String(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: 'Záznam konverzace nebyl nalezen.' });
      return;
    }
    res.json({ ok: true });
  });

  app.use('/api/admin', adminRouter);

  const ipDailyLimit = Math.max(
    1,
    options.chatDailyIpLimit ?? (Number(process.env.CHAT_DAILY_IP_LIMIT) || 40)
  );
  const globalDailyLimit = Math.max(
    1,
    options.chatDailyGlobalLimit ?? (Number(process.env.CHAT_DAILY_LIMIT) || 300)
  );
  const resolvedChatModel =
    options.geminiModel?.trim() || process.env.GEMINI_MODEL?.trim() || 'gemini-4-hydrogen';

  // Contextual Chat API
  app.post('/api/chat', chatLimiter, async (req: Request, res: Response) => {
    const parsedChat = chatPayloadSchema.safeParse(req.body);
    if (!parsedChat.success) {
      const firstErr = parsedChat.error.issues[0]?.message || 'Zadejte prosím svůj dotaz.';
      res.status(400).json({ error: firstErr });
      return;
    }

    const sanitizedMessages = parsedChat.data.messages
      .slice(-10)
      .map((m) => ({
        role: m.role,
        text: sanitizeChatText(m.text, 600),
      }))
      .filter((m) => m.text.length > 0);

    const lastMessage = sanitizedMessages[sanitizedMessages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      res.status(400).json({ error: 'Poslední zpráva v konverzaci musí být dotaz uživatele.' });
      return;
    }

    const dayKey = new Date(now()).toISOString().slice(0, 10);
    const sessionHash = hashVisitorIdentifier(
      req.ip || req.socket.remoteAddress || 'unknown',
      dayKey,
      process.env.SESSION_SECRET || ''
    );

    if (sanitizedMessages.some((m) => m.role === 'user' && isSuspiciousPromptInjection(m.text))) {
      db.addChatLog({
        sessionHash,
        userMessage: lastMessage.text,
        assistantReply: '[Blokováno bezpečnostním filtrem]',
        suggestLeadForm: false,
        suggestedServiceId: '',
        model: resolvedChatModel,
        status: 'rejected',
      });
      res.status(400).json({
        error:
          'Dotaz obsahuje nepovolené instrukce. Zeptejte se prosím běžným způsobem na naše stavební služby nebo poptávku.',
      });
      return;
    }

    const quota = db.consumeChatDailyQuota(sessionHash, ipDailyLimit, globalDailyLimit);
    if ('reason' in quota) {
      db.addChatLog({
        sessionHash,
        userMessage: lastMessage.text,
        assistantReply: `[Denní limit dosažen: ${quota.reason}]`,
        suggestLeadForm: true,
        suggestedServiceId: '',
        model: resolvedChatModel,
        status: 'rate_limited',
      });
      res.status(429).json({
        error:
          'Denní limit dotazů pro asistenta byl dosažen. Rádi vám odpovíme přímo přes poptávkový formulář.',
      });
      return;
    }

    const ai = options.generateChatReply ? null : getAiClient();
    if (!options.generateChatReply && !ai) {
      db.addChatLog({
        sessionHash,
        userMessage: lastMessage.text,
        assistantReply: '[Gemini API není nakonfigurováno]',
        suggestLeadForm: true,
        suggestedServiceId: '',
        model: resolvedChatModel,
        status: 'error',
      });
      res.status(503).json({
        error:
          'Asistent není momentálně připojen ke službě Gemini API (chybí konfigurace GEMINI_API_KEY v nastavení Secrets). Můžete ale rovnou využít náš poptávkový formulář.',
      });
      return;
    }

    const currentSettings = db.getSettings();
    const currentServices = db.listServices();
    const currentBlogPosts = db.listBlogPosts();
    const activeServiceIds = new Set(
      currentServices.filter((s) => s.isActive).map((s) => s.id)
    );

    // Strictly build knowledge base from SQLite settings & catalog (ignore untrusted client appContext)
    const systemInstruction = buildServerSystemInstruction({
      settings: currentSettings,
      services: currentServices,
      blogPosts: currentBlogPosts,
    });

    const contents = sanitizedMessages.map((m) => ({
      role: m.role,
      parts: [
        {
          text:
            m.role === 'user'
              ? `Dotaz zákazníka: ${m.text}`
              : m.text,
        },
      ],
    }));

    const callModelWithRetry = async (attempt = 0): Promise<string> => {
      if (options.generateChatReply) {
        return options.generateChatReply({
          model: resolvedChatModel,
          systemInstruction,
          contents,
        });
      }
      if (!ai) {
        throw new Error('Gemini client unavailable');
      }

      try {
        const response = await ai.models.generateContent({
          model: resolvedChatModel,
          contents,
          config: {
            systemInstruction,
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
                    'ID nejvhodnější aktivní služby z databáze nebo prázdný řetězec.',
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
        db.addChatLog({
          sessionHash,
          userMessage: lastMessage.text,
          assistantReply: '[Prázdná odpověď modelu]',
          suggestLeadForm: false,
          suggestedServiceId: '',
          model: resolvedChatModel,
          status: 'error',
        });
        res
          .status(502)
          .json({ error: 'Asistent nevrátil žádnou odpověď. Zkuste dotaz prosím zopakovat.' });
        return;
      }

      const validatedOutput = validateAndSanitizeChatModelOutput(rawJson, activeServiceIds);
      if (!validatedOutput) {
        db.addChatLog({
          sessionHash,
          userMessage: lastMessage.text,
          assistantReply: '[Neplatný formát výstupu modelu]',
          suggestLeadForm: false,
          suggestedServiceId: '',
          model: resolvedChatModel,
          status: 'error',
        });
        res.status(502).json({
          error: 'Odpověď asistenta nemohla být ověřena. Zkuste prosím dotaz přeformulovat nebo využijte poptávku.',
        });
        return;
      }

      db.addChatLog({
        sessionHash,
        userMessage: lastMessage.text,
        assistantReply: validatedOutput.reply,
        suggestLeadForm: validatedOutput.suggestLeadForm,
        suggestedServiceId: validatedOutput.suggestedServiceId,
        model: resolvedChatModel,
        status: 'ok',
      });

      res.json(validatedOutput);
    } catch (err: unknown) {
      console.error('Gemini chat endpoint error:', err);
      const message =
        err instanceof Error ? err.message : 'Neočekávaná chyba komunikace s AI asistentem.';
      const status =
        typeof err === 'object' && err !== null && 'status' in err
          ? Number((err as { status?: number }).status)
          : 500;

      db.addChatLog({
        sessionHash,
        userMessage: lastMessage.text,
        assistantReply: `[Chyba API ${status}]`,
        suggestLeadForm: false,
        suggestedServiceId: '',
        model: resolvedChatModel,
        status: 'error',
      });

      if (status === 400 || status === 403 || message.includes('API_KEY_INVALID')) {
        res.status(status || 400).json({
          error:
            'Konfigurace klíče Gemini API v Settings > Secrets není platná nebo chybí oprávnění.',
        });
        return;
      }

      if (status === 404) {
        res.status(502).json({
          error: `Nakonfigurovaný model AI (${resolvedChatModel}) nebyl na API nalezen. Zkontrolujte GEMINI_MODEL.`,
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

  const resolveBaseUrl = (req: Request): string => {
    const configured = (options.appUrl ?? process.env.APP_URL ?? '').trim();
    if (configured && configured !== 'MY_APP_URL') {
      try {
        return new URL(configured).origin;
      } catch {
        // Fall through to request host
      }
    }
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000')
      .split(',')[0]
      .trim();
    const proto = isHttpsRequest(req) ? 'https' : req.protocol || 'http';
    return `${proto}://${host}`;
  };

  const escapeXml = (raw: string): string =>
    raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  app.get('/robots.txt', (req: Request, res: Response) => {
    const baseUrl = resolveBaseUrl(req);
    const content = [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /api',
      '',
      `Sitemap: ${baseUrl}/sitemap.xml`,
      '',
    ].join('\n');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(content);
  });

  app.get('/sitemap.xml', (req: Request, res: Response) => {
    const baseUrl = resolveBaseUrl(req);
    const activeServices = db.listServices().filter((s) => s.isActive);
    const publishedPosts = db.listBlogPosts().filter((p) => p.isPublished);

    const urls: Array<{ loc: string; lastmod?: string; changefreq: string; priority: string }> = [
      { loc: `${baseUrl}/`, changefreq: 'weekly', priority: '1.0' },
      ...activeServices.map((s) => ({
        loc: `${baseUrl}/sluzba/${encodeURIComponent(s.slug)}`,
        changefreq: 'monthly',
        priority: '0.8',
      })),
      ...publishedPosts.map((p) => ({
        loc: `${baseUrl}/blog/${encodeURIComponent(p.slug)}`,
        lastmod: /^\d{4}-\d{2}-\d{2}/.test(p.publishedAt) ? p.publishedAt.slice(0, 10) : undefined,
        changefreq: 'monthly',
        priority: '0.7',
      })),
      ...CITY_PAGES.map((c) => ({
        loc: `${baseUrl}/lokalita/${encodeURIComponent(c.slug)}`,
        changefreq: 'monthly',
        priority: c.isHeadquarters ? '0.9' : '0.7',
      })),
    ];

    const body = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls.map((u) => {
        const lines = [
          '  <url>',
          `    <loc>${escapeXml(u.loc)}</loc>`,
          ...(u.lastmod ? [`    <lastmod>${escapeXml(u.lastmod)}</lastmod>`] : []),
          `    <changefreq>${u.changefreq}</changefreq>`,
          `    <priority>${u.priority}</priority>`,
          '  </url>',
        ];
        return lines.join('\n');
      }),
      '</urlset>',
      '',
    ].join('\n');

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(body);
  });

  // Catch-all for unknown /api routes so SPA HTML is never returned for missing endpoints
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Požadovaný API endpoint neexistuje.' });
  });

  return { app, db };
}
