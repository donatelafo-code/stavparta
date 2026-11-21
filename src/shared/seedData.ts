import {
  BlogPost,
  Lead,
  LeadStatus,
  NewsletterSubscriber,
  Project,
  ServiceItem,
  SiteSettings,
  Testimonial,
} from '../types';

const HERO_IMG = '/src/assets/images/hero_craft_construction_1793401118434.jpg';
const BATHROOM_IMG = '/src/assets/images/project_bathroom_tiles_1793401119494.jpg';
const INTERIOR_IMG = '/src/assets/images/project_interior_renovation_1793401119488.jpg';
const FACADE_IMG = '/src/assets/images/project_facade_masonry_1793401119373.jpg';
const APARTMENT_CORE_IMG = '/src/assets/images/service_apartment_core_renovation_1793401869790.jpg';
const DRYWALL_IMG = '/src/assets/images/service_plasterboard_drywall_1793467969873.jpg';
const PAINTING_IMG = '/src/assets/images/service_finishing_painting_1793467970178.jpg';
const BLOG_TRENDS_IMG = '/src/assets/images/blog_trends_interior_1795272927881.jpg';
const BLOG_MAINTENANCE_IMG = '/src/assets/images/blog_maintenance_care_1795272929816.jpg';
const BLOG_MATERIALS_IMG = '/src/assets/images/blog_core_materials_1795272929269.jpg';

export const INITIAL_SETTINGS: SiteSettings = {
  companyName: 'STAVPARTA – Stavební práce a rekonstrukce',
  brandName: 'STAVPARTA',
  slogan: 'Kvalitní práce dělá rozdíl.',
  motto: 'Stavíme, rekonstruujeme a tvoříme kvalitní prostor pro život.',
  phone: '+420 777 000 000',
  email: 'poptavky@stavparta.cz',
  ico: 'Údaj k doplnění před spuštěním',
  dic: 'CZ (k doplnění)',
  headquarters: 'Zábřeh na Moravě',
  operatingRegion: 'Zábřeh na Moravě & Olomoucký kraj',
  primaryLocations: [
    'Zábřeh na Moravě (centrála)',
    'Šumperk',
    'Mohelnice',
    'Olomouc',
    'Litovel',
    'Prostějov',
    'Přerov',
    'Šternberk',
  ],
  workingHours: 'Po–Pá: 7:00 – 17:00 (o víkendech dle domluvy na stavbě)',
  addressNotice:
    'Sídlo a zázemí party: Zábřeh na Moravě (PSČ 789 01). Působnost po celém Olomouckém kraji.',
  seoTitle: 'STAVPARTA – Rekonstrukce, bytová jádra a stavební práce | Zábřeh na Moravě',
  seoDescription:
    'Stavební parta se sídlem v Zábřehu na Moravě. Kompletní rekonstrukce bytů a domů, renovace bytových jader na klíč, sádrokartony a obklady v Olomouckém kraji.',
  isPublicLaunchReady: false,
  notifyEmailEnabled: true,
  notifyEmailAddress: '',
};

