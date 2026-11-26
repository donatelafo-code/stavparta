export type LeadStatus =
  | 'nova'
  | 'ceka_na_kontakt'
  | 'kontaktovano'
  | 'pripravuje_se_nabidka'
  | 'nabidka_odeslana'
  | 'zakazka_potvrzena'
  | 'realizace_probiha'
  | 'dokonceno'
  | 'uzavreno';

export interface LeadNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface LeadAttachment {
  id?: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export interface LeadCoreDetails {
  propertyType?: string; // Panelový byt, Zděný byt, Rodinný dům
  scope?: string; // Kompletní jádro, Pouze koupelna, Pouze WC
  dispositionChange?: string; // Ano, Ne, Chci poradit
  designStatus?: string; // Mám vlastní návrh, Mám hrubou představu, Nechám si poradit
  approximateArea?: string; // např. 4 m2
}

export interface Lead {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone?: string;
  serviceId: string;
  serviceTitle: string;
  location: string;
  preferredTimeline?: string;
  description: string;
  attachments?: LeadAttachment[];
  gdprConsent: boolean;
  status: LeadStatus;
  notes: LeadNote[];
  // Dynamic extended inquiry answers
  coreDetails?: LeadCoreDetails;
}

export interface ServiceFaq {
  question: string;
  answer: string;
}

export interface ServiceWorkflowStep {
  step: string;
  title: string;
  description: string;
}

export interface ServiceItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  iconName: string;
  order: number;
  isActive: boolean;
  image?: string;
  features?: string[];
  workflowSteps?: ServiceWorkflowStep[];
  faq?: ServiceFaq[];
  safetyNotice?: string;
  relatedServiceIds?: string[];
  metaTitle: string;
  metaDescription: string;
}

export type ProjectStage = 'pred' | 'behem' | 'po';

export interface ProjectPhoto {
  id: string;
  url: string;
  stage: ProjectStage;
  stageLabel: string;
  caption: string;
  isCover?: boolean;
}

export interface ProjectVideoChapter {
  timeSec: number;
  label: string;
  description?: string;
}

export interface ProjectVideo {
  url: string;
  posterUrl: string;
  title: string;
  durationLabel: string;
  summary: string;
  chapters?: ProjectVideoChapter[];
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  serviceId: string;
  serviceName: string;
  location: string;
  year?: string;
  isDemo: boolean;
  status: 'published' | 'draft' | 'hidden';
  order: number;
  photos: ProjectPhoto[];
  video?: ProjectVideo;
}

export type BlogCategory =
  | 'Trendy v rekonstrukcích'
  | 'Údržba interiéru'
  | 'Materiály pro bytová jádra';

export interface BlogSectionParagraph {
  heading: string;
  text: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: BlogCategory;
  publishedAt: string;
  readTimeMinutes: number;
  excerpt: string;
  contentSections: BlogSectionParagraph[];
  practicalTips: string[];
  image: string;
  imageAlt: string;
  relatedServiceId: string;
  author: string;
  isPublished: boolean;
  featured?: boolean;
}

export interface Testimonial {
  id: string;
  clientName: string;
  location: string;
  projectType: string;
  text: string;
  rating: number;
  year: string;
  hasConsent: boolean;
  isPublished: boolean;
  isDemo: boolean;
}

export interface SiteSettings {
  companyName: string;
  brandName: string;
  slogan: string;
  motto: string;
  phone: string;
  email: string;
  ico: string;
  dic: string;
  isVatPayer?: boolean;
  certificationNumber?: string;
  warrantyMonths?: number;
  headquarters?: string;
  operatingRegion: string;
  primaryLocations: string[];
  workingHours: string;
  addressNotice: string;
  seoTitle: string;
  seoDescription: string;
  isPublicLaunchReady: boolean;
  notifyEmailEnabled?: boolean;
  notifyEmailAddress?: string;
  chatPricingSummary?: string;
  chatTimelineSummary?: string;
  chatPaymentTerms?: string;
}

export interface ChatLogEntry {
  id: string;
  createdAt: string;
  sessionHash: string;
  userMessage: string;
  assistantReply: string;
  suggestLeadForm: boolean;
  suggestedServiceId: string;
  model: string;
  status: 'ok' | 'rejected' | 'rate_limited' | 'error';
}

export interface PricingRange {
  min: number;
  max: number;
}

export interface PricingApartmentTier extends PricingRange {
  duration: string;
}

export interface PricingConfig {
  version: number;
  updatedAt: string;
  core: {
    demolitionUmakart: PricingRange;
    demolitionMasonry: PricingRange;
    newMasonryAndPlaster: PricingRange;
    plumbingAndWaste: PricingRange;
    tilingStandard: PricingRange;
    tilingLargeFormat: PricingRange;
    sanitaryWalkIn: PricingRange;
    sanitaryTub: PricingRange;
    durationUmakart: string;
    durationMasonry: string;
  };
  apartment: {
    size1kk: PricingApartmentTier;
    size2kk: PricingApartmentTier;
    size3kk: PricingApartmentTier;
    size4kk: PricingApartmentTier;
    interiorOnlyMultiplier: number;
    ceilingsAddition: PricingRange;
    flooringAddition: PricingRange;
  };
}

export interface QuoteItem {
  id: string;
  name: string;
  category: 'prace' | 'material';
  unit: string;
  quantity: number;
  unitPrice: number;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  createdAt: string;
  consent: boolean;
  source?: string;
}
