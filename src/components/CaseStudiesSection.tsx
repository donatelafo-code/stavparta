import React, { useState } from 'react';
import {
  ArrowRight,
  ClipboardList,
  Clock,
  Layers,
  MapPin,
  Ruler,
  ShieldCheck,
  Wrench,
  AlertTriangle,
} from 'lucide-react';
import CORE_IMG from '../assets/images/service_apartment_core_renovation_1793401869790.jpg';
import BATHROOM_TILES_IMG from '../assets/images/project_bathroom_tiles_1793401119494.jpg';
import INTERIOR_IMG from '../assets/images/project_interior_renovation_1793401119488.jpg';

export interface CaseStudyTechParam {
  label: string;
  value: string;
}

export interface CaseStudyMaterial {
  category: string;
  spec: string;
}

export interface CaseStudyChallenge {
  challenge: string;
  solution: string;
}

export interface CaseStudyPhase {
  days: string;
  title: string;
  detail: string;
}

export interface CaseStudyItem {
  id: string;
  number: string;
  serviceId: string;
  categoryLabel: string;
  title: string;
  location: string;
  buildingType: string;
  duration: string;
  area: string;
  image: string;
  imageAlt: string;
  summary: string;
  techParams: CaseStudyTechParam[];
  materials: CaseStudyMaterial[];
  challenges: CaseStudyChallenge[];
  phases: CaseStudyPhase[];
  outcome: string;
}