export const INITIAL_SERVICES: ServiceItem[] = [
  {
    id: 'srv-rekonstrukce-bytu',
    slug: 'rekonstrukce-bytu-a-domu',
    title: 'Rekonstrukce bytů a domů',
    category: 'Komplexní stavby',
    shortDescription:
      'Celkové i dílčí rekonstrukce interiérů na klíč. Od vybourání a statiky po čisté finální detaily.',
    fullDescription:
      'Zajišťujeme kompletní stavební proměny bytů a rodinných domů pod jednou střechou. Zkoordinujeme vybourání, nové příčky, omítky, rozvody vody a odpadů, sádrokartony i špičkové obklady a podlahy. Šetříte čas, peníze a starosti s hledáním různých řemeslníků.',
    iconName: 'Home',
    order: 1,
    isActive: true,
    image: INTERIOR_IMG,
    features: [
      'Komplexní realizace pod jedním koordinátorem stavby',
      'Koordinace všech stavebních řemesel bez prostojů a čekání',
      'Položkový rozpočet rozpadnutý na materiál a práci',
      'Průběžná fotodokumentace skrytých rozvodů a konstrukcí',
      'Každodenní úklid a odvoz suti na skládku',
      'Záruka na celé dílo a písemná smlouva',
    ],
    workflowSteps: [
      {
        step: '01',
        title: 'Osobní prohlídka a zaměření',
        description:
          'Bezplatná návštěva objektu v Olomouckém kraji, posouzení stěn, podlah a konzultace požadavků.',
      },
      {
        step: '02',
        title: 'Položkový rozpočet a smlouva',
        description: 'Transparentní kalkulace bez skrytých položek a závazný harmonogram dokončení.',
      },
      {
        step: '03',
        title: 'Hrubé a stavební práce',
        description: 'Bourání, odvoz odpadu, nové příčky, vodoinstalace, omítky a sádrokartony.',
      },
      {
        step: '04',
        title: 'Finální úpravy a čisté předání',
        description: 'Obklady, stěrky, podlahy, výmalba, kompletace sanity a předání s protokolem.',
      },
    ],
    faq: [
      {
        question: 'Musím shánět zedníka, obkladače a sádrokartonáře zvlášť?',
        answer:
          'Ne. Všechny stavební profese – zedníky, instalatéry, obkladače i sádrokartonáře – zajišťujeme a koordinujeme jako jeden navazující celek.',
      },
      {
        question: 'Jak dlouho trvá celková rekonstrukce bytu 3+1?',
        answer:
          'Zpravidla 4 až 6 týdnů v závislosti na rozsahu vyrovnání podlah a technologických pauzách omítek.',
      },
      {
        question: 'Zajistíte i odvoz a likvidaci starého vybavení?',
        answer: 'Ano, součástí každé zakázky je ekologická likvidace vybouraného materiálu i suti.',
      },
    ],
    relatedServiceIds: ['srv-bytova-jadra', 'srv-obklady-dlazby', 'srv-sadrokartony'],
    metaTitle: 'Rekonstrukce bytů a domů na klíč Olomouc | STAVPARTA',
    metaDescription:
      'Komplexní rekonstrukce bytů a rodinných domů v Olomouckém kraji. Koordinace všech profesí, pevná cena a čisté řemeslo.',
  },
  {
    id: 'srv-bytova-jadra',
    slug: 'renovace-bytovych-jader',
    title: 'Kompletní renovace bytových jader',
    category: 'Koupelny & jádra',
    shortDescription:
      'Modernizace koupelen a WC v panelových i zděných bytech. Od odstranění umakartu po kompletaci sanity.',
    fullDescription:
      'Stará umakartová jádra nahrazujeme pevnými pórobetonovými příčkami s výbornou akustickou izolací. Zajistíme vyzdění a omítky, nové rozvody vody v plastu, spolehlivé hydroizolace sprchových koutů, přesné obklady se zapuštěnou sanitou i finální kompletaci.',
    iconName: 'Grid',
    order: 2,
    isActive: true,
    image: APARTMENT_CORE_IMG,
    features: [
      'Demontáž původního umakartového jádra za 1 den',
      'Ekologická likvidace suti a odvoz do sběrného dvora',
      'Zvětšení prostoru koupelny a úprava dispozice dle přání',
      'Nové rozvody vody a odpadů s odhlučněním',
      'Zateplené a impregnované sádrokartonové podhledy',
      'Kamenické rohy (Jolly hrany 45°) a hydroizolační vana',
      'Montáž walk-in sprch, van, podomítkových WC modulů i nábytku',
    ],
    workflowSteps: [
      {
        step: '01',
        title: 'Zaměření a návrh nové dispozice',
        description:
          'Prověříme stoupačky a navrhneme optimální uspořádání pro pračku, sprchu i umyvadlo.',
      },
      {
        step: '02',
        title: 'Bourání a odvoz starého jádra',
        description: 'Bezpečné odpojení sítí, vybourání umakartu a odvoz suti.',
      },
      {
        step: '03',
        title: 'Výstavba nových příček Ytong',
        description: 'Vyzdění rovných a pevných stěn připravených pro zavěšení skříněk a zařizovacích prvků.',
      },
      {
        step: '04',
        title: 'Nové rozvody vody a odpadů',
        description: 'Výměna potrubí vody a odhlučněných odpadů včetně zkoušky těsnosti.',
      },
      {
        step: '05',
        title: 'Hydroizolace, obklady a dlažby',
        description:
          'Vícevrstvá pružná hydroizolace s těsnicími páskami a přesná pokládka keramiky.',
      },
      {
        step: '06',
        title: 'Kompletace sanity a finální úklid',
        description:
          'Usazení baterií, sprchového koutu, WC, silikonování a předání připravené k užívání.',
      },
    ],
    faq: [
      {
        question: 'Lze během rekonstrukce jádra zvětšit koupelnu?',
        answer:
          'Ano, velmi často posouváme příčku do chodby nebo spojujeme WC s koupelnou pro vytvoření prostornějšího a světlejšího interiéru.',
      },
      {
        question: 'Jak dlouho trvá výměna umakartového jádra?',
        answer:
          'Kompletní renovace jádra na klíč obvykle trvá 10 až 14 pracovních dní podle náročnosti obkladů a schnutí podlah.',
      },
      {
        question: 'Zůstane během prací funkční toaleta?',
        answer:
          'Snažíme se toaletu zachovat funkční po maximální možnou dobu nebo ji na noc provizorně zapojit, pokud v bytě během prací bydlíte.',
      },
    ],
    relatedServiceIds: ['srv-obklady-dlazby', 'srv-sadrokartony', 'srv-zednicke-prace'],
    metaTitle: 'Rekonstrukce bytového jádra Olomouc a Prostějov | STAVPARTA',
    metaDescription:
      'Kompletní renovace bytových jader a koupelen na klíč v Olomouckém kraji. Vybourání umakartu, nové zdivo, voda i obklady.',
  },
  {
    id: 'srv-zednicke-prace',
    slug: 'zednicke-a-stavebni-prace',
    title: 'Zednické a stavební práce',
    category: 'Hrubá stavba & zdivo',
    shortDescription:
      'Zdění příček, jádrové i štukové omítky, betonáže podlah, vyrovnání křivých stěn a sanace.',
    fullDescription:
      'Poctivé zednické řemeslo s důrazem na rovinu a pevnost. Zdění z pórobetonu i cihel, strojní omítky, renovace poškozených stěn ve starších nemovitostech i bourací práce.',
    iconName: 'Layers',
    order: 3,
    isActive: true,
    image: FACADE_IMG,
    features: [
      'Zdění nenosných i nosných stěn (Ytong, Porotherm)',
      'Jádrové a jemné štukové omítky s perfektní rovinou',
      'Opravy popraskaného a vlhkého zdiva a sanační stěrky',
      'Betonáže a vyrovnávání základů podlah',
      'Bourací práce s bezpečným statickým zajištěním',
    ],
    relatedServiceIds: ['srv-rekonstrukce-bytu', 'srv-bytova-jadra'],
    metaTitle: 'Zednické a stavební práce Olomoucko | STAVPARTA',
    metaDescription:
      'Kvalitní zednické práce, jádrové a štukové omítky, příčky a betonáže v Olomouckém kraji.',
  },
  {
    id: 'srv-sadrokartony',
    slug: 'sadrokartony-a-konstrukce',
    title: 'Sádrokartony a konstrukce',
    category: 'Suchá výstavba',
    shortDescription:
      'Montáž sádrokartonových podhledů, akustických předstěn, půdních vestaveb a podkroví.',
    fullDescription:
      'Rychlé, čisté a přesné řešení dispozic. Realizujeme SDK podhledy pro srovnání stropů, protipožární i impregnované desky do koupelen a zateplené podkroví.',
    iconName: 'LayoutGrid',
    order: 4,
    isActive: true,
    image: DRYWALL_IMG,
    features: [
      'Sádrokartonové podhledy se snížením a tepelnou izolací',
      'Akustické příčky s minerální izolací pro tichý domov',
      'Zelené impregnované sádrokartony do koupelen a vlhka',
      'Půdní vestavby se zateplením a parozábranou',
      'Tmelení a bezprašné strojní broušení v kvalitě Q3/Q4',
    ],
    relatedServiceIds: ['srv-zednicke-prace', 'srv-bytova-jadra'],
    metaTitle: 'Sádrokartony a podhledy Olomouc | STAVPARTA',
    metaDescription:
      'Montáž certifikovaných sádrokartonů, podhledů a akustických příček v Olomouci a okolí.',
  },
  {
    id: 'srv-obklady-dlazby',
    slug: 'obklady-dlazby-a-podlahy',
    title: 'Obklady, dlažby a podlahy',
    category: 'Keramika & podlahy',
    shortDescription:
      'Pokládka velkoformátové keramiky, kamenické rohy 45°, samonivelační stěrky a vinylové podlahy.',
    fullDescription:
      'Specializujeme se na čisté kamenické rohy (jolly hrany 45°), hydroizolace sprchových koutů bez vaniček a přesné spárování. Provádíme také samonivelační stěrky a pokládku vinylu.',
    iconName: 'Maximize2',
    order: 5,
    isActive: true,
    image: BATHROOM_IMG,
    features: [
      'Velkoformátové obklady a rektifikovaná dlažba',
      'Kamenické rohy řezané pod úhlem 45° bez plastových lišt',
      'Samonivelační vyrovnávací stěrky pod podlahy',
      'Pokládka vinylových a laminátových podlah včetně soklů',
      'Bezbariérové sprchové kouty se spádovým žlabem',
    ],
    relatedServiceIds: ['srv-bytova-jadra', 'srv-rekonstrukce-bytu'],
    metaTitle: 'Obkladačské práce a pokládka podlah Olomouc | STAVPARTA',
    metaDescription:
      'Profesionální obklady velkoformátovou dlažbou, kamenické rohy a nivelace podlah v Olomouckém kraji.',
  },
  {
    id: 'srv-dokoncovaci-prace',
    slug: 'dokoncovaci-a-montazni-prace',
    title: 'Další dokončovací práce',
    category: 'Interiér & detail',
    shortDescription:
      'Výmalby, usazování obložkových zárubní, lištování, montáž zařizovacích předmětů a úklid.',
    fullDescription:
      'Finální fáze, která dává celému dílu dokonalou tvář. Malířské práce, montáž interiérových dveří, garnýží, sanity a závěrečný generální úklid před předáním.',
    iconName: 'CheckCircle2',
    order: 6,
    isActive: true,
    image: PAINTING_IMG,
    features: [
      'Hladké malování stěn a krycí nátěry',
      'Montáž obložkových zárubní a interiérových dveří',
      'Montáž koupelnového nábytku a doplňků',
      'Čisté předání díla připraveného k okamžitému užívání',
    ],
    relatedServiceIds: ['srv-rekonstrukce-bytu', 'srv-bytova-jadra'],
    metaTitle: 'Dokončovací a montážní práce Olomouc | STAVPARTA',
    metaDescription:
      'Malířské a dokončovací řemeslné práce, usazování obložkových dveří a montáž nábytku.',
  },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    slug: 'kompletni-rekonstrukce-bytoveho-jadra-zabreh',
    title: 'Kompletní renovace panelového bytového jádra',
    description:
      'Vybourání umakartového jádra, vyzdění nových stěn z Ytongu, nové rozvody vody a odpadů, hydroizolace sprchového koutu bez vaničky a velkoformátový obklad.',
    serviceId: 'srv-bytova-jadra',
    serviceName: 'Kompletní renovace bytových jader',
    location: 'Zábřeh na Moravě – sídliště Severovýchod',
    year: '2026',
    isDemo: true,
    status: 'published',
    order: 1,
    photos: [
      {
        id: 'p1-po',
        url: APARTMENT_CORE_IMG,
        stage: 'po',
        stageLabel: 'Po dokončení',
        caption: 'Prostorná moderní koupelna s nikou na pračku a walk-in sprchovým koutem.',
        isCover: true,
      },
      {
        id: 'p1-behem',
        url: HERO_IMG,
        stage: 'behem',
        stageLabel: 'V průběhu prací',
        caption: 'Vyzdění nových příček z Ytongu, instalace vody a odhlučněných odpadů.',
        isCover: false,
      },
      {
        id: 'p1-pred',
        url: INTERIOR_IMG,
        stage: 'pred',
        stageLabel: 'Před zahájením',
        caption: 'Původní opotřebovaný umakart před demolicí a vyklizením.',
        isCover: false,
      },
    ],
    video: {
      url: '/videos/casosber-bytove-jadro-zabreh.mp4',
      posterUrl: APARTMENT_CORE_IMG,
      title: 'Časosběr přestavby panelového jádra (Zábřeh na Moravě)',
      durationLabel: '0:13',
      summary:
        'Průřez pracemi od demontáže umakartového jádra přes zdění příček z Ytongu, rozvody vody a hydroizolaci až po finální předání koupelny.',
      chapters: [
        {
          timeSec: 0,
          label: '0:00 Demolice',
          description: 'Vybourání původního umakartu a odvoz suti první den zakázky.',
        },
        {
          timeSec: 3,
          label: '0:03 Zdění & voda',
          description:
            'Přesné vyzdění příček z tvárnic Ytong, rozvody PPR a odhlučněné odpady HT.',
        },
        {
          timeSec: 6,
          label: '0:06 Hydroizolace & obklady',
          description:
            'Dvouvrstvá tekutá hydroizolace s těsnicími páskami a pokládka velkoformátu.',
        },
        {
          timeSec: 9,
          label: '0:09 Finální předání',
          description:
            'Kompletace walk-in sprchy, závěsného WC a čisté sanitární silikonování.',
        },
      ],
    },
  },
  {
    id: 'proj-3',
    slug: 'modernizace-interieru-bytu-olomouc',
    title: 'Celková rekonstrukce bytu včetně sádrokartonů a podlah',
    description:
      'Vyrovnání stropů sádrokartonovými podhledy, strojní nivelace podlah, pokládka lepeného vinylu a kompletní výmalba.',
    serviceId: 'srv-rekonstrukce-bytu',
    serviceName: 'Rekonstrukce bytů a domů',
    location: 'Olomouc – Nová Ulice',
    year: '2026',
    isDemo: true,
    status: 'published',
    order: 2,
    photos: [
      {
        id: 'p3-po',
        url: INTERIOR_IMG,
        stage: 'po',
        stageLabel: 'Po dokončení',
        caption: 'Světlý moderní obytný prostor s dokonalými rovinami.',
        isCover: true,
      },
    ],
    video: {
      url: '/videos/casosber-interier-olomouc.mp4',
      posterUrl: INTERIOR_IMG,
      title: 'Časosběr kompletní rekonstrukce bytu 3+1 (Olomouc)',
      durationLabel: '0:13',
      summary:
        'Postup řemesel na staveništi od vyklizení původního bytu přes konstrukce SDK podhledů a stěrkování Q4 až po pokládku vinylu.',
      chapters: [
        {
          timeSec: 0,
          label: '0:00 Původní stav',
          description:
            'Vyklizení bytu, odstranění starých krytin a příprava podkladu pro nivelaci.',
        },
        {
          timeSec: 3,
          label: '0:03 Sádrokartony',
          description:
            'Montáž rastru a sádrokartonového podhledu s kročejovou a zvukovou izolací.',
        },
        {
          timeSec: 6,
          label: '0:06 Stěrky & výmalba',
          description:
            'Celoplošné tmelení spár v kvalitě Q4, bezprašné broušení a hloubková penetrace.',
        },
        {
          timeSec: 9,
          label: '0:09 Hotový interiér',
          description:
            'Pokládka lepené vinylové podlahy, usazení obložkových zárubní a čisté předání.',
        },
      ],
    },
  },
  {
    id: 'proj-4',
    slug: 'zatepleni-fasady-prerov',
    title: 'Zateplení fasády a soklu rodinného domu',
    description:
      'Zateplení obvodového pláště šedým polystyrenem tl. 160 mm, osazení parapetů, armovací vrstva a silikonová probarvená omítka se soklem z kamene.',
    serviceId: 'srv-zednicke-prace',
    serviceName: 'Zednické a stavební práce',
    location: 'Přerov – Předmostí',
    year: '2026',
    isDemo: true,
    status: 'published',
    order: 3,
    photos: [
      {
        id: 'p4-po',
        url: FACADE_IMG,
        stage: 'po',
        stageLabel: 'Po dokončení',
        caption: 'Nový reprezentativní vzhled domu s vysokou tepelnou úsporou.',
        isCover: true,
      },
    ],
  },
];

