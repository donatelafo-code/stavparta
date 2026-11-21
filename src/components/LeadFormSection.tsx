import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  CheckCircle,
  Paperclip,
  X,
  AlertCircle,
  FileText,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Grid,
  Sparkles,
} from 'lucide-react';
import {
  Lead,
  LeadAttachment,
  LeadCoreDetails,
  ServiceItem,
  SiteSettings,
} from '../types';
import { api, ApiError } from '../services/api';
import { createLeadPayloadSchema, extractZodFieldErrors } from '../shared/schemas';
import { CalculatedLeadData } from './PriceCalculatorSection';

export interface LeadPrefillNote {
  serviceId: string;
  sourceLabel: string;
  title: string;
  description: string;
}

interface LeadFormSectionProps {
  settings: SiteSettings;
  services: ServiceItem[];
  preselectedServiceId?: string;
  prefilledData?: CalculatedLeadData | null;
  prefilledNote?: LeadPrefillNote | null;
  onOpenGdpr: () => void;
  onLeadCreated?: (lead: Lead) => void;
}

export const FORM_SERVICE_OPTIONS = [
  { id: 'srv-bytova-jadra', label: 'Kompletní renovace bytového jádra' },
  { id: 'srv-koupelna-wc', label: 'Rekonstrukce koupelny' },
  { id: 'srv-wc-pouze', label: 'Rekonstrukce WC' },
  { id: 'srv-rekonstrukce-bytu', label: 'Kompletní rekonstrukce bytu či domu' },
  { id: 'srv-kombinace', label: 'Kombinace více služeb (jádro + zednictví + sádrokarton + obklady)' },
  { id: 'srv-zednicke-prace', label: 'Zednické a stavební práce' },
  { id: 'srv-sadrokartony', label: 'Sádrokartony a příčky' },
  { id: 'srv-obklady-dlazby', label: 'Obklady, dlažby a podlahy' },
  { id: 'srv-jine', label: 'Jiný stavební požadavek' },
];

