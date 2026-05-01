# PINGR — Telegram Mini App — Täydellinen kehitysprompti

> **Tämä on prompti jonka annat Claude Code -terminaalissa (Opus-malli).**
> **Claude Code rakentaa sovelluksen sinulle — sinun ei tarvitse osata koodata.**
> **Mutta ensin sinun täytyy tehdä muutama valmisteluvaihe (ohjeet alla).**

---

## ════════════════════════════════════════════════════════
## OSIO 1: VALMISTELUT (TEET ITSE ENNEN KUIN AVAAT CLAUDE CODEN)
## ════════════════════════════════════════════════════════

### Mitä tarvitset:
- Tietokone (Mac, Windows tai Linux)
- Telegram-tili (puhelimessasi)
- Nettiyhteys
- Noin 30 minuuttia aikaa valmisteluihin

---

### VAIHE 1: Asenna Claude Code

Claude Code on terminaalityökalu joka antaa Claud AI:n kirjoittaa koodia puolestasi.

**Macilla:**
1. Avaa Terminal-sovellus (hae Spotlightista "Terminal")
2. Asenna Node.js: mene osoitteeseen https://nodejs.org ja lataa "LTS"-versio. Asenna se.
3. Palaa terminaaliin ja kirjoita:
```
npm install -g @anthropic-ai/claude-code
```
4. Kun asennus on valmis, kirjoita:
```
claude
```
5. Se pyytää sinulta Anthropic API -avaimen. Hanki se osoitteesta https://console.anthropic.com

**Windowsilla:**
1. Asenna Node.js: https://nodejs.org (LTS-versio)
2. Avaa Command Prompt tai PowerShell
3. Sama komento: `npm install -g @anthropic-ai/claude-code`

---

### VAIHE 2: Luo Telegram-botti

Tämä on pingr-botti jota kaikki käyttäjät käyttävät. Teet tämän kerran.

1. Avaa Telegram puhelimessasi tai desktopissa
2. Hae käyttäjää **@BotFather** (se on Telegramin virallinen botti bottien luomiseen)
3. Paina **Start**
4. Kirjoita: `/newbot`
5. BotFather kysyy botin nimeä. Kirjoita: `pingr`
6. BotFather kysyy botin käyttäjänimeä. Kirjoita: `pingr_app_bot` (tai jokin muu joka päättyy `_bot` ja on vapaana)
7. BotFather antaa sinulle **tokenin** joka näyttää tältä:
   ```
   7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
8. **KOPIOI TÄMÄ TOKEN JA TALLENNA SE TURVALLISEEN PAIKKAAN.** Tarvitset sitä myöhemmin.
9. Kirjoita BotFatherille vielä: `/setdescription`
   - Valitse bottisi
   - Kirjoita kuvaus: `Networking tool for crypto events. Scan, connect, and follow up in seconds.`
10. Kirjoita: `/setabouttext`
    - Valitse bottisi
    - Kirjoita: `Scan QR → Save contact → Send greeting → Inform team. All in 15 seconds.`

**Tallenna tämä:**
- Bot token: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

### VAIHE 3: Hanki Telegram API credentials

Tätä tarvitaan GramJS:ää varten (se mikä luo ryhmät automaattisesti).

1. Avaa selaimessa: https://my.telegram.org
2. Kirjaudu sisään Telegram-puhelinnumerollasi (saat vahvistuskoodin Telegramiin)
3. Paina **"API development tools"**
4. Täytä lomake:
   - App title: `pingr`
   - Short name: `pingr`
   - Platform: `Web`
   - Description: `Networking tool for crypto events`
5. Paina **"Create application"**
6. Saat kaksi asiaa:
   - **api_id** — numero, esim. `12345678`
   - **api_hash** — pitkä tekstijono, esim. `abcdef1234567890abcdef1234567890`

**KOPIOI MOLEMMAT JA TALLENNA NE.** Tarvitset niitä myöhemmin.

**Tallenna tämä:**
- API ID: `xxxxxxxx`
- API Hash: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

### VAIHE 4: Luo GramJS session string

Tämä on kertaluontoinen kirjautuminen jolla palvelin saa luvan luoda ryhmiä Telegram-tilisi puolesta. Teet tämän KERRAN. Sen jälkeen palvelin käyttää tätä automaattisesti.

**TÄRKEÄÄ:** Suosittelen luomaan erillisen Telegram-tilin tätä varten (uusi puhelinnumero tai Google Voice -numero). Tämä on "pingr-palvelutili" joka luo ryhmät. Näin oma henkilökohtainen tilisi pysyy erillään. Mutta voit myös käyttää omaa tiliäsi jos haluat — se toimii samalla tavalla.

**Tämän vaiheen teemme Claude Coden kanssa myöhemmin** — se ohjaa sinut läpi. Tarvitset kuitenkin valmistelevan Telegram-tilin puhelinnumeron.

**Tallenna tämä:**
- GramJS-tilin puhelinnumero: `+xxx xxxxxxxxxx`

---

### VAIHE 5: Kerää kaikki yhteen

Ennen Claude Coden käynnistämistä sinulla pitäisi olla:

```
✅ Claude Code asennettu ja toimiva
✅ Bot token:          7123456789:AAHxxxxxxxx...
✅ API ID:             12345678
✅ API Hash:           abcdef1234567890...
✅ GramJS-tilin numero: +358 xxx xxx xxxx (tai muu)
```

Kun nämä ovat valmiina, luo projektikansio ja käynnistä Claude Code:

```bash
mkdir pingr
cd pingr
claude
```

Ja liitä alla oleva prompti Claude Codelle.

---

## ════════════════════════════════════════════════════════
## OSIO 2: PROMPTI CLAUDE CODELLE (KOPIOI TÄMÄ KOKONAAN)
## ════════════════════════════════════════════════════════

```
Rakennetaan pingr — Telegram Mini App krypto-eventtien verkostoitumiseen.

