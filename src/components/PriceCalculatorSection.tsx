import React, { useState, useMemo } from 'react';
import {
  Calculator,
  ArrowRight,
  Clock,
  ShieldCheck,
  Info,
  Wrench,
  Home,
  Check,
  Copy,
} from 'lucide-react';
import { LeadCoreDetails } from '../types';

export interface CalculatedLeadData {
  serviceId: string;
  serviceTitle: string;
  description: string;
  preferredTimeline: string;
  coreDetails?: LeadCoreDetails;
  estimateSummary: {
    minPrice: number;
    maxPrice: number;
    durationDays: string;
  };
}

interface PriceCalculatorSectionProps {
  onApplyCalculation: (data: CalculatedLeadData) => void;
}

type CalculatorMode = 'core' | 'apartment';

export const PriceCalculatorSection: React.FC<PriceCalculatorSectionProps> = ({
  onApplyCalculation,
}) => {
  const [activeMode, setActiveMode] = useState<CalculatorMode>('core');

  // --- Core State ---
  const [coreType, setCoreType] = useState<'umakart' | 'masonry'>('umakart');
  const [coreLayout, setCoreLayout] = useState<'separate' | 'combined'>('combined');
  const [coreSanitary, setCoreSanitary] = useState<'walkin' | 'tub'>('walkin');
  const [coreTileQuality, setCoreTileQuality] = useState<'standard' | 'large_format'>('standard');

  // --- Apartment State ---
  const [aptSize, setAptSize] = useState<'1kk' | '2kk' | '3kk' | '4kk'>('2kk');
  const [aptScope, setAptScope] = useState<'turnkey' | 'interior_only'>('turnkey');
  const [aptCeilings, setAptCeilings] = useState<boolean>(true);
  const [aptFlooring, setAptFlooring] = useState<boolean>(true);

  // --- Price Calculations ---
  const calculation = useMemo(() => {
    let min = 0;
    let max = 0;
    let days: string;

    if (activeMode === 'core') {
      // Base demolition & waste
      min += coreType === 'umakart' ? 22000 : 15000;
      max += coreType === 'umakart' ? 28000 : 19000;

      // New masonry walls & plaster
      min += 24000;
      max += 32000;

      // Plumbing & waste piping
      min += 18000;
      max += 25000;

      // Waterproofing & tiling
      if (coreTileQuality === 'large_format') {
        min += 38000;
        max += 49000;
      } else {
        min += 28000;
        max += 36000;
      }

      // Sanitary mounting & fittings
      min += coreSanitary === 'walkin' ? 19000 : 17000;
      max += coreSanitary === 'walkin' ? 26000 : 23000;

      days = coreType === 'umakart' ? '12–15 pracovních dní' : '10–12 pracovních dní';
    } else {
      const baseMap = {
        '1kk': { min: 140000, max: 210000, d: '14–21 dní' },
        '2kk': { min: 260000, max: 390000, d: '3–4 týdny' },
        '3kk': { min: 380000, max: 540000, d: '4–6 týdnů' },
        '4kk': { min: 490000, max: 720000, d: '6–8 týdnů' },
      };
      const b = baseMap[aptSize];
      min = b.min;
      max = b.max;
      days = b.d;

      if (aptScope === 'interior_only') {
        min = Math.round(min * 0.7);
        max = Math.round(max * 0.7);
      }
      if (aptCeilings) {
        min += 20000;
        max += 35000;
      }
      if (aptFlooring) {
        min += 25000;
        max += 42000;
      }
    }

    return { min, max, days };
  }, [
    activeMode,
    coreType,
    coreLayout,
    coreSanitary,
    coreTileQuality,
    aptSize,
    aptScope,
    aptCeilings,
    aptFlooring,
  ]);

  const handleApplyToLead = () => {
    let serviceId: string;
    let serviceTitle: string;
    let description: string;
    let coreDetails: LeadCoreDetails | undefined;

    if (activeMode === 'core') {
      serviceId = 'srv-bytova-jadra';
      serviceTitle = 'Kompletní renovace bytových jader';
      coreDetails = {
        propertyType: coreType === 'umakart' ? 'Panelový byt (umakartové jádro)' : 'Zděný byt',
        scope: coreLayout === 'combined' ? 'Koupelna spojená s WC' : 'Oddělená koupelna a WC',
        dispositionChange: coreLayout === 'combined' ? 'Ano, propojení prostor' : 'Ponechat původní dispozici',
        designStatus: coreTileQuality === 'large_format' ? 'Velkoformátový obklad, moderní styl' : 'Standardní keramika',
      };
      description =
        `Poptávka vygenerovaná z orientační kalkulačky:\n` +
        `• Typ jádra: ${coreType === 'umakart' ? 'Původní umakart (vybourání a odvoz)' : 'Zděné jádro'}\n` +
        `• Dispozice: ${coreLayout === 'combined' ? 'Spojená koupelna s WC' : 'Samostatné WC a koupelna'}\n` +
        `• Sanitární řešení: ${coreSanitary === 'walkin' ? 'Walk-in sprchový kout' : 'Vana'}\n` +
        `• Obklady: ${coreTileQuality === 'large_format' ? 'Velkoformát' : 'Standardní obklad'}\n` +
        `• Orientační kalkulace: ${calculation.min.toLocaleString('cs-CZ')} – ${calculation.max.toLocaleString('cs-CZ')} Kč.`;
    } else {
      serviceId = 'srv-rekonstrukce-bytu';
      serviceTitle = 'Rekonstrukce bytů a domů';
      description =
        `Poptávka z orientační kalkulačky rekonstrukce bytu:\n` +
        `• Velikost bytu: ${aptSize.toUpperCase()}\n` +
        `• Rozsah: ${aptScope === 'turnkey' ? 'Kompletní rekonstrukce na klíč' : 'Interiérové stavební úpravy'}\n` +
        `• Sádrokartonové podhledy: ${aptCeilings ? 'Ano' : 'Ne'}\n` +
        `• Podlahy: ${aptFlooring ? 'Nová nivelace a podlaha' : 'Původní'}\n` +
        `• Orientační kalkulace: ${calculation.min.toLocaleString('cs-CZ')} – ${calculation.max.toLocaleString('cs-CZ')} Kč.`;
    }

    onApplyCalculation({
      serviceId,
      serviceTitle,
      description,
      preferredTimeline: 'Dle domluvy po zaměření',
      coreDetails,
      estimateSummary: {
        minPrice: calculation.min,
        maxPrice: calculation.max,
        durationDays: calculation.days,
      },
    });

    // Smooth scroll to lead form
    const formElement = document.getElementById('poptavka');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Clipboard copy utility state & handler
  const [isCopied, setIsCopied] = useState(false);

  const generateCopyText = (): string => {
    const lines: string[] = [
      'STAVPARTA – Orientační kalkulace zakázky',
      '========================================',
    ];

    if (activeMode === 'core') {
      lines.push('Obor: Kompletní renovace bytových jader');
      lines.push('');
      lines.push('Zvolená konfigurace:');
      lines.push(`• Typ původního jádra: ${coreType === 'umakart' ? 'Původní umakart (vybourání a odvoz suti na skládku)' : 'Zděné jádro'}`);
      lines.push(`• Dispoziční řešení: ${coreLayout === 'combined' ? 'Spojená koupelna s WC' : 'Samostatné WC a samostatná koupelna'}`);
      lines.push(`• Sanitární vybavení: ${coreSanitary === 'walkin' ? 'Moderní walk-in sprchový kout' : 'Klasická akrylátová vana'}`);
      lines.push(`• Obklady a dlažby: ${coreTileQuality === 'large_format' ? 'Velkoformátový rektifikovaný obklad' : 'Standardní keramický obklad'}`);
    } else {
      lines.push('Obor: Rekonstrukce bytů a domů');
      lines.push('');
      lines.push('Zvolená konfigurace:');
      lines.push(`• Velikost dispozice: Byt ${aptSize.toUpperCase()}`);
      lines.push(`• Rozsah zakázky: ${aptScope === 'turnkey' ? 'Kompletní rekonstrukce na klíč' : 'Interiérové stavební úpravy a zednické práce'}`);
      lines.push(`• Sádrokartonové podhledy: ${aptCeilings ? 'Ano (s akustickou a tepelnou izolací)' : 'Ne'}`);
      lines.push(`• Podlahy: ${aptFlooring ? 'Kompletní samonivelační stěrka a pokládka podlahové krytiny' : 'Původní podlahy'}`);
    }

    lines.push('');
    lines.push('Orientační finanční odhad:');
    lines.push(`• Předpokládané cenové rozpětí: ${calculation.min.toLocaleString('cs-CZ')} – ${calculation.max.toLocaleString('cs-CZ')} Kč`);
    lines.push(`• Odhadovaná doba realizace: ${calculation.days}`);
    lines.push('• Záruka na dílo: až 36 měsíců');
    lines.push('• Centrála & působnost: Zábřeh na Moravě | Olomoucký kraj (Šumperk, Mohelnice, Olomouc, Prostějov, Přerov)');
    lines.push('');
    lines.push('Upozornění: Jedná se o nezávaznou kalkulaci. Konečnou pevnou cenu stanovíme zdarma po osobním zaměření na místě zakázky.');
    lines.push('Kontakt: STAVPARTA řemeslná parta | centrála Zábřeh na Moravě | web: stavparta.cz');

    return lines.join('\n');
  };

  const handleCopyToClipboard = async () => {
    const text = generateCopyText();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  return (
    <section id="kalkulacka" className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F07818] mb-2">
            <Calculator className="w-4 h-4" />
            <span>Transparentní rozpočty</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-600 font-medium">Olomoucký kraj</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17232D] tracking-tight">
            Orientační kalkulačka rekonstrukce a řemesel
          </h2>
          <p className="text-slate-600 mt-3 text-base">
            Vyzkoušejte si rychlý odhad nákladů a doby realizace. Výslednou kalkulaci můžete jedním klikem
            odeslat jako podklad pro přesný položkový rozpočet zdarma.
          </p>
        </div>

        {/* Calculator Container */}
        <div className="max-w-4xl mx-auto bg-[#F8FAFC] border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 bg-[#17232D] text-white p-1.5 sm:p-2 gap-1.5">
            <button
              onClick={() => setActiveMode('core')}
              className={`py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeMode === 'core'
                  ? 'bg-[#F07818] text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-[#263746]'
              }`}
            >
              <Wrench className="w-4 h-4 shrink-0" />
              <span>Renovace jádra & koupelny</span>
            </button>

            <button
              onClick={() => setActiveMode('apartment')}
              className={`py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeMode === 'apartment'
                  ? 'bg-[#F07818] text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-[#263746]'
              }`}
            >
              <Home className="w-4 h-4 shrink-0" />
              <span>Rekonstrukce bytu</span>
            </button>
          </div>

          {/* Form Controls & Results Grid */}
          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Interactive Options (Left 7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* MODE 1: CORE */}
              {activeMode === 'core' && (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Původní stav jádra
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setCoreType('umakart')}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold cursor-pointer transition-all ${
                          coreType === 'umakart'
                            ? 'border-[#F07818] bg-orange-50/50 text-[#17232D] shadow-xs ring-1 ring-[#F07818]'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="font-bold">Umakartové jádro</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Demolice, odvoz a nová vyzdívka</div>
                      </button>
                      <button
                        onClick={() => setCoreType('masonry')}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold cursor-pointer transition-all ${
                          coreType === 'masonry'
                            ? 'border-[#F07818] bg-orange-50/50 text-[#17232D] shadow-xs ring-1 ring-[#F07818]'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="font-bold">Staré zděné jádro</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Renovace stávajících příček a obkladů</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Dispozice koupelny a WC
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setCoreLayout('combined')}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold cursor-pointer transition-all ${
                          coreLayout === 'combined'
                            ? 'border-[#F07818] bg-orange-50/50 text-[#17232D] ring-1 ring-[#F07818]'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="font-bold">Spojená koupelna s WC</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Více prostoru pro pračku a sprchu</div>
                      </button>
                      <button
                        onClick={() => setCoreLayout('separate')}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold cursor-pointer transition-all ${
                          coreLayout === 'separate'
                            ? 'border-[#F07818] bg-orange-50/50 text-[#17232D] ring-1 ring-[#F07818]'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="font-bold">Samostatná koupelna i WC</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Zachování oddělených místností</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Koupací zóna
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setCoreSanitary('walkin')}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold cursor-pointer transition-all ${
                          coreSanitary === 'walkin'
                            ? 'border-[#F07818] bg-orange-50/50 text-[#17232D] ring-1 ring-[#F07818]'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="font-bold">Walk-in sprchový kout</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Bez vaničky se spádovým žlabem</div>
                      </button>
                      <button
                        onClick={() => setCoreSanitary('tub')}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold cursor-pointer transition-all ${
                          coreSanitary === 'tub'
                            ? 'border-[#F07818] bg-orange-50/50 text-[#17232D] ring-1 ring-[#F07818]'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="font-bold">Klasická vana</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Akrylátová či smaltovaná se zástěnou</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Obklady & Příplatkové práce
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={coreTileQuality === 'large_format'}
                          onChange={(e) => setCoreTileQuality(e.target.checked ? 'large_format' : 'standard')}
                          className="w-4 h-4 text-[#F07818] rounded"
                        />
                        <span className="text-xs text-slate-700 font-medium">
                          Velkoformátové obklady s kamenickými rohy (jolly 45°)
                        </span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* MODE 2: APARTMENT */}
              {activeMode === 'apartment' && (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Dispozice bytu
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['1kk', '2kk', '3kk', '4kk'] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => setAptSize(size)}
                          className={`py-3 rounded-xl border text-center text-xs font-bold uppercase cursor-pointer transition-all ${
                            aptSize === size
                              ? 'border-[#F07818] bg-orange-50 text-[#F07818] ring-1 ring-[#F07818]'
                              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Rozsah prací
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setAptScope('turnkey')}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold cursor-pointer transition-all ${
                          aptScope === 'turnkey'
                            ? 'border-[#F07818] bg-orange-50 text-[#17232D] ring-1 ring-[#F07818]'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="font-bold">Kompletní na klíč</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Včetně jádra, omítek a podlah</div>
                      </button>
                      <button
                        onClick={() => setAptScope('interior_only')}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold cursor-pointer transition-all ${
                          aptScope === 'interior_only'
                            ? 'border-[#F07818] bg-orange-50 text-[#17232D] ring-1 ring-[#F07818]'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="font-bold">Částečná modernizace</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Omítky, malby, podlahy (bez jádra)</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Doplňkové úpravy
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aptCeilings}
                          onChange={(e) => setAptCeilings(e.target.checked)}
                          className="w-4 h-4 text-[#F07818] rounded"
                        />
                        <span className="text-xs text-slate-700 font-medium">
                          Snížené sádrokartonové podhledy s tepelnou izolací
                        </span>
                      </label>
                      <label className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aptFlooring}
                          onChange={(e) => setAptFlooring(e.target.checked)}
                          className="w-4 h-4 text-[#F07818] rounded"
                        />
                        <span className="text-xs text-slate-700 font-medium">
                          Nivelační stěrka a pokládka vinylové podlahy s lištováním
                        </span>
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Estimated Price Breakdown Box (Right 5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Kalkulovaný odhad
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyToClipboard}
                      title="Zkopírovat kalkulaci do schránky"
                      className="p-1 text-slate-400 hover:text-[#F07818] hover:bg-slate-100 rounded transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-medium"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Zkopírováno</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Kopírovat</span>
                        </>
                      )}
                    </button>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                      Orientační pásmo
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 font-medium mb-1">Předpokládané cenové rozpětí:</div>
                  <div className="text-2xl sm:text-3xl font-black text-[#17232D] tracking-tight">
                    {calculation.min.toLocaleString('cs-CZ')} – {calculation.max.toLocaleString('cs-CZ')} Kč
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Cena zahrnuje odbornou práci, hrubý materiál, likvidaci suti i úklid.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#F07818]" />
                    <div>
                      <div className="text-[10px] text-slate-400">Předpokládaná doba:</div>
                      <div className="font-bold text-slate-800">{calculation.days}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-[10px] text-slate-400">Záruka na práci:</div>
                      <div className="font-bold text-slate-800">až 36 měsíců</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-start gap-1.5 font-bold text-slate-700">
                    <Info className="w-3.5 h-3.5 text-[#F07818] shrink-0 mt-0.5" />
                    <span>Garance férového jednání:</span>
                  </div>
                  <p className="text-slate-500 leading-relaxed">
                    Každá nemovitost má svá specifika. Přesnou pevnou cenu vám spočítáme zdarma po osobním
                    zaměření přímo na stavbě v Olomouckém kraji.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 mt-6 border-t border-slate-100 space-y-2.5">
                <button
                  type="button"
                  onClick={handleApplyToLead}
                  className="w-full py-3.5 px-4 bg-[#F07818] hover:bg-[#d9660e] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <span>Přenést konfiguraci do poptávky</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={handleCopyToClipboard}
                  className={`w-full py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99] ${
                    isCopied
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
                  }`}
                  title="Zkopírovat kompletní specifikaci kalkulace do schránky pro uložení či sdílení"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 animate-in fade-in" />
                      <span className="text-emerald-800">Kalkulace zkopírována do schránky!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Zkopírovat kalkulaci do schránky</span>
                    </>
                  )}
                </button>

                <div className="text-center text-[10px] text-slate-400">
                  Nezávazné odeslání • Vhodné i pro uložení do poznámek či sdílení
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