export const LeadFormSection: React.FC<LeadFormSectionProps> = ({
  settings,
  preselectedServiceId,
  prefilledData,
  prefilledNote,
  onOpenGdpr,
  onLeadCreated,
}) => {
  // Main form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    preselectedServiceId || 'srv-bytova-jadra'
  );
  const [location, setLocation] = useState('');
  const [preferredTimeline, setPreferredTimeline] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<LeadAttachment[]>([]);
  const [gdprConsent, setGdprConsent] = useState(false);

  // Dynamic conditional questions: Apartment core / bathroom / WC
  const isCoreCategory =
    selectedServiceId === 'srv-bytova-jadra' ||
    selectedServiceId === 'srv-koupelna-wc' ||
    selectedServiceId === 'srv-wc-pouze' ||
    selectedServiceId === 'srv-kombinace';

  const [corePropertyType, setCorePropertyType] = useState('Panelový byt');
  const [coreScope, setCoreScope] = useState('Kompletní jádro (koupelna + WC)');
  const [coreDisposition, setCoreDisposition] = useState('Chci poradit s možnostmi zvětšení');
  const [coreDesignStatus, setCoreDesignStatus] = useState('Mám hrubou představu');
  const [coreArea] = useState('cca 4–6 m²');

  // Anti-spam honeypot and timing
  const [honeypot, setHoneypot] = useState('');
  const formLoadTimeRef = useRef<number>(0);

  // Error handling & submission state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLeadId, setSubmittedLeadId] = useState<string | null>(null);

  // Adjust form state cleanly when incoming prefill props change
  const [prevPreselectedServiceId, setPrevPreselectedServiceId] = useState(preselectedServiceId);
  if (preselectedServiceId !== prevPreselectedServiceId) {
    setPrevPreselectedServiceId(preselectedServiceId);
    if (preselectedServiceId) {
      setSelectedServiceId(preselectedServiceId);
    }
  }

  const [prevPrefilledData, setPrevPrefilledData] = useState(prefilledData);
  if (prefilledData !== prevPrefilledData) {
    setPrevPrefilledData(prefilledData);
    if (prefilledData) {
      if (prefilledData.serviceId) setSelectedServiceId(prefilledData.serviceId);
      if (prefilledData.description) setDescription(prefilledData.description);
      if (prefilledData.preferredTimeline) setPreferredTimeline(prefilledData.preferredTimeline);
      if (prefilledData.coreDetails) {
        if (prefilledData.coreDetails.propertyType) {
          setCorePropertyType(prefilledData.coreDetails.propertyType);
        }
        if (prefilledData.coreDetails.scope) {
          setCoreScope(prefilledData.coreDetails.scope);
        }
        if (prefilledData.coreDetails.dispositionChange) {
          setCoreDisposition(prefilledData.coreDetails.dispositionChange);
        }
        if (prefilledData.coreDetails.designStatus) {
          setCoreDesignStatus(prefilledData.coreDetails.designStatus);
        }
      }
    }
  }

  const [prevPrefilledNote, setPrevPrefilledNote] = useState(prefilledNote);
  if (prefilledNote !== prevPrefilledNote) {
    setPrevPrefilledNote(prefilledNote);
    if (prefilledNote) {
      if (prefilledNote.serviceId) setSelectedServiceId(prefilledNote.serviceId);
      if (prefilledNote.description) setDescription(prefilledNote.description);
      setSubmittedLeadId(null);
    }
  }

  useEffect(() => {
    formLoadTimeRef.current = Date.now();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

    const newAttachments: LeadAttachment[] = [];
    let fileError = '';

    Array.from(files).forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        fileError = 'Podporovány jsou pouze obrázky (JPG, PNG, WebP) nebo PDF dokumentace.';
        return;
      }
      if (file.size > maxSizeBytes) {
        fileError = 'Každý soubor může mít maximálně 5 MB.';
        return;
      }

      newAttachments.push({
        name: file.name,
        size: Math.round(file.size / 1024),
        type: file.type,
      });
    });

    if (fileError) {
      setErrors((prev) => ({ ...prev, attachments: fileError }));
    } else {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.attachments;
        return copy;
      });
      setAttachments((prev) => [...prev, ...newAttachments]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const option = FORM_SERVICE_OPTIONS.find((o) => o.id === selectedServiceId);
    const parsed = createLeadPayloadSchema.safeParse({
      name,
      email,
      phone: phone.trim() || undefined,
      serviceId: selectedServiceId,
      serviceTitle: option ? option.label : 'Všeobecná poptávka',
      location,
      preferredTimeline: preferredTimeline.trim() || undefined,
      description,
      gdprConsent: gdprConsent as true,
    });

    if (!parsed.success) {
      const zodErrors = extractZodFieldErrors(parsed.error);
      if (zodErrors.gdprConsent) {
        zodErrors.gdpr = zodErrors.gdprConsent;
      }
      setErrors(zodErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (honeypot) {
      return;
    }

    if (formLoadTimeRef.current > 0 && Date.now() - formLoadTimeRef.current < 1200) {
      setErrors((prev) => ({
        ...prev,
        submit: 'Formulář byl odeslán příliš rychle. Počkejte prosím vteřinu a zkuste to znovu.',
      }));
      return;
    }

    if (!validate()) return;

    setIsSubmitting(true);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.submit;
      return next;
    });

    const option = FORM_SERVICE_OPTIONS.find((o) => o.id === selectedServiceId);
    const serviceTitle = option ? option.label : 'Všeobecná poptávka';

    const coreDetailsData: LeadCoreDetails | undefined = isCoreCategory
      ? {
          propertyType: corePropertyType,
          scope: coreScope,
          dispositionChange: coreDisposition,
          designStatus: coreDesignStatus,
          approximateArea: coreArea,
        }
      : undefined;

    try {
      const response = await api.submitLead({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        serviceId: selectedServiceId,
        serviceTitle,
        location: location.trim(),
        preferredTimeline: preferredTimeline.trim() || undefined,
        description: description.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
        gdprConsent: true,
        coreDetails: coreDetailsData,
        honeypot,
        formLoadedAt: formLoadTimeRef.current || undefined,
      });

      setSubmittedLeadId(response.lead.id);
      onLeadCreated?.(response.lead);

      // Reset only after confirmed server save
      setName('');
      setEmail('');
      setPhone('');
      setLocation('');
      setPreferredTimeline('');
      setDescription('');
      setAttachments([]);
      setGdprConsent(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors((prev) => ({
          ...prev,
          ...(err.fieldErrors || {}),
          submit: err.message,
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          submit: 'Nepodařilo se odeslat poptávku. Zkontrolujte připojení a zkuste to znovu.',
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="kontakt" className="py-20 bg-[#F1F4F6] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Direct Contacts */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F07818] mb-2">
                <span>Rychlé spojení</span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-600 font-medium">Nezávazná poptávka</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17232D] tracking-tight">
                Máte stavební či rekonstrukční záměr?
              </h2>
              <p className="text-slate-600 mt-3 text-sm leading-relaxed">
                Ať už potřebujete celkovou renovaci bytového jádra, sádrokartonové podhledy,
                obklady a podlahy nebo zednické práce, rádi za vámi přijedeme na osobní zaměření
                po celém Olomouckém kraji.
              </p>
            </div>

            {/* Direct Cards */}
            <div className="space-y-4">
              <a
                href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-[#F07818] transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-[#F07818]/10 flex items-center justify-center text-[#F07818] group-hover:bg-[#F07818] group-hover:text-white transition-colors">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Telefon na stavbu:</span>
                  <span className="text-base font-bold text-[#17232D] group-hover:text-[#F07818] transition-colors">
                    {settings.phone}
                  </span>
                </div>
              </a>

              <a
                href={`mailto:${settings.email}`}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-[#F07818] transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-[#263746]/10 flex items-center justify-center text-[#263746] group-hover:bg-[#263746] group-hover:text-white transition-colors">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">E-mail pro podklady:</span>
                  <span className="text-base font-bold text-[#17232D] group-hover:text-[#263746] transition-colors">
                    {settings.email}
                  </span>
                </div>
              </a>

              <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                  <MapPin className="w-6 h-6 text-[#F07818]" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Centrála & sídlo firmy:</span>
                  <span className="text-sm font-bold text-[#17232D] block">
                    Zábřeh na Moravě (PSČ 789 01)
                  </span>
                  <span className="text-xs text-slate-500 mt-1 block">
                    Výjezdy a realizace: Zábřeh, Šumperk, Mohelnice, Olomouc, Prostějov, Přerov a celý Olomoucký kraj.
                  </span>
                </div>
              </div>
            </div>

            {/* Quality & warranty banner */}
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Poctivé řemeslo & transparentní rozpočet</span>
              </span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Na provedené stavební a obkladačské práce poskytujeme písemnou záruku 36 měsíců
                včetně položkového rozpočtu bez skrytých vícenákladů.
              </p>
            </div>
          </div>

          {/* Right Column: Dynamic Lead Form */}
          <div id="poptavka" className="lg:col-span-7 scroll-mt-24">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-md">
              {submittedLeadId ? (
                /* Success State */
                <div className="py-10 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-[#17232D]">
                    Poptávka byla úspěšně odeslána!
                  </h3>
                  <div className="inline-block px-3 py-1 bg-slate-100 rounded text-xs font-mono font-bold text-slate-700">
                    Evidenční číslo: #{submittedLeadId}
                  </div>
                  <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    Děkujeme za vaši poptávku. Všechny podklady jsme bezpečně uložili. Do 24–48
                    hodin se vám ozveme pro upřesnění detailů a dohodnutí termínu bezplatného
                    zaměření na místě.
                  </p>
                  <div className="pt-4">
                    <button
                      onClick={() => setSubmittedLeadId(null)}
                      className="px-5 py-2.5 text-xs font-bold text-white bg-[#17232D] hover:bg-[#263746] rounded cursor-pointer"
                    >
                      Odeslat další poptávku
                    </button>
                  </div>
                </div>
              ) : (
                /* Interactive Form with Dynamic Category Questions */
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div className="border-b border-slate-100 pb-3 mb-2">
                    <h3 className="text-xl font-extrabold text-[#17232D]">
                      Nezávazný poptávkový formulář
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Zvolte požadovanou práci a formulář se přizpůsobí specifickým otázkám.
                    </p>
                  </div>

                  {/* Honeypot for spam bots */}
                  <div className="hidden" aria-hidden="true">
                    <input
                      type="text"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  {/* Prefilled calculation notice */}
                  {prefilledData && (
                    <div className="mb-4 p-3.5 bg-orange-50 border border-[#F07818]/40 rounded-xl flex items-center justify-between text-xs text-slate-800 shadow-xs">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#F07818] shrink-0" />
                        <div>
                          <div className="font-bold text-[#17232D]">
                            Načtena konfigurace z kalkulačky ({prefilledData.estimateSummary.minPrice.toLocaleString('cs-CZ')} – {prefilledData.estimateSummary.maxPrice.toLocaleString('cs-CZ')} Kč)
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Orientační doba: {prefilledData.estimateSummary.durationDays}. Specifikace byla přenesena.
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-[#F07818] text-white text-[10px] font-bold rounded shrink-0 hidden sm:inline">
                        Aktivní výpočet
                      </span>
                    </div>
                  )}

                  {/* Prefilled context notice (Case Study or Material Comparison) */}
                  {prefilledNote && !prefilledData && (
                    <div className="mb-4 p-3.5 bg-slate-50 border border-[#263746]/25 rounded-xl flex items-center justify-between text-xs text-slate-800">
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-[#F07818] shrink-0" />
                        <div>
                          <div className="font-bold text-[#17232D]">
                            {prefilledNote.sourceLabel}: {prefilledNote.title}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Vybraná služba a poznámka pro konzultaci byly předvyplněny níže.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Service selector (Primary category) */}
                  <div>
                    <label className="block text-xs font-bold text-[#17232D] mb-1">
                      Požadovaná služba / typ prací <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white font-semibold text-[#17232D] focus:outline-none focus:border-[#F07818]"
                    >
                      {FORM_SERVICE_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* DYNAMIC QUESTIONS: APARTMENT CORE / BATHROOM / WC */}
                  {isCoreCategory && (
                    <div className="p-4 bg-[#F8FAFC] border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#F07818] uppercase tracking-wider">
                        <Grid className="w-4 h-4" />
                        <span>Upřesnění pro renovaci bytového jádra & koupelny:</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Typ bytu / stavby</label>
                          <select
                            value={corePropertyType}
                            onChange={(e) => setCorePropertyType(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md bg-white"
                          >
                            <option value="Panelový byt">Panelový dům (umakartové jádro)</option>
                            <option value="Zděný byt">Cihlový / zděný byt</option>
                            <option value="Rodinný dům">Rodinný dům</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Rozsah renovace</label>
                          <select
                            value={coreScope}
                            onChange={(e) => setCoreScope(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md bg-white"
                          >
                            <option value="Kompletní jádro (koupelna + WC)">Kompletní jádro (koupelna + WC)</option>
                            <option value="Pouze koupelna">Pouze koupelna</option>
                            <option value="Pouze samostatné WC">Pouze samostatné WC</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Změna dispozice / stěn</label>
                          <select
                            value={coreDisposition}
                            onChange={(e) => setCoreDisposition(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md bg-white"
                          >
                            <option value="Chci poradit s možnostmi zvětšení">Chci poradit s možnostmi zvětšení</option>
                            <option value="Ano, požaduji posunutí příčky / zvětšení">Ano, plánujeme změnu dispozice</option>
                            <option value="Ne, zachováme původní rozměry jádra">Ne, zachováme původní rozměry</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Představa a návrh</label>
                          <select
                            value={coreDesignStatus}
                            onChange={(e) => setCoreDesignStatus(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md bg-white"
                          >
                            <option value="Mám hrubou představu">Mám hrubou představu</option>
                            <option value="Mám hotový projekt / vizualizaci">Mám hotový projekt / vizualizaci</option>
                            <option value="Nechám si navrhnout od vás na zaměření">Nechám si navrhnout od vás</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Name and Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#17232D] mb-1">
                        Jméno a příjmení <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="např. Tomáš Dvořák"
                        className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white focus:outline-none transition-colors ${
                          errors.name
                            ? 'border-rose-500 bg-rose-50/30'
                            : 'border-slate-300 focus:border-[#F07818]'
                        }`}
                      />
                      {errors.name && (
                        <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>{errors.name}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#17232D] mb-1">
                        E-mailová adresa <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="vas@email.cz"
                        className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white focus:outline-none transition-colors ${
                          errors.email
                            ? 'border-rose-500 bg-rose-50/30'
                            : 'border-slate-300 focus:border-[#F07818]'
                        }`}
                      />
                      {errors.email && (
                        <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>{errors.email}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Phone and Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#17232D] mb-1">
                        Telefonní číslo <span className="text-slate-400 font-normal">(doporučeno)</span>
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+420 777 000 000"
                        className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white focus:outline-none transition-colors ${
                          errors.phone
                            ? 'border-rose-500 bg-rose-50/30'
                            : 'border-slate-300 focus:border-[#F07818]'
                        }`}
                      />
                      {errors.phone && (
                        <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>{errors.phone}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#17232D] mb-1">
                        Místo stavby (obec v Olomouckém kraji) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="např. Olomouc – Hejčín, Prostějov..."
                        className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white focus:outline-none transition-colors ${
                          errors.location
                            ? 'border-rose-500 bg-rose-50/30'
                            : 'border-slate-300 focus:border-[#F07818]'
                        }`}
                      />
                      {errors.location && (
                        <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>{errors.location}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Timeline and Description */}
                  <div>
                    <label className="block text-xs font-bold text-[#17232D] mb-1">
                      Předpokládaný termín realizace <span className="text-slate-400 font-normal">(volitelné)</span>
                    </label>
                    <input
                      type="text"
                      value={preferredTimeline}
                      onChange={(e) => setPreferredTimeline(e.target.value)}
                      placeholder="např. Květen 2027, co nejdříve, flexibilní"
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#F07818]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-[#17232D]">
                        Podrobnější popis vašeho záměru <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {description.length} znaků
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Napište nám podrobnosti (např. zda chcete sprchový kout či vanu, přibližnou plochu obkladů či podlah, zda bydlíte v bytě během prací apod.)..."
                      className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white focus:outline-none transition-colors ${
                        errors.description
                          ? 'border-rose-500 bg-rose-50/30'
                          : 'border-slate-300 focus:border-[#F07818]'
                      }`}
                    />
                    {errors.description && (
                      <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.description}</span>
                      </p>
                    )}
                  </div>

                  {/* File Uploads */}
                  <div>
                    <label className="block text-xs font-bold text-[#17232D] mb-1">
                      Přílohy / fotografie stávajícího stavu či půdorys{' '}
                      <span className="text-slate-400 font-normal">(volitelné, max. 5 MB)</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-2 transition-colors">
                        <Paperclip className="w-4 h-4 text-slate-500" />
                        <span>Připojit foto nebo PDF</span>
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-slate-400">
                        Fotografie stávajícího jádra či půdorysu nám velmi pomohou při odhadu.
                      </span>
                    </div>

                    {errors.attachments && (
                      <p className="text-[11px] text-rose-600 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.attachments}</span>
                      </p>
                    )}

                    {attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {attachments.map((file, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded text-xs text-slate-700"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[140px]">{file.name}</span>
                            <span className="text-slate-400 text-[10px]">({file.size} KB)</span>
                            <button
                              type="button"
                              onClick={() => removeAttachment(idx)}
                              className="text-slate-400 hover:text-rose-600 ml-1"
                              title="Odstranit"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* GDPR Consent - Not pre-checked */}
                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gdprConsent}
                        onChange={(e) => setGdprConsent(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#F07818] focus:ring-[#F07818] cursor-pointer"
                      />
                      <span className="text-xs text-slate-600 leading-relaxed">
                        Souhlasím se zpracováním poskytnutých osobních údajů pro účely vyřízení
                        této poptávky v souladu s{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            onOpenGdpr();
                          }}
                          className="text-[#F07818] underline font-semibold hover:text-[#d9660e]"
                        >
                          informacemi o ochraně osobních údajů
                        </button>
                        . Údaje nebudou předány třetím stranám.{' '}
                        <span className="text-rose-500">*</span>
                      </span>
                    </label>
                    {errors.gdpr && (
                      <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.gdpr}</span>
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3 space-y-2">
                    {errors.submit && (
                      <p className="text-xs text-rose-600 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errors.submit}</span>
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-[#F07818] hover:bg-[#d9660e] active:scale-99 text-white font-extrabold text-base rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      <Send className="w-5 h-5" />
                      <span>
                        {isSubmitting
                          ? 'Odesílám poptávku...'
                          : 'Odeslat nezávaznou poptávku na stavbu'}
                      </span>
                    </button>
                    <p className="text-center text-[11px] text-slate-400 mt-2">
                      Bezplatná návštěva na stavbě a položková kalkulace bez závazků.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