TÄRKEÄÄ KONTEKSTIA:
- En ole koodari. Selitä jokainen vaihe selkeästi.
- Kysy minulta aina vahvistus ennen kuin siirryt seuraavaan isoon vaiheeseen.
- Jos tarvitset minulta tietoja (token, API key, jne.), kysy ne selkeästi.
- Testaa jokainen vaihe ennen seuraavaan siirtymistä.
- Jos jokin menee vikaan, selitä mitä tapahtui ja korjaa se.

═══════════════════════════════════════════════════
1. PROJEKTIN YLEISKUVA
═══════════════════════════════════════════════════

pingr on Telegram Mini App joka suoraviivaistaa verkostoitumisprosessin krypto-eventeissä.

Ydinlupaus: Tapaat henkilön eventissä → 15 sekunnissa kontakti on tallennettu, tervehdysviesti lähetetty ja tiimi informoitu.

Yrityksen nimi: Pingr

Sovellus on suunniteltu myöhemmin portattavaksi Flutterilla iOS- ja Android-natiivisovellukseksi. Arkkitehtuurin tulee erottaa bisneslogiikka selkeästi UI:sta.

═══════════════════════════════════════════════════
2. TECH STACK
═══════════════════════════════════════════════════

Frontend (Telegram Mini App):
- React 18+ / TypeScript / Vite
- @telegram-apps/sdk-react (tma.js v3.x — virallinen SDK)
- Zustand (tilanhallinta — helposti portattava Flutteriin)
- React Router (hash-based routing WebView:ssä)
- Tailwind CSS (mobile-first, Telegramin teemavärit)
- Kaikki komponentit custom — ei ulkoisia UI-kirjastoja

Backend:
- Node.js / TypeScript / Hono (kevyt framework)
- grammY (Telegram Bot framework)
- GramJS (MTProto API — ryhmien automaattinen luonti)
- PostgreSQL / Drizzle ORM
- Redis (cache, rate limiting)

Infra:
- Frontend: Vercel (HTTPS pakollinen Telegram Mini Appeille)
- Backend: Railway tai Fly.io
- Tietokanta: Neon (serverless PostgreSQL)

═══════════════════════════════════════════════════
3. PROJEKTIRAKENNE
═══════════════════════════════════════════════════

pingr/
├── apps/
│   ├── web/                          # Telegram Mini App (React)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── App.tsx
│   │   │   │   └── providers.tsx
│   │   │   ├── pages/
│   │   │   │   ├── home/
│   │   │   │   ├── contacts/
│   │   │   │   ├── dashboard/
│   │   │   │   └── onboarding/
│   │   │   ├── features/
│   │   │   │   ├── flow-a/           # QR-skannaus kontaktin luonti
│   │   │   │   ├── flow-b/           # Manuaalinen tallennus
│   │   │   │   ├── contact-detail/
│   │   │   │   ├── settings/
│   │   │   │   └── event-picker/
│   │   │   ├── components/ui/
│   │   │   ├── components/layout/
│   │   │   ├── stores/
│   │   │   ├── lib/
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   └── vite.config.ts
│   │
│   └── bot/                          # Telegram Bot (grammY + GramJS)
│       ├── src/
│       │   ├── bot.ts
│       │   ├── gramjs-client.ts      # GramJS MTProto client
│       │   ├── commands/
│       │   ├── handlers/
│       │   └── services/
│       │       ├── group.service.ts   # Ryhmien luonti (GramJS)
│       │       ├── message.service.ts
│       │       └── reminder.service.ts
│       └── tsconfig.json
│
├── packages/shared/                   # Jaetut tyypit
├── server/                            # API-palvelin (Hono)
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── db/schema.ts
│   │   └── services/
│   └── tsconfig.json
├── package.json
├── pnpm-workspace.yaml
└── turbo.json

