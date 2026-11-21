import React from 'react';
import { Users, CheckCircle2, Shield, Wrench, HeartHandshake, Eye } from 'lucide-react';
import { SiteSettings } from '../types';

interface AboutSectionProps {
  settings: SiteSettings;
  onOpenLeadForm: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ settings, onOpenLeadForm }) => {
  return (
    <section id="o-nas" className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Story & Principles */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F07818]">
              <span>O stavební partě</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500 font-medium">Centrála Zábřeh na Moravě & Olomoucký kraj</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17232D] tracking-tight">
              Řemeslo založené na férové domluvě a čisté práci
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Jsme parta samostatných řemeslníků (OSVČ) se sídlem a zázemím v <strong>Zábřehu na Moravě</strong>, kteří spojili své zkušenosti, aby zákazníkům v Zábřehu, Šumperku, Mohelnici, Olomouci i celém kraji nabídli spolehlivé stavební a rekonstrukční práce. Nevydáváme se za anonymní korporát ani nenabízíme nerealistické sliby – stavíme na osobním kontaktu, pečlivém zaměření a poctivě odvedeném detailu.
            </p>

            <p className="text-base text-slate-600 leading-relaxed">
              Víme, že rekonstrukce domova je pro každou rodinu velký krok i investice. Proto
              jednáme na rovinu: o postupu prací vás informujeme každý den, nepoužíváme nekvalitní
              náhražky materiálů a na staveništi udržujeme pořádek.
            </p>

            {/* 4 Core Principles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-lg bg-[#F1F4F6] border border-slate-200/80">
                <div className="flex items-center gap-2.5 font-bold text-[#17232D] mb-1">
                  <HeartHandshake className="w-5 h-5 text-[#F07818]" />
                  <span>Přímá komunikace</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Jednáte přímo s lidmi, kteří u vás na stavbě pracují. Žádní překupníci zakázek.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#F1F4F6] border border-slate-200/80">
                <div className="flex items-center gap-2.5 font-bold text-[#17232D] mb-1">
                  <Shield className="w-5 h-5 text-[#F07818]" />
                  <span>Dodržení rozpočtu</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Před začátkem máte v ruce položkový soupis. Žádné nečekané faktury na konci.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#F1F4F6] border border-slate-200/80">
                <div className="flex items-center gap-2.5 font-bold text-[#17232D] mb-1">
                  <Wrench className="w-5 h-5 text-[#F07818]" />
                  <span>Technologická kázeň</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ctíme doby schnutí, hydroizolační pásky i správné penetrace. Děláme věci na první pokus.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#F1F4F6] border border-slate-200/80">
                <div className="flex items-center gap-2.5 font-bold text-[#17232D] mb-1">
                  <Eye className="w-5 h-5 text-[#F07818]" />
                  <span>Fotodokumentace</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Před zakrytím rozvodů a konstrukcí vše nafotíme, abyste věděli, co je ve zdech.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Key facts & locations box */}
          <div className="lg:col-span-5">
            <div className="bg-[#17232D] text-white rounded-xl p-8 shadow-xl border border-[#263746] space-y-6">
              <div className="border-b border-[#263746] pb-4">
                <span className="text-xs font-semibold text-[#F07818] uppercase tracking-wider block">
                  Kde působíme
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">
                  Zábřeh na Moravě a celý region
                </h3>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                Rádi za vámi přijedeme na bezplatnou osobní prohlídku a zaměření po celém kraji:
              </p>

              <div className="flex flex-wrap gap-2">
                {settings.primaryLocations.map((loc) => (
                  <span
                    key={loc}
                    className="px-3 py-1 bg-[#263746] text-xs font-medium text-slate-200 rounded border border-slate-600/50"
                  >
                    {loc}
                  </span>
                ))}
                <span className="px-3 py-1 bg-[#263746] text-xs font-medium text-slate-400 rounded">
                  + okolní obce do 45 km
                </span>
              </div>

              <div className="pt-4 border-t border-[#263746] space-y-3 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Pracovní dny:</span>
                  <span className="text-white font-medium">Pondělí až Pátek</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Reakce na poptávku:</span>
                  <span className="text-white font-medium">Zpravidla do 24–48 hodin</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Zaměření na místě:</span>
                  <span className="text-[#F07818] font-bold">Vždy zdarma a nezávazně</span>
                </div>
              </div>

              <button
                onClick={onOpenLeadForm}
                className="w-full py-3.5 bg-[#F07818] hover:bg-[#d9660e] text-white font-bold text-sm rounded shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Domluvit osobní zaměření</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
