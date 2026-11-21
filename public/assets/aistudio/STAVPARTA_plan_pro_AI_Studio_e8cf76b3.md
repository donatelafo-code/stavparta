# ÚKOL PRO AI STUDIO: Produkční dokončení projektu STAVPARTA

Jsi senior full-stack inženýr. Pracuješ na existující aplikaci STAVPARTA (React 19 + Vite + Tailwind 4 + Express `server.ts` + Gemini chat). Cíl: z demo prototypu udělat ostrý, bezpečný web, který skutečně doručuje poptávky majiteli.

## PRAVIDLA PRÁCE (platí po celou dobu)
1. Pracuj po FÁZÍCH v pořadí níže. Fázi dokonči celou, než začneš další. Neskákej.
2. Před úpravou souboru ho přečti celý. Neprováděj žádné placeholder ani dummy implementace. Kód musí být kompletní a funkční.
3. Po každé fázi spusť `npm run lint` (tsc) a `npm run build`. Chyby oprav, než pokračuješ.
4. Po každé fázi napiš krátký report: co je hotovo, které soubory se změnily, co zbývá. Pak automaticky pokračuj další fází bez čekání na mou odpověď. Zastav se jen u položek označených **[ČEKÁ NA MĚ]**.
5. Nevymýšlej žádná fakta o firmě (telefon, IČO, DIČ, reference, ceny, právní tvrzení). Vše, co nemáš, ber z konfigurace/administrace a do reportu napiš do seznamu „Potřebné údaje od majitele“.
6. Žádná hesla ani klíče v kódu. Vše přes proměnné prostředí. Aktualizuj `.env.example`.
7. Přísná typová kontrola, žádné `any`, žádné prázdné `catch`. Dodržuj SOLID, DRY, KISS a YAGNI. Texty pro uživatele česky, identifikátory anglicky.
8. Nesahej na řádky ve `vite.config.ts` související s `DISABLE_HMR` (jsou tam kvůli AI Studiu).
9. Pokud si nejsi jistý API knihovny nebo chováním platformy, řekni to v reportu, nehádej.

---

## FÁZE 0: Oprava buildu a základ kvality
- [ ] `npm install` selhává na `ERESOLVE` (`vite@8.3.x` chce `esbuild ^0.27 || ^0.28`, `package.json` má `^0.25`). Oprav verze v `package.json`, aby `npm install` prošel bez `--legacy-peer-deps`.
- [ ] `npm start` spouští `node server.ts`. Uprav tak, aby produkční start fungoval spolehlivě (build serveru do `dist-server/` nebo spouštění přes `tsx`). Uprav i skript `clean`.
- [ ] Přidej ESLint + Prettier, skripty `lint:eslint`, `format`, `test`.
- [ ] Přidej Vitest a základní test infrastrukturu.
- [ ] Přepiš `README.md`: popis architektury, proměnné prostředí, spuštění, build, nasazení. Odstraň výchozí AI Studio banner.
- [ ] `vite.config.ts`: nahraď `__dirname` za `import.meta.dirname` (varování z buildu), HMR řádky nech.