export const INITIAL_TESTIMONIALS: Testimonial[] = [
  {
    id: 'test-1',
    clientName: 'Ing. Martin V. (Ověřený zákazník)',
    location: 'Zábřeh na Moravě',
    projectType: 'Renovace bytového jádra a koupelny',
    text: 'S místní partou přímo ze Zábřehu byla od prvního zaměření skvělá domluva. Co se řeklo, to platilo – jak termín, tak finální rozpočet. Koupelna po vybourání umakartu vypadá úžasně a všechny obklady i spáry sedí na milimetr.',
    rating: 5,
    year: '2026',
    hasConsent: true,
    isPublished: true,
    isDemo: true,
  },
  {
    id: 'test-2',
    clientName: 'Marek a Jana D.',
    location: 'Prostějov',
    projectType: 'Kompletní rekonstrukce bytu 3+1',
    text: 'Oceňujeme především to, že jsme nemuseli řešit žádné vícenáklady. Vše bylo sepsané předem – zedníci, sádrokartonáři i obkladači pracovali jako jeden sehraný tým.',
    rating: 5,
    year: '2026',
    hasConsent: true,
    isPublished: true,
    isDemo: true,
  },
  {
    id: 'test-3',
    clientName: 'Roman V.',
    location: 'Šumperk',
    projectType: 'Oprava soklu a fasády RD',
    text: 'Rychlá a čistá práce. Velmi příjemné vystupování a řemeslná poctivost, která se dnes už moc nevidí. Určitě se na STAVPARTU obrátíme i při rekonstrukci podkroví.',
    rating: 5,
    year: '2026',
    hasConsent: true,
    isPublished: true,
    isDemo: true,
  },
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-101',
    createdAt: '2026-04-10T08:00:00.000Z',
    name: 'Jan Novák',
    email: 'novak.jan.zabreh@example.com',
    phone: '+420 732 111 222',
    serviceId: 'srv-bytova-jadra',
    serviceTitle: 'Kompletní renovace bytových jader',
    location: 'Zábřeh na Moravě – Severovýchod',
    preferredTimeline: 'Duben – Květen',
    description:
      'Poptávám kompletní vybourání umakartového jádra v paneláku, nové zděné stěny z Ytongu, rozvody vody a odpadů, hydroizolaci a obklady s walk-in sprchou.',
    gdprConsent: true,
    status: 'nova',
    coreDetails: {
      propertyType: 'Panelový byt',
      scope: 'Kompletní jádro (koupelna + WC)',
      dispositionChange: 'Ano, chceme posunout příčku o 30 cm do chodby',
      designStatus: 'Mám hrubou představu',
      approximateArea: '5 m²',
    },
    notes: [
      {
        id: 'note-1',
        author: 'Systém',
        text: 'Poptávka přijata z webového formuláře včetně detailů bytového jádra.',
        createdAt: '2026-04-10T08:00:00.000Z',
      },
    ],
  },
];

