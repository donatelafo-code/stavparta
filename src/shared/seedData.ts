import {
  BlogPost,
  Lead,
  LeadStatus,
  NewsletterSubscriber,
  PricingConfig,
  Project,
  ServiceItem,
  SiteSettings,
  Testimonial,
} from '../types';
import settingsJson from '../data/settings.json';
import servicesJson from '../data/services.json';
import projectsJson from '../data/projects.json';
import testimonialsJson from '../data/testimonials.json';
import leadsJson from '../data/leads.json';
import subscribersJson from '../data/subscribers.json';
import blogPostsJson from '../data/blogPosts.json';
import pricingJson from '../data/pricing.json';

export const INITIAL_SETTINGS: SiteSettings = settingsJson as SiteSettings;
export const INITIAL_SERVICES: ServiceItem[] = servicesJson as ServiceItem[];
export const INITIAL_PROJECTS: Project[] = projectsJson as Project[];
export const INITIAL_TESTIMONIALS: Testimonial[] = testimonialsJson as Testimonial[];
export const INITIAL_LEADS: Lead[] = leadsJson as Lead[];
export const INITIAL_SUBSCRIBERS: NewsletterSubscriber[] =
  subscribersJson as NewsletterSubscriber[];
export const INITIAL_BLOG_POSTS: BlogPost[] = blogPostsJson as BlogPost[];
export const INITIAL_PRICING_CONFIG: PricingConfig = pricingJson as PricingConfig;

export const STATUS_LABELS: Record<LeadStatus, { label: string; bg: string; color: string }> = {
  nova: { label: 'Nová', bg: 'bg-amber-100', color: 'text-amber-900 border-amber-300' },
  ceka_na_kontakt: {
    label: 'Čeká na kontaktování',
    bg: 'bg-orange-100',
    color: 'text-orange-900 border-orange-300',
  },
  kontaktovano: {
    label: 'Kontaktováno',
    bg: 'bg-blue-100',
    color: 'text-blue-900 border-blue-300',
  },
  pripravuje_se_nabidka: {
    label: 'Připravuje se nabídka',
    bg: 'bg-indigo-100',
    color: 'text-indigo-900 border-indigo-300',
  },
  nabidka_odeslana: {
    label: 'Nabídka odeslána',
    bg: 'bg-purple-100',
    color: 'text-purple-900 border-purple-300',
  },
  zakazka_potvrzena: {
    label: 'Zakázka potvrzena',
    bg: 'bg-teal-100',
    color: 'text-teal-900 border-teal-300',
  },
  realizace_probiha: {
    label: 'Realizace probíhá',
    bg: 'bg-cyan-100',
    color: 'text-cyan-900 border-cyan-300',
  },
  dokonceno: {
    label: 'Dokončeno',
    bg: 'bg-emerald-100',
    color: 'text-emerald-900 border-emerald-300',
  },
  uzavreno: {
    label: 'Uzavřeno',
    bg: 'bg-slate-100',
    color: 'text-slate-700 border-slate-300',
  },
};