## FÁZE 1: Backend pro poptávky (nejvyšší priorita)
Dnes `db.addLead()` zapisuje do `localStorage` návštěvníka, takže majitel poptávku nikdy neuvidí.
- [ ] Zvol perzistenci a **napiš do reportu, jakou jsi zvolil a proč**. Doporučení: SQLite (`better-sqlite3`) s cestou z `DATA_DIR`, nebo Firestore, pokud AI Studio nabízí Firebase integraci. Výslovně uveď, zda zvolené úložiště přežije restart/redeploy na hostingu, který AI Studio používá, a pokud to nemůžeš ověřit, napiš „neověřeno“.
- [ ] Sdílené schéma validace (Zod) v `src/shared/schemas.ts` pro lead, newsletter, chat payload a import dumpu. Použij ho na klientu i serveru.
- [ ] Endpointy: `POST /api/leads`, `POST /api/newsletter`, `GET/PATCH/DELETE` pro administraci (chráněné ve Fázi 2).
- [ ] Ochrany: `helmet`, `express-rate-limit` (poptávky, newsletter, chat), limit velikosti těla, honeypot a časová kontrola přesunout i na server.
- [ ] Přepoj `LeadFormSection`, `Footer` (newsletter), `ChatWidget` a kalkulačku na API. Při chybě sítě zobraz srozumitelnou češtinu a nic neztrať.
- [ ] Notifikace majiteli o nové poptávce: e-mail přes SMTP (proměnné `SMTP_*`, `NOTIFY_EMAIL`) a volitelně Telegram bot (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`). Automatické potvrzení zákazníkovi. Pokud proměnné chybí, aplikace nepadne, jen zaloguje varování.
- [ ] Migrace: zachovej seed data (služby, realizace, blog) jako JSON a nahraj je při prvním startu.
- [ ] Testy: validace poptávky, rate-limit, uložení a načtení.

## FÁZE 2: Skutečná autentizace administrace
Dnes je heslo v `localStorage`, výchozí heslo je vypsané v UI a heslo `admin` projde vždy.
- [ ] Odstraň z `AdminDashboard.tsx` zadní vrátka `passwordInput === 'admin'`, text „Výchozí heslo: stavparta2026“ i zobrazený `<code>stavparta2026</code>`.
- [ ] Serverové přihlášení: hash hesla (`argon2` nebo `bcrypt`), httpOnly + secure + sameSite cookie se session, ochrana CSRF, rate-limit a zpomalení po neúspěšných pokusech.
- [ ] První administrátor se vytvoří z `ADMIN_INITIAL_PASSWORD` (proměnná prostředí) a vynutí změnu hesla při prvním přihlášení. Žádné výchozí heslo v kódu.
- [ ] Všechny administrační API endpointy vyžadují session. Frontend ztratí přímý přístup k `db` pro citlivá data (poptávky, odběratelé, uživatelé).
- [ ] Odhlášení, vypršení session, změna hesla přes server.
- [ ] Testy: nepřihlášený dostane 401, špatné heslo, zámek po opakovaných pokusech.

## FÁZE 3: Přílohy k poptávce
Dnes se ukládá jen název, velikost a typ souboru, obsah ne.
- [ ] Nahrávání přes `multipart/form-data` (`multer`), limit 5 MB na soubor a max. 5 souborů.
- [ ] Kontrola skutečného typu souboru podle obsahu (magic bytes), ne jen `file.type`. Povolit JPG, PNG, WebP, PDF. Náhodné názvy souborů, žádné cesty od uživatele.
- [ ] Uložení do `UPLOAD_DIR` mimo veřejnou složku. Stahování jen přes autentizovaný endpoint v administraci.
- [ ] Zobrazení příloh v detailu poptávky (náhled obrázků, odkaz na PDF).
- [ ] Smazání příloh při smazání poptávky.

## FÁZE 4: Odstranění demo režimu a hardcodovaných údajů
- [ ] Banner `[DEMO REŽIM]` v `Hero.tsx` a štítky „DEMO – NEPUBLIKOVAT“ (`ProjectsSection`, `CaseStudiesSection`, `TestimonialsSection`) zobrazuj jen při `VITE_DEMO_MODE=true`.
- [ ] Telefon `+420 777 000 000` (v `db.ts`, `index.html` JSON-LD a placeholder ve formuláři) nahraď hodnotami z nastavení firmy. JSON-LD generuj z nastavení, ne ručně v HTML.
- [ ] Administrace: povinná pole nastavení firmy (telefon, e-mail, IČO, DIČ nebo „neplátce DPH“, adresa). Web při chybějících údajích ukáže v administraci upozornění „Web není připraven k ostrému provozu“ se seznamem toho, co chybí.
- [ ] Tlačítko `clearDemoForProduction` přepiš tak, aby smazalo demo realizace a reference na serveru a ověřilo, že nic nezůstalo.
- [ ] **[ČEKÁ NA MĚ]** Vypiš seznam údajů a fotek, které musím dodat (telefon, IČO, DIČ, reference, skutečné realizace, fotky).

## FÁZE 5: Právní a obsahová oprava
- [ ] **DPH v generátoru nabídek:** sazbu 12 % nepovažuj za ověřenou. Sazba bude volitelná (0 % neplátce, 12 %, 21 %), s polem „plátce DPH“ v nastavení firmy a poznámkou „Sazbu DPH a režim přenesené daňové povinnosti potvrďte s daňovým poradcem“. Nic nepředvybírej jako „platné dle legislativy“.
- [ ] **Elektroinstalace a revize:** ve službě i v tištěné nabídce uveď, že revize provádí oprávněný revizní technik. Přidej do nastavení firmy volitelné pole „Oprávnění / číslo osvědčení“ a zobraz ho, pokud je vyplněné. Do reportu napiš, že oprávnění musím doplnit já.
- [ ] **GDPR a cookies:** lokálně hostuj písmo Plus Jakarta Sans (`@fontsource`) místo Google Fonts. Pro mapu (dlaždice CARTO) přidej souhlas před načtením, nebo zobraz statický náhled s tlačítkem „Načíst mapu“. Přidej stránku zásad zpracování údajů se lhůtou uchovávání, právem na výmaz a funkcí smazání údajů na žádost v administraci. Text `GdprModal` označ jako vzor k právní kontrole.
- [ ] Přidej stránky „Obchodní a záruční podmínky“ (šablona k doplnění majitelem, jasně označená).

## FÁZE 6: Zabezpečení chatu a serveru
- [ ] `/api/chat`: rate-limit na IP, denní limit požadavků, validace přes Zod, ořezání délky, ochrana proti prompt injection (systémová instrukce nesmí jít přepsat uživatelským textem, odpověď vždy validuj proti schématu).
- [ ] Model `gemini-4-hydrogen` v `server.ts`: ověř, že je platný pro daný klíč. Název modelu přesuň do proměnné `GEMINI_MODEL` s funkčním výchozím modelem, který skutečně existuje. Pokud ho nejsi schopen ověřit, napiš to do reportu.
- [ ] Logování konverzací (bez osobních údajů navíc) do databáze pro majitele a zobrazení v administraci.
- [ ] Znalostní báze chatu (ceny, doba, podmínky) čti z nastavení v administraci, ne z textu v `buildSystemInstruction`.
- [ ] Bezpečnostní hlavičky, CORS jen na vlastní doménu (`APP_URL`), `trust proxy` podle prostředí.

## FÁZE 7: Výkon
- [ ] Code-splitting: `React.lazy` + `Suspense` pro `AdminDashboard`, `ServiceAreaMapSection` (Leaflet), `QuotationGeneratorModal`, `MaterialComparisonSection`, `CaseStudiesSection`, `BlogSection`; `jszip` načítat dynamickým `import()` až při exportu. Cíl: hlavní JS pod 300 kB gzip (dnes 228 kB gzip při 804 kB minifikovaně, takže hlavně zmenšit úvodní chunk).
- [ ] Obrázky (dnes 12 JPG, celkem zhruba 9,5 MB): převod do WebP/AVIF ve více velikostech, `srcset`/`sizes`, `loading="lazy"` mimo hero, `width`/`height` proti CLS.
- [ ] Videa: `poster`, `preload="none"`, `playsInline`, `muted`.
- [ ] Hash `@/` aliasy a duplicity zkontroluj, nepoužívané importy odstraň.
- [ ] Změř a do reportu napiš velikosti před a po. Nevymýšlej Lighthouse čísla, pokud je nezměříš.

## FÁZE 8: SEO a skutečné URL
- [ ] Přejdi z hash odkazů (`#sluzba/...`, `#blog/...`) na skutečné cesty (`/sluzba/:slug`, `/blog/:slug`) přes `react-router`. Server vrací SPA fallback. Staré hash odkazy přesměruj.
- [ ] Per-page `<title>`, meta description, canonical a Open Graph (react-helmet-async nebo ekvivalent).
- [ ] `og:image` (1200×630), favicon, `theme-color`, manifest, stránka 404.
- [ ] `sitemap.xml` generuj z dat (skutečné URL služeb a článků, správné `lastmod`). `robots.txt` doplň o zákaz `/admin` a `/api`.
- [ ] JSON-LD: `HomeAndConstructionBusiness` z nastavení, `Service` pro každou službu, `FAQPage` tam, kde jsou FAQ, `BreadcrumbList`, `BlogPosting`. `aggregateRating` jen pokud budou reálné recenze.
- [ ] Lokální stránky pro města (Olomouc, Prostějov, Přerov, Šumperk, Litovel) s unikátním obsahem. Obsah nevymýšlej: připrav šablonu a prázdná místa označ k doplnění majitelem.

## FÁZE 9: Přístupnost a kvalita UI
- [ ] Focus trap, Esc a návrat fokusu ve všech modálech (administrace, GDPR, nabídka, chat).
- [ ] Posuvník Před/Po ovladatelný klávesnicí (šipky, `role="slider"`, `aria-valuenow`).
- [ ] Zkontroluj kontrast oranžové `#F07818` na bílé a světle šedé a uprav, kde nesplňuje WCAG AA.
- [ ] Všechny obrázky mají smysluplný `alt`, formuláře mají propojené `label` a `aria-describedby` pro chyby.
- [ ] Respektuj `prefers-reduced-motion` u animací (`motion`).

## FÁZE 10: Architektura a refaktor
- [ ] Rozděl `AdminDashboard.tsx` (1 649 řádků) na samostatné komponenty po záložkách (Poptávky, Služby, Realizace, Reference, Blog, Odběratelé, Nastavení, Záloha) ve složce `src/admin/`.
- [ ] Rozděl `db.ts` (1 071 řádků): seed data do `src/data/*.json`, klientská data vrstva přes API klienta s TanStack Query nebo ekvivalentem.
- [ ] Verze schématu dat a migrace. `restoreFullDump` validuj přes Zod, nepřijímej `any`, před importem udělej automatickou zálohu.
- [ ] Odstraň mrtvý kód a nepoužité exporty.
- [ ] Testy pro kalkulačku (`PriceCalculatorSection`) a výpočet nabídky (základ, sleva, DPH, celkem) vyjmi do čistých funkcí a otestuj hraniční hodnoty.

## FÁZE 11: Rozšíření administrace a obchodní funkce
- [ ] Poptávky: vyhledávání, filtry (stav, služba, město, datum), řazení, přiřazení osoby, termín zaměření, připomínky na follow-up, historie změn stavu.
- [ ] Generátor nabídek: číslování nabídek a zakázek, uložení nabídky k poptávce na serveru, PDF generované na serveru (Playwright nebo `pdf-lib`), odeslání e-mailem s odkazem, online schválení zákazníkem.
- [ ] Ceník upravitelný v administraci. Kalkulačka na webu čte ceny z ceníku (dnes jsou zapečené v kódu), s verzováním ceníku. Uložení konfigurace kalkulačky k poptávce.
- [ ] Realizace: filtr podle typu práce a města, nahrávání fotek Před/Po z administrace.
- [ ] Sběr referencí: po stavu „Dokončeno“ odeslat zákazníkovi e-mail s žádostí o hodnocení. Reference zveřejnit až po schválení majitelem.
- [ ] Tlačítka WhatsApp a `tel:` (jen pokud majitel vyplní číslo).
- [ ] Měření bez cookies (Plausible nebo Umami, přes proměnnou prostředí, vypnuté bez konfigurace): cíle odeslaná poptávka, použití kalkulačky, klik na telefon.
- [ ] Zálohy: automatická denní záloha databáze a příloh, stažení ze administrace (zachovej stávající export JSON/CSV/ZIP).

## FÁZE 12: Nasazení a CI
- [ ] `Dockerfile` (multi-stage), `.dockerignore`, healthcheck endpoint `/healthz`.
- [ ] GitHub Actions: install, lint, typecheck, test, build na každý push.
- [ ] Aktualizuj `.env.example` se všemi novými proměnnými a komentářem u každé: `GEMINI_API_KEY`, `GEMINI_MODEL`, `APP_URL`, `DATA_DIR`, `UPLOAD_DIR`, `SESSION_SECRET`, `ADMIN_INITIAL_PASSWORD`, `SMTP_*`, `NOTIFY_EMAIL`, `TELEGRAM_*`, `VITE_DEMO_MODE`, analytika.
- [ ] Do README přidej kontrolní seznam před spuštěním (údaje firmy, DPH, oprávnění, GDPR, doména, záloha).

---

## ZÁVĚREČNÁ KONTROLA (po poslední fázi)
1. `npm install` (bez `--legacy-peer-deps`), `npm run lint`, `npm test`, `npm run build` musí projít.
2. Ruční scénář: odeslání poptávky z webu → objeví se v administraci → přijde notifikace → vygeneruje se nabídka → export PDF.
3. Ověř, že nepřihlášený uživatel nedostane data z `/api` administrace a že heslo `admin` ani `stavparta2026` nefunguje.
4. Vypiš finální report: co je hotovo, co je neověřeno, seznam údajů k doplnění od majitele a doporučené další kroky.

Začni Fází 0.
