import {
  BlogPost,
  ChatLogEntry,
  Lead,
  LeadStatus,
  NewsletterSubscriber,
  Project,
  ServiceItem,
  SiteSettings,
  Testimonial,
} from '../types';
import { CreateLeadPayload } from '../shared/schemas';

export class ApiError extends Error {
  public readonly status: number;
  public readonly fieldErrors?: Record<string, string>;
  public readonly code?: string;

  constructor(
    message: string,
    status: number,
    fieldErrors?: Record<string, string>,
    code?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.code = code;
  }
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      credentials: 'include',
      ...init,
      headers: {
        'X-Requested-With': 'fetch',
        ...(init?.body && !(init.body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(
      'Nepodařilo se spojit se serverem. Zkontrolujte prosím připojení k internetu a zkuste to znovu.',
      0
    );
  }

  let data: Record<string, unknown>;
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    data = {};
  }

  if (!response.ok) {
    const message =
      typeof data.error === 'string' && data.error.trim().length > 0
        ? data.error
        : `Požadavek selhal (HTTP ${response.status}).`;
    const fieldErrors =
      data.fieldErrors && typeof data.fieldErrors === 'object'
        ? (data.fieldErrors as Record<string, string>)
        : undefined;
    const code = typeof data.code === 'string' ? data.code : undefined;
    throw new ApiError(message, response.status, fieldErrors, code);
  }

  return data as T;
}

export interface BootstrapResponse {
  settings: SiteSettings;
  services: ServiceItem[];
  projects: Project[];
  testimonials: Testimonial[];
  blogPosts: BlogPost[];
}

export interface AdminAuthUser {
  id: string;
  username: string;
  role: 'admin' | 'staff';
  mustChangePassword: boolean;
  createdAt: string;
}

export interface AdminMeResponse {
  authenticated: boolean;
  setupRequired: boolean;
  user: AdminAuthUser | null;
}

export interface CreateLeadResponse {
  lead: Lead;
  notifications: {
    ownerEmailSent: boolean;
    customerEmailSent: boolean;
    telegramSent: boolean;
  };
}

export const api = {
  getPublicBootstrap(): Promise<BootstrapResponse> {
    return requestJson<BootstrapResponse>('/api/public/bootstrap');
  },

  submitLead(payload: CreateLeadPayload, files?: File[]): Promise<CreateLeadResponse> {
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append('payload', JSON.stringify(payload));
      for (const file of files) {
        formData.append('attachments', file, file.name);
      }
      return requestJson<CreateLeadResponse>('/api/leads', {
        method: 'POST',
        body: formData,
      });
    }

    return requestJson<CreateLeadResponse>('/api/leads', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  subscribeNewsletter(payload: {
    email: string;
    consent: true;
    source?: string;
    honeypot?: string;
  }): Promise<{ subscriber: NewsletterSubscriber; message: string }> {
    return requestJson<{ subscriber: NewsletterSubscriber; message: string }>('/api/newsletter', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // --- Admin Auth ---
  getAdminMe(): Promise<AdminMeResponse> {
    return requestJson<AdminMeResponse>('/api/admin/me');
  },

  setupInitialAdmin(password: string): Promise<{ user: AdminAuthUser }> {
    return requestJson<{ user: AdminAuthUser }>('/api/admin/setup', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  loginAdmin(username: string, password: string): Promise<{ user: AdminAuthUser }> {
    return requestJson<{ user: AdminAuthUser }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  logoutAdmin(): Promise<{ ok: boolean }> {
    return requestJson<{ ok: boolean }>('/api/admin/logout', {
      method: 'POST',
    });
  },

  changeAdminPassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ user: AdminAuthUser }> {
    return requestJson<{ user: AdminAuthUser }>('/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // --- Protected Admin Endpoints ---
  getLeads(): Promise<{ leads: Lead[] }> {
    return requestJson<{ leads: Lead[] }>('/api/admin/leads');
  },

  updateLeadStatus(leadId: string, status: LeadStatus, author = 'Admin'): Promise<{ lead: Lead }> {
    return requestJson<{ lead: Lead }>(
      `/api/admin/leads/${encodeURIComponent(leadId)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, author }),
      }
    );
  },

  addLeadNote(leadId: string, text: string, author = 'Admin'): Promise<{ lead: Lead }> {
    return requestJson<{ lead: Lead }>(
      `/api/admin/leads/${encodeURIComponent(leadId)}/notes`,
      {
        method: 'POST',
        body: JSON.stringify({ text, author }),
      }
    );
  },

  deleteLead(leadId: string): Promise<{ ok: boolean }> {
    return requestJson<{ ok: boolean }>(`/api/admin/leads/${encodeURIComponent(leadId)}`, {
      method: 'DELETE',
    });
  },

  getSubscribers(): Promise<{ subscribers: NewsletterSubscriber[] }> {
    return requestJson<{ subscribers: NewsletterSubscriber[] }>('/api/admin/newsletter');
  },

  deleteSubscriber(id: string): Promise<{ ok: boolean }> {
    return requestJson<{ ok: boolean }>(`/api/admin/newsletter/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  updateSettings(partial: Partial<SiteSettings>): Promise<{ settings: SiteSettings }> {
    return requestJson<{ settings: SiteSettings }>('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(partial),
    });
  },

  updateService(id: string, updates: Partial<ServiceItem>): Promise<{ service: ServiceItem }> {
    return requestJson<{ service: ServiceItem }>(
      `/api/admin/services/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    );
  },

  addBlogPost(post: Omit<BlogPost, 'id'>): Promise<{ post: BlogPost }> {
    return requestJson<{ post: BlogPost }>('/api/admin/blog-posts', {
      method: 'POST',
      body: JSON.stringify(post),
    });
  },

  updateBlogPost(id: string, updates: Partial<BlogPost>): Promise<{ post: BlogPost }> {
    return requestJson<{ post: BlogPost }>(
      `/api/admin/blog-posts/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    );
  },

  deleteBlogPost(id: string): Promise<{ ok: boolean }> {
    return requestJson<{ ok: boolean }>(`/api/admin/blog-posts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  clearDemoData(): Promise<{
    settings: SiteSettings;
    projects: Project[];
    testimonials: Testimonial[];
    remainingDemoProjects: number;
    remainingDemoTestimonials: number;
    verifiedClean: boolean;
  }> {
    return requestJson<{
      settings: SiteSettings;
      projects: Project[];
      testimonials: Testimonial[];
      remainingDemoProjects: number;
      remainingDemoTestimonials: number;
      verifiedClean: boolean;
    }>('/api/admin/maintenance/clear-demo', {
      method: 'POST',
    });
  },

  resetDemoData(): Promise<BootstrapResponse> {
    return requestJson<BootstrapResponse>('/api/admin/maintenance/reset-demo', {
      method: 'POST',
    });
  },

  restoreDatabaseDump(dump: Record<string, unknown>): Promise<{
    ok: boolean;
    bootstrap: BootstrapResponse;
    leads: Lead[];
    subscribers: NewsletterSubscriber[];
  }> {
    return requestJson('/api/admin/maintenance/restore', {
      method: 'POST',
      body: JSON.stringify(dump),
    });
  },

  eraseGdprByEmail(email: string): Promise<{
    ok: boolean;
    normalizedEmail: string;
    deletedLeadsCount: number;
    deletedAttachmentsCount: number;
    deletedSubscribersCount: number;
  }> {
    return requestJson('/api/admin/gdpr/erase', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  getChatLogs(limit = 100): Promise<{ logs: ChatLogEntry[] }> {
    return requestJson<{ logs: ChatLogEntry[] }>(
      `/api/admin/chat-logs?limit=${encodeURIComponent(String(limit))}`
    );
  },

  deleteChatLog(id: string): Promise<{ ok: boolean }> {
    return requestJson<{ ok: boolean }>(`/api/admin/chat-logs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
