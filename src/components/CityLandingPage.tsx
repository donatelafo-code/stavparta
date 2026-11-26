import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Car,
  CheckCircle2,
  Info,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { CITY_PAGES, CityPageConfig } from '../shared/cityPages';
import { ServiceItem, SiteSettings } from '../types';

interface CityLandingPageProps {
  city: CityPageConfig;
  services: ServiceItem[];
  settings: SiteSettings;
  onOpenLeadForm: (serviceId?: string) => void;
}

export const CityLandingPage: React.FC<CityLandingPageProps> = ({
  city,
  services,
  settings,
  onOpenLeadForm,
}) => {
  const activeServices = services.filter((s) => s.isActive);
  const otherCities = CITY_PAGES.filter((c) => c.slug !== city.slug);

  return (
    <div className="bg-[#F1F4F6] min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
        {/* Breadcrumb */}
        <nav aria-label="Drobečková navigace" className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <Link to="/" className="hover:text-[#B84F00] flex items-center gap-1 font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Zpět na úvod</span>
          </Link>
          <span>/</span>
          <Link to="/#pusobnost" className="hover:text-[#B84F00] font-medium">
            Působnost
          </Link>
          <span>/</span>
          <span className="font-bold text-[#17232D]">{city.cityName}</span>
        </nav>

        {/* City Hero Banner */}
        <section className="bg-[#17232D] text-white rounded-2xl p-6 sm:p-10 lg:p-12 shadow-xl border border-[#263746]">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#263746] rounded text-xs font-bold uppercase tracking-wider text-[#FF9642]">
              <MapPin className="w-3.5 h-3.5" />
              <span>{city.districtLabel}</span>
              {city.isHeadquarters && (
                <>
                  <span className="text-slate-400">·</span>
                  <span className="text-white">Domovská centrála</span>
                </>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-balance">
              {city.headline}
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">{city.intro}</p>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-200 pt-1">
              <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                <Car className="w-4 h-4 text-[#F07818] shrink-0" />
                <span>{city.travelSummary}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Centrála: {settings.headquarters || 'Zábřeh na Moravě'}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-3">
              <button
                type="button"
                onClick={() => onOpenLeadForm()}
                className="px-6 py-3.5 bg-[#C2560A] hover:bg-[#9E4306] text-white font-bold text-sm rounded-lg shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Nezávazně poptat realizaci {city.locative}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                to="/#kalkulacka"
                className="px-5 py-3.5 bg-[#263746] hover:bg-[#34485a] text-slate-100 font-semibold text-sm rounded-lg border border-slate-600 transition-colors"
              >
                Orientační kalkulačka ceny
              </Link>
            </div>
          </div>
        </section>

        {/* Main Grid: Typical Local Work + Services Links */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-2xl font-extrabold text-[#17232D]">
                Jaké stavební práce {city.locative} zajišťujeme
              </h2>
              <ul className="space-y-3 pt-1">
                {city.typicalScope.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-3.5 bg-[#F8FAFC] rounded-xl border border-slate-200/80 flex items-start gap-3 text-sm text-slate-800"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#B84F00] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">Lokální poznámka k úpravě majitelem</span>
                  <span>{city.ownerTemplateNote}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-xl font-extrabold text-[#17232D]">
                Dostupné odborné služby v regionu
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeServices.map((srv) => (
                  <Link
                    key={srv.id}
                    to={`/sluzba/${srv.slug}`}
                    className="p-4 rounded-xl border border-slate-200 hover:border-[#C2560A] hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <span className="text-xs font-bold text-[#17232D] group-hover:text-[#B84F00] block">
                        {srv.title}
                      </span>
                      <span className="text-[11px] text-slate-600 line-clamp-1">
                        {srv.shortDescription}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#B84F00] shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <aside className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-lg font-extrabold text-[#17232D]">
                Další města v Olomouckém kraji
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Vyjíždíme z centrály v Zábřehu na Moravě po celém Olomouckém kraji bez zbytečných
                prostoje. Prohlédněte si přehled pro další lokality:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {otherCities.map((other) => (
                  <Link
                    key={other.slug}
                    to={`/lokalita/${other.slug}`}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-[#C2560A] hover:bg-orange-50/40 text-xs font-bold text-[#17232D] flex items-center justify-between"
                  >
                    <span>{other.cityName}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#B84F00]" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-[#17232D] text-white rounded-2xl p-6 space-y-3 border border-[#263746]">
              <h3 className="text-lg font-extrabold">Bezplatné zaměření na místě</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Po domluvě přijedeme přímo k vám {city.locative}, probereme technický stav
                konstrukce a připravíme jasný položkový rozpočet.
              </p>
              <button
                type="button"
                onClick={() => onOpenLeadForm()}
                className="w-full py-3 bg-[#C2560A] hover:bg-[#9E4306] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Domluvit obhlídku stavby</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
