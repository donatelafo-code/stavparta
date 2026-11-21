import React, { useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  FileCheck2,
  Hammer,
  HelpCircle,
  MessageSquare,
  Wallet,
} from 'lucide-react';

type FaqCategory = 'all' | 'prubeh' | 'platby' | 'legislativa';

interface FaqItem {
  id: string;
  category: Exclude<FaqCategory, 'all'>;
  categoryLabel: string;
  question: string;
  answer: string;
}

const FAQ_CATEGORIES: { key: FaqCategory; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'Všechny dotazy', icon: <HelpCircle className="w-3.5 h-3.5" /> },
  { key: 'prubeh', label: 'Průběh rekonstrukce', icon: <Hammer className="w-3.5 h-3.5" /> },
  { key: 'platby', label: 'Platby a rozpočet', icon: <Wallet className="w-3.5 h-3.5" /> },
  { key: 'legislativa', label: 'Legislativa, SVJ a záruky', icon: <FileCheck2 className="w-3.5 h-3.5" /> },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'prubeh',
    categoryLabel: 'Průběh rekonstrukce',
    question: 'Jak dlouho trvá kompletní renovace bytového jádra a jak dlouho rekonstrukce celého bytu?',
    answer:
      'Výměna původního umakartového jádra za zděné (Ytong), včetně nových rozvodů vody a odpadů, hydroizolace, obkladů a kompletace sanity, trvá standardně 10 až 14 pracovních dní. Kompletní rekonstrukce bytu 2+kk nebo 3+1 se zpravidla pohybuje mezi 3 až 6 týdny podle rozsahu vyrovnávání podlah, omítek a technologických pauz pro schnutí.',
  },
  {
    id: 'faq-2',
    category: 'prubeh',
    categoryLabel: 'Průběh rekonstrukce',
    question: 'Musím si shánět zedníka, sádrokartonáře, instalatéra a obkladače zvlášť?',
    answer:
      'Ne. Jsme sehraná stavební parta, která zastřešuje veškerá stavební a dokončovací řemesla – bourací a zednické práce, sádrokartony, vodu a odpady, podlahy, obklady i finální malby. Jednáte s jedním vedoucím party a práce na sebe plynule navazují bez zbytečných prostojů.',
  },
  {
    id: 'faq-3',
    category: 'prubeh',
    categoryLabel: 'Průběh rekonstrukce',
    question: 'Lze v bytě během rekonstrukce koupelny bydlet a jak řešíte úklid?',
    answer:
      'U rozsáhlejších rekonstrukcí celého bytu doporučujeme dočasné přestěhování kvůli prachu a odstávce vody. Pokud rekonstruujeme pouze bytové jádro za plného provozu domácnosti, vždy chráníme podlahy v chodbě zakrývací fólií a filcem, na noc se snažíme zajistit provizorní funkční toaletu a na konci každého pracovního dne po sobě uklidíme jak v bytě, tak na společném schodišti.',
  },
  {
    id: 'faq-4',
    category: 'prubeh',
    categoryLabel: 'Průběh rekonstrukce',
    question: 'Zajišťujete nákup stavebního materiálu i odvoz suti na skládku?',
    answer:
      'Ano. Stavební materiál (tvárnice, lepidla, hydroizolace, kabeláž, potrubí i sádrokartony) nakupujeme, přivezeme a vyneseme na stavbu. Vybouraný umakart, starou suť a obaly průběžně odvážíme k ekologické likvidaci na skládku nebo do sběrného dvora.',
  },
  {
    id: 'faq-5',
    category: 'platby',
    categoryLabel: 'Platby a rozpočet',
    question: 'Jaké jsou platební podmínky? Platí se celá částka předem?',
    answer:
      'Celou částku předem nikdy nevyžadujeme. Platby rozdělujeme do transparentních etap podle smlouvy o dílo: první záloha slouží na nákup materiálu při zahájení prací (obvykle 30–40 %), druhá průběžná platba probíhá po dokončení hrubých konstrukcí a rozvodů, a závěrečný doplatek hradíte až po osobní kontrole a podpisu předávacího protokolu.',
  },
  {
    id: 'faq-6',
    category: 'platby',
    categoryLabel: 'Platby a rozpočet',
    question: 'Je osobní zaměření na místě a vypracování cenové nabídky zdarma?',
    answer:
      'Ano. Po celém Olomouckém kraji (Zábřeh na Moravě, Šumperk, Mohelnice, Olomouc, Prostějov, Přerov a okolí) přijedeme na první prohlídku stavby, vše zaměříme a vypracujeme vám položkový rozpočet zcela zdarma a bez závazků.',
  },
  {
    id: 'faq-7',
    category: 'platby',
    categoryLabel: 'Platby a rozpočet',
    question: 'Může se schválená cena během stavby navýšit o skryté vícepráce?',
    answer:
      'Před zahájením dostáváte detailní položkový rozpočet rozdělený na materiál a práci, který držíme. Pokud se po vybourání starých konstrukcí objeví nečekaná technická závada (např. prasklá litinová stoupačka nebo vlhká zeď pod umakartem), vždy vás okamžitě informujeme, ukážeme rozsah problému a jakoukoliv úpravu ceny nejprve společně písemně odsouhlasíme.',
  },
  {
    id: 'faq-8',
    category: 'legislativa',
    categoryLabel: 'Legislativa, SVJ a záruky',
    question: 'Potřebuji k rekonstrukci bytového jádra nebo bytu stavební povolení?',
    answer:
      'Pokud při renovaci jádra nebo interiéru nezasahujete do nosných stěn, nebouráte otvory v nosném panelu a neměníte vnější vzhled domu, stavební povolení podle platného stavebního zákona zpravidla nepotřebujete. Vždy je ale nutné předem informovat výbor SVJ nebo bytové družstvo a dodržet domovní řád a časy hlučných prací. V případě zásahu do nosných konstrukcí zajistíme posouzení statikem.',
  },
  {
    id: 'faq-9',
    category: 'legislativa',
    categoryLabel: 'Legislativa, SVJ a záruky',
    question: 'Jak probíhá likvidace stavebního odpadu a ochrana společných prostor domu?',
    answer:
      'Veškerou stavební suť ze starého jádra, omítek a obkladů balíme do pevných pytlů a průběžně odvážíme k ekologické likvidaci na schválenou skládku. Společné chodby a výtah chráníme zakrývacím filcem a na konci každého pracovního dne schodiště uklidíme v souladu s domovním řádem SVJ.',
  },
  {
    id: 'faq-10',
    category: 'legislativa',
    categoryLabel: 'Legislativa, SVJ a záruky',
    question: 'Jakou záruku na provedené dílo poskytujete a co obdržím při předání?',
    answer:
      'Zakázky stvrzujeme písemnou smlouvou o dílo s jasným termínem a zárukou 36 měsíců na stavební a řemeslné práce. Při předání obdržíte předávací protokol, fotodokumentaci skrytých rozvodů vody a odpadů před zaklopením a záznam o tlakové zkoušce těsnosti rozvodů.',
  },
];