const CASE_STUDIES: CaseStudyItem[] = [
  {
    id: 'cs-jadro-zabreh',
    number: '01',
    serviceId: 'srv-bytova-jadra',
    categoryLabel: 'Renovace bytového jádra',
    title: 'Přestavba umakartového jádra s rozšířením dispozice pro pračku',
    location: 'Zábřeh na Moravě · Sídliště Severovýchod',
    buildingType: 'Panelový byt 3+1 (rok 1978)',
    duration: '14 pracovních dní',
    area: '5,4 m²',
    image: CORE_IMG,
    imageAlt: 'Dokončená rekonstrukce panelového bytového jádra v Zábřehu na Moravě',
    summary:
      'Kompletní vybourání původního umakartového boxu na holý panel, vyzdění nového jádra z pórobetonu, propojení koupelny s WC a posunutí příčky o 25 cm do chodby pro vestavbu pračky se sušičkou.',
    techParams: [
      { label: 'Užitná plocha jádra', value: '5,4 m² (+0,8 m² rozšíření)' },
      { label: 'Doba realizace', value: '14 pracovních dní' },
      { label: 'Zdivo & příčky', value: 'Ytong Klasik 100 mm & 75 mm' },
      { label: 'Spádování sprchového koutu', value: '2,0 % do nerezového žlabu 850 mm' },
      { label: 'Odvoz a likvidace suti', value: '2,4 t (ekologická skládka)' },
      { label: 'Záruka na provedené dílo', value: '36 měsíců + tlaková zkouška' },
    ],
    materials: [
      { category: 'Zdivo & příčky', spec: 'Pórobeton Ytong Klasik 100 mm (nosná stěna pro sanitu) a 75 mm, pružná PU pěna u stropu' },
      { category: 'Hydroizolace', spec: 'Dvouvrstvá tekutá lepenka Mapei Mapegum WPS + pružné těsnicí pásky Mapeband v koutech a prostupech' },
      { category: 'Voda & odpady', spec: 'Tlakové rozvody PPR Ekoplastik PN20 (svařováno), odhlučněné odpadní potrubí HT' },
      { category: 'Stropy & SDK', spec: 'Zelený impregnovaný sádrokarton Rigips RBI 12,5 mm na křížovém roštu CD/UD' },
      { category: 'Obklady & dlažby', spec: 'Rektifikovaný slinutý gres 60×120 cm (protiskluz R10), flexibilní lepidlo C2TE S1, epoxidová spárovačka' },
      { category: 'Sanita & moduly', spec: 'Podomítkový modul Geberit Duofix, liniový sprchový žlab Alcaplast se spádovou lištou' },
    ],
    challenges: [
      {
        challenge: 'Propadlá litinová odbočka hlavní stoupačky a netěsné hrdlo u sousedů',
        solution:
          'Po odkrytí instalační šachty jsme provedli výměnu poškozeného kusu napojení pomocí certifikované přechodky litina/HT s dvojitým manžetovým těsněním a provedli zátopovou zkoušku před zaklopením servisních dvířek.',
      },
      {
        challenge: 'Výškový rozdíl panelového stropu 32 mm a nedostatek místa pro pračku',
        solution:
          'Příčku směrem do předsíně jsme posunuli o 25 cm a ukotvili ji ocelovými trny s dilatační spárou. Křivý strop jsme srovnali zavěšeným podhledem Rigips RBI na křížovém roštu CD/UD v přesné rovině do laseru.',
      },
      {
        challenge: 'Riziko zatékání u bezvaničkového sprchového koutu v panelovém domě',
        solution:
          'Podklad jsme vyrovnali rychletuhnoucí spádovou stěrkou o sklonu 2 %, rohy a prostupy vyztužili pružnou páskou Mapeband a po aplikaci dvou vrstev tekuté hydroizolace provedli napojení na epoxidovou spárovačku.',
      },
    ],
    phases: [
      { days: 'Den 1–2', title: 'Demolice & příprava', detail: 'Ochrana podlah bytu, demontáž umakartu, vyklizení a odvoz 2,4 t suti.' },
      { days: 'Den 3–6', title: 'Zdění, voda & odpady', detail: 'Založení příček Ytong do laseru, rozvody PPR/HT, montáž modulu Geberit a tlaková zkouška.' },
      { days: 'Den 7–10', title: 'Hydroizolace & obklady', detail: 'Nivelace podlahy, 2× hydroizolační stěrka, přesné řezy kamenických rohů 45°.' },
      { days: 'Den 11–14', title: 'Kompletace & předání', detail: 'Osazení závěsné mísy, skleněné walk-in zástěny, silikonování a úklid.' },
    ],
    outcome: 'Původně stísněná koupelna získala bezbariérový sprchový kout, plnohodnotný prostor pro pračku a spolehlivou hydroizolaci na desítky let.',
  },
  {
    id: 'cs-podlahy-sumperk',
    number: '02',
    serviceId: 'srv-rekonstrukce-bytu',
    categoryLabel: 'Omítky, nivelace & obklady',
    title: 'Kompletní srovnání podlah nivelací, perlinka a renovace koupelny v cihlovém bytě',
    location: 'Šumperk · Centrum',
    buildingType: 'Cihlový byt 3+kk (60. léta)',
    duration: '18 pracovních dní',
    area: '78 m²',
    image: BATHROOM_TILES_IMG,
    imageAlt: 'Dokončené obklady, srovnané stěny a podlahy v cihlovém bytě v Šumperku',
    summary:
      'Celková sanace původních zvětralých omítek v cihlovém bytě před montáží nové kuchyňské linky, celoplošné vyrovnání nerovných podlah samonivelační stěrkou bez prahů a pokládka lepeného vinylu s koupelnovou dlažbou.',
    techParams: [
      { label: 'Podlahová plocha bytu', value: '78 m²' },
      { label: 'Doba realizace', value: '18 pracovních dní' },
      { label: 'Rovinnost nivelace podlah', value: '± 1,5 mm na 2 m lati' },
      { label: 'Povrchová kvalita stěn', value: 'Stupeň Q3 (perlinka + jemný štuk)' },
      { label: 'Nášlapná vrstva vinylu', value: '0,55 mm (zátěžová třída 33/42)' },
      { label: 'Zapravení stěn v kuchyni', value: 'Pravý úhel 90° pro linku na míru' },
    ],
    materials: [
      { category: 'Omítky & sanace', spec: 'Hloubková penetrace, jádrová omítka Baumit MPI 25, armovací sklovláknitá tkanina Vertex R117' },
      { category: 'Finální stěrky & malby', spec: 'Vápenocementový štuk Keraštuk, otěruvzdorný bílý nátěr Primalex Polar ve dvou vrstvách' },
      { category: 'Podlahový systém', spec: 'Samonivelační stěrka Ceresit CN 69 (tl. 8–18 mm), celoplošně lepený vinyl tl. 2,5 mm' },
      { category: 'Koupelna & kuchyň', spec: 'Slinutá dlažba 60×60 cm na flexibilní lepidlo C2TE S1, polyuretanové soklové lišty' },
      { category: 'Voda & odpady', spec: 'Přeložení přívodů vody a odpadu dle výkresu kuchyňského studia' },
    ],
    challenges: [
      {
        challenge: 'Sypká vápenopísková omítka a mikrotrhliny v původním cihelném zdivu',
        solution:
          'Uvolněné vrstvy jsme mechanicky oškrábali na pevné jádro, podklad zpevnili hloubkovou penetrací a celou plochu stěn natáhli do flexibilního stavebního lepidla s armovací perlinkou Vertex.',
      },
      {
        challenge: 'Nerovné rohy v kuchyni ohrožující přesnou montáž linky a pracovní desky',
        solution:
          'Pomocí křížového laseru a omítníků jsme srovnali kolmost stěn na přesný úhel 90° tak, aby kuchyňské skříňky a obklad za linkou lícovaly bez mezer.',
      },
      {
        challenge: 'Výškový zlom 22 mm mezi chodbou a původními místnostmi',
        solution:
          'Podklad jsme mechanicky očistili, napenetrovali adhezním můstkem a vylili dvouvrstvou samonivelační stěrkou do jedné roviny pro bezprahovou pokládku lepeného vinylu.',
      },
    ],
    phases: [
      { days: 'Den 1–5', title: 'Sanace stěn & přeložky vody', detail: 'Oškrábání starých maleb, příprava přípojek pro kuchyň a ošetření trhlin.' },
      { days: 'Den 6–10', title: 'Perlinka & jádrové omítky', detail: 'Armování kritických míst tkaninou, vyrovnání rohů kuchyně do pravého úhlu.' },
      { days: 'Den 11–14', title: 'Nivelace & štuky', detail: 'Vylití samonivelační stěrky do roviny, celoplošné štukování a dvojnásobná výmalba.' },
      { days: 'Den 15–18', title: 'Vinyl, lišty & úklid', detail: 'Celoplošné lepení vinylových dílců, instalace soklových lišt a předání bytu.' },
    ],
    outcome: 'Dokonale rovné stěny připravené na kuchyňskou linku na míru a bezprahová podlaha v celém bytě s minimálními nároky na údržbu.',
  },
  {
    id: 'cs-podkrovi-olomouc',
    number: '03',
    serviceId: 'srv-sadrokartony',
    categoryLabel: 'Sádrokartony & podlahy',
    title: 'Akustické odhlučnění a modernizace interiéru včetně podhledů Q4',
    location: 'Olomouc · Nová Ulice',
    buildingType: 'Byt v cihlové nástavbě (64 m²)',
    duration: '21 pracovních dní',
    area: '64 m²',
    image: INTERIOR_IMG,
    imageAlt: 'Modernizovaný obývací pokoj se sádrokartonovými podhledy a vinylovou podlahou v Olomouci',
    summary:
      'Vyřešení problémů s hlukem od sousedů pomocí akustické předstěny, instalace sádrokartonových podhledů nejvyšší kvality Q4 a pokládka tichého minerálního SPC vinylu.',
    techParams: [
      { label: 'Plocha rekonstrukce', value: '64 m²' },
      { label: 'Doba realizace', value: '21 pracovních dní' },
      { label: 'Vzduchová neprůzvučnost', value: 'Rw = 52 dB (akustická předstěna)' },
      { label: 'Tloušťka tepelné izolace', value: '240 mm (λ = 0,034 W/mK)' },
      { label: 'Kvalita tmelení SDK', value: 'Nejvyšší úroveň Q4 (pod boční světlo)' },
      { label: 'Tepelný odpor podlahy', value: '0,03 m²K/W (podlahové topení)' },
    ],
    materials: [
      { category: 'Akustické konstrukce', spec: 'Ocelové profily Rigips CW/UW 75 mm s pěnovou páskou, pružné akustické třmeny bez pevného styku' },
      { category: 'Sádrokartonové desky', spec: 'Modré akustické desky Rigips MAI (dvojité opláštění 2×12,5 mm), zelené RBI do koupelny' },
      { category: 'Izolace & parozábrana', spec: 'Minerální vata Knauf Insulation Unifit 035 + inteligentní parozábrana Isover Vario KM Duplex' },
      { category: 'Tmelení & broušení', spec: 'Vysokopevnostní tmel Uniflott se skelnou páskou + celoplošná pastovitá stěrka Rifino Top' },
      { category: 'Podlaha & lišty', spec: 'Minerální zámkový vinyl SPC tl. 5,5 mm s integrovanou podložkou, bílé MDF soklové lišty' },
    ],
    challenges: [
      {
        challenge: 'Nízký akustický útlum mezibytové stěny přenášející běžnou řeč od sousedů',
        solution:
          'Postavili jsme samostatně stojící předstěnu s 20mm vzduchovou mezerou, vyplněnou minerální vlnou 60 mm a opláštěnou dvěma vrstvami modrého akustického sádrokartonu s přesazenými spárami.',
      },
      {
        challenge: 'Ostré boční světlo z francouzských oken odhalující sebemenší spoje na stropech',
        solution:
          'Podhledy jsme celoplošně přestěrkovali pastovitou stěrkou na úroveň Q4, bezprašně přebrousili rotační bruskou napojenou na vysavač a zkontrolovali pod dlouhou kontrolní lampou.',
      },
      {
        challenge: 'Riziko tepelných mostů a kondenzace vlhkosti u napojení střešních šikmin',
        solution:
          'Všechny spoje parozábrany jsme vzduchotěsně přelepili systémovou páskou Isover a napojení na obvodové zdivo dotěsnili trvale pružným tmelem.',
      },
    ],
    phases: [
      { days: 'Den 1–5', title: 'Rošty, izolace & parozábrana', detail: 'Montáž podkonstrukce s odhlučněním, vložení izolace a slepení parozábrany.' },
      { days: 'Den 6–11', title: 'Dvojité opláštění & SDK detaily', detail: 'Záklop deskami MAI, přesné napojení šikmin a osazení zpevňujících hran.' },
      { days: 'Den 12–16', title: 'Tmelení Q4 & malby', detail: 'Tmelení spár, celoplošná stěrka, strojní broušení a dvouvrstvý nátěr Primalex Polar.' },
      { days: 'Den 17–21', title: 'SPC vinyl, dveře & předání', detail: 'Pokládka vinylové podlahy, osazení obložkových zárubní a závěrečné doladění.' },
    ],
    outcome: 'Znatelný akustický klid v ložnici, dokonale hladké stropy bez viditelných spojů a úspora energií díky souvislé parozábraně.',
  },
];

