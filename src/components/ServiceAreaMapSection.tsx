import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Clock,
  Car,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Search,
  Map as MapIcon,
} from 'lucide-react';
import { SiteSettings } from '../types';
import { CITY_PAGES } from '../shared/cityPages';

interface ServiceAreaCity {
  id: string;
  name: string;
  district: string;
  coords: [number, number];
  description: string;
  typicalWork: string[];
  responseTime: string;
  isMainBase?: boolean;
}

const SERVICE_CITIES: ServiceAreaCity[] = [
  {
    id: 'zabreh',
    name: 'Zábřeh na Moravě',
    district: 'Zábřežsko (Centrála & sídlo firmy)',
    coords: [49.8824, 16.8722],
    description: 'Hlavní centrála a domovská základna party STAVPARTA. Okamžitý výjezd na zaměření, stavební dílna a zázemí party přímo v Zábřehu na Moravě.',
    typicalWork: ['Centrála a dílna party STAVPARTA', 'Rekonstrukce bytových jader a domů Zábřežsko', 'Zednické práce, sádrokartony a podlahy'],
    responseTime: 'Dojezd na zaměření: do 12–24 hodin (místní výjezd zdarma)',
    isMainBase: true,
  },
  {
    id: 'sumperk',
    name: 'Šumperk',
    district: 'Šumpersko (přímé sousedství)',
    coords: [49.9653, 16.9706],
    description: 'Pravidelné realizace s každodenním dojezdem ze Zábřehu. Rekonstrukce bytů i rodinných domů v podhůří Jeseníků.',
    typicalWork: ['Rekonstrukce rodinných domů a bytů', 'Sádrokartonové podhledy s izolací', 'Obkladačské práce a sanita'],
    responseTime: 'Dojezd na zaměření: do 24 hodin',
  },
  {
    id: 'mohelnice',
    name: 'Mohelnice',
    district: 'Mohelnicko',
    coords: [49.7769, 16.9202],
    description: 'Rychlá dostupnost ze základny v Zábřehu. Zednické práce, rekonstrukce koupelen a pokládka podlah.',
    typicalWork: ['Koupelny a jádra na klíč', 'Omítky, štuky a příčky Ytong', 'Pokládka vinylu a podlah'],
    responseTime: 'Dojezd na zaměření: do 24 hodin',
  },
  {
    id: 'olomouc',
    name: 'Olomouc',
    district: 'Olomouc a Haná',
    coords: [49.5938, 17.2509],
    description: 'Pravidelné realizace po dálničním tahu i koridoru. Specializace na rekonstrukce panelových i historických bytů.',
    typicalWork: ['Bytová jádra Neředín, Lazce, Nová Ulice', 'Akustické sádrokartonové podhledy a příčky', 'Kompletní rekonstrukce bytů'],
    responseTime: 'Dojezd na zaměření: do 24–48 hodin',
  },
  {
    id: 'litovel',
    name: 'Litovel',
    district: 'Litovelsko & Haná',
    coords: [49.7006, 17.0759],
    description: 'Rychlá dostupnost po D35. Rekonstrukce koupelen, zednické začištění a malby.',
    typicalWork: ['Rekonstrukce bytových jader', 'Vyrovnání podlah a nivelace', 'Stěrkování a výmalba'],
    responseTime: 'Dojezd na zaměření: do 24 hodin',
  },
  {
    id: 'prostejov',
    name: 'Prostějov',
    district: 'Prostějovsko',
    coords: [49.472, 17.1124],
    description: 'Pravidelné realizace rekonstrukcí bytů, koupelen a sádrokartonářských prací.',
    typicalWork: ['Rekonstrukce koupelen a WC', 'Zdění příček z Ytongu', 'Velkoformátové obklady a dlažby'],
    responseTime: 'Dojezd na zaměření: do 24–48 hodin',
  },
  {
    id: 'prerov',
    name: 'Přerov',
    district: 'Přerovsko',
    coords: [49.4552, 17.4506],
    description: 'Kompletní stavební úpravy interiérů, vybourání starých jader a nová sanita.',
    typicalWork: ['Paneláková jádra a walk-in sprchy', 'Sádrokartonářské konstrukce a izolace', 'Velkoformátová dlažba'],
    responseTime: 'Dojezd na zaměření: do 24–48 hodin',
  },
  {
    id: 'sternberk',
    name: 'Šternberk',
    district: 'Šternbersko',
    coords: [49.7308, 17.2974],
    description: 'Zednické práce, rekonstrukce starších bytových jednotek i novostaveb.',
    typicalWork: ['Vyzdění a omítky', 'Nová koupelnová sanita', 'Zateplení fasád a opravy zdiva'],
    responseTime: 'Dojezd na zaměření: do 24 hodin',
  },
  {
    id: 'unicov',
    name: 'Uničov',
    district: 'Uničovsko',
    coords: [49.7712, 17.1217],
    description: 'Komplexní stavební řemesla, pokládka podlah a obkladů v bytech i domech.',
    typicalWork: ['Obklady a dlažby', 'Příčky ze sádrokartonu', 'Úpravy dispozic'],
    responseTime: 'Dojezd na zaměření: do 24–48 hodin',
  },
  {
    id: 'hranice',
    name: 'Hranice',
    district: 'Hranicko',
    coords: [49.5516, 17.7347],
    description: 'Rekonstrukce interiérů, obklady a zednické práce pro byty i menší provozovny.',
    typicalWork: ['Celkové rekonstrukce interiérů', 'Podhledy a akustické příčky', 'Vyrovnání podlah a nivelace'],
    responseTime: 'Dojezd na zaměření: do 48 hodin',
  },
];

