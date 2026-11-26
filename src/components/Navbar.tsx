import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Hammer, Menu, X, Phone, ArrowRight, Lock, Calculator } from 'lucide-react';
import { SiteSettings } from '../types';
import { getPreferredScrollBehavior } from '../hooks/useModalAccessibility';

interface NavbarProps {
  settings: SiteSettings;
  onOpenLeadForm: (serviceId?: string) => void;
  onOpenAdmin: () => void;
  unreadLeadsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onOpenLeadForm,
  onOpenAdmin,
  unreadLeadsCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate(`/#${id}`);
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: getPreferredScrollBehavior() });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#17232D]/95 backdrop-blur-md border-b border-[#263746] text-white">
      {/* Top micro info strip */}
      <div className="bg-[#0F171E] border-b border-[#1E2B37] px-4 sm:px-8 py-1.5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-300">Působnost:</span>
            <span>{settings.operatingRegion} (Centrála: Zábřeh na Moravě)</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">Pracovní doba: {settings.workingHours}</span>
            {settings.phone.trim() ? (
              <a
                href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                className="flex items-center gap-1.5 text-[#F07818] font-semibold hover:text-white transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{settings.phone}</span>
              </a>
            ) : settings.email.trim() ? (
              <a
                href={`mailto:${settings.email.trim()}`}
                className="flex items-center gap-1.5 text-[#F07818] font-semibold hover:text-white transition-colors"
              >
                <span>{settings.email}</span>
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Top Bar Contract: Zone 1 (Brand) - Zone 2 (4-5 Nav Links) - Zone 3 (1 Primary Action) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark element */}
        <Link
          to="/"
          onClick={() => {
            setMobileMenuOpen(false);
            if (location.pathname === '/') {
              window.scrollTo({ top: 0, behavior: getPreferredScrollBehavior() });
            }
          }}
          className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 group"
        >
          <div className="w-9 h-9 rounded bg-[#C2560A] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <Hammer className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="leading-none text-lg tracking-wider font-black">STAVPARTA</span>
            <span className="text-[10px] text-slate-400 font-normal tracking-normal">stavební řemeslo</span>
          </div>
        </Link>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => scrollTo('sluzby')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Služby
          </button>
          <button
            onClick={() => scrollTo('kalkulacka')}
            className="text-[#F07818] hover:text-[#ff8f38] transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1 font-bold"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Kalkulačka</span>
          </button>
          <button
            onClick={() => scrollTo('realizace')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Realizace
          </button>
          <button
            onClick={() => scrollTo('pripadove-studie')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Případové studie
          </button>
          <button
            onClick={() => scrollTo('porovnani-materialu')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Materiály
          </button>
          <button
            onClick={() => scrollTo('blog')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Blog
          </button>
          <button
            onClick={() => scrollTo('faq')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            FAQ
          </button>
          <button
            onClick={() => scrollTo('reference')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Reference
          </button>
          <button
            onClick={() => scrollTo('kontakt')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Kontakt
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action + discreet admin trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onOpenLeadForm()}
            className="px-4 py-2.5 text-sm font-bold text-white bg-[#C2560A] hover:bg-[#9E4306] active:scale-98 rounded shadow-md transition-all whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <span>Nezávazně poptat</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Admin entrance button */}
          <button
            onClick={onOpenAdmin}
            title="Administrace webu STAVPARTA"
            className="p-2 text-slate-400 hover:text-white hover:bg-[#263746] rounded transition-colors relative cursor-pointer"
            aria-label="Vstup do administrace"
          >
            <Lock className="w-4 h-4" />
            {unreadLeadsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C2560A] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadLeadsCount}
              </span>
            )}
          </button>

          {/* Mobile / tablet hamburger toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-300 hover:text-white focus:outline-none"
            aria-label="Přepnout menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#1E2B37] border-b border-[#263746] px-4 pt-2 pb-6 space-y-1.5">
          <button
            onClick={() => scrollTo('o-nas')}
            className="block w-full text-left py-2.5 px-3 text-slate-200 hover:bg-[#263746] rounded text-base font-medium"
          >
            O nás
          </button>
          <button
            onClick={() => scrollTo('sluzby')}
            className="block w-full text-left py-2.5 px-3 text-slate-200 hover:bg-[#263746] rounded text-base font-medium"
          >
            Služby
          </button>
          <button
            onClick={() => scrollTo('kalkulacka')}
            className="w-full text-left py-2.5 px-3 text-[#F07818] hover:bg-[#263746] rounded text-base font-bold flex items-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            <span>Kalkulačka cen</span>
          </button>
          <button
            onClick={() => scrollTo('realizace')}
            className="block w-full text-left py-2.5 px-3 text-slate-200 hover:bg-[#263746] rounded text-base font-medium"
          >
            Realizace
          </button>
          <button
            onClick={() => scrollTo('pripadove-studie')}
            className="block w-full text-left py-2.5 px-3 text-slate-200 hover:bg-[#263746] rounded text-base font-medium"
          >
            Případové studie
          </button>
          <button
            onClick={() => scrollTo('porovnani-materialu')}
            className="block w-full text-left py-2.5 px-3 text-slate-200 hover:bg-[#263746] rounded text-base font-medium"
          >
            Porovnání materiálů
          </button>
          <button
            onClick={() => scrollTo('blog')}
            className="block w-full text-left py-2.5 px-3 text-slate-200 hover:bg-[#263746] rounded text-base font-medium"
          >
            Blog & Aktuality
          </button>
          <button
            onClick={() => scrollTo('faq')}
            className="block w-full text-left py-2.5 px-3 text-slate-200 hover:bg-[#263746] rounded text-base font-medium"
          >
            Časté dotazy (FAQ)
          </button>
          <button
            onClick={() => scrollTo('postup')}
            className="block w-full text-left py-2.5 px-3 text-slate-200 hover:bg-[#263746] rounded text-base font-medium"
          >
            Jak pracujeme
          </button>
          <button
            onClick={() => scrollTo('reference')}
            className="block w-full text-left py-2.5 px-3 text-slate-200 hover:bg-[#263746] rounded text-base font-medium"
          >
            Reference
          </button>
          <button
            onClick={() => scrollTo('pusobnost')}
            className="block w-full text-left py-2.5 px-3 text-slate-200 hover:bg-[#263746] rounded text-base font-medium"
          >
            Působnost
          </button>
          <button
            onClick={() => scrollTo('kontakt')}
            className="block w-full text-left py-2.5 px-3 text-slate-200 hover:bg-[#263746] rounded text-base font-medium"
          >
            Kontakt
          </button>
          <div className="pt-3 border-t border-[#263746] flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenLeadForm();
              }}
              className="w-full py-3 text-center text-sm font-bold text-white bg-[#C2560A] hover:bg-[#9E4306] rounded flex items-center justify-center gap-2"
            >
              <span>Nezávazně poptat stavbu</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdmin();
              }}
              className="w-full py-2.5 text-center text-xs text-slate-300 hover:text-white bg-[#263746] rounded flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Správa webu a poptávek</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