═══════════════════════════════════════════════════
4. TIETOKANTASKEEMA
═══════════════════════════════════════════════════

Käytä Drizzle ORM:ää ja PostgreSQL:ää. Taulut:

USERS (käyttäjä = yksi Telegram-tili joka avaa pingrin):
- id: serial primary key
- telegram_id: varchar unique not null (Telegram user ID)
- username: varchar (Telegram @username)
- name: varchar
- company: varchar
- role: varchar
- x_handle: varchar
- blurb: text
- greeting_template: text, default "Hey! Great meeting you at {event}! 👋"
- logo_url: text
- onboarding_completed: boolean default false
- notif_daily_summary: boolean default true
- notif_ping_reminders: boolean default true
- notif_monthly_follow_up: boolean default false
- created_at: timestamp
- updated_at: timestamp

EVENT_WEEKS (eventtiviikko):
- id: serial primary key
- user_id: FK → users
- name: varchar not null (esim. "Token2049 Singapore")
- start_date: varchar (YYYY-MM-DD)
- end_date: varchar
- is_active: boolean default false (vain yksi per käyttäjä)
- log_group_chat_id: varchar (Telegram-ryhmän ID lokikirjaa varten)
- created_at: timestamp

CONTACTS (kontakti jonka käyttäjä on kerännyt):
- id: serial primary key
- user_id: FK → users (kuka keräsi)
- telegram_username: varchar not null (@username)
- telegram_id: varchar
- name: varchar
- company: varchar
- category: varchar not null
- event_week_id: FK → event_weeks (nullable — "General" jos ei eventtiä)
- ping_next_week: boolean default false
- notes: text
- selfie_url: text
- team_chat_created: boolean default false
- group_name: varchar (esim. "Pingr <> Sequoia Capital")
- group_chat_id: varchar
- greeting_sent: boolean default false
- met_date: varchar (YYYY-MM-DD)
- created_at: timestamp
- updated_at: timestamp
- UNIQUE INDEX: (user_id, telegram_username, event_week_id)

TEAM_TEMPLATES (tiimimalli):
- id: serial primary key
- user_id: FK → users
- name: varchar not null (esim. "BD Team")
- members: jsonb (string array, esim. ["@anna", "@mikko"])
- created_at: timestamp

