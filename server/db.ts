import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import {
  BlogPost,
  ChatLogEntry,
  Lead,
  LeadAttachment,
  LeadCoreDetails,
  LeadNote,
  LeadStatus,
  NewsletterSubscriber,
  Project,
  ServiceItem,
  SiteSettings,
  Testimonial,
} from '../src/types';
import {
  INITIAL_BLOG_POSTS,
  INITIAL_LEADS,
  INITIAL_PROJECTS,
  INITIAL_SERVICES,
  INITIAL_SETTINGS,
  INITIAL_SUBSCRIBERS,
  INITIAL_TESTIMONIALS,
  STATUS_LABELS,
} from '../src/shared/seedData';
import { CreateLeadPayload } from '../src/shared/schemas';
import { hasRequiredCompanySettings } from '../src/shared/launchReadiness';
import { normalizeLegacyMediaUrl } from '../src/shared/responsiveImages';
import { removeStoredAttachmentFile, StoredAttachmentRecord } from './uploads';

export interface AppBootstrapPayload {
  settings: SiteSettings;
  services: ServiceItem[];
  projects: Project[];
  testimonials: Testimonial[];
  blogPosts: BlogPost[];
}

export interface ServerDatabaseOptions {
  initialAdminPassword?: string;
  nowFn?: () => number;
  sessionSecret?: string;
  uploadDir?: string;
}

export interface PublicAdminUser {
  id: string;
  username: string;
  role: 'admin' | 'staff';
  mustChangePassword: boolean;
  createdAt: string;
}

