import { z } from 'zod';

export const LEAD_STATUS_VALUES = [
  'nova',
  'ceka_na_kontakt',
  'kontaktovano',
  'pripravuje_se_nabidka',
  'nabidka_odeslana',
  'zakazka_potvrzena',
  'realizace_probiha',
  'dokonceno',
  'uzavreno',
] as const;

export const leadStatusSchema = z.enum(LEAD_STATUS_VALUES);

export const leadAttachmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(255),
  size: z.number().nonnegative(),
  type: z.string().trim().min(1).max(120),
  url: z.string().optional(),
});

export const leadCoreDetailsSchema = z.object({
  propertyType: z.string().trim().max(120).optional(),
  scope: z.string().trim().max(120).optional(),
  dispositionChange: z.string().trim().max(160).optional(),
  designStatus: z.string().trim().max(160).optional(),
  approximateArea: z.string().trim().max(60).optional(),
});

const PHONE_REGEX = /^\+?[0-9]{9,13}$/;

export function isValidCzechPhone(value: string): boolean {
  const cleaned = value.replace(/[\s-]/g, '');
  return PHONE_REGEX.test(cleaned);
}

export const createLeadPayloadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Zadejte prosím vaše jméno a příjmení.')
    .max(120, 'Jméno může mít maximálně 120 znaků.'),
  email: z
    .string()
    .trim()
    .min(1, 'E-mail je povinný pro zaslání kalkulace.')
    .email('Zadejte platný formát e-mailové adresy.')
    .max(180),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || isValidCzechPhone(val), {
      message: 'Zadejte platné telefonní číslo (např. +420 777 123 456).',
    }),
  serviceId: z.string().trim().min(1).max(80),
  serviceTitle: z.string().trim().min(1).max(160),
  location: z
    .string()
    .trim()
    .min(2, 'Zadejte obec nebo město v Olomouckém kraji.')
    .max(160, 'Místo stavby může mít maximálně 160 znaků.'),
  preferredTimeline: z.string().trim().max(160).optional(),
  description: z
    .string()
    .trim()
    .min(10, 'Popis by měl obsahovat alespoň 10 znaků pro přesnější odhad.')
    .max(5000, 'Popis může mít maximálně 5000 znaků.'),
  gdprConsent: z.literal(true, {
    error: 'Před odesláním je nutné potvrdit seznámení se zpracováním osobních údajů.',
  }),
  coreDetails: leadCoreDetailsSchema.optional(),
  attachments: z.array(leadAttachmentSchema).max(5).optional(),
  honeypot: z.string().optional(),
  formLoadedAt: z.number().finite().optional(),
});

export type CreateLeadPayload = z.infer<typeof createLeadPayloadSchema>;

export const updateLeadStatusSchema = z.object({
  status: leadStatusSchema,
  author: z.string().trim().min(1).max(80).optional(),
});

export const addLeadNoteSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Poznámka nesmí být prázdná.')
    .max(2000, 'Poznámka může mít maximálně 2000 znaků.'),
  author: z.string().trim().min(1).max(80).optional(),
});

export const newsletterSubscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Zadejte prosím e-mailovou adresu.')
    .email('Zadejte prosím platnou e-mailovou adresu (např. jmeno@email.cz).')
    .max(180),
  consent: z.literal(true, {
    error: 'Pro odběr novinek je nutné udělit souhlas se zpracováním e-mailu.',
  }),
  source: z.string().trim().max(80).optional(),
  honeypot: z.string().optional(),
});

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  text: z
    .string()
    .trim()
    .min(1, 'Zpráva nesmí být prázdná.')
    .max(600, 'Dotaz může mít maximálně 600 znaků.'),
});

export const chatServiceContextSchema = z.object({
  id: z.string().max(80),
  title: z.string().max(160),
  category: z.string().max(120),
  shortDescription: z.string().max(500),
  features: z.array(z.string().max(300)).max(12),
});