export const INITIAL_SUBSCRIBERS: NewsletterSubscriber[] = [
  {
    id: 'sub-1',
    email: 'zajemce.zabreh@email.cz',
    createdAt: '2026-04-09T10:00:00.000Z',
    consent: true,
    source: 'footer_newsletter',
  },
];

export const INITIAL_BLOG_POSTS: BlogPost[] = [
  {
    id: 'blog-1',
    slug: 'trendy-v-rekonstrukcich-2026-velkoformat-a-bezprahove-podlahy',
    title:
      'Trendy v rekonstrukcích bytů: Velkoformátové obklady, walk-in sprchy a bezprahové podlahy',
    category: 'Trendy v rekonstrukcích',
    publishedAt: '2026-04-12',
    readTimeMinutes: 5,
    excerpt:
      'Jaké úpravy dávají panelovým i zděným bytům v Olomouckém kraji největší praktickou hodnotu? Přinášíme přehled osvědčených řešení, která šetří prostor i následnou údržbu.',
    contentSections: [
      {
        heading: 'Minimum spár a čisté kamenické rohy',
        text: 'V koupelnách jednoznačně ustupují drobné mozaiky a plastové ukončovací lišty ve prospěch rektifikovaných obkladů formátu 60×120 cm nebo větších desek. Díky broušeným hranám (jolly hrana 45°) působí rohy nik a přizdívek jako jeden celistvý blok kamene a v koupelně zůstává zlomek spár náchylných k usazování vodního kamene.',
      },
      {
        heading: 'Jednolitá podlaha bez prahů napříč celým bytem',
        text: 'Místo dříve běžných přechodových lišt pod každými dveřmi dnes investoři volí souvislou pokládku celoplošně lepeného vinylu LVT nebo kompozitního SPC na dokonale vyrovnanou samonivelační stěrku. Byt se opticky otevře, snáze se udržuje v čistotě a nevznikají nebezpečné výškové schodky.',
      },
      {
        heading: 'Walk-in zóny místo plastových vaniček',
        text: 'Vyzděná koupelna s nerezovým spádovým žlabem v rovině dlažby nabízí bezbariérový vstup a dlouhou životnost bez vrzajících pojezdů nebo zažloutlého akrylátu. Klíčem je ovšem poctivě vyspádovaný potěr a souvislá dvouvrstvá hydroizolační vana s bandážemi v rozích.',
      },
    ],
    practicalTips: [
      'U velkoformátových obkladů nad 60 cm vždy vyžadujte oboustranné nanášení lepidla (tzv. buttering-floating), aby deska v rozích nezůstala dutá.',
      'Před pokládkou jednotné podlahy bez přechodových lišt si nechte laserem přeměřit rovinnost v toleranci max. 2 mm na 2 metry.',
      'Při změně dispozice jádra myslete na šířku dveřního pouzdra nebo zárubně minimálně 70–80 cm kvůli průchodu pračky.',
    ],
    image: BLOG_TRENDS_IMG,
    imageAlt:
      'Moderně zrekonstruovaný obývací pokoj s dubovou vinylovou podlahou a hladkým SDK podhledem',
    relatedServiceId: 'srv-rekonstrukce-bytu',
    author: 'Martin Král, mistr zednických a rekonstrukčních prací',
    isPublished: true,
    featured: true,
  },
  {
    id: 'blog-2',
    slug: 'vyber-materialu-pro-bytove-jadro-ytong-sdk-hydroizolace',
    title:
      'Průvodce výběrem materiálů pro bytové jádro: Ytong vs. sádrokarton a pravidla hydroizolace',
    category: 'Materiály pro bytová jádra',
    publishedAt: '2026-04-05',
    readTimeMinutes: 6,
    excerpt:
      'Stojíte před výměnou umakartového jádra a řešíte, z čeho postavit nové stěny? Porovnali jsme pórobeton, impregnovaný sádrokarton i skladbu spolehlivé hydroizolace.',
    contentSections: [
      {
        heading: 'Pórobetonové tvárnice Ytong (tl. 75–100 mm)',
        text: 'Zděné jádro z přesných pórobetonových tvárnic je v panelových i cihlových domech nejtrvanlivějším standardem. Tvárnice mají nízkou objemovou hmotnost, takže zbytečně nepřetěžují stropní panel, snadno se do nich zařezávají drážky pro rozvody vody a po vyzdění unesou i těžké koupelnové skříňky nebo závěsné umyvadlo bez nutnosti předem plánovat ocelové výztuhy.',
      },
      {
        heading: 'Kdy zvolit modrozelený impregnovaný sádrokarton GKBI / H2',
        text: 'Pokud je prioritou maximální rychlost suché výstavby nebo potřebujete vytvořit předstěnu se zvýšeným akustickým útlumem směrem do ložnice, uplatní se dvojitě opláštěný impregnovaný sádrokarton s minerální vatou. Do míst, kde budou viset horní skříňky nebo madla, však musíme předem vložit OSB výztuhu nebo traverse profil.',
      },
      {
        heading: 'Skladba, která rozhoduje: Hydroizolační nátěr a těsnicí pásky',
        text: 'Ani ten nejdražší obklad sám o sobě vodu neudrží. Vlhkost proniká spárami do lepidla a stěny. Proto vždy aplikujeme hloubkovou penetraci, pružnou jednosložkovou či dvousložkovou polymerní hydroizolaci ve dvou křížových vrstvách a do všech koutů i k prostupům baterií vkládáme pryžové těsnicí pásky a manžety.',
      },
    ],
    practicalTips: [
      'Pro obvodové stěny bytového jádra v paneláku volte tloušťku Ytong 100 mm, pro méně zatížené instalační přizdívky postačí 75 mm.',
      'V oblasti sprchového koutu vytahujte hydroizolační stěrku minimálně do výšky 200 cm a na podlaze přetáhněte přes celou plochu koupelny s vytažením na sokl.',
      'Instalační revizní šachtu za WC opatřete magnetickými skrytými dvířky v úrovni obkladu – udržíte přístup k vodoměrům bez rušivého kovového rámečku.',
    ],
    image: BLOG_MATERIALS_IMG,
    imageAlt:
      'Ukázka materiálů pro bytové jádro: tvárnice Ytong, hydroizolační fólie, zelený sádrokarton a rozvody vody',
    relatedServiceId: 'srv-bytova-jadra',
    author: 'Tomáš Novotný, specialista na bytová jádra STAVPARTA',
    isPublished: true,
    featured: true,
  },
  {
    id: 'blog-3',
    slug: 'udrzba-interieru-epoxidove-spary-silikony-a-vinylove-podlahy',
    title:
      'Tipy pro údržbu interiéru: Jak udržet novou koupelnu, spáry a vinylové podlahy v perfektním stavu',
    category: 'Údržba interiéru',
    publishedAt: '2026-03-26',
    readTimeMinutes: 4,
    excerpt:
      'Nově předaná rekonstrukce si zaslouží správnou péči už od prvního měsíce. Jakým čističům se na velkoformátových obkladech a vinylu obloukem vyhnout?',
    contentSections: [
      {
        heading: 'Péče o spáry a sanitární silikony v koupelně',
        text: 'Cementové spárovací hmoty (i ty s hydrofobní přísadou) nesnášejí agresivní kyselé čističe na bázi silné kyseliny chlorovodíkové nebo chlornanu – ty narušují pigment a vyžírají spáru do hloubky. Na běžný vodní kámen používejte neutrální nebo jemné přípravky na bázi kyseliny citronové a po sprchování skleněnou zástěnu i spáry setřete gumovou stěrkou.',
      },
      {
        heading: 'Epoxidová spára ve sprchovém koutě je sázka na jistotu',
        text: 'Pokud jste při realizaci zvolili dvousložkovou epoxidovou spárovací hmotu v oblasti sprchového koutu, máte z 90 % vyhráno: je nenasákavá, nešpiní se od šamponů ani mýdel a stačí ji omývat teplou vodou s jemným saponátem.',
      },
      {
        heading: 'Jak správně čistit lepený a SPC vinyl',
        text: 'Na vinylové podlahy nikdy nepoužívejte parní mopy s vysokou teplotou ani vosky na dřevo, které na polyuretanové vrstvě tvoří mastné šmouhy. Ideální je vysavač s hubicí na tvrdé podlahy a mírně vlhký mikrovláknový mop s pH neutrálním přípravkem určeným přímo pro LVT/SPC krytiny.',
      },
    ],
    practicalTips: [
      'Na veškeré nohy židlí, stolu i koupelnových skříněk nalepte měkké filcové podložky – prodloužíte tak vzhled vinylu i dlažby o mnoho let.',
      'Pravidelně jednou za 3 měsíce propláchněte sifon lineárního sprchového žlabu a vyčistěte vyjímatelný lapač nečistot.',
      'U černých a kartáčovaných vodovodních baterií nikdy nepoužívejte hrubou stranu houbičky ani tekuté písky – povrch se nenávratně poškrábe.',
    ],
    image: BLOG_MAINTENANCE_IMG,
    imageAlt:
      'Detail čisté moderní koupelny s lineárním žlabem, velkoformátovou dlažbou a přesným silikonovým spojem',
    relatedServiceId: 'srv-obklady-dlazby',
    author: 'Petr Dvořák, mistr obkladač a podlahář',
    isPublished: true,
    featured: false,
  },
  {
    id: 'blog-4',
    slug: 'akusticke-podhledy-a-sadrokartonove-predsteny-v-panelaku',
    title:
      'Akustické sádrokartonové podhledy a předstěny: Jak v paneláku utlumit hluk od sousedů',
    category: 'Trendy v rekonstrukcích',
    publishedAt: '2026-03-14',
    readTimeMinutes: 5,
    excerpt:
      'Křivé stropní panely a hluk z vedlejšího bytu patří mezi nejčastější stížnosti majitelů bytů. Správně navržený sádrokartonový systém vyřeší oba problémy najednou.',
    contentSections: [
      {
        heading: 'Když jde o hluk shora i z boku',
        text: 'Samotná tenká vrstva polystyrenu nalepená na strop akustice nepomůže – naopak může rezonanci ještě zhoršit. Skutečný efekt přináší až pružně zavěšený sádrokartonový podhled na akustických třmenech s výplní z minerální vaty o objemové hmotnosti min. 40 kg/m³ a opláštění vysokohustotními modrými akustickými deskami.',
      },
      {
        heading: 'Odhlučnění stoupaček a stěny u ložnice',
        text: 'Při rekonstrukci jádra standardně balíme svislé kanalizační potrubí do tlumicí vrstvy minerální izolace nebo používáme odhlučněné odpadní trubky HT Plus. Pro stěnu sousedící s ložnicí postačí akustická předstěna o celkové tloušťce pouhých 6 až 7,5 cm na pružně podloženém UW/CW profilu.',
      },
    ],
    practicalTips: [
      'Po celém obvodu sádrokartonové konstrukce vždy trvejte na podlepení profilů pěnovou napojovací páskou – bez ní se zvuk přenáší konstrukcí dál.',
      'Všechny spáry u oken, rohů a napojení na panelové zdivo tmelíme výhradně sklovláknitou nebo papírovou páskou a dokončujeme do akrylového pružného koutu.',
    ],
    image: DRYWALL_IMG,
    imageAlt: 'Montáž přesného sádrokartonového podhledu a akustické předstěny v bytě',
    relatedServiceId: 'srv-sadrokartony',
    author: 'Jan Konečný, sádrokartonář STAVPARTA',
    isPublished: true,
    featured: false,
  },
  {
    id: 'blog-5',
    slug: 'podomitkove-moduly-wc-a-odvodnovaci-zlaby-vyber-do-jadra',
    title:
      'Podomítkové moduly WC a spádové žlaby: Na kterých prvcích v bytovém jádru nikdy nešetřit',
    category: 'Materiály pro bytová jádra',
    publishedAt: '2026-03-02',
    readTimeMinutes: 4,
    excerpt:
      'Vybavení, které po rekonstrukci zazdíte a obložíte keramikou, se mění jen velmi těžko. Podívejte se, podle čeho vybíráme moduly WC, baterie a odtokové žlaby my.',
    contentSections: [
      {
        heading: 'Značkový samonosný WC modul a dostupnost náhradních dílů',
        text: 'Podomítková nádržka je skrytá uvnitř předstěny na desítky let. Osvědčení výrobci (např. Geberit, Alcaplast/Alcadrain nebo Viega) garantují dostupnost napouštěcích a vypouštěcích ventilů po mnoho let dopředu a veškerý servis provedete pohodlně skrze otvor ovládacího tlačítka bez jediného zásahu do obkladu.',
      },
      {
        heading: 'Zápachová uzávěra žlabu a výška potěru v paneláku',
        text: 'V panelovém domě limituje montážní výška odpadní trubky možnost hlubokého zapuštění žlabu do podlahy. Proto předem zaměřujeme napojení do stoupačky – u snížených sprchových žlabů (stavební výška od 54 mm) pak často stačí zvednout úroveň sprchového koutu pouze o jeden nízký plynulý náběh, aniž by se narušila statika stropního panelu.',
      },
    ],
    practicalTips: [
      'Mezi zadní stěnu závěsného WC a keramický obklad vždy vkládáme originální hlukově izolační podložku, která tlumí přenos vibrací do konstrukce.',
      'Před zaklopením instalační šachty vždy vyžadujte tlakovou zkoušku vody i zkoušku těsnosti napojení odpadního kolena.',
    ],
    image: APARTMENT_CORE_IMG,
    imageAlt: 'Rekonstruované panelové bytové jádro s podomítkovým WC modulem a sprchovým koutem',
    relatedServiceId: 'srv-bytova-jadra',
    author: 'Tomáš Novotný, specialista na bytová jádra STAVPARTA',
    isPublished: true,
    featured: false,
  },
  {
    id: 'blog-6',
    slug: 'jak-obnovit-sanitarni-silikon-a-chranit-novou-vymalbu',
    title:
      'Kdy obnovit sanitární silikon v koupelně a jak předejít vlasovým prasklinám ve štuku',
    category: 'Údržba interiéru',
    publishedAt: '2026-02-18',
    readTimeMinutes: 4,
    excerpt:
      'I nejlépe provedená koupelna vyžaduje po několika letech drobnou preventivní údržbu pružných spár. Zjistěte, jak poznat správný čas na přetmelení.',
    contentSections: [
      {
        heading: 'Pružný silikon je spotřební těsnění',
        text: 'V rozích sprchového koutu, kolem vany nebo u kuchyňské desky pracuje silikonová spára každý den při změně teplot a zatížení vodou. Běžná životnost kvalitního protiplísňového sanitárního silikonu je 4 až 7 let. Jakmile spára ztvrdne, začne se odchlipovat od kraje obkladu nebo se pod ní tvoří tmavé mapy, je čas starý tmel pečlivě vyříznout a nanést nový.',
      },
      {
        heading: 'Proč v koutech pokojů vznikají jemné linky a jak je opravit',
        text: 'Panelové domy i cihlové novostavby celoročně pracují v závislosti na teplotě a vlhkosti vzduchu. Spoje různých materiálů (např. zděná příčka Ytong u panelového stropu) proto při rekonstrukci vyztužujeme armovací perlinkou a v koutech tmelíme přetíratelným akrylem. Pokud se po letech objeví jemná vlasová linka, stačí ji vyškrábnout, přetmelit akrylovým tmelem a lokálně přetřít.',
      },
    ],
    practicalTips: [
      'Nový silikon nikdy nenanášejte na zbytky starého tmelu – nový na starém nedrží a voda brzy zateče za obklad.',
      'Při malování koupelny a přilehlé chodby používejte otěruvzdorné paropropustné barvy, které umožňují stěnám přirozeně dýchat.',
    ],
    image: PAINTING_IMG,
    imageAlt: 'Finální malířské a dokončovací úpravy stěn po rekonstrukci interiéru',
    relatedServiceId: 'srv-dokoncovaci-prace',
    author: 'Martin Král, mistr zednických a rekonstrukčních prací',
    isPublished: true,
    featured: false,
  },
];