interface ServiceAreaMapSectionProps {
  settings: SiteSettings;
  onOpenLeadForm: (serviceId?: string) => void;
}

export const ServiceAreaMapSection: React.FC<ServiceAreaMapSectionProps> = ({
  settings: _settings,
  onOpenLeadForm,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  const [selectedCity, setSelectedCity] = useState<ServiceAreaCity>(SERVICE_CITIES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapConsentGranted, setMapConsentGranted] = useState(false);

  // Filter cities by search
  const filteredCities = SERVICE_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.district.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Initialize Leaflet map only after explicit visitor consent (external CARTO / OSM requests)
  useEffect(() => {
    if (!mapConsentGranted || !mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Zábřeh and Olomoucký kraj
    const map = L.map(mapContainerRef.current, {
      center: [49.80, 17.05],
      zoom: 9,
      minZoom: 8,
      maxZoom: 14,
      scrollWheelZoom: false, // Prevent hijacking page scroll
    });

    mapInstanceRef.current = map;

    // CartoDB Positron tiles for a modern, clean, non-distracting craft design
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://carto.com/" target="_blank">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Primary Coverage Circle around Headquarters in Zábřeh na Moravě (~32 km radius)
    L.circle([49.8824, 16.8722], {
      radius: 32000,
      color: '#F07818',
      weight: 2,
      opacity: 0.6,
      fillColor: '#F07818',
      fillOpacity: 0.08,
      dashArray: '6, 6',
    }).addTo(map);

    // Secondary Coverage Circle for Olomouc, Haná and south region (~38 km radius)
    L.circle([49.60, 17.20], {
      radius: 38000,
      color: '#263746',
      weight: 1.5,
      opacity: 0.4,
      fillColor: '#263746',
      fillOpacity: 0.04,
      dashArray: '4, 4',
    }).addTo(map);

    // Add city markers with custom L.divIcon
    SERVICE_CITIES.forEach((city) => {
      const isBase = city.isMainBase;
      const markerHtml = `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: ${isBase ? '36px' : '28px'};
          height: ${isBase ? '36px' : '28px'};
          border-radius: 9999px;
          background-color: ${isBase ? '#C2560A' : '#17232D'};
          color: #ffffff;
          border: 2px solid #ffffff;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35);
          cursor: pointer;
          font-weight: 800;
          font-size: ${isBase ? '12px' : '10px'};
          transition: transform 0.2s ease;
        ">
          ${isBase ? '★' : '●'}
          ${
            isBase
              ? '<span style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; border: 2px solid #C2560A; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.4;"></span>'
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-stavparta-marker',
        iconSize: [isBase ? 36 : 28, isBase ? 36 : 28],
        iconAnchor: [isBase ? 18 : 14, isBase ? 18 : 14],
      });

      const marker = L.marker(city.coords, { icon: customIcon }).addTo(map);

      // Popup content
      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; color: #17232D; min-width: 170px; padding: 2px;">
          <div style="font-size: 13px; font-weight: 800; margin-bottom: 2px; color: #17232D;">
            ${city.name} ${city.isMainBase ? '<span style="color:#B84F00; font-size:10px;">(Základna)</span>' : ''}
          </div>
          <div style="font-size: 11px; color: #64748B; margin-bottom: 6px;">${city.district}</div>
          <div style="font-size: 11px; color: #059669; font-weight: 600; margin-bottom: 4px;">
            ✓ ${city.responseTime}
          </div>
          <div style="font-size: 11px; color: #475569; line-height: 1.3;">
            Zaměření a konzultace na stavbě zdarma.
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        setSelectedCity(city);
      });

      markersRef.current[city.id] = marker;
    });

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = {};
    };
  }, [mapConsentGranted]);

  // When city is selected via side list, pan map to it and open popup
  const handleSelectCity = (city: ServiceAreaCity) => {
    setSelectedCity(city);
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo(city.coords, 11, { duration: 1.2 });
      const marker = markersRef.current[city.id];
      if (marker) {
        marker.openPopup();
      }
    }
  };

  const handleResetView = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([49.80, 17.05], 9, { duration: 1.2 });
      setSelectedCity(SERVICE_CITIES[0]);
    }
  };

  return (
    <section id="pusobnost" className="py-20 bg-[#F1F4F6] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B84F00] mb-2">
            <MapPin className="w-4 h-4" />
            <span>Regionální působnost</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-600 font-medium">Centrála Zábřeh na Moravě & Olomoucký kraj</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17232D] tracking-tight">
            Kde všude stavíme a rekonstruujeme
          </h2>
          <p className="text-slate-600 mt-3 text-base">
            Centrála naší stavební party sídlí v <strong>Zábřehu na Moravě</strong>. Odtud pravidelně vyrážíme za zakázkami po celém Zábřežsku, Šumpersku, Mohelnicku i do Olomouce a celé Hané. Na zaměření a posouzení stavby k vám přijedeme nezávazně a zdarma.
          </p>
        </div>

        {/* Map & City Panel Grid */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Interactive Leaflet Map with Privacy Consent Gate (7 cols) */}
          <div className="lg:col-span-7 relative flex flex-col min-h-[380px] sm:min-h-[480px] bg-[#17232D]">
            {mapConsentGranted ? (
              <>
                <div ref={mapContainerRef} className="flex-1 w-full h-full z-10" />

                {/* Map Legend Overlay (Top Left) */}
                <div className="absolute top-3 left-3 z-20 bg-[#17232D]/90 backdrop-blur-xs text-white p-3 rounded-xl border border-slate-700 shadow-md max-w-[230px]">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#F07818] mb-1">
                    Oblast působení
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#C2560A] inline-block shrink-0" />
                      <span>Centrála (Zábřeh na Moravě)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-white inline-block shrink-0" />
                      <span>Pravidelně obsluhovaná města</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full border border-dashed border-[#FF9642] inline-block shrink-0" />
                      <span>Dojezd na stavbu bez příplatku</span>
                    </div>
                  </div>
                </div>

                {/* Reset Map View Button (Bottom Left) */}
                <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetView}
                    className="px-3 py-1.5 bg-white/95 hover:bg-white text-slate-700 text-xs font-bold rounded-lg shadow-md border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Celý kraj (Přehled)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapConsentGranted(false)}
                    className="px-2.5 py-1.5 bg-[#17232D]/85 hover:bg-[#17232D] text-slate-200 text-[11px] font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer"
                  >
                    Skrýt mapu
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center text-white bg-gradient-to-br from-[#17232D] via-[#1E2C39] to-[#263746]">
                <div className="w-14 h-14 rounded-2xl bg-[#C2560A]/25 border border-[#FF9642]/45 text-[#FF9642] flex items-center justify-center mb-4">
                  <MapIcon className="w-7 h-7" />
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white mb-2">
                  Interaktivní mapa působnosti (Olomoucký kraj)
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed mb-5">
                  Z důvodu ochrany soukromí se externí mapové podklady (OpenStreetMap / CARTO)
                  nenačítají automaticky. Kliknutím níže povolíte jejich načtení (dojde k přenosu
                  vaší IP adresy poskytovateli mapy). Přehled měst si můžete prohlédnout i v panelu
                  vpravo bez načtení mapy.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 mb-6 max-w-md text-[11px] text-slate-200">
                  <span className="px-2.5 py-1 rounded bg-white/10 border border-white/15 font-semibold">
                    ★ Centrála: Zábřeh na Moravě
                  </span>
                  <span className="px-2.5 py-1 rounded bg-white/10 border border-white/15">
                    Šumperk · Mohelnice · Olomouc · Prostějov · Přerov
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMapConsentGranted(true)}
                  className="px-5 py-3 bg-[#C2560A] hover:bg-[#9E4306] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Načíst interaktivní mapu</span>
                </button>
              </div>
            )}
          </div>

          {/* Right: City Details & Quick Selector (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-white border-t lg:border-t-0 lg:border-l border-slate-200">
            <div className="space-y-6">
              {/* Quick Search */}
              <div className="relative">
                <label htmlFor="map-city-search" className="sr-only">
                  Hledat obec či město v Olomouckém kraji
                </label>
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  id="map-city-search"
                  type="text"
                  placeholder="Hledat obec či město v kraji..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#C2560A]"
                />
              </div>

              {/* City Quick Pills Carousel / Wrap */}
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Města s garancí rychlého dojezdu:
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {filteredCities.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => handleSelectCity(city)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                        selectedCity.id === city.id
                          ? 'bg-[#C2560A] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected City Details Card */}
              <div className="p-4 bg-[#F8FAFC] border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#B84F00] font-bold uppercase">
                      {selectedCity.district}
                    </span>
                    <h3 className="text-lg font-extrabold text-[#17232D]">
                      {selectedCity.name}
                    </h3>
                  </div>
                  {selectedCity.isMainBase && (
                    <span className="px-2 py-0.5 bg-orange-100 text-[#9E4306] border border-orange-200 rounded text-[10px] font-bold">
                      Centrála
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedCity.description}
                </p>

                {/* Response time */}
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{selectedCity.responseTime}</span>
                </div>

                {/* Typical Work Scope */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-slate-700">Časté zakázky v lokalitě:</div>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {selectedCity.typicalWork.map((work, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#B84F00] shrink-0" />
                        <span>{work}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {(() => {
                  const cityRoute = CITY_PAGES.find(
                    (cp) => cp.cityName.toLowerCase() === selectedCity.name.toLowerCase()
                  );
                  if (!cityRoute) return null;
                  return (
                    <div className="pt-2 border-t border-slate-200/80">
                      <Link
                        to={`/lokalita/${cityRoute.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B84F00] hover:underline"
                      >
                        <span>Detail lokality {cityRoute.cityName}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  );
                })()}
              </div>

              {/* Guarantees Strip */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Car className="w-4 h-4 text-[#B84F00] shrink-0" />
                  <span>Zaměření na místě zdarma</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-[#B84F00] shrink-0" />
                  <span>Položkový rozpočet bez závazku</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-6 mt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onOpenLeadForm()}
                className="w-full py-3 px-4 bg-[#17232D] hover:bg-[#263746] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>Poptat práce v lokalitě {selectedCity.name}</span>
                <ArrowRight className="w-4 h-4 text-[#F07818] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
