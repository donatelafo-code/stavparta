import React from 'react';
import { ArrowRight, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { SiteSettings } from '../types';
import { IMAGE_PATHS } from '../shared/responsiveImages';
import { ResponsiveImage } from './ResponsiveImage';
import { getPreferredScrollBehavior } from '../hooks/useModalAccessibility';

interface HeroProps {
  settings: SiteSettings;
  onOpenLeadForm: () => void;
}

export const Hero: React.FC<HeroProps> = ({ settings, onOpenLeadForm }) => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: getPreferredScrollBehavior() });
  };

  return (
    <section className="relative bg-[#17232D] text-white overflow-hidden border-b border-[#263746]">
      {/* Background Hero Image with measured contrast scrim */}
      <div className="absolute inset-0 z-0">
        <ResponsiveImage
          src={IMAGE_PATHS.HERO}
          alt="Řemeslníci STAVPARTA při poctivé rekonstrukci interiéru"
          sizes="100vw"
          priority
          className="w-full h-full object-cover object-center opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#17232D] via-[#17232D]/90 to-[#17232D]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#17232D] via-transparent to-black/30" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-24 lg:py-28">
        <div className="max-w-3xl">
          {/* Slogan Kicker */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#263746]/90 border border-slate-600 rounded-md text-xs font-semibold uppercase tracking-wider text-[#FF9642] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#FF9642]" />
            <span>{settings.slogan}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-300 normal-case">{settings.operatingRegion}</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] mb-6 text-white text-balance">
            {settings.motto}
          </h1>

          {/* Subtitle / Lead Paragraph */}
          <p className="text-lg sm:text-xl text-slate-300 leading-relaxed mb-8 max-w-2xl">
            Jsme parta zkušených řemeslníků OSVČ. Provádíme komplexní rekonstrukce bytů a domů,
            zednické práce, sádrokartony, obklady a fasády. Sázíme na přímou domluvu, pevný
            rozpočet a pořádek na stavbě.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-10">
            <button
              onClick={onOpenLeadForm}
              className="px-6 py-4 text-base font-bold text-white bg-[#C2560A] hover:bg-[#9E4306] active:scale-98 rounded shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Nezávazně poptat zakázku</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollTo('realizace')}
              className="px-6 py-4 text-base font-semibold text-slate-200 hover:text-white bg-[#263746]/80 hover:bg-[#263746] border border-slate-600 rounded transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Prohlédnout realizace</span>
            </button>
          </div>

          {/* Trust Value Propositions Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-slate-700/80 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#F07818] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Pevný položkový rozpočet</span>
                <span className="text-xs text-slate-400">Předem víte, kolik zaplatíte za materiál i práci.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#F07818] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Dodržení termínů</span>
                <span className="text-xs text-slate-400">Realistický harmonogram a každodenní postup prací.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#F07818] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Čistota na stavbě</span>
                <span className="text-xs text-slate-400">Pravidelný úklid staveniště i společných prostor.</span>
              </div>
            </div>
          </div>

          {/* Regional coverage badge strip */}
          <div className="mt-8 flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span className="font-extrabold text-[#F07818] uppercase tracking-wider text-[11px]">
              Oblast působení:
            </span>
            <button
              onClick={() => scrollTo('pusobnost')}
              className="px-2.5 py-0.5 bg-[#C2560A] text-white border border-[#C2560A] rounded text-[11px] font-bold transition-all hover:bg-[#9E4306] cursor-pointer flex items-center gap-1 shadow-xs"
              title="Centrála a domovská základna STAVPARTA – Zábřeh na Moravě"
            >
              <span>★ Zábřeh na Moravě (Centrála)</span>
            </button>
            {['Šumperk', 'Mohelnice', 'Olomouc', 'Litovel', 'Prostějov', 'Přerov', 'Šternberk', 'Uničov'].map(
              (city) => (
                <button
                  key={city}
                  onClick={() => scrollTo('pusobnost')}
                  className="px-2 py-0.5 bg-[#263746]/80 hover:bg-[#C2560A] hover:text-white border border-slate-700 hover:border-[#C2560A] rounded text-[11px] text-slate-300 transition-colors cursor-pointer"
                  title={`Zobrazit působnost a dojezd pro ${city} na mapě`}
                >
                  {city}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Demo notice bar */}
      {import.meta.env.VITE_DEMO_MODE === 'true' && (
        <div className="bg-[#0D151C] border-t border-[#1E2B37] py-2 px-4 text-center text-xs text-slate-400">
          <span className="font-medium text-amber-400 mr-2">[DEMO REŽIM]</span>
          <span>
            Web je v předvýrobní verzi. Veškeré fotografie realizací a texty referencí jsou dočasné a
            připravené k doplnění zadavatelem.
          </span>
        </div>
      )}
    </section>
  );
};