export const chatPayloadSchema = z.object({
  messages: z
    .array(chatMessageSchema)
    .min(1, 'Zadejte prosím svůj dotaz.')
    .max(12, 'Konverzace může obsahovat maximálně 12 posledních zpráv.'),
  appContext: z
    .object({
      companyName: z.string().max(200).optional(),
      headquarters: z.string().max(200).optional(),
      operatingRegion: z.string().max(200).optional(),
      primaryLocations: z.array(z.string().max(120)).max(25).optional(),
      phone: z.string().max(60).optional(),
      email: z.string().max(180).optional(),
      workingHours: z.string().max(160).optional(),
      services: z.array(chatServiceContextSchema).max(20).optional(),
    })
    .optional(),
});

export const chatResponseSchema = z.object({
  reply: z.string().trim().min(1).max(2500),
  suggestLeadForm: z.boolean(),
  suggestedServiceId: z.string().trim().max(80),
  suggestedPrefillSummary: z.string().trim().max(500),
});

export type ChatResponsePayload = z.infer<typeof chatResponseSchema>;

// Strict schemas for database backup / restore
export const siteSettingsSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  brandName: z.string().trim().min(1).max(120),
  slogan: z.string().max(240),
  motto: z.string().max(400),
  phone: z.string().max(60),
  email: z.string().max(180),
  ico: z.string().max(60),
  dic: z.string().max(60),
  isVatPayer: z.boolean().optional(),
  certificationNumber: z.string().max(160).optional(),
  warrantyMonths: z.number().int().min(0).max(240).optional(),
  headquarters: z.string().max(160).optional(),
  operatingRegion: z.string().max(200),
  primaryLocations: z.array(z.string().max(120)).max(30),
  workingHours: z.string().max(200),
  addressNotice: z.string().max(400),
  seoTitle: z.string().max(240),
  seoDescription: z.string().max(500),
  isPublicLaunchReady: z.boolean(),
  notifyEmailEnabled: z.boolean().optional(),
  notifyEmailAddress: z.string().max(180).optional(),
  chatPricingSummary: z.string().max(2000).optional(),
  chatTimelineSummary: z.string().max(2000).optional(),
  chatPaymentTerms: z.string().max(2000).optional(),
});

export const serviceItemSchema = z.object({
  id: z.string().trim().min(1).max(80),
  slug: z.string().trim().min(1).max(160),
  title: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(120),
  shortDescription: z.string().max(1000),
  fullDescription: z.string().max(6000),
  iconName: z.string().max(80),
  order: z.number().int().min(0).max(999),
  isActive: z.boolean(),
  image: z.string().max(500).optional(),
  features: z.array(z.string().max(500)).optional(),
  workflowSteps: z
    .array(
      z.object({
        step: z.string().max(20),
        title: z.string().max(200),
        description: z.string().max(1000),
      })
    )
    .optional(),
  faq: z
    .array(
      z.object({
        question: z.string().max(400),
        answer: z.string().max(2000),
      })
    )
    .optional(),
  safetyNotice: z.string().max(1000).optional(),
  relatedServiceIds: z.array(z.string().max(80)).optional(),
  metaTitle: z.string().max(240),
  metaDescription: z.string().max(500),
});

export const projectSchema = z.object({
  id: z.string().trim().min(1).max(80),
  slug: z.string().trim().min(1).max(160),
  title: z.string().trim().min(1).max(240),
  description: z.string().max(4000),
  serviceId: z.string().trim().min(1).max(80),
  serviceName: z.string().trim().min(1).max(200),
  location: z.string().trim().min(1).max(180),
  year: z.string().max(20).optional(),
  isDemo: z.boolean(),
  status: z.enum(['published', 'draft', 'hidden']),
  order: z.number().int().min(0).max(999),
  photos: z.array(
    z.object({
      id: z.string().trim().min(1).max(80),
      url: z.string().trim().min(1).max(500),
      stage: z.enum(['pred', 'behem', 'po']),
      stageLabel: z.string().max(100),
      caption: z.string().max(600),
      isCover: z.boolean().optional(),
    })
  ),
  video: z
    .object({
      url: z.string().trim().min(1).max(500),
      posterUrl: z.string().max(500),
      title: z.string().max(240),
      durationLabel: z.string().max(40),
      summary: z.string().max(1000),
      chapters: z
        .array(
          z.object({
            timeSec: z.number().nonnegative(),
            label: z.string().max(120),
            description: z.string().max(400).optional(),
          })
        )
        .optional(),
    })
    .optional(),
});

