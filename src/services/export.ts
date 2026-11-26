import {
  BlogPost,
  Lead,
  NewsletterSubscriber,
  Project,
  ServiceItem,
  SiteSettings,
  Testimonial,
} from '../types';
import { fullDatabaseDumpSchema } from '../shared/schemas';
import { api } from './api';

export interface ExportDatabaseSnapshot {
  settings: SiteSettings;
  services: ServiceItem[];
  projects: Project[];
  testimonials: Testimonial[];
  leads: Lead[];
  subscribers?: NewsletterSubscriber[];
  blogPosts: BlogPost[];
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildDumpPayload(snapshot: ExportDatabaseSnapshot) {
  return {
    exportedAt: new Date().toISOString(),
    version: '3.2.0',
    settings: snapshot.settings,
    services: snapshot.services,
    projects: snapshot.projects,
    testimonials: snapshot.testimonials,
    leads: snapshot.leads,
    subscribers: snapshot.subscribers || [],
    blogPosts: snapshot.blogPosts,
  };
}

export function exportDatabaseToJson(snapshot: ExportDatabaseSnapshot): void {
  const dump = buildDumpPayload(snapshot);
  const jsonStr = JSON.stringify(dump, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const date = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `stavparta-databaze-${date}.json`);
}

export function exportLeadsToCsv(leads: Lead[]): void {
  const headers = [
    'ID',
    'Datum vytvoření',
    'Jméno a příjmení',
    'E-mail',
    'Telefon',
    'Poptávaná služba',
    'Lokalita',
    'Termín',
    'Stav',
    'Popis poptávky',
  ];

  const escapeCsv = (val: string | undefined) => {
    if (!val) return '""';
    return `"${val.replace(/"/g, '""')}"`;
  };

  const rows = leads.map((l) => [
    escapeCsv(l.id),
    escapeCsv(new Date(l.createdAt).toLocaleString('cs-CZ')),
    escapeCsv(l.name),
    escapeCsv(l.email),
    escapeCsv(l.phone || ''),
    escapeCsv(l.serviceTitle),
    escapeCsv(l.location),
    escapeCsv(l.preferredTimeline || ''),
    escapeCsv(l.status),
    escapeCsv(l.description),
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const date = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `stavparta-poptavky-${date}.csv`);
}

export async function exportFullBackupZip(snapshot: ExportDatabaseSnapshot): Promise<void> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const dump = buildDumpPayload(snapshot);
  const date = new Date().toISOString().slice(0, 10);

  zip.file(`stavparta-databaze-${date}.json`, JSON.stringify(dump, null, 2));

  const leads = snapshot.leads;
  const headers = [
    'ID',
    'Datum',
    'Jmeno',
    'Email',
    'Telefon',
    'Sluzba',
    'Lokalita',
    'Termin',
    'Stav',
    'Popis',
  ];
  const rows = leads.map((l) => [
    l.id,
    new Date(l.createdAt).toLocaleString('cs-CZ'),
    l.name,
    l.email,
    l.phone || '',
    l.serviceTitle,
    l.location,
    l.preferredTimeline || '',
    l.status,
    `"${(l.description || '').replace(/"/g, '""')}"`,
  ]);
  const csv = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  zip.file(`poptavky-export-${date}.csv`, csv);

  const readme = `# STAVPARTA – Návod na zálohu, obnovu a přenos webu

Datum vytvoření zálohy: ${new Date().toLocaleString('cs-CZ')}

## Obsah tohoto archivu:
1. stavparta-databaze-${date}.json – Kompletní data webu (služby, realizace, reference, nastavení firmy, poptávky, historie poznámek).
2. poptavky-export-${date}.csv – Přehledná tabulka všech poptávek pro import do Microsoft Excel nebo Google Sheets.
3. README.txt – Tento návod.
`;
  zip.file('README-MIGRACE-A-ZALOHA.txt', readme);

  const content = await zip.generateAsync({ type: 'blob' });
  downloadBlob(content, `stavparta-kompletni-zaloha-${date}.zip`);
}

export function importDatabaseFromJson(file: File): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = String(e.target?.result ?? '');
        const raw = JSON.parse(text) as unknown;
        const parsed = fullDatabaseDumpSchema.safeParse(raw);
        if (!parsed.success) {
          reject(new Error('Soubor neodpovídá platnému formátu zálohy STAVPARTA.'));
          return;
        }
        await api.restoreDatabaseDump(parsed.data as Record<string, unknown>);
        resolve(true);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Chyba při čtení souboru.'));
    reader.readAsText(file);
  });
}
