export type FaqCategory = 'all' | 'prubeh' | 'platby' | 'legislativa';

export interface FaqItem {
  id: string;
  category: Exclude<FaqCategory, 'all'>;
  categoryLabel: string;
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'prubeh',
    categoryLabel: 'Průběh rekonstrukce',
    question: 'Jak dlouho trvá kompletní renovace bytového jádra a jak dlouho rekonstrukce celého bytu?',
    answer:
      'Výměna původního umakartového jádra za zděné (Ytong), včetně nových rozvodů vody a odpadů, hydroizolace, obkladů a kompletace sanity, trvá standardně 10 až 14 pracovních dní. Kompletní rekonstrukce bytu 2+kk nebo 3+1 se zpravidla pohybuje mezi 3 až 6 týdny podle rozsahu vyrovnávání podlah, omítek a technologických pauz pro schnutí.',
  },
  {
    id: 'faq-2',
    category: 'prubeh',
    categoryLabel: 'Průběh rekonstrukce',
    question: 'Musím si shánět zedníka, sádrokartonáře, instalatéra a obkladače zvlášť?',
    answer:
      'Ne. Jsme sehraná stavební parta, která zastřešuje veškerá stavební a dokončovací řemesla – bourací a zednické práce, sádrokartony, vodu a odpady, podlahy, obklady i finální malby. Jednáte s jedním vedoucím party a práce na sebe plynule navazují bez zbytečných prostojů.',
  },
  {
    id: 'faq-3',
    category: 'prubeh',
    categoryLabel: 'Průběh rekonstrukce',
    question: 'Lze v bytě během rekonstrukce koupelny bydlet a jak řešíte úklid?',
    answer:
      'U rozsáhlejších rekonstrukcí celého bytu doporučujeme dočasné přestěhování kvůli prachu a odstávce vody. Pokud rekonstruujeme pouze bytové jádro za plného provozu domácnosti, vždy chráníme podlahy v chodbě zakrývací fólií a filcem, na noc se snažíme zajistit provizorní funkční toaletu a na konci každého pracovního dne po sobě uklidíme jak v bytě, tak na společném schodišti.',
  },
  {
    id: 'faq-4',
    category: 'prubeh',
    categoryLabel: 'Průběh rekonstrukce',
    question: 'Zajišťujete nákup stavebního materiálu i odvoz suti na skládku?',
    answer:
      'Ano. Stavební materiál (tvárnice, lepidla, hydroizolace, stavební chemii, rozvody vody i sádrokartony) nakupujeme, přivezeme a vyneseme na stavbu. Vybouraný umakart, starou suť a obaly průběžně odvážíme k ekologické likvidaci na skládku nebo do sběrného dvora.',
  },
  {
    id: 'faq-5',
    category: 'platby',
    categoryLabel: 'Platby a rozpočet',
    question: 'Jaké jsou platební podmínky? Platí se celá částka předem?',
    answer:
      'Celou částku předem nikdy nevyžadujeme. Platby rozdělujeme do transparentních etap podle smlouvy o dílo: první záloha slouží na nákup materiálu při zahájení prací (obvykle 30–40 %), druhá průběžná platba probíhá po dokončení hrubých konstrukcí a rozvodů, a závěrečný doplatek hradíte až po osobní kontrole a podpisu předávacího protokolu.',
  },
  {
    id: 'faq-6',
    category: 'platby',
    categoryLabel: 'Platby a rozpočet',
    question: 'Je osobní zaměření na místě a vypracování cenové nabídky zdarma?',
    answer:
      'Ano. Po celém Olomouckém kraji (Zábřeh na Moravě, Šumperk, Mohelnice, Olomouc, Prostějov, Přerov a okolí) přijedeme na první prohlídku stavby, vše zaměříme a vypracujeme vám položkový rozpočet zcela zdarma a bez závazků.',
  },
  {
    id: 'faq-7',
    category: 'platby',
    categoryLabel: 'Platby a rozpočet',
    question: 'Může se schválená cena během stavby navýšit o skryté vícepráce?',
    answer:
      'Před zahájením dostáváte detailní položkový rozpočet rozdělený na materiál a práci, který držíme. Pokud se po vybourání starých konstrukcí objeví nečekaná technická závada (např. prasklá litinová stoupačka nebo vlhká zeď pod umakartem), vždy vás okamžitě informujeme, ukážeme rozsah problému a jakoukoliv úpravu ceny nejprve společně písemně odsouhlasíme.',
  },
  {
    id: 'faq-8',
    category: 'legislativa',
    categoryLabel: 'Legislativa, SVJ a záruky',
    question: 'Potřebuji k rekonstrukci bytového jádra nebo bytu stavební povolení?',
    answer:
      'Pokud při renovaci jádra nebo interiéru nezasahujete do nosných stěn, nebouráte otvory v nosném panelu a neměníte vnější vzhled domu, stavební povolení podle platného stavebního zákona zpravidla nepotřebujete. Vždy je ale nutné předem informovat výbor SVJ nebo bytové družstvo a dodržet domovní řád a časy hlučných prací. V případě zásahu do nosných konstrukcí zajistíme posouzení statikem.',
  },
  {
    id: 'faq-9',
    category: 'legislativa',
    categoryLabel: 'Legislativa, SVJ a záruky',
    question: 'Jak probíhá likvidace stavebního odpadu a ochrana společných prostor domu?',
    answer:
      'Veškerou stavební suť ze starého jádra, omítek a obkladů balíme do pevných pytlů a průběžně odvážíme k ekologické likvidaci na schválenou skládku. Společné chodby a výtah chráníme zakrývacím filcem a na konci každého pracovního dne schodiště uklidíme v souladu s domovním řádem SVJ.',
  },
  {
    id: 'faq-10',
    category: 'legislativa',
    categoryLabel: 'Legislativa, SVJ a záruky',
    question: 'Jakou záruku na provedené dílo poskytujete a co obdržím při předání?',
    answer:
      'Zakázky stvrzujeme písemnou smlouvou o dílo s jasným termínem a sjednanou záruční dobou na stavební a řemeslné práce. Při předání obdržíte předávací protokol, fotodokumentaci skrytých rozvodů vody a odpadů před zaklopením a záznam o tlakové zkoušce těsnosti rozvodů.',
  },
];
