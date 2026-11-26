import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  Columns3,
  Droplets,
  Flame,
  Layers,
  RotateCcw,
  SlidersHorizontal,
  Volume2,
  Wallet,
} from 'lucide-react';

export type ComparisonCategoryKey = 'podlahy' | 'obklady' | 'pricky';
export type PriorityKey = 'all' | 'water' | 'heating' | 'acoustic' | 'budget';

interface MaterialOption {
  id: string;
  name: string;
  subtitle: string;
  serviceId: string;
  priceRange: string;
  recommendedForPriorities: PriorityKey[];
  specs: {
    waterResistance: string;
    waterScore: 1 | 2 | 3 | 4 | 5;
    heatingCompat: string;
    acousticRating: string;
    installSpeed: string;
    substratePrep: string;
    durability: string;
    idealRooms: string;
  };
}

interface ComparisonCategory {
  key: ComparisonCategoryKey;
  label: string;
  description: string;
  materials: MaterialOption[];
}

const PRIORITY_FILTERS: { key: PriorityKey; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'Všechny parametry', icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
  { key: 'water', label: 'Vlhkost a voda', icon: <Droplets className="w-3.5 h-3.5" /> },
  { key: 'heating', label: 'Podlahové topení', icon: <Flame className="w-3.5 h-3.5" /> },
  { key: 'acoustic', label: 'Zvuková izolace', icon: <Volume2 className="w-3.5 h-3.5" /> },
  { key: 'budget', label: 'Rozpočet a rychlost', icon: <Wallet className="w-3.5 h-3.5" /> },
];

