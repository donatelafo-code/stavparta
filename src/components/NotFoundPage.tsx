import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, Home, Search } from 'lucide-react';

interface NotFoundPageProps {
  onOpenLeadForm?: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onOpenLeadForm }) => {
  return (
    <div className="bg-[#F1F4F6] min-h-[70vh] flex items-center justify-center py-16 px-4 sm:px-8">
      <div className="max-w-xl w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#17232D] text-[#F07818] flex items-center justify-center mx-auto">
          <Search className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#B84F00]">
            Chyba 404
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17232D]">
            Tato stránka nebyla nalezena
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Požadovaná adresa buď neexistuje, nebo byla přesunuta. Pokračujte prosím na hlavní
            stránku stavební party STAVPARTA nebo do poptávkového formuláře.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="px-5 py-3 bg-[#17232D] hover:bg-[#263746] text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4 text-[#F07818]" />
            <span>Zpět na hlavní stránku</span>
          </Link>

          <Link
            to="/#sluzby"
            className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-[#17232D] text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 transition-colors"
          >
            <Compass className="w-4 h-4 text-[#B84F00]" />
            <span>Přehled služeb</span>
          </Link>
        </div>

        {onOpenLeadForm && (
          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onOpenLeadForm}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B84F00] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Přejít rovnou do nezávazné poptávky</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
