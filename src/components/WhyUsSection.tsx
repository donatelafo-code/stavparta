import React from 'react';
import {
  Sparkles,
  Scale,
  HandCoins,
  ShieldCheck,
  CheckCircle,
  CalendarCheck,
  Camera,
  Layers,
} from 'lucide-react';

export const WhyUsSection: React.FC = () => {
  const reasons = [
    {
      title: 'Pevná cena a položkový rozpočet',
      desc: 'Před začátkem prací obdržíte detailní položkový rozpis materiálu i práce. Co je na papíře, to platí bez dodatečných překvapení.',
      icon: HandCoins,
    },
    {
      title: 'Pořádek a čistota každý den',
      desc: 'Na stavbě i ve společných prostorách bytového domu po sobě každý den zameteme a uklidíme. Odpad pravidelně odvážíme.',
      icon: Sparkles,
    },
    {
      title: 'Průběžná fotodokumentace',
      desc: 'Všechny skryté rozvody vody, odpadů a konstrukce pod sádrokartonem pečlivě fotíme před zaklopením. Přesně víte, kde co vede.',
      icon: Camera,
    },
    {
      title: 'Dodržování technologických pauz',
      desc: 'Neuspěcháváme schnutí betonů, nivelací ani lepidel. Poctivé dodržení technických listů je zárukou, že obklad ani omítka nepopraská.',
      icon: CalendarCheck,
    },
    {
      title: 'Přímá domluva s řemeslníky',
      desc: 'Žádné zprostředkovatelské agentury ani střídání anonymních part. Jednáte a domlouváte se přímo s lidmi, kteří u vás pracují.',
      icon: Scale,
    },
    {
      title: 'Záruka a smlouva o dílo',
      desc: 'Na provedené dílo poskytujeme řádnou záruku. Vše stvrzujeme písemnou smlouvou s jasnými termíny a odpovědností.',
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="py-20 bg-[#F1F4F6] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F07818] mb-2">
            <span>Principy naší práce</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-600 font-medium">Poctivé řemeslo</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17232D] tracking-tight">
            Proč svěřit svou stavbu partě STAVPARTA
          </h2>
          <p className="text-slate-600 mt-3 text-base">
            Nestavíme si pomníky ani se nehonosíme smyšlenými tituly. Naše reputace stojí na
            spokojených klientech a kvalitně odvedené práci.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs hover:border-[#F07818]/50 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-[#F07818]/10 text-[#F07818] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#17232D] mb-2 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
