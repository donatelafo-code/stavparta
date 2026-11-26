import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Hammer,
  Phone,
  Mail,
  MapPin,
  Lock,
  FileText,
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ServiceItem, SiteSettings } from '../types';
import { CITY_PAGES } from '../shared/cityPages';
import { api, ApiError } from '../services/api';
import { newsletterSubscribeSchema } from '../shared/schemas';

interface FooterProps {
  settings: SiteSettings;
  services?: ServiceItem[];
  onOpenLeadForm: () => void;
  onOpenAdmin: () => void;
  onOpenGdpr: () => void;
  onOpenTerms: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  services = [],
  onOpenLeadForm,
  onOpenAdmin,
  onOpenGdpr,
  onOpenTerms,
}) => {
  // Newsletter subscription state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterConsent, setNewsletterConsent] = useState(true);
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [newsletterFeedback, setNewsletterFeedback] = useState('');
  const [newsletterHoneypot, setNewsletterHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Spam honeypot
    if (newsletterHoneypot) return;

    const parsed = newsletterSubscribeSchema.safeParse({
      email: newsletterEmail,
      consent: newsletterConsent as true,
      source: 'footer_newsletter',
    });

    if (!parsed.success) {
      setNewsletterStatus('error');
      setNewsletterFeedback(
        parsed.error.issues[0]?.message || 'Zadejte prosím platnou e-mailovou adresu.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await api.subscribeNewsletter({
        email: newsletterEmail.trim(),
        consent: true,
        source: 'footer_newsletter',
        honeypot: newsletterHoneypot,
      });
      setNewsletterStatus('success');
      setNewsletterFeedback(result.message);
      setNewsletterEmail('');
    } catch (err) {
      setNewsletterStatus('error');
      setNewsletterFeedback(
        err instanceof ApiError
          ? err.message
          : 'Nepodařilo se uložit odběr novinek. Zkuste to prosím znovu.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#0F171E] text-slate-300 border-t border-[#1E2B37] text-xs">
      {/* Upper CTA Banner */}
      <div className="bg-[#17232D] border-b border-[#263746] py-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Plánujete rekonstrukci v Olomouckém kraji?
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Rádi se přijedeme podívat na vaši stavbu a připravíme přehledný položkový rozpočet.
            </p>
          </div>
          <button
            onClick={onOpenLeadForm}
            className="px-6 py-3.5 bg-[#C2560A] hover:bg-[#9E4306] text-white font-bold text-sm rounded shadow transition-all cursor-pointer whitespace-nowrap"
          >
            Nezávazně poptat stavbu
          </button>
        </div>
      </div>

      {/* Newsletter Subscription Section */}
      <div className="bg-[#131D26] border-b border-[#1E2B37] py-10 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-[#F07818] mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Odběr novinek a inspirace</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Sledujte nové realizace, tipy a akční nabídky
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-1.5 leading-relaxed">
              Získejte fotoreportáže dokončených proměn v Zábřehu na Moravě i v celém Olomouckém kraji, praktické řemeslné rady a přednostní informace o uvolněných stavebních termínech. Žádný spam, max. 1–2× měsíčně.
            </p>
          </div>

          {/* Form container */}
          <div className="w-full lg:max-w-md">
            {newsletterStatus === 'success' ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-start gap-3 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <div className="font-bold text-white text-sm">Jste úspěšně přihlášeni k odběru!</div>
                  <p className="text-emerald-300/90 leading-relaxed text-[11px]">
                    {newsletterFeedback || 'Děkujeme za váš zájem. Jakmile dokončíme novou zajímavou stavbu nebo vyhlásíme akční nabídku, budete mezi prvními, kdo se to dozví.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setNewsletterStatus('idle');
                      setNewsletterFeedback('');
                    }}
                    className="text-[11px] text-emerald-400 hover:text-white underline cursor-pointer"
                  >
                    Přihlásit další e-mail
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} noValidate className="space-y-2.5">
                {/* Anti-spam honeypot */}
                <div className="hidden" aria-hidden="true">
                  <input
                    type="text"
                    value={newsletterHoneypot}
                    onChange={(e) => setNewsletterHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <div className="relative flex-1">
                    <label htmlFor="footer-newsletter-email" className="sr-only">
                      Váš e-mail pro odběr novinek
                    </label>
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="footer-newsletter-email"
                      type="email"
                      value={newsletterEmail}
                      aria-invalid={newsletterStatus === 'error'}
                      aria-describedby={newsletterStatus === 'error' ? 'footer-newsletter-error' : undefined}
                      onChange={(e) => {
                        setNewsletterEmail(e.target.value);
                        if (newsletterStatus === 'error') setNewsletterStatus('idle');
                      }}
                      placeholder="Váš e-mail (např. jmeno@email.cz)"
                      className="w-full pl-10 pr-3 py-3 bg-[#17232D] text-white placeholder:text-slate-400 border border-[#263746] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#F07818] transition-colors"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-3 bg-[#C2560A] hover:bg-[#9E4306] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <span>Odebírat novinky</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {newsletterStatus === 'error' && (
                  <div
                    id="footer-newsletter-error"
                    role="alert"
                    className="text-[11px] text-red-300 flex items-center gap-1.5 pt-0.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{newsletterFeedback}</span>
                  </div>
                )}

                <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-400">
                  <input
                    type="checkbox"
                    id="newsletter-consent"
                    checked={newsletterConsent}
                    onChange={(e) => setNewsletterConsent(e.target.checked)}
                    className="w-3.5 h-3.5 text-[#F07818] rounded mt-0.5 accent-[#F07818] cursor-pointer"
                  />
                  <label htmlFor="newsletter-consent" className="cursor-pointer leading-tight text-[11px]">
                    Souhlasím se zasíláním zpráv o realizacích a akčních nabídkách v souladu se zásadami{' '}
                    <button
                      type="button"
                      onClick={onOpenGdpr}
                      className="text-[#F07818] hover:underline cursor-pointer"
                    >
                      ochrany osobních údajů (GDPR)
                    </button>
                    . Odběr můžete kdykoliv bezplatně zrušit.
                  </label>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer Links & Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-12 pb-24 md:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Craft Identity */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 text-white font-extrabold text-base">
              <div className="w-7 h-7 rounded bg-[#C2560A] flex items-center justify-center text-white">
                <Hammer className="w-4 h-4" />
              </div>
              <span>STAVPARTA</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              {settings.slogan} Parta spolehlivých řemeslníků OSVČ se sídlem v <strong>Zábřehu na Moravě</strong> specializující se na rekonstrukce bytů a domů, koupelny, sádrokartony, obklady a zednické práce po celém kraji.
            </p>
          </div>

          {/* Col 2: Services Quick Links */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Hlavní řemesla
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              {services.filter((s) => s.isActive).slice(0, 6).map((srv) => (
                <li key={srv.id}>
                  <Link to={`/sluzba/${srv.slug}`} className="hover:text-[#F07818] transition-colors">
                    {srv.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Operating Area & Contacts */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Kontakt & Působnost
            </h4>
            <div className="space-y-1.5 text-slate-400">
              {settings.phone.trim() && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#F07818]" />
                  <a
                    href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                    className="hover:text-white transition-colors"
                  >
                    {settings.phone}
                  </a>
                </div>
              )}
              {settings.email.trim() && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#F07818]" />
                  <a href={`mailto:${settings.email}`} className="hover:text-white transition-colors">
                    {settings.email}
                  </a>
                </div>
              )}
              <div className="flex items-start gap-2 mt-2">
                <MapPin className="w-3.5 h-3.5 text-[#F07818] shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-bold">Centrála: Zábřeh na Moravě</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{settings.operatingRegion}</div>
                  <div className="flex flex-wrap gap-x-2.5 gap-y-1 mt-1.5 text-[11px]">
                    {CITY_PAGES.map((city) => (
                      <Link
                        key={city.slug}
                        to={`/lokalita/${city.slug}`}
                        className="text-slate-400 hover:text-[#F07818] underline-offset-2 hover:underline transition-colors"
                      >
                        {city.cityName}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Col 4: Corporate Data & Transparency Note */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Fakturační údaje
            </h4>
            <div className="text-slate-400 space-y-1">
              <p className="text-[11px]">
                IČO:{' '}
                <span className="text-slate-300 font-mono">
                  {settings.ico.trim() || 'k doplnění v administraci'}
                </span>
              </p>
              <p className="text-[11px]">
                DIČ:{' '}
                <span className="text-slate-300 font-mono">
                  {settings.dic.trim() || 'k doplnění v administraci'}
                </span>{' '}
                <span className="text-slate-500">
                  ({settings.isVatPayer ? 'Plátce DPH' : 'Neplátce DPH'})
                </span>
              </p>
              {settings.certificationNumber?.trim() && (
                <p className="text-[11px]">
                  Oprávnění / osvědčení:{' '}
                  <span className="text-slate-300 font-mono">
                    {settings.certificationNumber.trim()}
                  </span>
                </p>
              )}
              <p className="text-[10px] text-slate-500 leading-normal pt-1">
                {settings.addressNotice}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Admin Bar */}
        <div className="pt-8 mt-8 border-t border-[#1E2B37] flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            © {new Date().getFullYear()} STAVPARTA. Všechna práva vyhrazena.
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
            <button
              type="button"
              onClick={onOpenTerms}
              className="hover:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Obchodní a záruční podmínky</span>
            </button>

            <span className="text-slate-700 hidden sm:inline">·</span>

            <button
              type="button"
              onClick={onOpenGdpr}
              className="hover:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Ochrana osobních údajů (GDPR)</span>
            </button>

            <span className="text-slate-700 hidden sm:inline">·</span>

            <button
              type="button"
              onClick={onOpenAdmin}
              className="text-slate-400 hover:text-[#F07818] transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Administrace webu</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
