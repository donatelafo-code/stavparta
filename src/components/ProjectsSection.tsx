import React, { useState } from 'react';
import { Project, ProjectStage } from '../types';
import { MapPin, Calendar, Layers, Maximize2, AlertTriangle, ArrowRight, MoveHorizontal, Film } from 'lucide-react';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { SiteVideoPlayer } from './SiteVideoPlayer';

import BATHROOM_BEFORE from '../assets/images/project_bathroom_before_1793480824213.jpg';
import BATHROOM_AFTER from '../assets/images/project_bathroom_tiles_1793401119494.jpg';
import INTERIOR_BEFORE from '../assets/images/project_interior_before_1793480836173.jpg';
import INTERIOR_AFTER from '../assets/images/project_interior_renovation_1793401119488.jpg';

interface ProjectsSectionProps {
  projects: Project[];
  onOpenLeadForm: () => void;
}

type CardViewMode = ProjectStage | 'video';

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  projects,
  onOpenLeadForm,
}) => {
  const publishedProjects = projects.filter((p) => p.status === 'published');
  const projectsWithVideos = publishedProjects.filter((p) => Boolean(p.video?.url));

  const [selectedFilter, setSelectedFilter] = useState<string>('Vše');
  const [activeSliderSubject, setActiveSliderSubject] = useState<'bathroom' | 'interior'>('bathroom');
  const [activeShowcaseVideoId, setActiveShowcaseVideoId] = useState<string>(
    projectsWithVideos[0]?.id || ''
  );

  // Track active photo stage or inline video playback per project id
  const [activeStages, setActiveStages] = useState<Record<string, CardViewMode>>({});
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    url: string;
    caption: string;
    title: string;
  } | null>(null);

  const handleStageChange = (projectId: string, stage: CardViewMode) => {
    setActiveStages((prev) => ({ ...prev, [projectId]: stage }));
  };

  const activeShowcaseProject =
    projectsWithVideos.find((p) => p.id === activeShowcaseVideoId) || projectsWithVideos[0];

  const filteredProjects =
    selectedFilter === 'Vše'
      ? publishedProjects
      : selectedFilter === 'Bytová jádra & koupelny'
      ? publishedProjects.filter(
          (p) => p.serviceId.includes('jadra') || p.title.toLowerCase().includes('jádra') || p.title.toLowerCase().includes('koupeln')
        )
      : publishedProjects.filter(
          (p) => !p.serviceId.includes('jadra')
        );

  return (
    <section id="realizace" className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F07818] mb-2">
              <span>Ukázky realizací</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500 font-medium">Fotodokumentace & Časosběrná videa ze stavby</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17232D] tracking-tight text-balance">
              Ukázky proměn bytových jader, koupelen a interiérů
            </h2>
            <p className="text-slate-600 mt-2 text-base max-w-2xl">
              Níže si můžete interaktivně přepínat jednotlivé fáze prací před vybouráním, v
              průběhu hrubých rozvodů, po finálním předání i zhlédnout krátké časosběrné záznamy
              přímo ze staveniště.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="px-3 py-1.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold rounded flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Ukázky označeny: DEMO – NEPUBLIKOVAT</span>
            </span>
          </div>
        </div>

        {/* FEATURED 1: INTERACTIVE BEFORE / AFTER SLIDER SHOWCASE */}
        <div className="mb-10 p-6 sm:p-8 bg-[#F8FAFC] border border-slate-200 rounded-2xl shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F07818] uppercase tracking-wider mb-1">
                <MoveHorizontal className="w-3.5 h-3.5" />
                <span>Interaktivní srovnávač</span>
              </div>
              <h3 className="text-xl font-extrabold text-[#17232D]">
                Přesvědčte se sami: Posuvník proměny Před a Po
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tažením středové linie porovnejte původní stav nemovitosti a výsledek po naší řemeslné práci.
              </p>
            </div>

            {/* Subject Selector Buttons */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveSliderSubject('bathroom')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeSliderSubject === 'bathroom'
                    ? 'bg-[#17232D] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bytové jádro & Koupelna
              </button>
              <button
                type="button"
                onClick={() => setActiveSliderSubject('interior')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeSliderSubject === 'interior'
                    ? 'bg-[#17232D] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kompletní rekonstrukce interiéru
              </button>
            </div>
          </div>

          {activeSliderSubject === 'bathroom' ? (
            <BeforeAfterSlider
              beforeImage={BATHROOM_BEFORE}
              afterImage={BATHROOM_AFTER}
              beforeLabel="Původní umakartové jádro"
              afterLabel="Nová vyzděná koupelna"
              subtitle="Lokalita: Olomouc – Neředín | Vybourání umakartu, nové zděné příčky Ytong, velkoformátové obklady a sprchový kout"
            />
          ) : (
            <BeforeAfterSlider
              beforeImage={INTERIOR_BEFORE}
              afterImage={INTERIOR_AFTER}
              beforeLabel="Původní stav před rekonstrukcí"
              afterLabel="Kompletně dokončený interiér"
              subtitle="Lokalita: Prostějov | Vyrovnání stěn, sádrokartonové podhledy, nivelace podlahy a pokládka vinylové krytiny"
            />
          )}
        </div>

        {/* FEATURED 2: ON-SITE TIME-LAPSE VIDEO SHOWCASE */}
        {activeShowcaseProject && activeShowcaseProject.video && (
          <div className="mb-14 p-6 sm:p-8 bg-[#F8FAFC] border border-slate-200 rounded-2xl shadow-sm space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F07818] uppercase tracking-wider mb-1">
                  <Film className="w-3.5 h-3.5" />
                  <span>Video ze staveniště</span>
                </div>
                <h3 className="text-xl font-extrabold text-[#17232D]">
                  Časosběrný průběh prací: Podívejte se naší partě pod ruce
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                  Krátké reálné videoukázky dokumentují návaznost prací od bourání přes hrubé rozvody
                  a hydroizolaci až po finální čisté předání.
                </p>
              </div>

              {projectsWithVideos.length > 1 && (
                <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs self-start lg:self-auto">
                  {projectsWithVideos.map((vidProj) => (
                    <button
                      key={vidProj.id}
                      type="button"
                      onClick={() => setActiveShowcaseVideoId(vidProj.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        activeShowcaseProject.id === vidProj.id
                          ? 'bg-[#17232D] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {vidProj.id === 'proj-1'
                        ? 'Bytové jádro (Zábřeh)'
                        : vidProj.id === 'proj-3'
                        ? 'Rekonstrukce bytu (Olomouc)'
                        : vidProj.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8">
                <SiteVideoPlayer video={activeShowcaseProject.video} />
              </div>

              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
                    <span className="font-bold text-[#F07818]">
                      {activeShowcaseProject.serviceName}
                    </span>
                    <span>·</span>
                    <span>{activeShowcaseProject.location}</span>
                  </div>
                  <h4 className="text-base font-extrabold text-[#17232D] leading-snug">
                    {activeShowcaseProject.video.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed mt-2">
                    {activeShowcaseProject.video.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Délka časosběru:</span>
                    <span className="font-bold text-[#17232D] font-mono">
                      {activeShowcaseProject.video.durationLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Rok realizace:</span>
                    <span className="font-bold text-[#17232D]">
                      {activeShowcaseProject.year || '2026'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Dostupná rychlost:</span>
                    <span className="font-bold text-[#17232D]">1× / 1.5× / 2×</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenLeadForm}
                  className="w-full py-2.5 px-4 bg-[#F07818] hover:bg-[#d9660e] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Poptat podobnou realizaci</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-10">
          {[
            { id: 'Vše', label: 'Všechny realizace' },
            { id: 'Bytová jádra & koupelny', label: 'Bytová jádra a koupelny' },
            { id: 'Ostatní', label: 'Interiéry, zednictví a fasády' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                selectedFilter === tab.id
                  ? 'bg-[#17232D] text-white shadow-xs'
                  : 'bg-[#F1F4F6] text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredProjects.map((project) => {
            const currentStage: CardViewMode = activeStages[project.id] || 'po';
            const isVideoMode = currentStage === 'video' && Boolean(project.video?.url);
            const currentPhoto =
              project.photos.find((p) => p.stage === currentStage) ||
              project.photos.find((p) => p.isCover) ||
              project.photos[0];

            return (
              <div
                key={project.id}
                className="bg-[#F1F4F6] rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Media Viewer (Photo or Inline Video) */}
                  <div className="relative aspect-16/10 bg-slate-900 overflow-hidden group">
                    {isVideoMode && project.video ? (
                      <SiteVideoPlayer video={project.video} compact />
                    ) : currentPhoto ? (
                      <img
                        src={currentPhoto.url}
                        alt={currentPhoto.caption || project.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                        Fotografie není k dispozici
                      </div>
                    )}

                    {project.isDemo && !isVideoMode && (
                      <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-xs text-amber-400 border border-amber-400/50 px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider">
                        DEMO – NEPUBLIKOVAT
                      </div>
                    )}

                    {currentPhoto && !isVideoMode && (
                      <button
                        onClick={() =>
                          setLightboxPhoto({
                            url: currentPhoto.url,
                            caption: currentPhoto.caption,
                            title: project.title,
                          })
                        }
                        className="absolute top-3 right-3 p-1.5 rounded bg-black/60 hover:bg-black/90 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Zvětšit fotografii"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Stage & Video Switcher */}
                    <div className="absolute bottom-3 left-3 right-3 bg-black/80 backdrop-blur-md rounded-lg p-1 flex items-center justify-between gap-1 text-xs z-10">
                      {(['pred', 'behem', 'po'] as ProjectStage[]).map((stage) => {
                        const exists = project.photos.some((p) => p.stage === stage);
                        const labels: Record<ProjectStage, string> = {
                          pred: 'PŘED',
                          behem: 'BĚHEM',
                          po: 'PO DOKONČENÍ',
                        };
                        return (
                          <button
                            key={stage}
                            disabled={!exists}
                            onClick={() => handleStageChange(project.id, stage)}
                            className={`flex-1 py-1 px-2 text-[11px] font-bold rounded transition-colors whitespace-nowrap cursor-pointer ${
                              currentStage === stage
                                ? 'bg-[#F07818] text-white shadow-xs'
                                : exists
                                ? 'text-slate-300 hover:text-white hover:bg-white/10'
                                : 'text-slate-600 opacity-40 cursor-not-allowed'
                            }`}
                          >
                            {labels[stage]}
                          </button>
                        );
                      })}
                      {project.video && (
                        <button
                          type="button"
                          onClick={() => handleStageChange(project.id, 'video')}
                          className={`flex-1 py-1 px-2 text-[11px] font-bold rounded transition-colors whitespace-nowrap flex items-center justify-center gap-1 cursor-pointer ${
                            isVideoMode
                              ? 'bg-[#F07818] text-white shadow-xs'
                              : 'text-orange-300 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Film className="w-3 h-3 shrink-0" />
                          <span>VIDEO</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Caption Strip */}
                  {isVideoMode && project.video ? (
                    <div className="bg-slate-800 text-slate-300 text-[11px] px-4 py-2 flex items-center gap-1.5 border-b border-slate-700">
                      <span className="text-[#F07818] font-bold shrink-0">
                        Časosběr ({project.video.durationLabel}):
                      </span>
                      <span className="truncate">{project.video.summary}</span>
                    </div>
                  ) : (
                    currentPhoto && (
                      <div className="bg-slate-800 text-slate-300 text-[11px] px-4 py-2 flex items-center gap-1.5 border-b border-slate-700">
                        <span className="text-[#F07818] font-bold shrink-0">
                          {currentPhoto.stageLabel}:
                        </span>
                        <span className="truncate">{currentPhoto.caption}</span>
                      </div>
                    )
                  )}

                  {/* Card Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                      <span className="flex items-center gap-1 font-medium text-[#17232D]">
                        <Layers className="w-3.5 h-3.5 text-[#F07818]" />
                        {project.serviceName}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {project.location}
                      </span>
                      {project.year && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {project.year}
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-[#17232D] mb-2 leading-snug">
                      {project.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {project.description}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Plánujete podobnou rekonstrukci?
                  </span>
                  <button
                    onClick={onOpenLeadForm}
                    className="text-xs font-bold text-[#F07818] hover:text-[#d9660e] flex items-center gap-1 cursor-pointer"
                  >
                    <span>Nezávazná poptávka</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="max-w-4xl w-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-16/10 bg-black">
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.caption}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-white">{lightboxPhoto.title}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{lightboxPhoto.caption}</p>
              </div>
              <button
                onClick={() => setLightboxPhoto(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded text-white"
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