CUSTOM_CATEGORIES (omat kategoriat):
- id: serial primary key
- user_id: FK → users
- name: varchar not null
- color: varchar not null (#hex)

═══════════════════════════════════════════════════
5. TELEGRAM MINI APP -INTEGRAATIO
═══════════════════════════════════════════════════

### SDK:n alustus
Käytä @telegram-apps/sdk-react (tma.js). Alussa:
- Kutsu init() ja miniApp.ready()
- Laajenna viewport: viewport.expand()
- Mount teema: miniApp.mount(), themeParams.mount()
- Tee haptic feedback wrapper (light, medium, success, error, selection) käyttäen window.Telegram.WebApp.HapticFeedback

### Autentikointi (KRIITTINEN)
Jokainen API-kutsu sisältää X-Telegram-Init-Data headerin.
Backendissä validoi HMAC-SHA256:lla:
1. Parse initData (URLSearchParams)
2. Poimi hash, poista se parametreista
3. Lajittele parametrit aakkosjärjestykseen
4. Muodosta data_check_string: "key=value\nkey=value..."
5. secret_key = HMAC-SHA256("WebAppData", bot_token)
6. computed_hash = HMAC-SHA256(secret_key, data_check_string)
7. Vertaa computed_hash === hash

### QR-skannaus (Telegramin natiivi)
Käytä window.Telegram.WebApp.showScanQrPopup():
- Avaa Telegramin oman kameran
- Parsii Telegram QR:stä @username (regex: t.me/([a-zA-Z0-9_]+))
- Palauttaa @username flow A:lle
- Fallback dev-tilassa: manuaalinen syöttö

═══════════════════════════════════════════════════
6. GRAMJS-INTEGRAATIO (RYHMIEN AUTOMAATTINEN LUONTI)
═══════════════════════════════════════════════════

GramJS käyttää Telegramin MTProto API:a, mikä mahdollistaa ryhmien luonnin automaattisesti. Tämä on pingrin ydinominaisuus.

### Miten se toimii:
1. Palvelimella pyörii GramJS-client joka on kirjautunut pingr-palvelutilillä
2. Kun käyttäjä valitsee "Luo tiimikeskustelu" Mini Appissa:
   a. Frontend lähettää pyynnön backendille
   b. Backend kutsuu GramJS-palvelua
   c. GramJS luo Telegram-ryhmän nimellä "[Käyttäjän yritys] <> [Kontaktin yritys]"
   d. GramJS lisää tiimimallin jäsenet ryhmään
   e. GramJS generoi invite-linkin
   f. Backend palauttaa invite-linkin frontendille
   g. Botti lähettää invite-linkin kontaktille tervehdysviestin mukana

### GramJS-clientin setup (apps/bot/src/gramjs-client.ts):
- Käytä npm-pakettia "telegram" (GramJS)
- StringSession tallentaa kirjautumisen — ei tarvitse kirjautua uudelleen
- Kysy session string käyttäjältä (generoidaan kerran setup-vaiheessa)
- Client yhdistää Telegram-palvelimiin MTProto-protokollalla

### Session stringin generointi (kertaluontoinen setup):
Luo erillinen setup-skripti (scripts/generate-session.ts):
1. Pyytää API ID, API Hash ja puhelinnumeron
2. Lähettää vahvistuskoodin Telegramiin
3. Käyttäjä syöttää koodin
4. Tulostaa session stringin joka tallennetaan ympäristömuuttujaksi
TÄRKEÄÄ: Kysy minulta nämä tiedot kun tulet tähän vaiheeseen.

### Ryhmänluontipalvelu (apps/bot/src/services/group.service.ts):
```
createTeamGroup(params):
  1. GramJS: luo ryhmä nimellä "{userCompany} <> {contactCompany}"
  2. GramJS: lisää tiimimallin jäsenet (username-perusteisesti)
  3. GramJS: lisää kontaktin @username
  4. GramJS: aseta käyttäjä admiksi
  5. GramJS: generoi invite-linkki (exportChatInviteLink)
  6. Palauta { groupChatId, inviteLink, groupName }
```

### Jos ryhmänluonti epäonnistuu:
- Jos jäsentä ei voi lisätä (ei löydy, privacy-asetukset) → ohita se, jatka muilla
- Jos koko ryhmänluonti epäonnistuu → tallenna kontakti silti normaalisti, ilmoita käyttäjälle
- Ei koskaan estä kontaktin tallennusta ryhmänluonnin virheen takia

═══════════════════════════════════════════════════
7. NÄKYMÄT JA KÄYTTÄJÄFLOWT
═══════════════════════════════════════════════════

### NAVIGAATIO
3-tabinen bottom tab bar (aina näkyvissä onboardingin jälkeen):
  Tab 1: Home — QR-koodi + Skannaa-nappi
  Tab 2: Contacts — Kontaktilista + haku + filtterit
  Tab 3: Dashboard — Tiimitilastot + kontaktikatsaus

Kaikissa tabeissa oikeassa yläkulmassa ⚙️-ikoni → avaa Settings-modal.
Kaikki modalit: full-screen, slideUp-animaatio (300ms), suljetaan X:llä tai vetämällä alas.

### ONBOARDING (ensimmäinen käyttökerta, 6-vaiheinen stepper)
Jokainen vaihe on skipattavissa.
Vaihe 1: Nimi (tekstikenttä, placeholder "e.g. Alex Thompson")
Vaihe 2: Yritys/projekti (tekstikenttä, placeholder "e.g. Pingr")
Vaihe 3: Blurbi (textarea, selitys "Sent in every greeting message")
Vaihe 4: Rooli (tekstikenttä, vapaaehtoinen)
Vaihe 5: X (Twitter) handle (@-prefix, vapaaehtoinen)
Vaihe 6: Tiimien luonti (tiimin nimi + jäsenten @usernamet, vapaaehtoinen)
Viimeisessä vaiheessa nappi "Get started" → siirtyy Homeen.

### HOME-NÄKYMÄ
Ylhäältä alas:
- Yläpalkki: "pingr" logo (22px, weight 900) vasemmalla + ⚙️ oikealla
- Eventtiviikko-indikaattori (PAINETTAVA → avaa EventPicker bottom sheet):
  Jos aktiivinen: vihreä piste (8px, #22C55E, box-shadow glow) + eventin nimi + ▼
  Jos ei aktiivista: "No active event — tap to set" + ▼
- QR-koodi keskellä (iso, käyttäjän Telegram-linkki tai generoitu QR)
- Käyttäjän nimi + @xHandle
- Iso "Scan QR Code" -nappi (koko levyinen, valkoinen)
- 70px tyhjä tila tab baria varten

### EVENT PICKER (bottom sheet)
- Avautuu Home-näkymän eventtiviikko-indikaattorista
- Tummennettu tausta (50% musta)
- Listaa eventtiviikot (aktiivinen vihreällä korostuksella + ACTIVE-tagi)
- Painaminen aktivoi eventin (deaktivoi muut)
- "Create new event week" → inline-lomake: nimi + alku/loppupäivä → "Create & activate"

### FLOW A — QR-skannaus → Kontaktin luonti (full-screen modal)
Käynnistyy: käyttäjä painaa "Scan QR Code" → TMA natiivi QR-skanneri → @username parsitaan → modal avautuu.

Duplikaattitarkistus: Jos @username on jo kontaktilistalla → keltainen Toast "You've met @username before!" (3.5s). Flow jatkuu normaalisti.

Vaiheiden määrä: 5 (tai 4 jos ei tiimimalleita → ohita vaihe 3).

Vaihe 1 — Kategoria:
  Otsikko "Category", selitys "How would you classify this contact?"
  Chip-painikkeet: Investor, KOL, Marketing, Dev, Founder, BD, Media, Other + omat
  Yksi pakollinen valinta. "Next" aktiivinen vasta kun valittu.

Vaihe 2 — Kontaktin tiedot:
  Otsikko "Contact details", alaotsikko "You can fill these in later too"
  Nimi (vapaaehtoinen), Yritys (vapaaehtoinen), Notes (textarea, vapaaehtoinen)
  "Ping next week" toggle (oletus pois, selitys "Shows up in your ping list the Monday after the event")
  "Next" aina aktiivinen (kaikki vapaaehtoisia).

Vaihe 3 — Tiimikeskustelu (ohitetaan jos ei tiimimalleita):
  "Create group chat?" toggle (oletus pois)
  Jos kyllä:
    Tiimimallivalinta (painikkeet, valittu korostuu sinisellä)
    "Their company" tekstikenttä (esitäytetty yrityksellä/usernamella)
    Esikatselu: "Pingr <> [Toinen yritys]" + jäsenlista
  "Next".

Vaihe 4 — Selfie:
  Etukameran placeholder (3:4, dashed border)
  "Take photo" nappi + "Skip" linkki
  Kuvan oton jälkeen: esikatselu + "Retake" / "Use photo"

Vaihe 5 — Tervehdysviesti:
  Esitäytetty viesti muokattavassa textareassa.
  Viestin rakenne:
    {greetingTemplate} ({event} korvattu aktiivisen eventin nimellä)
    {blurbi}
    [Jos tiimichat luotiin: 👥 Join our team group: {ryhmänimi} + invite-linkki]
    "Sent via pingr — try it yourself" (ei poistettavissa)
  Jos tiimichat luotiin, sininen info-box: "📎 Group invite link will be included automatically"
  "Send & Save" -nappi (send-ikoni).

Tallennuksen jälkeen:
  1. Kontakti tallennetaan tietokantaan
  2. Jos tiimichat valittiin → GramJS luo ryhmän (ks. osio 6)
  3. Jos selfie otettu → botti lähettää sen ensin Telegram-chattiin
  4. Botti lähettää tervehdysviestin kontaktin @usernamelle
  5. Yhteenveto menee lokikirjaryhmään (jos eventtiviikko aktiivinen)
  6. SuccessScreen (1.8s, vihreä check-ikoni, scaleIn-animaatio) → modal sulkeutuu

### FLOW B — Manuaalinen tallennus (full-screen modal)
Käynnistyy: Contacts-näkymän +-nappi.
4 vaihetta (tai 3 jos ei tiimimalleita):
  Vaihe 1: @username (tekstikenttä @-prefixillä, pakollinen, onBlur duplikaattitarkistus)
  Vaihe 2: Kategoria (sama kuin Flow A)
  Vaihe 3: Kontaktin tiedot (sama kuin Flow A)
  Vaihe 4: Tiimikeskustelu (sama kuin Flow A, ohitetaan jos ei malleita)
Ei selfieta, ei tervehdysviestiä.
"Save contact" -nappi viimeisessä vaiheessa.

### CONTACTS-NÄKYMÄ
- Yläpalkki: "Contacts" + ➕-nappi (→ Flow B) + ⚙️
- Hakupalkki (hakuikoni + placeholder "Search name, company, @username...")
- Filtterichipit (vaakasuora scroll): All, [jokainen kategoria omalla värillä], 🔔 Ping
- Eventtiviikko-dropdown (select: kaikki eventtiviikot + "General")
- Kontaktilista (VAIN käyttäjän omat, collector === "You"):
    Jokainen rivi: Avatar + Nimi (tai @username) + 🔔/👥 ikonit + Yritys + Kategoria-badge
- Tyhjätila: 📇 + "No contacts yet. Scan a QR code to get started!"
- Kontaktirivin painaminen → ContactDetail-modal

### CONTACT DETAIL (full-screen modal)
Katselu-tila:
  Iso avatar (72px), nimi, @username, yritys, kategoria-badge
  Kentät: Company, Event week, Met on, Notes
  Ping next week toggle (read-only ilman edit-tilaa)
  Team group linkki (jos luotu)
  Napit: "Message privately" (TG-ikoni) + "Open team group" (jos luotu)

Muokkaus-tila (Edit/Done nappi yläpalkissa):
  Muokattavat: Nimi, Yritys, Kategoria (chip-valinta), Notes, Ping next week

### DASHBOARD-NÄKYMÄ
- Eventtiviikko-dropdown (suodattaa kaiken)
- Team activity: Lista kerääjistä (avatar + nimi + kontaktimäärä). Painettava → drill-down.
- Tilastokortti: Iso numero (kokonaiskontaktimäärä, gradient-tausta indigo→violetti)
- By category: Väripalkkikaavio (kategoria, lukumäärä, prosenttipalkki)
- Team groups created: Lista luoduista ryhmistä (ryhmäikoni + nimi + kontaktin nimi)
- Drill-down: Yksittäisen jäsenen kontaktit (avatar + nimi + yritys + badge). Vain katselu.

### SETTINGS (full-screen modal)
Kaksi navigaatiotasoa: päävalikko → alasivu. Back sulkee alaosan, toinen painallus sulkee koko modalin.

Päävalikko (lista rivejä, jokaisessa emoji + otsikko + selitys + chevron-oikea):
  👤 Profile — [nimi tai "Set up"]
  💬 Greeting template — "Customize your greeting"
  📅 Event weeks — "[N] weeks"
  👥 Team templates — "[N] templates"
  🏷️ Categories — "[N] total"
  🔔 Notifications — "Bot alerts"

Profile: Nimi, Yritys, Rooli, X handle -kentät + Blurbi textarea + "Save changes"
Greeting template: Textarea, {event}-muuttuja selitys, live-esikatselu, "Save template"
Event weeks: Lista korteissa (aktiivinen vihreällä + ACTIVE, muut "Activate" linkki) + luontilomake
Team templates: Lista (nimi + jäsenet + poisto-nappi) + lisäyslomake (nimi + @usernamet)
Categories: Oletuskategoriat (badge, ei poistettavissa) + Omat (väripallo + nimi + X-nappi) + lisäyslomake (nimi + 14 värivaihtoehtoa 32x32 pallot)
Notifications: 3 togglea: Daily summary (22 local time), Ping reminders (Mon 12 UTC), Monthly follow-up

Jokainen tallennus: vihreä Toast "Saved!" (2s).

═══════════════════════════════════════════════════
8. TELEGRAM BOT -TOIMINNOT
═══════════════════════════════════════════════════

### Bot-komennot (grammY):
/start — lähettää viestin Mini App -nappeineen
/contacts — listaa 5 viimeisintä kontaktia
/ping — näyttää tämän viikon ping-listan
/week — näyttää aktiivisen eventtiviikon ja vaihtoehdot

### Botin automaattiset toiminnot:
1. Tervehdysviestin lähetys kontaktille (Flow A vaihe 5)
   HUOM: Botti voi lähettää vain käyttäjille jotka ovat aloittaneet keskustelun botin kanssa (/start). Jos ei → tallenna kontakti normaalisti, ilmoita "Greeting couldn't be sent — the contact hasn't started the bot."

2. Selfien lähetys chattiin ennen tervehdysviestiä (Flow A vaihe 4)

3. Ryhmänluonti GramJS:llä (ks. osio 6)

4. Lokikirjaryhmän ylläpito: yhteenveto jokaisesta uudesta kontaktista

5. Ajastetut ilmoitukset (cron):
   - Eventtiviikon aikana klo 22 local: "Tänään X uutta kontaktia."
   - Eventtiviikon jälkeen maanantai 12 UTC: Ping-lista + viikkoyhteenveto
   - Kuukausi eventin jälkeen: "X kontaktia joihin et ole ollut yhteydessä."

═══════════════════════════════════════════════════
9. API-ENDPOINTIT
═══════════════════════════════════════════════════

Kaikki vaativat X-Telegram-Init-Data headerin (validointi ks. osio 5).

POST   /api/auth/init               — Luo/päivitä käyttäjä, palauta profiili
PUT    /api/profile                  — Päivitä profiili
PUT    /api/profile/greeting         — Päivitä tervehdysmalli

GET    /api/contacts                 — Hae kontaktit (?eventWeekId, category, search, pingOnly)
POST   /api/contacts                 — Luo kontakti (+ triggeraa bot-toiminnot)
PUT    /api/contacts/:id             — Päivitä kontakti
GET    /api/contacts/check/:username — Duplikaattitarkistus

GET    /api/events                   — Hae eventtiviikot
POST   /api/events                   — Luo eventtiviikko
PUT    /api/events/:id/activate      — Aktivoi (deaktivoi muut)

GET    /api/teams                    — Hae tiimimallit
POST   /api/teams                    — Luo
DELETE /api/teams/:id                — Poista

GET    /api/categories               — Hae omat kategoriat
POST   /api/categories               — Lisää
DELETE /api/categories/:id           — Poista

GET    /api/dashboard/:eventWeekId   — Dashboard-data (kaikki tiimin kontaktit + tilastot)

═══════════════════════════════════════════════════
10. VISUAALINEN SUUNNITTELU
═══════════════════════════════════════════════════

### Teema ja värit
Käytä Telegramin CSS-muuttujia + omat pingr-värit:
  Tausta: #1A1A1D
  Teksti: #E4E4E7
  Toissijainen: #8B8B8E
  Linkit: #60A5FA
  Onnistuminen: #22C55E
  Varoitus: #FBBF24
  Virhe: #EF4444
  Reunat: rgba(255,255,255,0.08)
  Inputtien tausta: rgba(255,255,255,0.06)

### Kategoriavärrit (kiinteät)
  Investor: #818CF8, KOL: #F472B6, Marketing: #FBBF24, Dev: #4ADE80
  Founder: #C084FC, BD: #60A5FA, Media: #FB923C, Other: #9CA3AF
  Badge: teksti=väri, tausta=väri+"22", border=väri+"44"

### Typografia
  Font: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
  Logo/otsikot: 22-26px, weight 800-900, letterSpacing -0.02em — -0.03em
  Body: 15px
  Labels: 12px, weight 700, uppercase, letterSpacing 0.06em, color #52525B
  Napit: 16px, weight 700

### Komponentit
  Primäärinappi: bg #fff, text #1A1A1D, radius 14px, padding 16px 24px
  Sekundäärinappi: bg rgba(255,255,255,0.06), text #E4E4E7, border 1.5px rgba(255,255,255,0.08)
  Input: radius 12px, bg rgba(255,255,255,0.06), border 1.5px, padding 14px 16px
  Modal: full-screen, slideUp 300ms cubic-bezier(0.4,0,0.2,1)
  Bottom sheet: radius 20px 20px 0 0, drag handle 36x4px
  Toast: fixed top center, backdrop-blur, radius 12px
  Avatar: gradient circle 135°, 8 väriä, charCode-perusteinen
  Stepper: aktiiviset 24px, tulevat 8px, radius 4px, animoitu
  Toggle: iOS-tyylinen, 48x28px, #22C55E kun päällä
  Max-leveys: 430px, keskitetty

### Animaatiot
  slideUp: translateY(100%) → translateY(0), 300ms
  fadeIn: opacity 0 → 1, 200ms
  scaleIn: scale(0.5) → scale(1), 400ms, bouncy cubic-bezier
  Kaikki interaktiot: haptic feedback (selection chip-valinnoissa, success tallennuksessa, light scrollauksessa)

═══════════════════════════════════════════════════
11. VPN-RESILIENT ARKKITEHTUURI
═══════════════════════════════════════════════════

Krypto-eventeissä käytetään paljon VPN:iä. Koko arkkitehtuuri:
1. Kevyet API-kutsut (minimaalinen JSON)
2. Aggressiivinen cache: Telegram DeviceStorage API + stale-while-revalidate
3. Optimistinen UI: SuccessScreen heti, synkkaa taustalla
4. Retry: exponential backoff (1s, 2s, 4s, 8s, max 30s)
5. Offline-indikaattori: selkeä tila yläpalkissa jos yhteys katkeaa
6. QR-skannaus vaatii netin — kaikki muu toimii mahdollisimman pitkään ilman

═══════════════════════════════════════════════════
12. YMPÄRISTÖMUUTTUJAT
═══════════════════════════════════════════════════

Kysy minulta nämä kun tulet tähän vaiheeseen:

# .env (backend)
BOT_TOKEN=           # BotFatherilta saatu token
TELEGRAM_API_ID=     # my.telegram.org → API ID
TELEGRAM_API_HASH=   # my.telegram.org → API Hash
GRAMJS_SESSION=      # GramJS session string (generoidaan setup-skriptillä)
DATABASE_URL=        # PostgreSQL connection string
REDIS_URL=           # Redis connection string
FRONTEND_URL=        # Vercelin antama URL

# .env (frontend)
VITE_API_URL=        # Backendin URL
VITE_BOT_USERNAME=   # Botin @username ilman @-merkkiä

═══════════════════════════════════════════════════
13. TOTEUTUSJÄRJESTYS (NOUDATA TÄTÄ)
═══════════════════════════════════════════════════

Tee nämä vaiheet TÄSSÄ JÄRJESTYKSESSÄ. Jokaisen vaiheen jälkeen kysy minulta vahvistus ennen seuraavaan siirtymistä.

VAIHE 1 — PROJEKTIN PERUSTA:
  Pystytä monorepo (pnpm + Turborepo)
  Konfiguroi Vite + React + TypeScript + Tailwind + TMA SDK
  Konfiguroi backend (Hono + TypeScript)
  Konfiguroi tietokanta (Drizzle + PostgreSQL schema)
  Kysy minulta: BOT_TOKEN, TELEGRAM_API_ID, TELEGRAM_API_HASH
  → Varmista että `pnpm dev` käynnistää sekä frontendin että backendin

VAIHE 2 — TELEGRAM-YHTEYS:
  Tee initData-validointi backendiin
  Tee TMA SDK alustus frontendiin
  Tee /api/auth/init endpoint
  Deployaa frontend Verceliin
  Konfiguroi botti BotFatherissa: aseta Mini App URL
  → Testaa: avaa botti Telegramissa, paina "Launch App", näkyykö tyhjä appi?

VAIHE 3 — ONBOARDING + HOME:
  Onboarding-stepper (6 vaihetta, kaikki skipattavissa)
  Home-näkymä (QR-koodi + Scan-nappi)
  Bottom tab bar (Home, Contacts, Dashboard)
  Profiili-store + /api/profile endpoint
  → Testaa: avaa appi, täytä onboarding, näkyykö Home QR-koodilla?

VAIHE 4 — EVENTTIVIIKON HALLINTA:
  EventPicker bottom sheet
  Event weeks CRUD (/api/events)
  Aktiivisen eventin näyttö Homessa
  → Testaa: luo eventtiviikko, aktivoi se, näkyykö Homessa?

VAIHE 5 — GRAMJS SETUP:
  Luo session string -generointiskripti
  Kysy minulta: puhelinnumero ja vahvistuskoodi
  Testaa GramJS-yhteys
  → Testaa: skripti tulostaa session stringin onnistuneesti

VAIHE 6 — FLOW A (QR-SKANNAUS):
  Skannausoverlay (TMA natiivi showScanQrPopup)
  5-vaiheinen stepper modal
  Kontaktin tallennus (/api/contacts)
  Tervehdysviestin lähetys (grammY bot)
  Tiimikeskustelun luonti (GramJS)
  SuccessScreen
  → Testaa: skannaa QR, täytä flow, tallentuuko kontakti? Tuleeko tervehdysviesti?

VAIHE 7 — CONTACTS + FLOW B:
  Kontaktilista (haku, filtterit, event-dropdown)
  ContactDetail modal (katselu + muokkaus)
  Flow B (manuaalinen tallennus, 4 vaihetta)
  Duplikaattitarkistus
  → Testaa: näkyvätkö kontaktit? Toimiiko muokkaus? Toimiiko Flow B?

VAIHE 8 — DASHBOARD:
  Dashboard-näkymä
  Team activity + drill-down
  Tilastot + kategoriajakauma
  → Testaa: näkyvätkö tilastot oikein?

VAIHE 9 — SETTINGS:
  Kaikki 6 osa-aluetta (Profile, Greeting, Events, Teams, Categories, Notifications)
  → Testaa: toimiiko jokainen asetus?

VAIHE 10 — BOT-KOMENNOT + ILMOITUKSET:
  /contacts, /ping, /week komennot
  Ajastetut ilmoitukset (cron)
  Lokikirjaryhmä
  → Testaa: toimivatko komennot Telegramissa?

VAIHE 11 — VIIMEISTELY:
  VPN-resilienssi (cache, retry, offline-tila)
  Haptic feedback kaikille interaktioille
  Animaatioiden hiominen
  Performance-optimointi
  Virhetilanteiden käsittely kaikissa kohdissa

═══════════════════════════════════════════════════
14. ESIMERKKIDATA (KEHITYSTÄ VARTEN)
═══════════════════════════════════════════════════

Kontaktit:
  @vitalik_b, "Vitalik B.", "Ethereum Foundation", Founder, "Token2049 Singapore", pingNextWeek: true
  @anna_vc, "Anna Chen", "Sequoia Capital", Investor, "Token2049 Singapore"
  @crypto_mike, "Mike Rodriguez", "CoinDesk", Media, "Token2049 Singapore", collector: "@laura"
  @dev_sarah, "Sarah Kim", "LayerZero", Dev, "ETHDenver 2026"
  @bd_james, "James Liu", "Binance", BD, "Token2049 Singapore", collector: "@mikko"
  @kol_emma, "Emma Watts", "", KOL, "Token2049 Singapore"

Eventtiviikot:
  "Token2049 Singapore", 2026-03-03 → 2026-03-09, active
  "ETHDenver 2026", 2026-02-25 → 2026-03-01, inactive

Tiimimallit:
  "BD Team": @anna, @mikko, @laura
  "Tech Team": @dev1, @dev2

Oletuskategoriat:
  Investor, KOL, Marketing, Dev, Founder, BD, Media, Other

═══════════════════════════════════════════════════
15. ALOITETAAN
═══════════════════════════════════════════════════

Aloita vaiheesta 1 (projektin perusta). Kerro mitä teet, miksi ja mitä tietoja tarvitset minulta. Kysy vahvistus ennen jokaista isoa askelta. Jos jokin menee pieleen, selitä mitä tapahtui yksinkertaisesti ja korjaa se.
```

---

Tämä on se prompti jonka liität Claude Codelle. Kopioi kaikki ``` -merkkien sisältö.
