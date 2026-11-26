import React from 'react';
import { MessageSquare, ClipboardCheck, Calculator, Sparkles, ArrowRight } from 'lucide-react';

interface ProcessSectionProps {
  onOpenLeadForm: () => void;
}

export const ProcessSection: React.FC<ProcessSectionProps> = ({ onOpenLeadForm }) => {
  const steps = [
    {
      num: '01',
      title: 'Nezávazná poptávka',
      desc: 'Vyplníte jednoduchý formulář na webu nebo nám zavoláte. Popíšete nám, co plánujete stavět či rekonstruovat.',
      icon: MessageSquare,
    },
    {
      num: '02',
      title: 'Osobní prohlídka a zaměření',
      desc: 'Přijedeme za vámi kamkoliv v Olomouckém kraji. Zkontrolujeme stávající stav, změříme roviny a probereme technická řešení.',
      icon: ClipboardCheck,
    },
    {
      num: '03',
      title: 'Položkový rozpočet & termín',
      desc: 'Sestavíme přehlednou cenovou nabídku s rozpadem materiálu a prací. Dohodneme přesný termín zahájení i dokončení.',
      icon: Calculator,
    },
    {
      num: '04',
      title: 'Kvalitní realizace a předání',
      desc: 'Pracujeme v dohodnutém čase. Dodržujeme technologie, denně po sobě uklízíme a hotové dílo předáváme bez nedodělků.',
      icon: Sparkles,
    },
  ];

  return (
    <section id="postup" className="py-20 bg-[#17232D] text-white border-b border-[#263746]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F07818] mb-2">
            <span>Jak probíhá spolupráce</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-300 font-medium">4 jasné kroky</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Žádné nepříjemné překvapení. Od poptávky až po čistý úklid.
          </h2>
          <p className="text-slate-400 mt-3 text-base">
            U nás přesně víte, v jaké fázi se vaše stavba nachází a co bude následovat.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="bg-[#1E2B37] rounded-xl p-6 border border-[#263746] relative flex flex-col justify-between group hover:border-[#F07818]/60 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-2xl font-black text-[#F07818] tracking-wider">
                      {step.num}
                    </span>
                    <div className="w-10 h-10 rounded-lg bg-[#263746] flex items-center justify-center text-slate-300 group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                    {step.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#263746] text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                  Krok {step.num} z 04
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Prompt */}
        <div className="mt-14 text-center">
          <button
            onClick={onOpenLeadForm}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#C2560A] hover:bg-[#9E4306] text-white font-bold text-sm rounded shadow-lg transition-all cursor-pointer"
          >
            <span>Začněte 1. krokem – poptejte svou stavbu</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
