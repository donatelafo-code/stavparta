import React, { useState } from 'react';
import {
  X,
  Printer,
  Plus,
  Trash2,
  FileCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Lead, SiteSettings } from '../types';

export interface QuoteItem {
  id: string;
  name: string;
  category: 'prace' | 'material';
  unit: string;
  quantity: number;
  unitPrice: number;
}

interface QuotationGeneratorModalProps {
  lead: Lead;
  settings: SiteSettings;
  onClose: () => void;
  onSaveQuoteToLeadNotes?: (noteText: string) => void;
}

export const QuotationGeneratorModal: React.FC<QuotationGeneratorModalProps> = ({
  lead,
  settings,
  onClose,
  onSaveQuoteToLeadNotes,
}) => {
  const [dates] = useState(() => {
    const now = Date.now();
    return {
      year: new Date(now).getFullYear(),
      todayStr: new Date(now).toLocaleDateString('cs-CZ'),
      validUntilStr: new Date(now + 30 * 86400000).toLocaleDateString('cs-CZ'),
    };
  });
  const quoteNumber = `CN-${lead.id.replace('lead-', '')}-${dates.year}`;
  const todayStr = dates.todayStr;
  const validUntilStr = dates.validUntilStr;

  // Default items tuned to the requested service
  const [items, setItems] = useState<QuoteItem[]>(() => {
    if (lead.serviceId.includes('jadra') || lead.coreDetails) {
      return [
        { id: '1', name: 'Demontáž a vybourání původního jádra, naložení a ekologická likvidace suti', category: 'prace', unit: 'soubor', quantity: 1, unitPrice: 18500 },
        { id: '2', name: 'Vyzdění nových příček z pórobetonu Ytong tl. 100 mm včetně lepidla a perlinky', category: 'prace', unit: 'm²', quantity: 18, unitPrice: 850 },
        { id: '3', name: 'Nové rozvody vody (PPR) a odpadů (HT) pro koupelnu a WC včetně tlakové zkoušky', category: 'prace', unit: 'soubor', quantity: 1, unitPrice: 14500 },
        { id: '4', name: 'Snížený sádrokartonový podhled z impregnovaných desek Rigips RBI včetně tmelení', category: 'prace', unit: 'm²', quantity: 6, unitPrice: 950 },
        { id: '5', name: 'Dvouvrstvá hydroizolační stěrka včetně pružných těsnicích pásek v koutech', category: 'prace', unit: 'm²', quantity: 14, unitPrice: 420 },
        { id: '6', name: 'Pokládka obkladů a dlažeb včetně spárování a silikonování', category: 'prace', unit: 'm²', quantity: 24, unitPrice: 750 },
        { id: '7', name: 'Kompletace sanity: montáž závěsného WC Geberit, sprchového koutu a umyvadla', category: 'prace', unit: 'soubor', quantity: 1, unitPrice: 9500 },
        { id: '8', name: 'Výmalba koupelny a přilehlé chodby, závěrečný úklid a předání díla', category: 'prace', unit: 'soubor', quantity: 1, unitPrice: 4500 },
      ];
    } else {
      return [
        { id: '1', name: 'Přípravné a bourací práce na stavbě, zakrytí podlah', category: 'prace', unit: 'hod', quantity: 16, unitPrice: 450 },
        { id: '2', name: 'Zednické zapravení, jádrové a štukové omítky', category: 'prace', unit: 'm²', quantity: 45, unitPrice: 380 },
        { id: '3', name: 'Sádrokartonové podhledy včetně tmelení a broušení Q3', category: 'prace', unit: 'm²', quantity: 30, unitPrice: 720 },
        { id: '4', name: 'Výmalba interiéru disperzní otěruvzdornou bílou barvou (2x nátěr)', category: 'prace', unit: 'm²', quantity: 110, unitPrice: 85 },
        { id: '5', name: 'Závěrečný úklid a předání díla zákazníkovi', category: 'prace', unit: 'soubor', quantity: 1, unitPrice: 3000 },
      ];
    }
  });

  const [dphRate, setDphRate] = useState<number>(12); // 12% pro bydlení dle zákona ČR, nebo 21% standard
  const [discountPercent] = useState<number>(0);
  const [noteToClient, setNoteToClient] = useState<string>(
    'Cenová nabídka je platná 30 dní od vystavení. Přesný harmonogram zahájení a ukončení prací bude potvrzen ve smlouvě o dílo se zárukou 36 měsíců na provedené dílo.'
  );

  // Financial calculations
  const subtotalWithoutDph = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountAmount = (subtotalWithoutDph * discountPercent) / 100;
  const discountedSubtotal = subtotalWithoutDph - discountAmount;
  const dphAmount = (discountedSubtotal * dphRate) / 100;
  const grandTotal = discountedSubtotal + dphAmount;

  const handleAddItem = () => {
    const newItem: QuoteItem = {
      id: Date.now().toString(),
      name: 'Nová řemeslná položka...',
      category: 'prace',
      unit: 'hod',
      quantity: 1,
      unitPrice: 500,
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = <K extends keyof QuoteItem>(
    id: string,
    field: K,
    value: QuoteItem[K]
  ) => {
    setItems(items.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((it) => it.id !== id));
  };

  const handleSaveToNotes = () => {
    if (onSaveQuoteToLeadNotes) {
      const summaryText =
        `Vystavena položková cenová nabídka č. ${quoteNumber} ze dne ${todayStr}:\n` +
        `• Položek v rozpočtu: ${items.length}\n` +
        `• Základ bez DPH: ${discountedSubtotal.toLocaleString('cs-CZ')} Kč\n` +
        `• DPH (${dphRate} %): ${dphAmount.toLocaleString('cs-CZ')} Kč\n` +
        `• Celková cena s DPH: ${grandTotal.toLocaleString('cs-CZ')} Kč\n` +
        `• Platnost do: ${validUntilStr}`;
      onSaveQuoteToLeadNotes(summaryText);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-70 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col border border-slate-300 overflow-hidden print:m-0 print:p-0 print:border-none print:shadow-none print:max-w-none">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="bg-[#17232D] text-white px-6 py-4 flex items-center justify-between border-b border-[#263746] print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#F07818] flex items-center justify-center text-white font-bold">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight">
                Položková cenová nabídka – {quoteNumber}
              </h3>
              <span className="text-[11px] text-slate-400">
                Zákazník: {lead.name} ({lead.location})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveToNotes}
              className="px-3 py-1.5 bg-[#263746] hover:bg-[#34485a] text-white text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer"
              title="Uložit rekapitulaci do historie poznámek poptávky"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zapsat do poznámek</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#F07818] hover:bg-[#d9660e] text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Tisk / Uložit PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-6 text-slate-800 bg-white print:p-0">
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-6">
            <div>
              <div className="text-2xl font-black text-[#17232D] tracking-tight">
                STAVPARTA
              </div>
              <div className="text-xs text-[#F07818] font-bold mt-0.5">
                Stavební a řemeslné práce • Centrála Zábřeh na Moravě
              </div>
              <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                <div>Telefon: {settings.phone}</div>
                <div>E-mail: {settings.email}</div>
                <div>IČO: {settings.ico}</div>
                <div>DIČ: {settings.dic}</div>
                <div>Sídlo: Zábřeh na Moravě (PSČ 789 01)</div>
                <div>Působnost: {settings.operatingRegion}</div>
              </div>
            </div>

            <div className="sm:text-right bg-slate-50 p-4 rounded-xl border border-slate-200 min-w-[240px]">
              <div className="text-xs font-mono font-bold text-[#F07818]">
                {quoteNumber}
              </div>
              <h2 className="text-lg font-black text-[#17232D] mt-0.5">
                CENOVÁ NABÍDKA
              </h2>
              <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                <div>Datum vystavení: <strong>{todayStr}</strong></div>
                <div>Platnost do: <strong>{validUntilStr}</strong></div>
                <div>Zakázka č.: <strong>#{lead.id}</strong></div>
              </div>
            </div>
          </div>

          {/* Client Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Odběratel (Zákazník)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Jméno:</span>{' '}
                <strong className="text-slate-800">{lead.name}</strong>
              </div>
              <div>
                <span className="text-slate-500">Místo stavby:</span>{' '}
                <strong className="text-slate-800">{lead.location}</strong>
              </div>
              <div>
                <span className="text-slate-500">E-mail:</span>{' '}
                <strong className="text-slate-800">{lead.email}</strong>
              </div>
              {lead.phone && (
                <div>
                  <span className="text-slate-500">Telefon:</span>{' '}
                  <strong className="text-slate-800">{lead.phone}</strong>
                </div>
              )}
              <div className="sm:col-span-2">
                <span className="text-slate-500">Poptávaná služba:</span>{' '}
                <strong className="text-slate-800">{lead.serviceTitle}</strong>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Položkový rozpočet prací a materiálu
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded flex items-center gap-1 cursor-pointer print:hidden"
              >
                <Plus className="w-3.5 h-3.5 text-[#F07818]" />
                <span>Přidat položku</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F1F4F6] text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Popis položky</th>
                    <th className="py-2.5 px-3 w-20 text-center">Jednotka</th>
                    <th className="py-2.5 px-3 w-20 text-right">Množství</th>
                    <th className="py-2.5 px-3 w-28 text-right">Cena / MJ</th>
                    <th className="py-2.5 px-3 w-28 text-right">Celkem bez DPH</th>
                    <th className="py-2.5 px-2 w-8 print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const rowTotal = item.quantity * item.unitPrice;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                            className="w-full font-medium text-slate-800 bg-transparent border-0 focus:ring-1 focus:ring-[#F07818] rounded px-1 -mx-1"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                            className="w-14 text-center text-slate-500 bg-transparent border-0 focus:ring-1 focus:ring-[#F07818] rounded"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-16 text-right font-medium text-slate-800 bg-transparent border-0 focus:ring-1 focus:ring-[#F07818] rounded"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-24 text-right font-mono text-slate-800 bg-transparent border-0 focus:ring-1 focus:ring-[#F07818] rounded"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {rowTotal.toLocaleString('cs-CZ')} Kč
                        </td>
                        <td className="py-2.5 px-2 text-center print:hidden">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Calculation Breakdown & DPH Rate Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-2">
            <div className="sm:col-span-7 space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Poznámka k nabídce a platebním podmínkám
              </div>
              <textarea
                rows={3}
                value={noteToClient}
                onChange={(e) => setNoteToClient(e.target.value)}
                className="w-full text-xs text-slate-600 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-[#F07818]"
              />

              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-[11px] text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Garance ceny a kvality:</strong> Veškeré práce jsou realizovány podle schválených
                  technologických postupů a na základě písemné smlouvy o dílo se zárukou 36 měsíců.
                </span>
              </div>
            </div>

            <div className="sm:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Mezisoučet položek:</span>
                <span className="font-mono font-bold text-slate-800">
                  {subtotalWithoutDph.toLocaleString('cs-CZ')} Kč
                </span>
              </div>

              {/* DPH selector */}
              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600">Sazba DPH:</span>
                  <select
                    value={dphRate}
                    onChange={(e) => setDphRate(parseInt(e.target.value, 10))}
                    className="text-xs font-bold border border-slate-300 rounded px-1.5 py-0.5 bg-white cursor-pointer"
                  >
                    <option value={12}>12 % (Bydlení)</option>
                    <option value={21}>21 % (Standard)</option>
                    <option value={0}>0 % (Přenesená daňová pov.)</option>
                  </select>
                </div>
                <span className="font-mono text-slate-700">
                  {dphAmount.toLocaleString('cs-CZ')} Kč
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-2 border-t-2 border-slate-300">
                <span className="text-xs font-extrabold text-[#17232D]">CELKEM S DPH:</span>
                <span className="text-xl font-black text-[#F07818] font-mono">
                  {grandTotal.toLocaleString('cs-CZ')} Kč
                </span>
              </div>
            </div>
          </div>

          {/* Signature Footer */}
          <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
            <div>
              <div>Vypracoval: <strong>STAVPARTA – koordinace staveb</strong></div>
              <div>V Olomouci dne: {todayStr}</div>
            </div>
            <div className="text-right border-t border-dashed border-slate-400 pt-2 w-48 text-center text-[10px]">
              Razítko a podpis dodavatele
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
