export interface CityPageConfig {
  slug: string;
  cityName: string;
  locative: string;
  districtLabel: string;
  isHeadquarters?: boolean;
  metaTitle: string;
  metaDescription: string;
  headline: string;
  intro: string;
  travelSummary: string;
  typicalScope: string[];
  ownerTemplateNote: string;
}

export const CITY_PAGES: CityPageConfig[] = [
  {
    slug: 'zabreh-na-morave',
    cityName: 'Zábřeh na Moravě',
    locative: 'v Zábřehu na Moravě',
    districtLabel: 'Centrála & sídlo stavební party',
    isHeadquarters: true,
    metaTitle: 'Rekonstrukce bytů a jader Zábřeh na Moravě | STAVPARTA',
    metaDescription:
      'Stavební parta STAVPARTA se sídlem přímo v Zábřehu na Moravě. Renovace bytových jader, koupelen, zednické práce, sádrokartony a obklady bez příplatku za dopravu.',
    headline: 'Rekonstrukce bytů, domů a bytových jader v Zábřehu na Moravě',
    intro:
      'Zábřeh na Moravě je naší domovskou základnou a sídlem zázemí party STAVPARTA. Na zaměření po městě a blízkém okolí (Postřelmov, Leština, Rájec, Chromeč) vyrážíme flexibilně bez příplatků za výjezd.',
    travelSummary: 'Místní výjezd na obhlídku a zaměření zdarma (centrála Zábřeh na Moravě).',
    typicalScope: [
      'Renovace umakartových i zděných bytových jader na sídlištích v Zábřehu',
      'Kompletní rekonstrukce bytů i starších rodinných domů na Zábřežsku',
      'Zednické práce, vyrovnání podlah, sádrokartony, obklady a dlažby',
      'Čistá práce a každodenní úklid společných prostor domu v souladu s řádem SVJ',
    ],
    ownerTemplateNote:
      '[ŠABLONA K DOPLNĚNÍ MAJITELEM: Zde lze doplnit konkrétní dokončené ulice nebo místní reference v Zábřehu na Moravě.]',
  },
  {
    slug: 'olomouc',
    cityName: 'Olomouc',
    locative: 'v Olomouci',
    districtLabel: 'Olomouc a přilehlé obce',
    metaTitle: 'Rekonstrukce bytů a koupelen Olomouc | STAVPARTA',
    metaDescription:
      'Rekonstrukce bytů, koupelen a bytových jader v Olomouci. Stavební parta ze Zábřehu na Moravě – zednictví, sádrokartony a obkladačské práce na klíč.',
    headline: 'Rekonstrukce bytů a koupelen v Olomouci a okolí',
    intro:
      'Pravidelně realizujeme stavební zakázky v Olomouci (Nová Ulice, Neředín, Lazce, Slavonín, Hodolany i okolní obce). Zajišťujeme návaznost všech stavebních profesí pod jedním vedením.',
    travelSummary: 'Osobní zaměření stavby a zpracování položkové nabídky zdarma.',
    typicalScope: [
      'Přestavby bytových jader v panelových domech po celé Olomouci',
      'Sádrokartonové podhledy, akustické příčky a vyrovnání podlah v bytech',
      'Velkoformátové koupelnové obklady, dlažby a dvoukomponentní hydroizolace',
      'Koordinace odvozu suti a dovozu materiálu bez starostí pro investora',
    ],
    ownerTemplateNote:
      '[ŠABLONA K DOPLNĚNÍ MAJITELEM: Doplňte orientační termíny dostupnosti a vybrané olomoucké reference po spuštění.]',
  },
  {
    slug: 'prostejov',
    cityName: 'Prostějov',
    locative: 'v Prostějově',
    districtLabel: 'Prostějovsko a Haná',
    metaTitle: 'Rekonstrukce bytů a zednické práce Prostějov | STAVPARTA',
    metaDescription:
      'Renovace bytových jader, koupelen, zednické práce a sádrokartony v Prostějově. Sehraná parta STAVPARTA s transparentním rozpočtem a smlouvou o dílo.',
    headline: 'Stavební práce a rekonstrukce interiérů v Prostějově',
    intro:
      'V Prostějově a přilehlých obcích pomáháme majitelům bytů a rodinných domů s kompletní proměnou interiérů, výměnou jader i precizním obkládáním a sádrokartonářskými pracemi.',
    travelSummary: 'Nezávazná obhlídka a zaměření v Prostějově po domluvě zdarma.',
    typicalScope: [
      'Kompletní rekonstrukce koupelen, WC a rozvodů vody / odpadů',
      'Zdění příček z pórobetonu Ytong, jádrové a štukové omítky',
      'Podlahové nivelace a pokládka lepeného i click vinylu',
      'Písemná smlouva o dílo a etapové fakturování bez placení celé částky předem',
    ],
    ownerTemplateNote:
      '[ŠABLONA K DOPLNĚNÍ MAJITELEM: Zde lze vložit lokální zkušenosti nebo vybrané zakázky na Prostějovsku.]',
  },
  {
    slug: 'prerov',
    cityName: 'Přerov',
    locative: 'v Přerově',
    districtLabel: 'Přerovsko',
    metaTitle: 'Rekonstrukce bytových jader a bytů Přerov | STAVPARTA',
    metaDescription:
      'Stavební a obkladačské práce v Přerově. Přestavby bytových jader, walk-in sprchové kouty, sádrokartony a rekonstrukce bytů s jasným rozpočtem.',
    headline: 'Rekonstrukce bytů a koupelen v Přerově',
    intro:
      'Na Přerovsku realizujeme kompletní rekonstrukce bytových jader, koupelen i celých bytových jednotek. Pracujeme podle jasného harmonogramu s průběžnou fotodokumentací zakrytých konstrukcí.',
    travelSummary: 'Zaměření a položkový rozpočet na Přerovsku bez závazků.',
    typicalScope: [
      'Vybourání umakartu a vyzdění nového jádra včetně hydroizolace',
      'Sprchové kouty bez vaničky se zapuštěným lineárním žlabem',
      'Sádrokartonové stropy s bodovým podsvětlením a zateplením podkroví',
      'Ekologická likvidace stavební suti a ochrana společných chodeb',
    ],
    ownerTemplateNote:
      '[ŠABLONA K DOPLNĚNÍ MAJITELEM: Místní poznámky a reference v Přerově doplní majitel v rámci úprav.]',
  },
  {
    slug: 'sumperk',
    cityName: 'Šumperk',
    locative: 'v Šumperku',
    districtLabel: 'Šumpersko (přímé sousedství centrály)',
    metaTitle: 'Rekonstrukce bytů, domů a zednictví Šumperk | STAVPARTA',
    metaDescription:
      'Stavební parta STAVPARTA v Šumperku – pouhých 15 minut z naší základny v Zábřehu. Rekonstrukce bytových jader, rodinných domů, sádrokartony a fasády.',
    headline: 'Stavební práce a rekonstrukce v Šumperku a okolí',
    intro:
      'Šumperk a Šumpersko leží v bezprostředním sousedství naší centrály v Zábřehu na Moravě. Díky krátké dojezdové vzdálenosti probíhá každodenní realizace zakázek plynule a operativně.',
    travelSummary: 'Krátká dojezdová vzdálenost ze Zábřehu na Moravě, zaměření zdarma.',
    typicalScope: [
      'Celkové rekonstrukce rodinných domů i starších zděných bytů',
      'Renovace koupelen a bytových jader včetně nových rozvodů vody',
      'Sádrokartonové podhledy, tepelné izolace podkroví a půdní vestavby',
      'Zateplení fasád a opravy venkovního zdiva',
    ],
    ownerTemplateNote:
      '[ŠABLONA K DOPLNĚNÍ MAJITELEM: Lze doplnit konkrétní reference na Šumpersku a aktuální kapacity.]',
  },
  {
    slug: 'litovel',
    cityName: 'Litovel',
    locative: 'v Litovli',
    districtLabel: 'Litovelsko a Mohelnicko',
    metaTitle: 'Rekonstrukce bytů a koupelen Litovel | STAVPARTA',
    metaDescription:
      'Rekonstrukce bytů, koupelen, zednické práce a obklady v Litovli. Spolehlivá parta řemeslníků ze Zábřehu na Moravě.',
    headline: 'Rekonstrukce koupelen, bytů a zednické práce v Litovli',
    intro:
      'Litovel a okolní obce mezi Mohelnicí a Olomoucí obsluhujeme pravidelně. Zajišťujeme jak menší úpravy koupelen a podlah, tak celkové rekonstrukce bytových jednotek a domů.',
    travelSummary: 'Pravidelný dojezd na Litovelsko, zaměření stavby na místě zdarma.',
    typicalScope: [
      'Renovace bytových jader a koupelen na klíč',
      'Vyrovnání podlah samonivelační stěrkou a pokládka krytin',
      'Omítky, štuky a finální výmalby interiérů',
      'Zednické úpravy a příčky ze sádrokartonu nebo pórobetonu',
    ],
    ownerTemplateNote:
      '[ŠABLONA K DOPLNĚNÍ MAJITELEM: Doplňte dle potřeby konkrétní reference z Litovelska.]',
  },
];

export const findCityPageBySlug = (slug?: string): CityPageConfig | undefined =>
  CITY_PAGES.find((c) => c.slug === slug);
