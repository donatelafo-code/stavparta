import React, { useState } from 'react';
import {
  Home,
  Layers,
  LayoutGrid,
  Grid,
  Maximize2,
  CheckCircle2,
  Wrench,
  ArrowRight,
  Info,
  Sparkles,
  Star,
  ShieldCheck,
} from 'lucide-react';
import { ServiceItem } from '../types';

interface ServicesSectionProps {
  services: ServiceItem[];
  onSelectServiceForLead: (serviceId: string) => void;
  onOpenServiceDetail: (service: ServiceItem) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  onSelectServiceForLead,
  onOpenServiceDetail,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Vše');

  // Strict sorting function prioritizing:
  // 1. Rekonstrukce bytů a domů
  // 2. Kompletní renovace bytových jader
  // 3. Zednické a stavební práce
  // followed by remaining craft services
  const getServiceSortRank = (service: ServiceItem): number => {
    const title = (service.title || '').toLowerCase();
    const slug = (service.slug || '').toLowerCase();
    const id = (service.id || '').toLowerCase();

    // 1. Rekonstrukce bytů
    if (
      id === 'srv-rekonstrukce-bytu' ||
      slug.includes('rekonstrukce-bytu') ||
      (title.includes('rekonstrukce') && (title.includes('byt') || title.includes('dom')))
    ) {
      return 1;
    }

    // 2. Renovace bytových jader
    if (
      id === 'srv-bytova-jadra' ||
      slug.includes('bytov') ||
      slug.includes('jader') ||
      title.includes('jád') ||
      title.includes('jad')
    ) {
      return 2;
    }

    // 3. Zednické práce
    if (id === 'srv-zednicke-prace' || title.includes('zednick')) {
      return 3;
    }

    // 4. Sádrokartony
    if (id === 'srv-sadrokartony' || title.includes('sádrokarton') || title.includes('sadrokarton')) {
      return 4;
    }

    // 5. Obklady a dlažby
    if (id === 'srv-obklady-dlazby' || title.includes('obklad') || title.includes('dlažb')) {
      return 5;
    }

    // 6. Dokončovací práce
    if (id === 'srv-dokoncovaci-prace' || title.includes('dokončov')) {
      return 6;
    }

    return 10 + (service.order || 0);
  };

  const activeServices = [...services]
    .filter((s) => s.isActive)
    .sort((a, b) => getServiceSortRank(a) - getServiceSortRank(b));

  const categories = ['Vše', ...Array.from(new Set(activeServices.map((s) => s.category)))];

  const filteredServices =
    selectedCategory === 'Vše'
      ? activeServices
      : activeServices.filter((s) => s.category === selectedCategory);

  const renderIcon = (name: string) => {
    const props = { className: 'w-5 h-5 text-[#F07818]' };
    switch (name) {
      case 'Home':
        return <Home {...props} />;
      case 'Grid':
        return <Grid {...props} />;
      case 'Layers':
        return <Layers {...props} />;
      case 'LayoutGrid':
        return <LayoutGrid {...props} />;
      case 'Maximize2':
        return <Maximize2 {...props} />;
      case 'CheckCircle2':
        return <CheckCircle2 {...props} />;
      case 'ShieldCheck':
        return <ShieldCheck {...props} />;
      default:
        return <Wrench {...props} />;
    }
  };

  return (
    <section id="sluzby" className="py-20 bg-[#F1F4F6] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F07818] mb-2">
            <span>Nabídka řemesel</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-600 font-medium">Olomoucký kraj</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17232D] tracking-tight">
            Kompletní stavební a rekonstrukční práce
          </h2>
          <p className="text-slate-600 mt-3 text-base">
            Poptat můžete samostatnou specializaci (koupelny a jádra, sádrokartony, zednictví, obklady)
            i celkovou rekonstrukci bytu či domu na klíč s plynulou koordinací řemesel.
          </p>

          {/* Category Filter Buttons */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-[#17232D] text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Responsive Unified Grid: 1 col on mobile, 2 cols on tablet, 3 cols on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredServices.map((service) => {
            const rank = getServiceSortRank(service);
            const isTopPriority = rank <= 3;

            return (
              <div
                key={service.id}
                className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden flex flex-col justify-between group ${
                  isTopPriority
                    ? 'border-slate-300 shadow-sm hover:shadow-lg hover:border-[#F07818]/60 ring-1 ring-slate-200/60'
                    : 'border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Visual Image Header (Linkable to subpage) */}
                  <a
                    href={`#sluzba/${service.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenServiceDetail(service);
                    }}
                    className="block relative aspect-16/10 bg-slate-900 overflow-hidden cursor-pointer"
                    title={`Detail služby: ${service.title}`}
                  >
                    {service.image ? (
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#17232D] flex items-center justify-center text-slate-400">
                        {renderIcon(service.iconName)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

                    {/* Top priority badge */}
                    <div className="absolute top-3 right-3">
                      {isTopPriority && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#F07818] bg-black/80 backdrop-blur-xs px-2.5 py-1 rounded-md border border-[#F07818]/40 shadow-xs">
                          <Sparkles className="w-3 h-3 text-[#F07818]" />
                          <span>Prioritní obor</span>
                        </span>
                      )}
                    </div>

                    {/* Category tag */}
                    <div className="absolute bottom-3 left-3">
                      <span className="text-white text-[11px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded border border-white/20">
                        {service.category}
                      </span>
                    </div>
                  </a>

                  {/* Card Content */}
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start gap-2.5 mb-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#F07818]/10 flex items-center justify-center shrink-0 mt-0.5">
                        {renderIcon(service.iconName)}
                      </div>
                      <div>
                        <a
                          href={`#sluzba/${service.slug}`}
                          onClick={(e) => {
                            e.preventDefault();
                            onOpenServiceDetail(service);
                          }}
                          className="text-base sm:text-lg font-bold text-[#17232D] group-hover:text-[#F07818] transition-colors leading-snug cursor-pointer block"
                        >
                          {service.title}
                        </a>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {service.shortDescription}
                    </p>

                    {/* Key features checklist */}
                    {service.features && service.features.length > 0 && (
                      <ul className="space-y-1.5 mb-2 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
                        {service.features.slice(0, 3).map((feat, i) => (
                          <li key={i} className="flex items-start gap-1.5 line-clamp-1">
                            <span className="text-[#F07818] font-bold shrink-0">✓</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Card Actions (Linkable & Popttat) */}
                <div className="p-5 sm:p-6 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between gap-3">
                  <a
                    href={`#sluzba/${service.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenServiceDetail(service);
                    }}
                    className="text-xs font-bold text-slate-700 hover:text-[#17232D] flex items-center gap-1 cursor-pointer py-1.5"
                  >
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    <span>Více informací</span>
                  </a>

                  <button
                    onClick={() => onSelectServiceForLead(service.id)}
                    className="px-3.5 py-2 text-xs font-bold text-white bg-[#F07818] hover:bg-[#d9660e] rounded shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Nezávazně poptat</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
