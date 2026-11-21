import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Layers,
  HelpCircle,
  Clock,
} from 'lucide-react';
import { ServiceItem } from '../types';

interface ServiceDetailPageProps {
  service: ServiceItem;
  allServices: ServiceItem[];
  onBack: () => void;
  onOpenLeadForm: (serviceId: string) => void;
  onSelectService: (service: ServiceItem) => void;
}

export const ServiceDetailPage: React.FC<ServiceDetailPageProps> = ({
  service,
  allServices,
  onBack,
  onOpenLeadForm,
  onSelectService,
}) => {
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const relatedServices = allServices.filter(
    (s) => service.relatedServiceIds?.includes(s.id) && s.id !== service.id
  );

  return (
    <div className="bg-[#F1F4F6] min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <button
            onClick={onBack}
            className="hover:text-[#F07818] flex items-center gap-1 font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Zpět na přehled webu</span>
          </button>
          <span>/</span>
          <span className="text-slate-400">Služby</span>
          <span>/</span>
          <span className="font-bold text-[#17232D]">{service.title}</span>
        </div>

        {/* Hero Section of Subpage */}
        <div className="bg-[#17232D] text-white rounded-2xl overflow-hidden shadow-xl border border-[#263746] mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10 lg:p-12">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#263746] rounded text-xs font-bold uppercase tracking-wider text-[#F07818]">
                <span>{service.category}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-300 normal-case">Olomoucký kraj</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {service.title}
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                {service.fullDescription}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => onOpenLeadForm(service.id)}
                  className="px-6 py-3.5 bg-[#F07818] hover:bg-[#d9660e] text-white font-bold text-sm rounded shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Nezávazně poptat tuto službu</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onBack}
                  className="px-5 py-3.5 bg-[#263746] hover:bg-[#34485a] text-slate-200 font-semibold text-sm rounded border border-slate-600 transition-colors"
                >
                  Prohlédnout ostatní služby
                </button>
              </div>
            </div>

            {/* Visual presentation */}
            <div className="lg:col-span-5">
              <div className="relative aspect-4/3 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
                {service.image ? (
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400 text-xs">
                    STAVPARTA – Profesionální řemeslo
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-xs text-slate-200 font-medium">
                  {service.shortDescription}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Left Content: Activities, Workflow, FAQ */}
          <div className="lg:col-span-8 space-y-12">
            {/* Features & Activities Checklist */}
            {service.features && service.features.length > 0 && (
              <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F07818]">
                  <Layers className="w-4 h-4" />
                  <span>Rozsah prací</span>
                </div>
                <h2 className="text-2xl font-extrabold text-[#17232D]">
                  Co konkrétně v rámci této služby zajišťujeme:
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {service.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#F1F4F6] rounded-lg border border-slate-200/80 flex items-start gap-3"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#F07818] shrink-0 mt-0.5" />
                      <span className="text-xs font-medium text-slate-800 leading-relaxed">
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Workflow: "Jak probíhá rekonstrukce" (Mandatory for Apartment Cores) */}
            {service.workflowSteps && service.workflowSteps.length > 0 && (
              <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F07818] mb-1">
                    <Clock className="w-4 h-4" />
                    <span>Harmonogram a fáze</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-[#17232D]">
                    Jak probíhá realizace od A do Z
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Přesný postup, díky kterému zakázka probíhá plynule a bez zbytečných prostojů.
                  </p>
                </div>

                <div className="space-y-4">
                  {service.workflowSteps.map((ws, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 bg-[#F8FAFC] hover:border-[#F07818]/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#17232D] text-[#F07818] font-black text-sm flex items-center justify-center shrink-0">
                        {ws.step}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#17232D]">{ws.title}</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {ws.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ Accordion */}
            {service.faq && service.faq.length > 0 && (
              <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F07818]">
                  <HelpCircle className="w-4 h-4" />
                  <span>Časté otázky a odpovědi</span>
                </div>
                <h2 className="text-2xl font-extrabold text-[#17232D]">
                  Co vás nejčastěji zajímá před zahájením prací
                </h2>

                <div className="space-y-3 pt-2">
                  {service.faq.map((item, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-200 rounded-lg overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}
                        className="w-full text-left p-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs sm:text-sm font-bold text-[#17232D] cursor-pointer"
                      >
                        <span>{item.question}</span>
                        <span className="text-[#F07818] text-base font-bold ml-2">
                          {openFaqIdx === idx ? '−' : '+'}
                        </span>
                      </button>
                      {openFaqIdx === idx && (
                        <div className="p-4 bg-white text-xs text-slate-600 leading-relaxed border-t border-slate-200">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Inquiry Trigger & Related Services */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Inquiry Sticky Box */}
            <div className="bg-[#17232D] text-white rounded-xl p-6 shadow-lg border border-[#263746] space-y-4 sticky top-24">
              <span className="text-xs font-bold text-[#F07818] uppercase tracking-wider block">
                Nezávazná kalkulace
              </span>
              <h3 className="text-xl font-extrabold text-white">
                Máte zájem o {service.title.toLowerCase()}?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Rádi se přijedeme podívat na vaši stavbu v Olomouci a celém kraji. Změříme prostor a
                připravíme přesný položkový rozpočet.
              </p>

              <button
                onClick={() => onOpenLeadForm(service.id)}
                className="w-full py-3.5 bg-[#F07818] hover:bg-[#d9660e] text-white font-bold text-xs rounded shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Poptat tuto službu</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-3 border-t border-[#263746] text-xs text-slate-400 space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Zaměření na místě zdarma</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Položkový rozpočet bez vícenákladů</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Průběžná fotodokumentace</span>
                </div>
              </div>
            </div>

            {/* Related Services Links (Mandatory requirement 3) */}
            {relatedServices.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-bold text-sm text-[#17232D]">Související práce na stavbě:</h4>
                <p className="text-xs text-slate-500">
                  Tuto službu naši zákazníci nejčastěji kombinují s:
                </p>
                <div className="space-y-2 pt-1">
                  {relatedServices.map((rel) => (
                    <button
                      key={rel.id}
                      onClick={() => onSelectService(rel)}
                      className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-[#F07818] hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <span className="text-xs font-bold text-[#17232D] group-hover:text-[#F07818] transition-colors block">
                          {rel.title}
                        </span>
                        <span className="text-[11px] text-slate-500 line-clamp-1">
                          {rel.shortDescription}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#F07818] shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