export interface DbAttachmentRow {
  id: string;
  leadId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const LOCKOUT_MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export class ServerDatabase {
  private db: Database.Database;
  private readonly nowFn: () => number;
  private readonly initialAdminPassword?: string;
  private readonly sessionSecret: string;
  private readonly uploadDir: string;

  constructor(dbFilePath?: string, options?: ServerDatabaseOptions) {
    const resolvedPath =
      dbFilePath || path.resolve(process.env.DATA_DIR || './data', 'stavparta.db');

    if (resolvedPath !== ':memory:') {
      fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    }

    this.nowFn = options?.nowFn ?? (() => Date.now());
    this.initialAdminPassword =
      options?.initialAdminPassword !== undefined
        ? options.initialAdminPassword
        : process.env.ADMIN_INITIAL_PASSWORD;
    this.sessionSecret = options?.sessionSecret ?? process.env.SESSION_SECRET ?? '';
    this.uploadDir = path.resolve(options?.uploadDir || process.env.UPLOAD_DIR || './uploads');

    this.db = new Database(resolvedPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initializeSchema();
    this.seedIfFirstBoot();
    this.sanitizeLegacyPlaceholders();
    this.bootstrapInitialAdmin();
  }

  private sanitizeLegacyPlaceholders(): void {
    const row = this.db.prepare('SELECT json FROM settings WHERE id = 1').get() as
      | { json: string }
      | undefined;
    if (!row) return;
    const current = JSON.parse(row.json) as SiteSettings;
    let changed = false;

    if (current.phone === '+420 777 000 000') {
      current.phone = '';
      changed = true;
    }
    if (current.ico === 'Údaj k doplnění před spuštěním') {
      current.ico = '';
      changed = true;
    }
    if (current.dic === 'CZ (k doplnění)') {
      current.dic = '';
      changed = true;
    }

    if (changed) {
      this.db
        .prepare('INSERT OR REPLACE INTO settings (id, json, updated_at) VALUES (1, ?, ?)')
        .run(JSON.stringify(current), new Date().toISOString());
    }

    // Upgrade any legacy /src/assets/images/*.jpg references persisted before WebP/AVIF migration
    const updateService = this.db.prepare('UPDATE services SET json = ? WHERE id = ?');
    const serviceRows = this.db.prepare('SELECT id, json FROM services').all() as Array<{
      id: string;
      json: string;
    }>;
    for (const srvRow of serviceRows) {
      const srv = JSON.parse(srvRow.json) as ServiceItem;
      if (srv.image) {
        const nextUrl = normalizeLegacyMediaUrl(srv.image);
        if (nextUrl !== srv.image) {
          srv.image = nextUrl;
          updateService.run(JSON.stringify(srv), srvRow.id);
        }
      }
    }

    const updateProject = this.db.prepare('UPDATE projects SET json = ? WHERE id = ?');
    const projectRows = this.db.prepare('SELECT id, json FROM projects').all() as Array<{
      id: string;
      json: string;
    }>;
    for (const projRow of projectRows) {
      const proj = JSON.parse(projRow.json) as Project;
      let projChanged = false;
      for (const photo of proj.photos) {
        const nextUrl = normalizeLegacyMediaUrl(photo.url);
        if (nextUrl !== photo.url) {
          photo.url = nextUrl;
          projChanged = true;
        }
      }
      if (proj.video?.posterUrl) {
        const nextPoster = normalizeLegacyMediaUrl(proj.video.posterUrl);
        if (nextPoster !== proj.video.posterUrl) {
          proj.video.posterUrl = nextPoster;
          projChanged = true;
        }
      }
      if (projChanged) {
        updateProject.run(JSON.stringify(proj), projRow.id);
      }
    }

    const updatePost = this.db.prepare('UPDATE blog_posts SET json = ? WHERE id = ?');
    const postRows = this.db.prepare('SELECT id, json FROM blog_posts').all() as Array<{
      id: string;
      json: string;
    }>;
    for (const postRow of postRows) {
      const post = JSON.parse(postRow.json) as BlogPost;
      if (post.image) {
        const nextUrl = normalizeLegacyMediaUrl(post.image);
        if (nextUrl !== post.image) {
          post.image = nextUrl;
          updatePost.run(JSON.stringify(post), postRow.id);
        }
      }
    }
  }

  public getUploadDir(): string {
    return this.uploadDir;
  }

  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    return `scrypt$${salt}$${derived}`;
  }

  private verifyPassword(password: string, storedHash: string): boolean {
    const parts = storedHash.split('$');
    if (parts.length !== 3 || parts[0] !== 'scrypt') {
      return false;
    }
    const [, salt, hexHash] = parts;
    if (!salt || !hexHash) {
      return false;
    }
    try {
      const expected = Buffer.from(hexHash, 'hex');
      const actual = crypto.scryptSync(password, salt, 64);
      if (expected.length !== actual.length) {
        return false;
      }
      return crypto.timingSafeEqual(expected, actual);
    } catch {
      return false;
    }
  }

  private hashSessionToken(rawToken: string): string {
    if (this.sessionSecret.trim().length > 0) {
      return crypto.createHmac('sha256', this.sessionSecret).update(rawToken).digest('hex');
    }
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        must_change_password INTEGER NOT NULL DEFAULT 0,
        failed_attempts INTEGER NOT NULL DEFAULT 0,
        locked_until INTEGER,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS admin_sessions (
        id TEXT PRIMARY KEY,
        token_hash TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
        expires_at INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token_hash);
      CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        sort_order INTEGER NOT NULL,
        is_active INTEGER NOT NULL,
        json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        sort_order INTEGER NOT NULL,
        is_demo INTEGER NOT NULL,
        status TEXT NOT NULL,
        json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS testimonials (
        id TEXT PRIMARY KEY,
        is_demo INTEGER NOT NULL,
        is_published INTEGER NOT NULL,
        json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS blog_posts (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        published_at TEXT NOT NULL,
        is_published INTEGER NOT NULL,
        json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        service_id TEXT NOT NULL,
        service_title TEXT NOT NULL,
        location TEXT NOT NULL,
        preferred_timeline TEXT,
        description TEXT NOT NULL,
        gdpr_consent INTEGER NOT NULL,
        status TEXT NOT NULL,
        core_details_json TEXT,
        attachments_json TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

      CREATE TABLE IF NOT EXISTS lead_notes (
        id TEXT PRIMARY KEY,
        lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        author TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes(lead_id);

      CREATE TABLE IF NOT EXISTS lead_attachments (
        id TEXT PRIMARY KEY,
        lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        original_name TEXT NOT NULL,
        stored_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_lead_attachments_lead_id ON lead_attachments(lead_id);

      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL,
        consent INTEGER NOT NULL,
        source TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS chat_logs (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        session_hash TEXT NOT NULL,
        user_message TEXT NOT NULL,
        assistant_reply TEXT NOT NULL,
        suggest_lead_form INTEGER NOT NULL DEFAULT 0,
        suggested_service_id TEXT NOT NULL DEFAULT '',
        model TEXT NOT NULL,
        status TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_chat_logs_created_at ON chat_logs(created_at DESC);

      CREATE TABLE IF NOT EXISTS chat_daily_usage (
        day_key TEXT NOT NULL,
        scope_key TEXT NOT NULL,
        request_count INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (day_key, scope_key)
      );
    `);
  }

  private bootstrapInitialAdmin(): void {
    const initialPass = this.initialAdminPassword?.trim();
    if (!initialPass) {
      return;
    }
    const existingCountRow = this.db
      .prepare('SELECT COUNT(*) AS count FROM admin_users')
      .get() as { count: number };
    if (existingCountRow.count > 0) {
      return;
    }

    const id = 'usr-admin-1';
    const createdAt = new Date(this.nowFn()).toISOString();
    const passwordHash = this.hashPassword(initialPass);
    this.db
      .prepare(
        `INSERT INTO admin_users (
          id, username, password_hash, role, must_change_password, failed_attempts, locked_until, created_at
        ) VALUES (?, ?, ?, ?, ?, 0, NULL, ?)`
      )
      .run(id, 'admin', passwordHash, 'admin', 1, createdAt);
  }

  private seedIfFirstBoot(): void {
    const initialized = this.db
      .prepare('SELECT value FROM meta WHERE key = ?')
      .get('seed_initialized') as { value: string } | undefined;

    if (initialized?.value === '1') {
      return;
    }

    this.seedDefaults();
  }

  private seedDefaults(): void {
    const now = new Date().toISOString();
    const tx = this.db.transaction(() => {
      this.db
        .prepare('INSERT OR REPLACE INTO settings (id, json, updated_at) VALUES (1, ?, ?)')
        .run(JSON.stringify(INITIAL_SETTINGS), now);

      const insertService = this.db.prepare(
        'INSERT OR REPLACE INTO services (id, slug, sort_order, is_active, json) VALUES (?, ?, ?, ?, ?)'
      );
      for (const srv of INITIAL_SERVICES) {
        insertService.run(srv.id, srv.slug, srv.order, srv.isActive ? 1 : 0, JSON.stringify(srv));
      }

      const insertProject = this.db.prepare(
        'INSERT OR REPLACE INTO projects (id, slug, sort_order, is_demo, status, json) VALUES (?, ?, ?, ?, ?, ?)'
      );
      for (const proj of INITIAL_PROJECTS) {
        insertProject.run(
          proj.id,
          proj.slug,
          proj.order,
          proj.isDemo ? 1 : 0,
          proj.status,
          JSON.stringify(proj)
        );
      }

      const insertTestimonial = this.db.prepare(
        'INSERT OR REPLACE INTO testimonials (id, is_demo, is_published, json) VALUES (?, ?, ?, ?)'
      );
      for (const t of INITIAL_TESTIMONIALS) {
        insertTestimonial.run(
          t.id,
          t.isDemo ? 1 : 0,
          t.isPublished ? 1 : 0,
          JSON.stringify(t)
        );
      }

      const insertPost = this.db.prepare(
        'INSERT OR REPLACE INTO blog_posts (id, slug, published_at, is_published, json) VALUES (?, ?, ?, ?, ?)'
      );
      for (const post of INITIAL_BLOG_POSTS) {
        insertPost.run(
          post.id,
          post.slug,
          post.publishedAt,
          post.isPublished ? 1 : 0,
          JSON.stringify(post)
        );
      }

      const insertLead = this.db.prepare(`
        INSERT OR IGNORE INTO leads (
          id, created_at, name, email, phone, service_id, service_title,
          location, preferred_timeline, description, gdpr_consent, status,
          core_details_json, attachments_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const insertNote = this.db.prepare(
        'INSERT OR IGNORE INTO lead_notes (id, lead_id, author, text, created_at) VALUES (?, ?, ?, ?, ?)'
      );
      for (const lead of INITIAL_LEADS) {
        insertLead.run(
          lead.id,
          lead.createdAt,
          lead.name,
          lead.email,
          lead.phone || null,
          lead.serviceId,
          lead.serviceTitle,
          lead.location,
          lead.preferredTimeline || null,
          lead.description,
          lead.gdprConsent ? 1 : 0,
          lead.status,
          lead.coreDetails ? JSON.stringify(lead.coreDetails) : null,
          lead.attachments ? JSON.stringify(lead.attachments) : null
        );
        for (const note of lead.notes) {
          insertNote.run(note.id, lead.id, note.author, note.text, note.createdAt);
        }
      }

      const insertSub = this.db.prepare(
        'INSERT OR IGNORE INTO newsletter_subscribers (id, email, created_at, consent, source) VALUES (?, ?, ?, ?, ?)'
      );
      for (const sub of INITIAL_SUBSCRIBERS) {
        insertSub.run(
          sub.id,
          sub.email.toLowerCase(),
          sub.createdAt,
          sub.consent ? 1 : 0,
          sub.source || 'footer_newsletter'
        );
      }

      this.db
        .prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)')
        .run('seed_initialized', '1');
    });

    tx();
  }

  public close(): void {
    this.db.close();
  }

  // --- Bootstrap / Public Read (No PII) ---
  public getPublicBootstrap(): AppBootstrapPayload {
    return {
      settings: this.getSettings(),
      services: this.listServices(),
      projects: this.listProjects(),
      testimonials: this.listTestimonials(),
      blogPosts: this.listBlogPosts(),
    };
  }

  // --- Settings ---
  public getSettings(): SiteSettings {
    const row = this.db.prepare('SELECT json FROM settings WHERE id = 1').get() as
      | { json: string }
      | undefined;
    if (!row) return INITIAL_SETTINGS;
    return JSON.parse(row.json) as SiteSettings;
  }

  public updateSettings(partial: Partial<SiteSettings>): SiteSettings {
    const merged: SiteSettings = { ...this.getSettings(), ...partial };
    const demoProjectsRow = this.db
      .prepare('SELECT COUNT(*) AS count FROM projects WHERE is_demo = 1')
      .get() as { count: number };
    const demoTestimonialsRow = this.db
      .prepare('SELECT COUNT(*) AS count FROM testimonials WHERE is_demo = 1')
      .get() as { count: number };

    const updated: SiteSettings = {
      ...merged,
      isPublicLaunchReady:
        hasRequiredCompanySettings(merged) &&
        demoProjectsRow.count === 0 &&
        demoTestimonialsRow.count === 0,
    };

    this.db
      .prepare('INSERT OR REPLACE INTO settings (id, json, updated_at) VALUES (1, ?, ?)')
      .run(JSON.stringify(updated), new Date().toISOString());
    return updated;
  }

  // --- Services ---
  public listServices(): ServiceItem[] {
    const rows = this.db
      .prepare('SELECT json FROM services ORDER BY sort_order ASC')
      .all() as Array<{ json: string }>;
    return rows.map((r) => JSON.parse(r.json) as ServiceItem);
  }

  public addService(input: Omit<ServiceItem, 'id'>): ServiceItem {
    const item: ServiceItem = {
      ...input,
      id: `srv-${crypto.randomUUID().slice(0, 8)}`,
    };
    this.db
      .prepare('INSERT INTO services (id, slug, sort_order, is_active, json) VALUES (?, ?, ?, ?, ?)')
      .run(item.id, item.slug, item.order, item.isActive ? 1 : 0, JSON.stringify(item));
    return item;
  }

  public updateService(id: string, updates: Partial<ServiceItem>): ServiceItem | null {
    const row = this.db.prepare('SELECT json FROM services WHERE id = ?').get(id) as
      | { json: string }
      | undefined;
    if (!row) return null;
    const updated: ServiceItem = { ...(JSON.parse(row.json) as ServiceItem), ...updates, id };
    this.db
      .prepare('UPDATE services SET slug = ?, sort_order = ?, is_active = ?, json = ? WHERE id = ?')
      .run(updated.slug, updated.order, updated.isActive ? 1 : 0, JSON.stringify(updated), id);
    return updated;
  }

  public deleteService(id: string): boolean {
    const res = this.db.prepare('DELETE FROM services WHERE id = ?').run(id);
    return res.changes > 0;
  }

  // --- Projects ---
  public listProjects(): Project[] {
    const rows = this.db
      .prepare('SELECT json FROM projects ORDER BY sort_order ASC')
      .all() as Array<{ json: string }>;
    return rows.map((r) => JSON.parse(r.json) as Project);
  }

  public addProject(input: Omit<Project, 'id'>): Project {
    const item: Project = {
      ...input,
      id: `proj-${crypto.randomUUID().slice(0, 8)}`,
    };
    this.db
      .prepare(
        'INSERT INTO projects (id, slug, sort_order, is_demo, status, json) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(
        item.id,
        item.slug,
        item.order,
        item.isDemo ? 1 : 0,
        item.status,
        JSON.stringify(item)
      );
    return item;
  }

  public updateProject(id: string, updates: Partial<Project>): Project | null {
    const row = this.db.prepare('SELECT json FROM projects WHERE id = ?').get(id) as
      | { json: string }
      | undefined;
    if (!row) return null;
    const updated: Project = { ...(JSON.parse(row.json) as Project), ...updates, id };
    this.db
      .prepare(
        'UPDATE projects SET slug = ?, sort_order = ?, is_demo = ?, status = ?, json = ? WHERE id = ?'
      )
      .run(
        updated.slug,
        updated.order,
        updated.isDemo ? 1 : 0,
        updated.status,
        JSON.stringify(updated),
        id
      );
    return updated;
  }

  public deleteProject(id: string): boolean {
    const res = this.db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    return res.changes > 0;
  }

  // --- Testimonials ---
  public listTestimonials(): Testimonial[] {
    const rows = this.db.prepare('SELECT json FROM testimonials').all() as Array<{ json: string }>;
    return rows.map((r) => JSON.parse(r.json) as Testimonial);
  }

  public addTestimonial(input: Omit<Testimonial, 'id'>): Testimonial {
    const item: Testimonial = {
      ...input,
      id: `test-${crypto.randomUUID().slice(0, 8)}`,
    };
    this.db
      .prepare(
        'INSERT INTO testimonials (id, is_demo, is_published, json) VALUES (?, ?, ?, ?)'
      )
      .run(item.id, item.isDemo ? 1 : 0, item.isPublished ? 1 : 0, JSON.stringify(item));
    return item;
  }

  public updateTestimonial(id: string, updates: Partial<Testimonial>): Testimonial | null {
    const row = this.db.prepare('SELECT json FROM testimonials WHERE id = ?').get(id) as
      | { json: string }
      | undefined;
    if (!row) return null;
    const updated: Testimonial = { ...(JSON.parse(row.json) as Testimonial), ...updates, id };
    this.db
      .prepare('UPDATE testimonials SET is_demo = ?, is_published = ?, json = ? WHERE id = ?')
      .run(updated.isDemo ? 1 : 0, updated.isPublished ? 1 : 0, JSON.stringify(updated), id);
    return updated;
  }

  public deleteTestimonial(id: string): boolean {
    const res = this.db.prepare('DELETE FROM testimonials WHERE id = ?').run(id);
    return res.changes > 0;
  }

  // --- Blog Posts ---
  public listBlogPosts(): BlogPost[] {
    const rows = this.db
      .prepare('SELECT json FROM blog_posts ORDER BY published_at DESC')
      .all() as Array<{ json: string }>;
    return rows.map((r) => JSON.parse(r.json) as BlogPost);
  }

  public addBlogPost(input: Omit<BlogPost, 'id'>): BlogPost {
    const item: BlogPost = {
      ...input,
      id: `blog-${crypto.randomUUID().slice(0, 8)}`,
    };
    this.db
      .prepare(
        'INSERT INTO blog_posts (id, slug, published_at, is_published, json) VALUES (?, ?, ?, ?, ?)'
      )
      .run(item.id, item.slug, item.publishedAt, item.isPublished ? 1 : 0, JSON.stringify(item));
    return item;
  }

  public updateBlogPost(id: string, updates: Partial<BlogPost>): BlogPost | null {
    const row = this.db.prepare('SELECT json FROM blog_posts WHERE id = ?').get(id) as
      | { json: string }
      | undefined;
    if (!row) return null;
    const updated: BlogPost = { ...(JSON.parse(row.json) as BlogPost), ...updates, id };
    this.db
      .prepare(
        'UPDATE blog_posts SET slug = ?, published_at = ?, is_published = ?, json = ? WHERE id = ?'
      )
      .run(updated.slug, updated.publishedAt, updated.isPublished ? 1 : 0, JSON.stringify(updated), id);
    return updated;
  }

  public deleteBlogPost(id: string): boolean {
    const res = this.db.prepare('DELETE FROM blog_posts WHERE id = ?').run(id);
    return res.changes > 0;
  }

  // --- Leads ---
  private mapLeadRow(row: {
    id: string;
    created_at: string;
    name: string;
    email: string;
    phone: string | null;
    service_id: string;
    service_title: string;
    location: string;
    preferred_timeline: string | null;
    description: string;
    gdpr_consent: number;
    status: string;
    core_details_json: string | null;
    attachments_json: string | null;
  }): Lead {
    const notesRows = this.db
      .prepare(
        'SELECT id, author, text, created_at FROM lead_notes WHERE lead_id = ? ORDER BY created_at ASC'
      )
      .all(row.id) as Array<{ id: string; author: string; text: string; created_at: string }>;

    const notes: LeadNote[] = notesRows.map((n) => ({
      id: n.id,
      author: n.author,
      text: n.text,
      createdAt: n.created_at,
    }));

    const attachmentRows = this.db
      .prepare(
        'SELECT id, original_name, mime_type, size_bytes FROM lead_attachments WHERE lead_id = ? ORDER BY created_at ASC'
      )
      .all(row.id) as Array<{
      id: string;
      original_name: string;
      mime_type: string;
      size_bytes: number;
    }>;

    const attachments: LeadAttachment[] | undefined =
      attachmentRows.length > 0
        ? attachmentRows.map((att) => ({
            id: att.id,
            name: att.original_name,
            size: Math.max(1, Math.round(att.size_bytes / 1024)),
            type: att.mime_type,
            url: `/api/admin/attachments/${encodeURIComponent(att.id)}`,
          }))
        : row.attachments_json
          ? (JSON.parse(row.attachments_json) as LeadAttachment[])
          : undefined;

    return {
      id: row.id,
      createdAt: row.created_at,
      name: row.name,
      email: row.email,
      phone: row.phone || undefined,
      serviceId: row.service_id,
      serviceTitle: row.service_title,
      location: row.location,
      preferredTimeline: row.preferred_timeline || undefined,
      description: row.description,
      attachments,
      gdprConsent: Boolean(row.gdpr_consent),
      status: row.status as LeadStatus,
      notes,
      coreDetails: row.core_details_json
        ? (JSON.parse(row.core_details_json) as LeadCoreDetails)
        : undefined,
    };
  }

  public listLeads(): Lead[] {
    const rows = this.db
      .prepare('SELECT * FROM leads ORDER BY created_at DESC')
      .all() as Array<Parameters<ServerDatabase['mapLeadRow']>[0]>;
    return rows.map((row) => this.mapLeadRow(row));
  }

  public getLeadById(id: string): Lead | null {
    const row = this.db.prepare('SELECT * FROM leads WHERE id = ?').get(id) as
      | Parameters<ServerDatabase['mapLeadRow']>[0]
      | undefined;
    return row ? this.mapLeadRow(row) : null;
  }

  public createLead(
    input: CreateLeadPayload,
    savedAttachments: StoredAttachmentRecord[] = []
  ): Lead {
    const now = new Date(this.nowFn()).toISOString();
    const shortRand = crypto.randomInt(1000, 9999);
    const id = `lead-${Date.now().toString(36)}-${shortRand}`;
    const initialNoteId = `note-${crypto.randomUUID().slice(0, 8)}`;

    const attachmentMeta: LeadAttachment[] | undefined =
      savedAttachments.length > 0
        ? savedAttachments.map((att) => ({
            id: att.id,
            name: att.originalName,
            size: Math.max(1, Math.round(att.sizeBytes / 1024)),
            type: att.mimeType,
            url: `/api/admin/attachments/${encodeURIComponent(att.id)}`,
          }))
        : input.attachments && input.attachments.length > 0
          ? input.attachments
          : undefined;

    const tx = this.db.transaction(() => {
      this.db
        .prepare(
          `INSERT INTO leads (
            id, created_at, name, email, phone, service_id, service_title,
            location, preferred_timeline, description, gdpr_consent, status,
            core_details_json, attachments_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          id,
          now,
          input.name,
          input.email,
          input.phone || null,
          input.serviceId,
          input.serviceTitle,
          input.location,
          input.preferredTimeline || null,
          input.description,
          input.gdprConsent ? 1 : 0,
          'nova',
          input.coreDetails ? JSON.stringify(input.coreDetails) : null,
          attachmentMeta ? JSON.stringify(attachmentMeta) : null
        );

      this.db
        .prepare(
          'INSERT INTO lead_notes (id, lead_id, author, text, created_at) VALUES (?, ?, ?, ?, ?)'
        )
        .run(initialNoteId, id, 'Formulář', 'Poptávka přijata přes API z webu.', now);

      if (savedAttachments.length > 0) {
        const insertAtt = this.db.prepare(
          `INSERT INTO lead_attachments (
            id, lead_id, original_name, stored_name, mime_type, size_bytes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`
        );
        for (const att of savedAttachments) {
          insertAtt.run(
            att.id,
            id,
            att.originalName,
            att.storedName,
            att.mimeType,
            att.sizeBytes,
            now
          );
        }
      }
    });

    tx();
    const created = this.getLeadById(id);
    if (!created) {
      throw new Error('Failed to load created lead from database.');
    }
    return created;
  }

  public getAttachmentById(id: string): DbAttachmentRow | null {
    const row = this.db
      .prepare(
        'SELECT id, lead_id, original_name, stored_name, mime_type, size_bytes, created_at FROM lead_attachments WHERE id = ?'
      )
      .get(id) as
      | {
          id: string;
          lead_id: string;
          original_name: string;
          stored_name: string;
          mime_type: string;
          size_bytes: number;
          created_at: string;
        }
      | undefined;

    if (!row) return null;
    return {
      id: row.id,
      leadId: row.lead_id,
      originalName: row.original_name,
      storedName: row.stored_name,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      createdAt: row.created_at,
    };
  }

  public updateLeadStatus(id: string, status: LeadStatus, author = 'Admin'): Lead | null {
    const existing = this.getLeadById(id);
    if (!existing) return null;

    const statusLabel = STATUS_LABELS[status]?.label || status;
    const now = new Date().toISOString();
    const noteId = `note-${crypto.randomUUID().slice(0, 8)}`;

    const tx = this.db.transaction(() => {
      this.db.prepare('UPDATE leads SET status = ? WHERE id = ?').run(status, id);
      this.db
        .prepare(
          'INSERT INTO lead_notes (id, lead_id, author, text, created_at) VALUES (?, ?, ?, ?, ?)'
        )
        .run(noteId, id, author, `Změna stavu na: ${statusLabel}`, now);
    });

    tx();
    return this.getLeadById(id);
  }

  public addLeadNote(id: string, text: string, author = 'Admin'): Lead | null {
    const existing = this.getLeadById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const noteId = `note-${crypto.randomUUID().slice(0, 8)}`;
    this.db
      .prepare(
        'INSERT INTO lead_notes (id, lead_id, author, text, created_at) VALUES (?, ?, ?, ?, ?)'
      )
      .run(noteId, id, author, text, now);

    return this.getLeadById(id);
  }

  public deleteLead(id: string): boolean {
    const storedFiles = this.db
      .prepare('SELECT stored_name FROM lead_attachments WHERE lead_id = ?')
      .all(id) as Array<{ stored_name: string }>;

    const res = this.db.prepare('DELETE FROM leads WHERE id = ?').run(id);
    if (res.changes > 0) {
      for (const file of storedFiles) {
        removeStoredAttachmentFile(this.uploadDir, file.stored_name);
      }
      return true;
    }
    return false;
  }

  // --- Newsletter Subscribers ---
  public listSubscribers(): NewsletterSubscriber[] {
    const rows = this.db
      .prepare(
        'SELECT id, email, created_at, consent, source FROM newsletter_subscribers ORDER BY created_at DESC'
      )
      .all() as Array<{
      id: string;
      email: string;
      created_at: string;
      consent: number;
      source: string;
    }>;
    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      createdAt: r.created_at,
      consent: Boolean(r.consent),
      source: r.source,
    }));
  }

  public addSubscriber(
    email: string,
    source = 'footer_newsletter'
  ): { ok: true; subscriber: NewsletterSubscriber } | { ok: false; code: 'duplicate' } {
    const cleanEmail = email.trim().toLowerCase();
    const existing = this.db
      .prepare('SELECT id FROM newsletter_subscribers WHERE LOWER(email) = ?')
      .get(cleanEmail) as { id: string } | undefined;

    if (existing) {
      return { ok: false, code: 'duplicate' };
    }

    const subscriber: NewsletterSubscriber = {
      id: `sub-${crypto.randomUUID().slice(0, 8)}`,
      email: cleanEmail,
      createdAt: new Date().toISOString(),
      consent: true,
      source,
    };

    this.db
      .prepare(
        'INSERT INTO newsletter_subscribers (id, email, created_at, consent, source) VALUES (?, ?, ?, ?, ?)'
      )
      .run(subscriber.id, subscriber.email, subscriber.createdAt, 1, subscriber.source);

    return { ok: true, subscriber };
  }

  public deleteSubscriber(id: string): boolean {
    const res = this.db.prepare('DELETE FROM newsletter_subscribers WHERE id = ?').run(id);
    return res.changes > 0;
  }

  public erasePersonalDataByEmail(email: string): {
    normalizedEmail: string;
    deletedLeadsCount: number;
    deletedAttachmentsCount: number;
    deletedSubscribersCount: number;
  } {
    const normalizedEmail = email.trim().toLowerCase();

    const result = this.db.transaction(() => {
      const leadRows = this.db
        .prepare('SELECT id FROM leads WHERE LOWER(TRIM(email)) = ?')
        .all(normalizedEmail) as Array<{ id: string }>;

      const storedFiles: string[] = [];
      const selectFilesStmt = this.db.prepare(
        'SELECT stored_name FROM lead_attachments WHERE lead_id = ?'
      );
      for (const lead of leadRows) {
        const files = selectFilesStmt.all(lead.id) as Array<{ stored_name: string }>;
        for (const f of files) {
          storedFiles.push(f.stored_name);
        }
      }

      const deletedLeads = this.db
        .prepare('DELETE FROM leads WHERE LOWER(TRIM(email)) = ?')
        .run(normalizedEmail).changes;

      const deletedSubscribers = this.db
        .prepare('DELETE FROM newsletter_subscribers WHERE LOWER(TRIM(email)) = ?')
        .run(normalizedEmail).changes;

      return {
        deletedLeadsCount: deletedLeads,
        deletedSubscribersCount: deletedSubscribers,
        storedFiles,
      };
    })();

    for (const storedName of result.storedFiles) {
      removeStoredAttachmentFile(this.uploadDir, storedName);
    }

    return {
      normalizedEmail,
      deletedLeadsCount: result.deletedLeadsCount,
      deletedAttachmentsCount: result.storedFiles.length,
      deletedSubscribersCount: result.deletedSubscribersCount,
    };
  }

  // --- Chat Daily Quotas & Audit Logs (without extra PII) ---
  public consumeChatDailyQuota(
    sessionHash: string,
    ipDailyLimit: number,
    globalDailyLimit: number
  ): { allowed: true } | { allowed: false; reason: 'ip_daily_limit' | 'global_daily_limit' } {
    const dayKey = new Date(this.nowFn()).toISOString().slice(0, 10);
    const ipScope = `ip:${sessionHash}`;
    const globalScope = 'global';

    return this.db.transaction(() => {
      const globalRow = this.db
        .prepare('SELECT request_count FROM chat_daily_usage WHERE day_key = ? AND scope_key = ?')
        .get(dayKey, globalScope) as { request_count: number } | undefined;
      const globalCount = globalRow?.request_count ?? 0;

      if (globalCount >= globalDailyLimit) {
        return { allowed: false, reason: 'global_daily_limit' as const };
      }

      const ipRow = this.db
        .prepare('SELECT request_count FROM chat_daily_usage WHERE day_key = ? AND scope_key = ?')
        .get(dayKey, ipScope) as { request_count: number } | undefined;
      const ipCount = ipRow?.request_count ?? 0;

      if (ipCount >= ipDailyLimit) {
        return { allowed: false, reason: 'ip_daily_limit' as const };
      }

      this.db
        .prepare(
          `INSERT INTO chat_daily_usage (day_key, scope_key, request_count)
           VALUES (?, ?, 1)
           ON CONFLICT(day_key, scope_key)
           DO UPDATE SET request_count = request_count + 1`
        )
        .run(dayKey, globalScope);

      this.db
        .prepare(
          `INSERT INTO chat_daily_usage (day_key, scope_key, request_count)
           VALUES (?, ?, 1)
           ON CONFLICT(day_key, scope_key)
           DO UPDATE SET request_count = request_count + 1`
        )
        .run(dayKey, ipScope);

      return { allowed: true as const };
    })();
  }

  public addChatLog(entry: {
    sessionHash: string;
    userMessage: string;
    assistantReply: string;
    suggestLeadForm: boolean;
    suggestedServiceId: string;
    model: string;
    status: ChatLogEntry['status'];
  }): ChatLogEntry {
    const createdAt = new Date(this.nowFn()).toISOString();
    const id = `chat-${crypto.randomUUID().slice(0, 12)}`;
    this.db
      .prepare(
        `INSERT INTO chat_logs (
          id, created_at, session_hash, user_message, assistant_reply,
          suggest_lead_form, suggested_service_id, model, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        createdAt,
        entry.sessionHash,
        entry.userMessage,
        entry.assistantReply,
        entry.suggestLeadForm ? 1 : 0,
        entry.suggestedServiceId,
        entry.model,
        entry.status
      );

    return {
      id,
      createdAt,
      sessionHash: entry.sessionHash,
      userMessage: entry.userMessage,
      assistantReply: entry.assistantReply,
      suggestLeadForm: entry.suggestLeadForm,
      suggestedServiceId: entry.suggestedServiceId,
      model: entry.model,
      status: entry.status,
    };
  }

  public listChatLogs(limit = 100): ChatLogEntry[] {
    const safeLimit = Math.max(1, Math.min(500, Math.floor(limit)));
    const rows = this.db
      .prepare(
        `SELECT id, created_at, session_hash, user_message, assistant_reply,
                suggest_lead_form, suggested_service_id, model, status
         FROM chat_logs
         ORDER BY created_at DESC
         LIMIT ?`
      )
      .all(safeLimit) as Array<{
      id: string;
      created_at: string;
      session_hash: string;
      user_message: string;
      assistant_reply: string;
      suggest_lead_form: number;
      suggested_service_id: string;
      model: string;
      status: ChatLogEntry['status'];
    }>;

    return rows.map((r) => ({
      id: r.id,
      createdAt: r.created_at,
      sessionHash: r.session_hash,
      userMessage: r.user_message,
      assistantReply: r.assistant_reply,
      suggestLeadForm: Boolean(r.suggest_lead_form),
      suggestedServiceId: r.suggested_service_id,
      model: r.model,
      status: r.status,
    }));
  }

  public deleteChatLog(id: string): boolean {
    const res = this.db.prepare('DELETE FROM chat_logs WHERE id = ?').run(id);
    return res.changes > 0;
  }

  // --- Admin Auth & Sessions ---
  public hasAdminAccount(): boolean {
    const row = this.db.prepare('SELECT COUNT(*) AS count FROM admin_users').get() as {
      count: number;
    };
    return row.count > 0;
  }

  public claimInitialAdmin(
    password: string
  ): { ok: true; user: PublicAdminUser } | { ok: false; code: 'already_exists' } {
    const result = this.db.transaction((): { ok: true; user: PublicAdminUser } | { ok: false; code: 'already_exists' } => {
      if (this.hasAdminAccount()) {
        return { ok: false, code: 'already_exists' };
      }
      const id = 'usr-admin-1';
      const createdAt = new Date(this.nowFn()).toISOString();
      const passwordHash = this.hashPassword(password);
      this.db
        .prepare(
          `INSERT INTO admin_users (
            id, username, password_hash, role, must_change_password, failed_attempts, locked_until, created_at
          ) VALUES (?, ?, ?, ?, 0, 0, NULL, ?)`
        )
        .run(id, 'admin', passwordHash, 'admin', createdAt);

      return {
        ok: true,
        user: {
          id,
          username: 'admin',
          role: 'admin',
          mustChangePassword: false,
          createdAt,
        },
      };
    })();
    return result;
  }

  public verifyLogin(
    username: string,
    password: string
  ):
    | { ok: true; user: PublicAdminUser }
    | { ok: false; code: 'invalid_credentials' }
    | { ok: false; code: 'locked'; retryAfterSeconds: number } {
    const cleanUsername = username.trim().toLowerCase();
    const row = this.db
      .prepare(
        `SELECT id, username, password_hash, role, must_change_password, failed_attempts, locked_until, created_at
         FROM admin_users WHERE LOWER(username) = ?`
      )
      .get(cleanUsername) as
      | {
          id: string;
          username: string;
          password_hash: string;
          role: 'admin' | 'staff';
          must_change_password: number;
          failed_attempts: number;
          locked_until: number | null;
          created_at: string;
        }
      | undefined;

    const currentMs = this.nowFn();

    if (!row) {
      // Constant-time dummy work to reduce timing side-channel
      this.hashPassword(password);
      return { ok: false, code: 'invalid_credentials' };
    }

    if (row.locked_until !== null && row.locked_until > currentMs) {
      const retryAfterSeconds = Math.max(1, Math.ceil((row.locked_until - currentMs) / 1000));
      return { ok: false, code: 'locked', retryAfterSeconds };
    }

    const valid = this.verifyPassword(password, row.password_hash);
    if (!valid) {
      const nextAttempts = (row.locked_until !== null && row.locked_until <= currentMs ? 0 : row.failed_attempts) + 1;
      if (nextAttempts >= LOCKOUT_MAX_ATTEMPTS) {
        const lockedUntil = currentMs + LOCKOUT_DURATION_MS;
        this.db
          .prepare('UPDATE admin_users SET failed_attempts = ?, locked_until = ? WHERE id = ?')
          .run(nextAttempts, lockedUntil, row.id);
        return {
          ok: false,
          code: 'locked',
          retryAfterSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
        };
      }
      this.db
        .prepare('UPDATE admin_users SET failed_attempts = ?, locked_until = NULL WHERE id = ?')
        .run(nextAttempts, row.id);
      return { ok: false, code: 'invalid_credentials' };
    }

    this.db
      .prepare('UPDATE admin_users SET failed_attempts = 0, locked_until = NULL WHERE id = ?')
      .run(row.id);

    return {
      ok: true,
      user: {
        id: row.id,
        username: row.username,
        role: row.role,
        mustChangePassword: Boolean(row.must_change_password),
        createdAt: row.created_at,
      },
    };
  }

  public createSession(userId: string): { rawToken: string; expiresAt: number } {
    const currentMs = this.nowFn();
    const expiresAt = currentMs + SESSION_TTL_MS;
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashSessionToken(rawToken);
    const id = `ses-${crypto.randomUUID()}`;

    this.db.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').run(currentMs);
    this.db
      .prepare(
        'INSERT INTO admin_sessions (id, token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
      )
      .run(id, tokenHash, userId, expiresAt, new Date(currentMs).toISOString());

    return { rawToken, expiresAt };
  }

  public getSessionUser(rawToken: string): PublicAdminUser | null {
    if (!rawToken || rawToken.trim().length === 0) {
      return null;
    }
    const currentMs = this.nowFn();
    const tokenHash = this.hashSessionToken(rawToken);
    const row = this.db
      .prepare(
        `SELECT s.id AS session_id, s.expires_at, u.id, u.username, u.role, u.must_change_password, u.created_at
         FROM admin_sessions s
         JOIN admin_users u ON u.id = s.user_id
         WHERE s.token_hash = ?`
      )
      .get(tokenHash) as
      | {
          session_id: string;
          expires_at: number;
          id: string;
          username: string;
          role: 'admin' | 'staff';
          must_change_password: number;
          created_at: string;
        }
      | undefined;

    if (!row) {
      return null;
    }

    if (row.expires_at <= currentMs) {
      this.db.prepare('DELETE FROM admin_sessions WHERE id = ?').run(row.session_id);
      return null;
    }

    return {
      id: row.id,
      username: row.username,
      role: row.role,
      mustChangePassword: Boolean(row.must_change_password),
      createdAt: row.created_at,
    };
  }

  public deleteSession(rawToken: string): void {
    if (!rawToken) return;
    const tokenHash = this.hashSessionToken(rawToken);
    this.db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(tokenHash);
  }

  public changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    keepSessionToken?: string
  ):
    | { ok: true; user: PublicAdminUser }
    | { ok: false; code: 'not_found' | 'invalid_current_password' } {
    const row = this.db
      .prepare(
        'SELECT id, username, password_hash, role, created_at FROM admin_users WHERE id = ?'
      )
      .get(userId) as
      | {
          id: string;
          username: string;
          password_hash: string;
          role: 'admin' | 'staff';
          created_at: string;
        }
      | undefined;

    if (!row) {
      return { ok: false, code: 'not_found' };
    }
    if (!this.verifyPassword(currentPassword, row.password_hash)) {
      return { ok: false, code: 'invalid_current_password' };
    }

    const nextHash = this.hashPassword(newPassword);
    const keepHash = keepSessionToken ? this.hashSessionToken(keepSessionToken) : null;

    this.db.transaction(() => {
      this.db
        .prepare('UPDATE admin_users SET password_hash = ?, must_change_password = 0 WHERE id = ?')
        .run(nextHash, userId);

      if (keepHash) {
        this.db
          .prepare('DELETE FROM admin_sessions WHERE user_id = ? AND token_hash != ?')
          .run(userId, keepHash);
      } else {
        this.db.prepare('DELETE FROM admin_sessions WHERE user_id = ?').run(userId);
      }
    })();

    return {
      ok: true,
      user: {
        id: row.id,
        username: row.username,
        role: row.role,
        mustChangePassword: false,
        createdAt: row.created_at,
      },
    };
  }

  // --- Maintenance & Demo Cleanup ---
  public clearDemoForProduction(): {
    settings: SiteSettings;
    projects: Project[];
    testimonials: Testimonial[];
    remainingDemoProjects: number;
    remainingDemoTestimonials: number;
    verifiedClean: boolean;
  } {
    const verification = this.db.transaction(() => {
      this.db.prepare('DELETE FROM projects WHERE is_demo = 1').run();
      this.db.prepare('DELETE FROM testimonials WHERE is_demo = 1').run();

      const demoProjectsRow = this.db
        .prepare('SELECT COUNT(*) AS count FROM projects WHERE is_demo = 1')
        .get() as { count: number };
      const demoTestimonialsRow = this.db
        .prepare('SELECT COUNT(*) AS count FROM testimonials WHERE is_demo = 1')
        .get() as { count: number };

      if (demoProjectsRow.count > 0 || demoTestimonialsRow.count > 0) {
        throw new Error('Failed to remove all demo projects and testimonials from database.');
      }

      const currentSettings = this.getSettings();
      const updated: SiteSettings = {
        ...currentSettings,
        isPublicLaunchReady: hasRequiredCompanySettings(currentSettings),
      };
      this.db
        .prepare('INSERT OR REPLACE INTO settings (id, json, updated_at) VALUES (1, ?, ?)')
        .run(JSON.stringify(updated), new Date().toISOString());

      return {
        remainingDemoProjects: demoProjectsRow.count,
        remainingDemoTestimonials: demoTestimonialsRow.count,
      };
    })();

    return {
      settings: this.getSettings(),
      projects: this.listProjects(),
      testimonials: this.listTestimonials(),
      remainingDemoProjects: verification.remainingDemoProjects,
      remainingDemoTestimonials: verification.remainingDemoTestimonials,
      verifiedClean:
        verification.remainingDemoProjects === 0 &&
        verification.remainingDemoTestimonials === 0,
    };
  }

  public restoreFromDump(dump: {
    settings?: Record<string, unknown>;
    services?: Array<Record<string, unknown>>;
    projects?: Array<Record<string, unknown>>;
    testimonials?: Array<Record<string, unknown>>;
    leads?: Array<Record<string, unknown>>;
    subscribers?: Array<Record<string, unknown>>;
    blogPosts?: Array<Record<string, unknown>>;
  }): void {
    const tx = this.db.transaction(() => {
      if (dump.settings) {
        const merged = { ...this.getSettings(), ...dump.settings };
        this.db
          .prepare('INSERT OR REPLACE INTO settings (id, json, updated_at) VALUES (1, ?, ?)')
          .run(JSON.stringify(merged), new Date().toISOString());
      }
      if (dump.services) {
        this.db.prepare('DELETE FROM services').run();
        const stmt = this.db.prepare(
          'INSERT OR REPLACE INTO services (id, slug, sort_order, is_active, json) VALUES (?, ?, ?, ?, ?)'
        );
        for (const item of dump.services) {
          const id = String(item.id || `srv-${crypto.randomUUID().slice(0, 8)}`);
          const slug = String(item.slug || id);
          const order = Number(item.order ?? 0);
          const isActive = item.isActive === false ? 0 : 1;
          stmt.run(id, slug, order, isActive, JSON.stringify({ ...item, id, slug }));
        }
      }
      if (dump.projects) {
        this.db.prepare('DELETE FROM projects').run();
        const stmt = this.db.prepare(
          'INSERT OR REPLACE INTO projects (id, slug, sort_order, is_demo, status, json) VALUES (?, ?, ?, ?, ?, ?)'
        );
        for (const item of dump.projects) {
          const id = String(item.id || `proj-${crypto.randomUUID().slice(0, 8)}`);
          const slug = String(item.slug || id);
          const order = Number(item.order ?? 0);
          const isDemo = item.isDemo ? 1 : 0;
          const status = String(item.status || 'publikovano');
          stmt.run(id, slug, order, isDemo, status, JSON.stringify({ ...item, id, slug }));
        }
      }
      if (dump.testimonials) {
        this.db.prepare('DELETE FROM testimonials').run();
        const stmt = this.db.prepare(
          'INSERT OR REPLACE INTO testimonials (id, is_demo, is_published, json) VALUES (?, ?, ?, ?)'
        );
        for (const item of dump.testimonials) {
          const id = String(item.id || `test-${crypto.randomUUID().slice(0, 8)}`);
          const isDemo = item.isDemo ? 1 : 0;
          const isPublished = item.isPublished === false ? 0 : 1;
          stmt.run(id, isDemo, isPublished, JSON.stringify({ ...item, id }));
        }
      }
      if (dump.blogPosts) {
        this.db.prepare('DELETE FROM blog_posts').run();
        const stmt = this.db.prepare(
          'INSERT OR REPLACE INTO blog_posts (id, slug, published_at, is_published, json) VALUES (?, ?, ?, ?, ?)'
        );
        for (const item of dump.blogPosts) {
          const id = String(item.id || `blog-${crypto.randomUUID().slice(0, 8)}`);
          const slug = String(item.slug || id);
          const publishedAt = String(item.publishedAt || new Date().toISOString().slice(0, 10));
          const isPublished = item.isPublished === false ? 0 : 1;
          stmt.run(id, slug, publishedAt, isPublished, JSON.stringify({ ...item, id, slug }));
        }
      }
      if (dump.leads) {
        this.db.prepare('DELETE FROM lead_notes').run();
        this.db.prepare('DELETE FROM leads').run();
        const insertLead = this.db.prepare(`
          INSERT INTO leads (
            id, created_at, name, email, phone, service_id, service_title,
            location, preferred_timeline, description, gdpr_consent, status,
            core_details_json, attachments_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const insertNote = this.db.prepare(
          'INSERT INTO lead_notes (id, lead_id, author, text, created_at) VALUES (?, ?, ?, ?, ?)'
        );
        for (const l of dump.leads) {
          const id = String(l.id || `lead-${crypto.randomUUID().slice(0, 8)}`);
          insertLead.run(
            id,
            String(l.createdAt || new Date().toISOString()),
            String(l.name || 'Klient'),
            String(l.email || ''),
            l.phone ? String(l.phone) : null,
            String(l.serviceId || 'srv-bytova-jadra'),
            String(l.serviceTitle || 'Stavební práce'),
            String(l.location || ''),
            l.preferredTimeline ? String(l.preferredTimeline) : null,
            String(l.description || ''),
            l.gdprConsent ? 1 : 0,
            String(l.status || 'nova'),
            l.coreDetails ? JSON.stringify(l.coreDetails) : null,
            l.attachments ? JSON.stringify(l.attachments) : null
          );
          if (Array.isArray(l.notes)) {
            for (const n of l.notes) {
              if (n && typeof n === 'object') {
                const noteObj = n as Record<string, unknown>;
                insertNote.run(
                  String(noteObj.id || `note-${crypto.randomUUID().slice(0, 8)}`),
                  id,
                  String(noteObj.author || 'Admin'),
                  String(noteObj.text || ''),
                  String(noteObj.createdAt || new Date().toISOString())
                );
              }
            }
          }
        }
      }
      if (dump.subscribers) {
        this.db.prepare('DELETE FROM newsletter_subscribers').run();
        const stmt = this.db.prepare(
          'INSERT OR IGNORE INTO newsletter_subscribers (id, email, created_at, consent, source) VALUES (?, ?, ?, ?, ?)'
        );
        for (const s of dump.subscribers) {
          const id = String(s.id || `sub-${crypto.randomUUID().slice(0, 8)}`);
          const email = String(s.email || '').trim().toLowerCase();
          if (email) {
            stmt.run(
              id,
              email,
              String(s.createdAt || new Date().toISOString()),
              s.consent === false ? 0 : 1,
              String(s.source || 'import')
            );
          }
        }
      }
      this.db
        .prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)')
        .run('seed_initialized', '1');
    });
    tx();
  }

  public resetToDefaults(): void {
    const tx = this.db.transaction(() => {
      this.db.prepare('DELETE FROM lead_notes').run();
      this.db.prepare('DELETE FROM leads').run();
      this.db.prepare('DELETE FROM services').run();
      this.db.prepare('DELETE FROM projects').run();
      this.db.prepare('DELETE FROM testimonials').run();
      this.db.prepare('DELETE FROM blog_posts').run();
      this.db.prepare('DELETE FROM newsletter_subscribers').run();
      this.db.prepare('DELETE FROM meta WHERE key = ?').run('seed_initialized');
    });
    tx();
    this.seedDefaults();
  }
}