export const testimonialSchema = z.object({
  id: z.string().trim().min(1).max(80),
  clientName: z.string().trim().min(1).max(160),
  location: z.string().max(160),
  projectType: z.string().max(200),
  text: z.string().trim().min(1).max(3000),
  rating: z.number().int().min(1).max(5),
  year: z.string().max(20),
  hasConsent: z.boolean(),
  isPublished: z.boolean(),
  isDemo: z.boolean(),
});

export const blogPostSchema = z.object({
  id: z.string().trim().min(1).max(80),
  slug: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(260),
  category: z.enum([
    'Trendy v rekonstrukcích',
    'Údržba interiéru',
    'Materiály pro bytová jádra',
  ]),
  publishedAt: z.string().trim().min(1).max(40),
  readTimeMinutes: z.number().int().min(1).max(60),
  excerpt: z.string().max(1200),
  contentSections: z.array(
    z.object({
      heading: z.string().max(240),
      text: z.string().max(6000),
    })
  ),
  practicalTips: z.array(z.string().max(600)),
  image: z.string().max(500),
  imageAlt: z.string().max(300),
  relatedServiceId: z.string().max(80),
  author: z.string().max(180),
  isPublished: z.boolean(),
  featured: z.boolean().optional(),
});

export const leadNoteSchema = z.object({
  id: z.string().trim().min(1).max(80),
  author: z.string().trim().min(1).max(120),
  text: z.string().max(4000),
  createdAt: z.string().trim().min(1).max(60),
});

export const leadDumpSchema = z.object({
  id: z.string().trim().min(1).max(80),
  createdAt: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(180),
  phone: z.string().max(60).optional(),
  serviceId: z.string().trim().min(1).max(80),
  serviceTitle: z.string().trim().min(1).max(200),
  location: z.string().max(180),
  preferredTimeline: z.string().max(160).optional(),
  description: z.string().max(6000),
  attachments: z.array(leadAttachmentSchema).optional(),
  gdprConsent: z.boolean(),
  status: leadStatusSchema,
  notes: z.array(leadNoteSchema).default([]),
  coreDetails: leadCoreDetailsSchema.optional(),
});

export const newsletterSubscriberDumpSchema = z.object({
  id: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(180),
  createdAt: z.string().trim().min(1).max(60),
  consent: z.boolean(),
  source: z.string().max(80).optional(),
});

export const fullDatabaseDumpSchema = z.object({
  exportedAt: z.string().optional(),
  version: z.string().optional(),
  settings: siteSettingsSchema.partial().optional(),
  services: z.array(serviceItemSchema).optional(),
  projects: z.array(projectSchema).optional(),
  testimonials: z.array(testimonialSchema).optional(),
  leads: z.array(leadDumpSchema).optional(),
  subscribers: z.array(newsletterSubscriberDumpSchema).optional(),
  blogPosts: z.array(blogPostSchema).optional(),
});

export type FullDatabaseDump = z.infer<typeof fullDatabaseDumpSchema>;

export const adminLoginSchema = z.object({
  username: z.string().trim().min(1, 'Zadejte uživatelské jméno.').max(60).default('admin'),
  password: z.string().min(1, 'Zadejte přístupové heslo.').max(200),
});

export const adminSetupSchema = z.object({
  password: z
    .string()
    .min(8, 'Heslo musí mít alespoň 8 znaků.')
    .max(200, 'Heslo může mít maximálně 200 znaků.'),
});

export const adminChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Zadejte stávající heslo.').max(200),
  newPassword: z
    .string()
    .min(8, 'Nové heslo musí mít alespoň 8 znaků.')
    .max(200, 'Nové heslo může mít maximálně 200 znaků.'),
});

export const gdprEraseSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Zadejte e-mailovou adresu pro výmaz.')
    .email('Zadejte platnou e-mailovou adresu.')
    .max(180),
});

export function extractZodFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'submit');
    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}
