import React, { useRef } from 'react';
import { X, FileText, AlertCircle, Scale } from 'lucide-react';
import { SiteSettings } from '../types';
import { useModalAccessibility } from '../hooks/useModalAccessibility';

interface TermsModalProps {
  settings: SiteSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ settings, isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useModalAccessibility({
    isOpen,
    onClose,
    containerRef: dialogRef,
  });

  if (!isOpen) return null;

  const warrantyLabel =
    settings.warrantyMonths && settings.warrantyMonths > 0
      ? `${settings.warrantyMonths} měsíců (dle nastavení zhotovitele)`
      : '[DOPLNÍ MAJITEL: např. 24 nebo 36 měsíců dle občanského zákoníku a smlouvy o dílo]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-modal-title"
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 relative border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Zavřít okno obchodních podmínek"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-orange-100 text-[#B84F00] flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h3 id="terms-modal-title" className="text-xl font-extrabold text-[#17232D]">
              Obchodní a záruční podmínky
            </h3>
            <p className="text-xs text-slate-500">
              {settings.brandName || 'STAVPARTA'} · Vzorová šablona před finálním schválením
            </p>
          </div>
        </div>

        {/* Legal Template Disclaimer */}
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 mb-6 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Vzorová šablona pro majitele:</strong> Tento dokument slouží jako připravená
            základní osnova obchodních a záručních podmínek. Před ostrým spuštěním webu doplňte
            označená místa podle reálných smluvních podmínek vaší firmy a nechte text zkontrolovat
            právníkem.
          </span>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <div>
            <h4 className="font-bold text-[#17232D] text-sm mb-1">
              1. Identifikace zhotovitele
            </h4>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <div>
                <strong>Obchodní název / značka:</strong>{' '}
                {settings.companyName || settings.brandName}
              </div>
              <div>
                <strong>Sídlo / zázemí:</strong> {settings.addressNotice}
              </div>
              <div>
                <strong>IČO:</strong> {settings.ico.trim() || '[DOPLNÍ MAJITEL]'} ·{' '}
                <strong>DIČ / DPH:</strong>{' '}
                {settings.dic.trim() || '[DOPLNÍ MAJITEL]'}{' '}
                ({settings.isVatPayer ? 'Plátce DPH' : 'Neplátce DPH / neuvedeno'})
              </div>
              {settings.certificationNumber?.trim() && (
                <div>
                  <strong>Oprávnění / číslo osvědčení:</strong>{' '}
                  {settings.certificationNumber.trim()}
                </div>
              )}
              <div>
                <strong>E-mail:</strong> {settings.email}
                {settings.phone.trim() ? ` · Telefon: ${settings.phone}` : ''}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-[#17232D] text-sm mb-1">
              2. Nezávazná poptávka a cenová nabídka
            </h4>
            <p>
              Odeslání poptávkového formuláře nebo výpočet v orientační kalkulačce na webu nepředstavuje
              závaznou objednávku ani uzavření smlouvy o dílo. Závazný rozsah prací, cena a termín
              realizace jsou vždy stanoveny až na základě osobního zaměření na místě a oboustranně
              odsouhlasené písemné nabídky či smlouvy o dílo.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#17232D] text-sm mb-1">
              3. Rozsah poskytovaných řemesel
            </h4>
            <p>
              Zhotovitel zajišťuje stavební, zednické, sádrokartonářské, obkladačské a dokončovací
              práce dle konkrétní objednávky. Zhotovitel v současné době neprovádí elektroinstalace
              ani revize elektrických zařízení – je-li součástí záměru zásah do elektroinstalace,
              zajišťuje si jej objednatel samostatně prostřednictvím oprávněného elektrikáře a
              revizního technika (není-li písemně ujednáno jinak).
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#17232D] text-sm mb-1">
              4. Platební podmínky a zálohy
            </h4>
            <p>
              Konkrétní splátkový kalendář (např. záloha na materiál před zahájením prací, průběžná
              fakturace a doplatek po předání díla) se vždy sjednává individuálně v písemné smlouvě o
              dílo. <em>[DOPLNÍ MAJITEL: konkrétní výše záloh, splatnost faktur a případné storno podmínky]</em>.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#17232D] text-sm mb-1">
              5. Předání díla, záruka a reklamace
            </h4>
            <p>
              Po dokončení prací proběhne společná kontrola díla a podpis předávacího protokolu.
              Délka záruční doby na provedené dílo: <strong>{warrantyLabel}</strong>. Záruka se
              nevztahuje na běžné opotřebení, mechanické poškození uživatelem ani na vady vzniklé
              nedodržením pokynů pro údržbu (např. agresivní chemické čističe na spáry a baterie).
              Reklamace je nutné uplatnit písemně bez zbytečného odkladu na e-mail{' '}
              <a href={`mailto:${settings.email}`} className="text-[#B84F00] font-semibold underline">
                {settings.email}
              </a>
              .
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#17232D] text-sm mb-1">
              6. Mimosoudní řešení sporů (spotřebitelé)
            </h4>
            <p>
              Pokud je objednatel spotřebitelem, má právo na mimosoudní řešení spotřebitelského sporu
              z uzavřené smlouvy u České obchodní inspekce (www.coi.cz) v souladu se zákonem č.
              634/1992 Sb., o ochraně spotřebitele.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>Vzorový dokument STAVPARTA</span>
          </span>
          <button
            type="button"
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
