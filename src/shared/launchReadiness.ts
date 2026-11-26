import { Project, SiteSettings, Testimonial } from '../types';

export function hasRequiredCompanySettings(settings: SiteSettings): boolean {
  return Boolean(
    settings.phone.trim() &&
      settings.email.trim() &&
      settings.ico.trim() &&
      settings.dic.trim() &&
      settings.addressNotice.trim()
  );
}

export function getLaunchReadinessMissingItems(
  settings: SiteSettings,
  projects?: Project[],
  testimonials?: Testimonial[]
): string[] {
  const missing: string[] = [];

  if (!settings.phone.trim()) {
    missing.push('Telefonní číslo firmy');
  }
  if (!settings.email.trim()) {
    missing.push('Kontaktní e-mail');
  }
  if (!settings.ico.trim()) {
    missing.push('IČO');
  }
  if (!settings.dic.trim()) {
    missing.push('DIČ (nebo uveďte „neplátce DPH“)');
  }
  if (!settings.addressNotice.trim()) {
    missing.push('Sídlo a adresa firmy');
  }

  if (projects && projects.some((p) => p.isDemo)) {
    missing.push('Ukázkové DEMO realizace (smazat nebo nahradit skutečnými)');
  }
  if (testimonials && testimonials.some((t) => t.isDemo)) {
    missing.push('Ukázkové DEMO reference (smazat nebo nahradit ověřenými)');
  }

  return missing;
}
