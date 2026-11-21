# STAVPARTA – Webová prezentace a poptávkový systém

Produkční webová aplikace stavební party **STAVPARTA** (sídlo Zábřeh na Moravě, působnost Olomoucký kraj).

## Architektura

- **Frontend:** React 19, Vite 8, Tailwind CSS 4, Lucide Icons, Motion, Leaflet.
- **Backend (`server.ts`, `server/app.ts`):** Node.js + Express (v dev režimu s napojeným Vite middlewarem, v produkci kompilovaný do `dist-server/server.js` a servírující statický build z `dist/`).
- **Databáze (`server/db.ts`):** SQLite přes `better-sqlite3` (WAL mód, cizí klíče `ON`, parametrizované dotazy, jednorázové naplnění výchozích dat při prvním startu).
  - **Důležitá poznámka k provozu v AI Studio / kontejnerech:** Soubor databáze (`DATA_DIR/stavparta.db`) a uploady (`UPLOAD_DIR`) se ukládají na lokální souborový systém kontejneru. Zda úložiště na konkrétním hostingu (např. Google Cloud Run / AI Studio runtime) přežije restart nebo redeploy bez připojeného persistentního disku, je **neověřeno** – pro ostrý provoz doporučujeme připojit trvalý diskový svazek (Persistent Volume / Cloud Storage FUSE) nebo provozovat aplikaci na vlastním VPS s připojeným úložištěm.
- **Notifikace (`server/notifications.ts`):** Volitelný SMTP e-mail (`nodemailer`) majiteli i zákazníkovi a volitelný Telegram bot. Pokud proměnné prostředí chybí, aplikace bezpečně zaloguje varování a poptávku řádně uloží do databáze.
- **AI Asistent (`/api/chat`):** Serverový endpoint využívající `@google/genai` (klíč `GEMINI_API_KEY` zůstává pouze na serveru).

- **Autentizace administrace (`server/db.ts`, `server/app.ts`):** Hesla jsou hashována pomocí `crypto.scrypt` s náhodnou solí (`timingSafeEqual`). Relace jsou uloženy v SQLite tabulce `admin_sessions` a předávány v `HttpOnly` cookie (`SameSite=None; Secure; Partitioned` pro HTTPS / iframe, `SameSite=Lax` na lokálním HTTP). Všechny chráněné endpointy pod `/api/admin/*` vyžadují platnou session a CSRF ověření; po 5 chybných pokusech se účet na 15 minut zamkne.

## Požadavky

- Node.js 22+
- npm 10+

## Proměnné prostředí

Zkopírujte `.env.example` do `.env` a nastavte hodnoty:

- `GEMINI_API_KEY` – API klíč pro Gemini (povinné pro běh AI chatového asistenta).
- `APP_URL` – Veřejná URL nasazené aplikace.
- `PORT` – Port serveru (výchozí `3000`).
- `DATA_DIR` – Adresář pro SQLite databázi `stavparta.db` (výchozí `./data`).
- `UPLOAD_DIR` – Adresář pro nahrané přílohy k poptávkám mimo veřejnou složku (výchozí `./uploads`).
- `ADMIN_INITIAL_PASSWORD` – Inicializační heslo pro vytvoření prvního účtu `admin` při startu (vynutí změnu hesla po prvním přihlášení; pokud není nastaveno, zobrazí administrace jednorázové prvotní nastavení).
- `SESSION_SECRET` – Volitelný HMAC klíč pro dodatečné zabezpečení session tokenů v databázi.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `NOTIFY_EMAIL` – Nastavení odchozí pošty pro upozornění na nové poptávky a automatické potvrzení zákazníkovi.
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` – Volitelná okamžitá notifikace o nové poptávce přes Telegram.

## Příkazy pro vývoj a nasazení

```bash
# Instalace závislostí
npm install

# Spuštění vývojového serveru (Express + Vite na portu 3000)
npm run dev

# Typová kontrola TypeScriptu
npm run lint

# Kontrola kódu přes ESLint
npm run lint:eslint

# Formátování kódu (Prettier)
npm run format

# Spuštění unit testů (Vitest)
npm test

# Produkční build klienta (dist/) a serveru (dist-server/)
npm run build

# Produkční spuštění zkompilovaného serveru
npm start

# Vyčištění build artefaktů
npm run clean
```
