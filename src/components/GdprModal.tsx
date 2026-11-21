import React from 'react';
import { X, ShieldCheck, AlertCircle } from 'lucide-react';
import { SiteSettings } from '../types';

interface GdprModalProps {
  settings: SiteSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const GdprModal: React.FC<GdprModalProps> = ({ settings, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 relative border border-slate-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Zavřít okno"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-[#17232D]">
              Informace o zpracování osobních údajů
            </h3>
            <p className="text-xs text-slate-500">
              STAVPARTA · Transparentní zásady ochrany soukromí
            </p>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 mb-6 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Upozornění pro zadavatele:</strong> Následující text představuje technicky
            připravené vzorové znění v souladu s nařízením GDPR. Před ostrým spuštěním webu
            doplňte přesné identifikační údaje správce (IČO, sídlo) a nechte text projít finální
            právní kontrolou.
          </span>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <div>
            <h4 className="font-bold text-[#17232D] text-sm mb-1">1. Správce osobních údajů</h4>
            <p>
              Správcem osobních údajů je stavební parta <strong>{settings.brandName}</strong>{' '}
              působící v Olomouckém kraji. Kontaktní e-mail pro záležitosti ochrany údajů je{' '}
              <a href={`mailto:${settings.email}`} className="text-[#F07818] underline">
                {settings.email}
              </a>
              , telefon: <strong>{settings.phone}</strong>.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#17232D] text-sm mb-1">
              2. Účel zpracování a rozsah údajů
            </h4>
            <p>
              Shromažďujeme a zpracováváme pouze údaje nezbytné pro vyřízení vaší poptávky na
              stavební a rekonstrukční práce:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-1 text-slate-600">
              <li>Jméno a příjmení (pro identifikaci poptávajícího)</li>
              <li>E-mailová adresa (pro zaslání položkového rozpočtu a kalkulace)</li>
              <li>Telefonní číslo (pro operativní domluvu termínu osobního zaměření)</li>
              <li>Místo stavby (obec/město v Olomouckém kraji pro ověření dojezdové vzdálenosti)</li>
              <li>Popis požadavku a přiložené fotografie stávajícího stavu</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#17232D] text-sm mb-1">3. Právní základ zpracování</h4>
            <p>
              Právním základem pro zpracování těchto údajů je <strong>čl. 6 odst. 1 písm. b) GDPR</strong> –
              provedení opatření přijatých před uzavřením smlouvy na žádost subjektu údajů
              (poptávkový a nabídkový proces).
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#17232D] text-sm mb-1">4. Doba uchování údajů</h4>
            <p>
              Poptávky a kontaktní údaje uchováváme po dobu nezbytnou k vyřízení poptávky, maximálně
              však <strong>12 měsíců</strong> od odeslání, pokud nedojde k uzavření smlouvy o dílo.
              V případě realizace zakázky jsou fakturační a smluvní údaje uchovávány po dobu
              stanovenou daňovými a účetními zákony ČR.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#17232D] text-sm mb-1">
              5. Zabezpečení a příjemci údajů
            </h4>
            <p>
              Osobní údaje nejsou předávány žádným třetím stranám pro marketingové účely ani do
              zemí mimo Evropskou unii. Přístup k nim mají pouze oprávnění řemeslníci přímo
              zodpovědní za kalkulaci a realizaci zakázky. Databáze je zabezpečena a přístupná pouze
              přes autorizovanou administraci.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#17232D] text-sm mb-1">6. Vaše práva</h4>
            <p>
              Jako subjekt údajů máte právo na přístup ke svým osobním údajům, jejich opravu,
              výmaz (právo být zapomenut), omezení zpracování a podání stížnosti u Úřadu pro
              ochranu osobních údajů (www.uoou.cz). Kdykoliv nás můžete kontaktovat na{' '}
              <a href={`mailto:${settings.email}`} className="text-[#F07818] underline">
                {settings.email}
              </a>
              .
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#17232D] text-sm mb-1">7. Soubory cookies</h4>
            <p>
              Tento web využívá pouze nezbytné technické úložiště pro bezpečný běh administrace a
              uložení stavu formuláře. Nevyužíváme žádné agresivní sledovací ani profilovací cookies
              třetích stran.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#17232D] hover:bg-[#263746] text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            Rozumím a zavřít
          </button>
        </div>
      </div>
    </div>
  );
};
