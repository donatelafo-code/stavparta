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

export type NewsletterSubscribePayload = z.infer<typeof newsletterSubscribeSchema>;

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  text: z.string().trim().min(1, 'Zpráva nesmí být prázdná.').max(1500, 'Dotaz je příliš dlouhý.'),
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
    .max(20, 'Konverzace je příliš dlouhá.'),
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

export type ChatRequestPayload = z.infer<typeof chatPayloadSchema>;

export const fullDatabaseDumpSchema = z.object({
  exportedAt: z.string().optional(),
  version: z.string().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  services: z.array(z.record(z.string(), z.unknown())).optional(),
  projects: z.array(z.record(z.string(), z.unknown())).optional(),
  testimonials: z.array(z.record(z.string(), z.unknown())).optional(),
  leads: z.array(z.record(z.string(), z.unknown())).optional(),
  subscribers: z.array(z.record(z.string(), z.unknown())).optional(),
  blogPosts: z.array(z.record(z.string(), z.unknown())).optional(),
});

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