interface FaqSectionProps {
  onOpenLeadForm: () => void;
  onOpenChat?: () => void;
}

export const FaqSection: React.FC<FaqSectionProps> = ({
  onOpenLeadForm,
  onOpenChat,
}) => {
  const [activeCategory, setActiveCategory] = useState<FaqCategory>('all');
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0].id);

  const filteredItems =
    activeCategory === 'all'
      ? FAQ_ITEMS
      : FAQ_ITEMS.filter((item) => item.category === activeCategory);

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="faq"
      className="py-20 bg-[#F8FAFC] border-b border-slate-200 scroll-mt-20"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#F07818] mb-2">
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>Často kladené dotazy</span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span className="text-slate-600">Průběh, finance i legislativa</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17232D] tracking-tight text-balance">
            Na co se nás klienti nejčastěji ptají
          </h2>
          <p className="text-slate-600 mt-3 text-sm sm:text-base leading-relaxed">
            Přehled praktických odpovědí k organizaci stavby, etapovému placení, ohlášení
            rekonstrukce SVJ a zárukám ještě před prvním zaměřením.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div
          className="flex flex-wrap items-center justify-center gap-2 mb-8"
          role="tablist"
          aria-label="Kategorie často kladených dotazů"
        >
          {FAQ_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setActiveCategory(cat.key);
                  const firstInCat =
                    cat.key === 'all'
                      ? FAQ_ITEMS[0]
                      : FAQ_ITEMS.find((i) => i.category === cat.key);
                  if (firstInCat) setOpenId(firstInCat.id);
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#17232D] text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-[#F07818]/60'
                }`}
              >
                <span className={isActive ? 'text-[#F07818]' : 'text-slate-400'}>
                  {cat.icon}
                </span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all bg-white ${
                  isOpen
                    ? 'border-[#F07818]/60 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                  className="w-full text-left px-5 py-4 sm:px-6 sm:py-5 flex items-start justify-between gap-4 cursor-pointer"
                >
                  <div className="space-y-1 pr-2">
                    <span className="text-[11px] font-bold text-[#F07818] block">
                      {item.categoryLabel}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-[#17232D] block leading-snug">
                      {item.question}
                    </span>
                  </div>
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors mt-0.5 ${
                      isOpen
                        ? 'bg-[#F07818] text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0">
                    <div className="pt-3 border-t border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {item.answer}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Strip */}
        <div className="mt-10 p-6 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-[#17232D]">
              Máte specifický dotaz ke své nemovitosti?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Popište nám svůj záměr v poptávce nebo se rovnou zeptejte našeho asistenta k nabízeným službám.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onOpenChat && (
              <button
                type="button"
                onClick={onOpenChat}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#17232D] font-bold text-xs sm:text-sm rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-[#F07818]" />
                <span>Zeptat se v chatu</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenLeadForm}
              className="px-5 py-2.5 bg-[#F07818] hover:bg-[#d9660e] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Nezávazně poptat</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