const CATEGORIES: ComparisonCategory[] = [
  {
    key: 'podlahy',
    label: 'Podlahové krytiny',
    description:
      'Porovnání nejčastějších podlahových systémů při rekonstrukcích bytů a rodinných domů v našem regionu.',
    materials: [
      {
        id: 'mat-vinyl-lepeny',
        name: 'Lepený vinyl (LVT)',
        subtitle: 'Tl. 2,0–2,5 mm · nášlap 0,55 mm',
        serviceId: 'srv-obklady-dlazby',
        priceRange: '1 150 – 1 550 Kč/m²',
        recommendedForPriorities: ['heating', 'acoustic', 'water'],
        specs: {
          waterResistance: '100 % voděodolný (lepidlo bez bobtnání)',
          waterScore: 5,
          heatingCompat: 'Výborná (minimální tepelný odpor ~0,01 m²K/W)',
          acousticRating: 'Velmi tichý krok (žádná dutá ozvěna)',
          installSpeed: '2–3 dny (nutné schnutí nivelace)',
          substratePrep: 'Vyžaduje dokonalou nivelaci (tolerance ±1,5 mm/2 m)',
          durability: '15–25 let (snadná výměna jednotlivého dílce)',
          idealRooms: 'Celý byt v jedné rovině bez prahů, kuchyně, chodby',
        },
      },
      {
        id: 'mat-vinyl-spc',
        name: 'Zámkový vinyl (SPC)',
        subtitle: 'Minerální jádro 4,5–6 mm s podložkou',
        serviceId: 'srv-obklady-dlazby',
        priceRange: '1 250 – 1 680 Kč/m²',
        recommendedForPriorities: ['water', 'budget'],
        specs: {
          waterResistance: '100 % voděodolné jádro (pozor na zatečení pod lišty)',
          waterScore: 4,
          heatingCompat: 'Velmi dobrá (tepelný odpor ~0,03 m²K/W)',
          acousticRating: 'Dobrá (integrovaná IXPE podložka tlumí až 19 dB)',
          installSpeed: '1–2 dny (rychlá plovoucí pokládka)',
          substratePrep: 'Snese drobné nerovnosti do 2 mm/2 m bez stěrkování',
          durability: '15–20 let (vysoká tuhost zámků proti otlakům)',
          idealRooms: 'Obývací pokoje, ložnice, rychlé rekonstrukce bez prachu',
        },
      },
      {
        id: 'mat-dlazba',
        name: 'Slinutá keramická dlažba',
        subtitle: 'Rektifikovaný gres tl. 9–10 mm',
        serviceId: 'srv-obklady-dlazby',
        priceRange: '1 450 – 2 200 Kč/m²',
        recommendedForPriorities: ['water', 'heating'],
        specs: {
          waterResistance: 'Absolutní (nasákavost < 0,5 %, ideální do sprchy)',
          waterScore: 5,
          heatingCompat: 'Nejlepší tepelná vodivost i akumulace tepla',
          acousticRating: 'Tvrdý došlap (nutná kročejová izolace v patrech)',
          installSpeed: '3–4 dny (lepení, zrání lepidla, spárování)',
          substratePrep: 'Pevný, rovný a penetrovaný podklad (flexibilní lepidlo C2TE)',
          durability: '30+ let (prakticky nezničitelný povrch proti poškrábání)',
          idealRooms: 'Koupelny, WC, zádveří, technické místnosti, chodby',
        },
      },
      {
        id: 'mat-laminat',
        name: 'Zátěžový laminát AC5',
        subtitle: 'HDF deska tl. 8–10 mm · třída 33',
        serviceId: 'srv-obklady-dlazby',
        priceRange: '790 – 1 150 Kč/m²',
        recommendedForPriorities: ['budget'],
        specs: {
          waterResistance: 'Omezená (max. 24–72 h u voděodolných variant)',
          waterScore: 2,
          heatingCompat: 'Průměrná (vyšší tepelný odpor ~0,07 m²K/W)',
          acousticRating: 'Hlasitější krok bez kvalitní těžké podložky',
          installSpeed: '1 den (nejrychlejší a cenově nejdostupnější)',
          substratePrep: 'Běžná rovinnost podkladu (2–3 mm/2 m) + parozábrana',
          durability: '10–15 let (tvrdý povrch, citlivé hrany v blízkosti vody)',
          idealRooms: 'Ložnice, dětské pokoje, pracovny, suché obytné zóny',
        },
      },
    ],
  },
  {
    key: 'obklady',
    label: 'Obklady & povrchy do koupelny',
    description:
      'Rozdíly v ceně, údržbě spár a náročnosti pokládky mezi klasickým obkladem, velkoformátem a stěrkou.',
    materials: [
      {
        id: 'mat-obklad-30x60',
        name: 'Standardní obklad 30×60 cm',
        subtitle: 'Klasický formát se spárou 2 mm',
        serviceId: 'srv-koupelna-wc',
        priceRange: '1 350 – 1 750 Kč/m²',
        recommendedForPriorities: ['budget'],
        specs: {
          waterResistance: 'Vysoká (v kombinaci s 2× hydroizolační stěrkou)',
          waterScore: 4,
          heatingCompat: 'Plně vhodné pro podlahové i stěnové vytápění',
          acousticRating: 'Neutrální (závisí na podkladové příčce)',
          installSpeed: '3–4 dny včetně spárování a silikonování',
          substratePrep: 'Standardní srovnání stěn lepidlem nebo jádrovou omítkou',
          durability: '25+ let (cementová nebo lépe epoxidová spára)',
          idealRooms: 'Menší panelákové koupelny, WC, ekonomická rekonstrukce',
        },
      },
      {
        id: 'mat-velkoformat',
        name: 'Velkoformát 60×120+ cm',
        subtitle: 'Rektifikované desky · minimální spára 1–1,5 mm',
        serviceId: 'srv-obklady-dlazby',
        priceRange: '2 100 – 2 950 Kč/m²',
        recommendedForPriorities: ['water', 'heating'],
        specs: {
          waterResistance: 'Maximální (minimum spár, ideálně epoxidová spárovačka)',
          waterScore: 5,
          heatingCompat: 'Výborná (oboustranné lepení Buttering-Floating C2TE S1)',
          acousticRating: 'Neutrální (vysoká objemová hmotnost desky)',
          installSpeed: '5–6 dní (přesné řezy 45° kamenických rohů, nivelace)',
          substratePrep: 'Přísně rovná stěna do laseru + vyrovnávací spony (klínky)',
          durability: '30+ let (snadná údržba díky minimu spár)',
          idealRooms: 'Moderní koupelny, walk-in sprchové kouty, reprezentativní WC',
        },
      },
      {
        id: 'mat-sterka',
        name: 'Voděodolná designová stěrka',
        subtitle: 'Bezespárý mikrocement / polyuretan',
        serviceId: 'srv-koupelna-wc',
        priceRange: '2 350 – 3 300 Kč/m²',
        recommendedForPriorities: ['water', 'acoustic'],
        specs: {
          waterResistance: '100 % bezespárá vodotěsnost díky finálnímu dvousložkovému laku',
          waterScore: 5,
          heatingCompat: 'Dobrá (tenkovrstvá aplikace 2–3 mm bez spár)',
          acousticRating: 'Příjemný teplý matný dotek povrchu',
          installSpeed: '5–7 dní (více technologických vrstev a schnutí laku)',
          substratePrep: 'Armování perlinkou + absolutní čistota bez prachu při lakování',
          durability: '15–20 let (možnost lokální obnovy vrchního laku)',
          idealRooms: 'Bezespáré sprchové kouty, renovace bez nutnosti bourání starých obkladů',
        },
      },
    ],
  },
  {
    key: 'pricky',
    label: 'Konstrukce příček & jádra',
    description:
      'Výběr materiálu stěn při přestavbě umakartového jádra nebo dělení dispozice bytu.',
    materials: [
      {
        id: 'mat-ytong',
        name: 'Pórobeton Ytong (75–100 mm)',
        subtitle: 'Přesné tvárnice na tenkovrstvé lepidlo',
        serviceId: 'srv-bytova-jadra',
        priceRange: '1 450 – 1 950 Kč/m²',
        recommendedForPriorities: ['water', 'budget'],
        specs: {
          waterResistance: 'Bezpečná pro vlhké provozy (po aplikaci hydroizolace)',
          waterScore: 4,
          heatingCompat: 'Vysoká tepelná izolace stěny',
          acousticRating: 'Standardní (Rw ≈ 37–40 dB u tl. 100 mm)',
          installSpeed: '2–3 dny (zdění + penetrace + lepidlo s perlinkou)',
          substratePrep: 'Vhodné i na panelové stropy s menší únosností (nízká hmotnost)',
          durability: '50+ let (snadné drážkování vody, odpadů i prostupů)',
          idealRooms: 'Bytová jádra v panelových domech, koupelny, WC',
        },
      },
      {
        id: 'mat-sdk-akustik',
        name: 'Akustický sádrokarton 2×12,5 mm',
        subtitle: 'Modré desky MAI/RBI + minerální vata 60 mm',
        serviceId: 'srv-sadrokartony',
        priceRange: '1 350 – 1 850 Kč/m²',
        recommendedForPriorities: ['acoustic', 'budget'],
        specs: {
          waterResistance: 'Vysoká při použití zelené impregnace (RBI / RigiStabil)',
          waterScore: 4,
          heatingCompat: 'Dobrá (ideální pro suchou výstavbu v podkroví)',
          acousticRating: 'Špičková (Rw = 52–56 dB při dvojitém opláštění a vatě)',
          installSpeed: '1–2 dny (minimální mokré procesy a rychlé schnutí)',
          substratePrep: 'Kotvení do stropu a podlahy přes akustickou pěnovou pásku',
          durability: '35+ let (pro těžké skříňky vkládáme výztužné traverzy/OSB)',
          idealRooms: 'Odhlučnění ložnice, dělení pokojů, podkrovní příčky, předstěny',
        },
      },
      {
        id: 'mat-cihla',
        name: 'Akustická cihla Porotherm 115',
        subtitle: 'Pálené keramické bloky na pero a drážku',
        serviceId: 'srv-zednicke-prace',
        priceRange: '1 750 – 2 350 Kč/m²',
        recommendedForPriorities: ['acoustic', 'water'],
        specs: {
          waterResistance: 'Výborná (minerální pálený střep snáší dlouhodobou vlhkost)',
          waterScore: 5,
          heatingCompat: 'Velmi dobrá tepelná setrvačnost zdiva',
          acousticRating: 'Velmi dobrá (Rw = 44–46 dB díky objemové hmotnosti)',
          installSpeed: '4–5 dní (zdění + jádrová omítka a technologická pauza)',
          substratePrep: 'Nutné ověření statické únosnosti stropní desky (vyšší hmotnost)',
          durability: '70+ let (extrémní únosnost pro těžké kuchyňské skříňky a bojlery)',
          idealRooms: 'Cihlové byty, rodinné domy, nosně namáhané stěny s kuchyní',
        },
      },
    ],
  },
];