export const STATUS_LABELS: Record<LeadStatus, { label: string; bg: string; color: string }> = {
  nova: { label: 'Nová', bg: 'bg-amber-100', color: 'text-amber-900 border-amber-300' },
  ceka_na_kontakt: {
    label: 'Čeká na kontaktování',
    bg: 'bg-orange-100',
    color: 'text-orange-900 border-orange-300',
  },
  kontaktovano: {
    label: 'Kontaktováno',
    bg: 'bg-blue-100',
    color: 'text-blue-900 border-blue-300',
  },
  pripravuje_se_nabidka: {
    label: 'Připravuje se nabídka',
    bg: 'bg-indigo-100',
    color: 'text-indigo-900 border-indigo-300',
  },
  nabidka_odeslana: {
    label: 'Nabídka odeslána',
    bg: 'bg-purple-100',
    color: 'text-purple-900 border-purple-300',
  },
  zakazka_potvrzena: {
    label: 'Zakázka potvrzena',
    bg: 'bg-teal-100',
    color: 'text-teal-900 border-teal-300',
  },
  realizace_probiha: {
    label: 'Realizace probíhá',
    bg: 'bg-cyan-100',
    color: 'text-cyan-900 border-cyan-300',
  },
  dokonceno: {
    label: 'Dokončeno',
    bg: 'bg-emerald-100',
    color: 'text-emerald-900 border-emerald-300',
  },
  uzavreno: {
    label: 'Uzavřeno',
    bg: 'bg-slate-100',
    color: 'text-slate-700 border-slate-300',
  },
};