interface CaseStudiesSectionProps {
  onSelectCaseStudyForLead: (serviceId: string, contextTitle: string) => void;
}

export const CaseStudiesSection: React.FC<CaseStudiesSectionProps> = ({
  onSelectCaseStudyForLead,
}) => {
  const [selectedId, setSelectedId] = useState<string>(CASE_STUDIES[0].id);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const activeStudy = CASE_STUDIES.find((c) => c.id === selectedId) || CASE_STUDIES[0];

  return (
    <section id="pripadove-studie" className="py-20 bg-[#F1F4F6] border-b border-slate-200 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#F07818] mb-2">
              <ClipboardList className="w-4 h-4 shrink-0" />
              <span>Případové studie</span>
              <span aria-hidden="true" className="text-slate-400">·</span>
              <span className="text-slate-600">Technické postupy, materiály a řešení ze staveb</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17232D] tracking-tight text-balance">
              Jak v praxi řešíme konkrétní stavební výzvy
            </h2>
            <p className="text-slate-600 mt-3 text-base leading-relaxed">
              Podívejte se pod pokličku našich zakázek. U každé studie uvádíme reálné technické
              parametry, přesnou skladbu použitých materiálů i komplikace, které nás na stavbě
              potkaly – a jak jsme je řemeslně vyřešili.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2 self-start lg:self-auto">
            <span className="px-3 py-1.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold rounded flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Ukázkové studie: DEMO – NEPUBLIKOVAT</span>
            </span>
          </div>
        </div>

        {/* Interactive Case Study Selector Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {CASE_STUDIES.map((study) => {
            const isSelected = study.id === activeStudy.id;
            return (
              <button
                key={study.id}
                type="button"
                onClick={() => setSelectedId(study.id)}
                className={`text-left p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#17232D] text-white border-[#17232D] shadow-lg'
                    : 'bg-white text-[#17232D] border-slate-200 hover:border-[#F07818]/60 hover:bg-slate-50/70'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span
                      className={`font-bold ${
                        isSelected ? 'text-[#F07818]' : 'text-[#F07818]'
                      }`}
                    >
                      {study.number}. {study.categoryLabel}
                    </span>
                    <span
                      className={`font-mono tabular-nums text-[11px] ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {study.duration}
                    </span>
                  </div>
                  <h3
                    className={`text-base font-extrabold leading-snug ${
                      isSelected ? 'text-white' : 'text-[#17232D]'
                    }`}
                  >
                    {study.title}
                  </h3>
                </div>

                <div
                  className={`flex items-center justify-between pt-3 border-t text-xs ${
                    isSelected
                      ? 'border-slate-700 text-slate-300'
                      : 'border-slate-100 text-slate-500'
                  }`}
                >
                  <span className="truncate">{study.location}</span>
                  <span className="font-mono tabular-nums font-semibold shrink-0 ml-2">
                    {study.area}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Case Study Full Technical Report */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            {/* Left Column: Visual Overview, Key Metrics & Timeline (5 cols) */}
            <div className="lg:col-span-5 bg-[#F8FAFC] border-b lg:border-b-0 lg:border-r border-slate-200 p-6 sm:p-8 flex flex-col justify-between gap-6">
              <div className="space-y-6">
                {/* Study Image with Resilient Fallback */}
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#17232D] border border-slate-200">
                  {!imgErrors[activeStudy.id] ? (
                    <img
                      src={activeStudy.image}
                      alt={activeStudy.imageAlt}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setImgErrors((prev) => ({ ...prev, [activeStudy.id]: true }))
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#17232D] to-[#263746] text-white">
                      <Wrench className="w-8 h-8 text-[#F07818] mb-2" />
                      <span className="text-sm font-bold">{activeStudy.title}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="flex items-center gap-2 text-[11px] text-slate-200">
                      <MapPin className="w-3.5 h-3.5 text-[#F07818] shrink-0" />
                      <span>{activeStudy.location}</span>
                      <span aria-hidden="true">·</span>
                      <span>{activeStudy.buildingType}</span>
                    </div>
                  </div>
                </div>

                {/* Technical Parameters Grid */}
                <div>
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#17232D] mb-3">
                    <Ruler className="w-4 h-4 text-[#F07818]" />
                    <span>Technické parametry zakázky</span>
                  </div>
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white overflow-hidden">
                    {activeStudy.techParams.map((param) => (
                      <div
                        key={param.label}
                        className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="text-slate-500">{param.label}</span>
                        <span className="font-bold text-[#17232D] text-right font-mono tabular-nums">
                          {param.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Work Phases Timeline */}
                <div>
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#17232D] mb-3">
                    <Clock className="w-4 h-4 text-[#F07818]" />
                    <span>Průběh realizace po dnech</span>
                  </div>
                  <div className="space-y-2.5">
                    {activeStudy.phases.map((phase) => (
                      <div
                        key={phase.days}
                        className="p-3 bg-white border border-slate-200 rounded-xl text-xs"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-[#17232D]">{phase.title}</span>
                          <span className="font-mono tabular-nums font-bold text-[#F07818]">
                            {phase.days}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{phase.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Summary, Challenges Solved, Materials & Outcome (7 cols) */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-8">
              <div className="space-y-8">
                {/* Title & Summary */}
                <div className="border-b border-slate-100 pb-6">
                  <div className="text-xs font-semibold text-slate-500 mb-1.5">
                    Studie {activeStudy.number} · {activeStudy.categoryLabel} · {activeStudy.buildingType}
                  </div>
                  <h3 className="text-2xl font-extrabold text-[#17232D] tracking-tight text-balance">
                    {activeStudy.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mt-3">
                    {activeStudy.summary}
                  </p>
                </div>

                {/* Challenges & Engineering Solutions */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-extrabold text-[#17232D] mb-4">
                    <Wrench className="w-4 h-4 text-[#F07818]" />
                    <span>Konkrétní výzvy na stavbě a jak jsme je vyřešili</span>
                  </div>

                  <div className="space-y-4">
                    {activeStudy.challenges.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 space-y-2.5"
                      >
                        <div className="text-xs font-bold text-[#17232D]">
                          Výzva {idx + 1}: {item.challenge}
                        </div>
                        <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                          <span className="font-bold text-emerald-700">Technické řešení: </span>
                          {item.solution}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Used Materials & Systems */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-extrabold text-[#17232D] mb-4">
                    <Layers className="w-4 h-4 text-[#F07818]" />
                    <span>Použité stavební materiály a systémy</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeStudy.materials.map((mat) => (
                      <div
                        key={mat.category}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1"
                      >
                        <div className="text-[11px] font-bold text-[#F07818]">
                          {mat.category}
                        </div>
                        <div className="text-xs text-slate-700 leading-relaxed">
                          {mat.spec}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Outcome & Action Footer */}
              <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-2.5 text-xs text-slate-700 max-w-md">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#17232D]">Výsledek realizace: </span>
                    <span>{activeStudy.outcome}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onSelectCaseStudyForLead(activeStudy.serviceId, activeStudy.title)
                  }
                  className="px-5 py-3 bg-[#F07818] hover:bg-[#d9660e] text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Poptat podobnou realizaci</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