interface MaterialComparisonSectionProps {
  onConsultMaterial: (serviceId: string, materialSummary: string) => void;
}

export const MaterialComparisonSection: React.FC<MaterialComparisonSectionProps> = ({
  onConsultMaterial,
}) => {
  const [activeCategoryKey, setActiveCategoryKey] = useState<ComparisonCategoryKey>('podlahy');
  const [activePriority, setActivePriority] = useState<PriorityKey>('all');
  const [selectedIdsByCat, setSelectedIdsByCat] = useState<Record<ComparisonCategoryKey, string[]>>({
    podlahy: CATEGORIES[0].materials.map((m) => m.id),
    obklady: CATEGORIES[1].materials.map((m) => m.id),
    pricky: CATEGORIES[2].materials.map((m) => m.id),
  });

  const activeCategory =
    CATEGORIES.find((c) => c.key === activeCategoryKey) || CATEGORIES[0];
  const selectedIds = selectedIdsByCat[activeCategoryKey];

  const visibleMaterials = activeCategory.materials.filter((m) =>
    selectedIds.includes(m.id)
  );

  const toggleMaterial = (id: string) => {
    setSelectedIdsByCat((prev) => {
      const current = prev[activeCategoryKey];
      const exists = current.includes(id);
      // Keep at least 2 materials visible for meaningful comparison
      if (exists && current.length <= 2) {
        return prev;
      }
      return {
        ...prev,
        [activeCategoryKey]: exists
          ? current.filter((item) => item !== id)
          : [...current, id],
      };
    });
  };

  const resetCategorySelection = () => {
    setSelectedIdsByCat((prev) => ({
      ...prev,
      [activeCategoryKey]: activeCategory.materials.map((m) => m.id),
    }));
    setActivePriority('all');
  };

  const renderScoreDots = (score: 1 | 2 | 3 | 4 | 5) => (
    <div className="flex items-center gap-1 mt-1" aria-label={`Hodnocení ${score} z 5`}>
      {[1, 2, 3, 4, 5].map((step) => (
        <span
          key={step}
          className={`h-1.5 w-4 rounded-full ${
            step <= score ? 'bg-[#C2560A]' : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  );

  return (
    <section
      id="porovnani-materialu"
      className="py-20 bg-white border-b border-slate-200 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#B84F00] mb-2">
              <Columns3 className="w-4 h-4 shrink-0" />
              <span>Konzultační srovnávač materiálů</span>
              <span aria-hidden="true" className="text-slate-400">·</span>
              <span className="text-slate-600">Pomůcka pro osobní výběr při zaměření</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17232D] tracking-tight text-balance">
              Porovnání stavebních materiálů a skladeb
            </h2>
            <p className="text-slate-600 mt-3 text-base leading-relaxed">
              Nevíte, zda zvolit lepený nebo zámkový vinyl, velkoformátovou dlažbu či zděnou
              příčku z Ytongu? Připravili jsme přehlednou srovnávací tabulku, kterou používáme i
              při konzultacích s klienty přímo na stavbě.
            </p>
          </div>

          <button
            type="button"
            onClick={resetCategorySelection}
            className="self-start lg:self-auto px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-[#17232D] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Obnovit výchozí srovnání</span>
          </button>
        </div>

        {/* Controls Bar: Category Switcher & Priority Highlight */}
        <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4 sm:p-6 mb-8 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Kategorie materiálů">
              {CATEGORIES.map((cat) => {
                const active = cat.key === activeCategoryKey;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveCategoryKey(cat.key)}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      active
                        ? 'bg-[#17232D] text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:border-[#C2560A]/60'
                    }`}
                  >
                    <Layers className={`w-4 h-4 ${active ? 'text-[#F07818]' : 'text-slate-400'}`} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-slate-600 max-w-md">{activeCategory.description}</p>
          </div>

          {/* Priority & Material Toggles */}
          <div className="pt-4 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-7 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#17232D] mr-1">
                Priorita výběru:
              </span>
              {PRIORITY_FILTERS.map((pf) => {
                const isActive = activePriority === pf.key;
                return (
                  <button
                    key={pf.key}
                    type="button"
                    onClick={() => setActivePriority(pf.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#C2560A] text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {pf.icon}
                    <span>{pf.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-5 flex flex-wrap items-center lg:justify-end gap-2">
              <span className="text-xs font-semibold text-slate-500 mr-1">
                Zobrazeno ({visibleMaterials.length}/{activeCategory.materials.length}):
              </span>
              {activeCategory.materials.map((mat) => {
                const isChecked = selectedIds.includes(mat.id);
                const disableUncheck = isChecked && selectedIds.length <= 2;
                return (
                  <button
                    key={mat.id}
                    type="button"
                    disabled={disableUncheck}
                    onClick={() => toggleMaterial(mat.id)}
                    title={
                      disableUncheck
                        ? 'Pro srovnání musí zůstat vybrány alespoň 2 materiály'
                        : 'Přepnout zobrazení materiálu v tabulce'
                    }
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                      isChecked
                        ? 'bg-white border-[#17232D] text-[#17232D]'
                        : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600'
                    } ${disableUncheck ? 'cursor-not-allowed opacity-85' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center ${
                        isChecked ? 'bg-[#17232D] text-white' : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-2.5 h-2.5" />}
                    </span>
                    <span className="truncate max-w-[140px]">{mat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead>
                <tr className="bg-[#17232D] text-white">
                  <th className="p-4 sm:p-5 w-48 sm:w-56 align-top border-r border-[#263746] text-xs font-bold uppercase tracking-wider text-slate-300 sticky left-0 bg-[#17232D] z-10">
                    Porovnávaný parametr
                  </th>
                  {visibleMaterials.map((mat) => {
                    const isRecommended =
                      activePriority !== 'all' &&
                      mat.recommendedForPriorities.includes(activePriority);
                    return (
                      <th
                        key={mat.id}
                        className={`p-4 sm:p-5 align-top border-r border-[#263746] last:border-r-0 transition-colors ${
                          isRecommended ? 'bg-[#263746]' : ''
                        }`}
                      >
                        <div className="space-y-1.5">
                          {isRecommended && (
                            <span className="inline-block px-2 py-0.5 rounded bg-[#C2560A] text-white text-[10px] font-bold tracking-wide">
                              Doporučeno pro prioritu
                            </span>
                          )}
                          <div className="text-base font-extrabold text-white leading-snug">
                            {mat.name}
                          </div>
                          <div className="text-[11px] font-normal text-slate-300">
                            {mat.subtitle}
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                {/* Price Row */}
                <tr className="bg-slate-50/70">
                  <td className="p-4 font-bold text-[#17232D] border-r border-slate-200 sticky left-0 bg-slate-50 z-10">
                    Orientační cena (materiál + práce)
                  </td>
                  {visibleMaterials.map((mat) => {
                    const isRecommended =
                      activePriority !== 'all' &&
                      mat.recommendedForPriorities.includes(activePriority);
                    return (
                      <td
                        key={mat.id}
                        className={`p-4 border-r border-slate-200 last:border-r-0 font-mono tabular-nums font-extrabold text-[#17232D] ${
                          isRecommended ? 'bg-orange-50/60' : ''
                        }`}
                      >
                        {mat.priceRange}
                      </td>
                    );
                  })}
                </tr>

                {/* Water resistance */}
                <tr>
                  <td className="p-4 font-bold text-[#17232D] border-r border-slate-200 sticky left-0 bg-white z-10">
                    Odolnost vůči vodě a vlhkosti
                  </td>
                  {visibleMaterials.map((mat) => {
                    const isRecommended =
                      activePriority !== 'all' &&
                      mat.recommendedForPriorities.includes(activePriority);
                    return (
                      <td
                        key={mat.id}
                        className={`p-4 border-r border-slate-200 last:border-r-0 text-slate-700 align-top ${
                          isRecommended ? 'bg-orange-50/40' : ''
                        }`}
                      >
                        <div className="text-xs leading-relaxed">{mat.specs.waterResistance}</div>
                        {renderScoreDots(mat.specs.waterScore)}
                      </td>
                    );
                  })}
                </tr>

                {/* Heating compatibility */}
                <tr>
                  <td className="p-4 font-bold text-[#17232D] border-r border-slate-200 sticky left-0 bg-white z-10">
                    Podlahové topení / tepelný prostup
                  </td>
                  {visibleMaterials.map((mat) => {
                    const isRecommended =
                      activePriority !== 'all' &&
                      mat.recommendedForPriorities.includes(activePriority);
                    return (
                      <td
                        key={mat.id}
                        className={`p-4 border-r border-slate-200 last:border-r-0 text-xs text-slate-700 leading-relaxed align-top ${
                          isRecommended ? 'bg-orange-50/40' : ''
                        }`}
                      >
                        {mat.specs.heatingCompat}
                      </td>
                    );
                  })}
                </tr>

                {/* Acoustics */}
                <tr>
                  <td className="p-4 font-bold text-[#17232D] border-r border-slate-200 sticky left-0 bg-white z-10">
                    Akustika a kročejový útlum
                  </td>
                  {visibleMaterials.map((mat) => {
                    const isRecommended =
                      activePriority !== 'all' &&
                      mat.recommendedForPriorities.includes(activePriority);
                    return (
                      <td
                        key={mat.id}
                        className={`p-4 border-r border-slate-200 last:border-r-0 text-xs text-slate-700 leading-relaxed align-top ${
                          isRecommended ? 'bg-orange-50/40' : ''
                        }`}
                      >
                        {mat.specs.acousticRating}
                      </td>
                    );
                  })}
                </tr>

                {/* Speed */}
                <tr>
                  <td className="p-4 font-bold text-[#17232D] border-r border-slate-200 sticky left-0 bg-white z-10">
                    Rychlost realizace (běžný byt)
                  </td>
                  {visibleMaterials.map((mat) => {
                    const isRecommended =
                      activePriority !== 'all' &&
                      mat.recommendedForPriorities.includes(activePriority);
                    return (
                      <td
                        key={mat.id}
                        className={`p-4 border-r border-slate-200 last:border-r-0 text-xs text-slate-700 leading-relaxed align-top ${
                          isRecommended ? 'bg-orange-50/40' : ''
                        }`}
                      >
                        {mat.specs.installSpeed}
                      </td>
                    );
                  })}
                </tr>

                {/* Substrate Prep */}
                <tr>
                  <td className="p-4 font-bold text-[#17232D] border-r border-slate-200 sticky left-0 bg-white z-10">
                    Nároky na přípravu podkladu
                  </td>
                  {visibleMaterials.map((mat) => {
                    const isRecommended =
                      activePriority !== 'all' &&
                      mat.recommendedForPriorities.includes(activePriority);
                    return (
                      <td
                        key={mat.id}
                        className={`p-4 border-r border-slate-200 last:border-r-0 text-xs text-slate-700 leading-relaxed align-top ${
                          isRecommended ? 'bg-orange-50/40' : ''
                        }`}
                      >
                        {mat.specs.substratePrep}
                      </td>
                    );
                  })}
                </tr>

                {/* Durability */}
                <tr>
                  <td className="p-4 font-bold text-[#17232D] border-r border-slate-200 sticky left-0 bg-white z-10">
                    Životnost & údržba
                  </td>
                  {visibleMaterials.map((mat) => {
                    const isRecommended =
                      activePriority !== 'all' &&
                      mat.recommendedForPriorities.includes(activePriority);
                    return (
                      <td
                        key={mat.id}
                        className={`p-4 border-r border-slate-200 last:border-r-0 text-xs text-slate-700 leading-relaxed align-top ${
                          isRecommended ? 'bg-orange-50/40' : ''
                        }`}
                      >
                        {mat.specs.durability}
                      </td>
                    );
                  })}
                </tr>

                {/* Ideal rooms */}
                <tr>
                  <td className="p-4 font-bold text-[#17232D] border-r border-slate-200 sticky left-0 bg-white z-10">
                    Kde se nejvíce osvědčilo
                  </td>
                  {visibleMaterials.map((mat) => {
                    const isRecommended =
                      activePriority !== 'all' &&
                      mat.recommendedForPriorities.includes(activePriority);
                    return (
                      <td
                        key={mat.id}
                        className={`p-4 border-r border-slate-200 last:border-r-0 text-xs font-semibold text-[#17232D] leading-relaxed align-top ${
                          isRecommended ? 'bg-orange-50/40' : ''
                        }`}
                      >
                        {mat.specs.idealRooms}
                      </td>
                    );
                  })}
                </tr>

                {/* Consultation CTA row */}
                <tr className="bg-[#F8FAFC]">
                  <td className="p-4 text-xs text-slate-500 border-r border-slate-200 sticky left-0 bg-[#F8FAFC] z-10">
                    Další krok ke konzultaci
                  </td>
                  {visibleMaterials.map((mat) => {
                    const isRecommended =
                      activePriority !== 'all' &&
                      mat.recommendedForPriorities.includes(activePriority);
                    return (
                      <td
                        key={mat.id}
                        className={`p-4 border-r border-slate-200 last:border-r-0 ${
                          isRecommended ? 'bg-orange-50/50' : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            onConsultMaterial(
                              mat.serviceId,
                              `Konzultace materiálu: ${mat.name} (${mat.subtitle}, orientačně ${mat.priceRange})`
                            )
                          }
                          className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                            isRecommended
                              ? 'bg-[#C2560A] hover:bg-[#9E4306] text-white shadow-xs'
                              : 'bg-white hover:bg-[#17232D] text-[#17232D] hover:text-white border border-slate-300'
                          }`}
                        >
                          <span>Konzultovat výběr</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>
              Uvedené ceny jsou orientační bez DPH dle složitosti podkladu a rozsahu zakázky. Na
              zaměření s sebou vozíme fyzické vzorníky vinylů i spárovacích hmot.
            </span>
            <span className="font-semibold text-slate-600 md:hidden">
              Tabulku lze na mobilu posouvat vodorovně ↔
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
