# 💍 InviteAura Builder — Reusable Wedding Invitation Web App

එක් වරක් කේත ලියලා, හැම මංගල උත්සවයකටම විස්තර විතරක් වෙනස් කරලා ඕනෑම අයට ලබා දිය හැකි
**config-driven** Wedding Invitation පද්ධතියක්. අලුතින් coding කරන්න ඕනෑ නෑ — JSON එකක්
හෝ Admin form එකක් පුරවන්න විතරයි.

> පැරණි `../Inviteaura-Builder.html` (compiled React artifact) එක එහෙමම තියෙනවා.
> මේ අලුත් folder එක clean, maintain කරන්න පුළුවන්, reusable version එකයි.

---

## 🚀 ඉක්මනට පටන් ගන්න (Quick Start)

```bash
cd Inviteaura-Builder
node server.js          # npm install ඕනෑ නෑ — zero dependency!
# → http://localhost:3000          (invitation)
# → http://localhost:3000/admin.html  (Admin Builder)
```

වෙනත් විදිහට (server නැතිව බලන්න): `index.html` file එක double-click කරන්න —
embedded `js/default-config.js` නිසා demo එක වැඩ කරයි (RSVP localStorage එකට save වේ).

---

## 📁 Project Structure

```
Inviteaura-Builder/
├── index.html                  ← Invitation template (Cover/Hero/Story/Events/Gallery/RSVP/Wishes)
├── admin.html                  ← Admin Dashboard / Onboarding Builder
├── wedding.config.json         ← ★ DEFAULT template — මේක edit කරලා හැම wedding එකම හදන්න
├── wedding.schema.json         ← JSON schema (field guide + validation)
├── weddings/
│   ├── kasun-shanika.json      ← Example couple 1 (copy කරලා අලුත් couple කෙනෙක් හදන්න)
│   └── default.json
├── js/
│   ├── invitation.js           ← Config කියවලා UI auto-render කරන engine
│   ├── admin.js                ← Builder logic (form → live preview → publish → QR)
│   └── default-config.js       ← file:// fallback config
├── server.js                   ← Node.js backend (API + static hosting, zero deps)
├── data/
│   ├── rsvps.json              ← RSVP database (auto-created)
│   └── wishes.json             ← Wishes database
├── package.json
├── vercel.json                 ← Pretty URLs: yourdomain.com/kasun-shanika
└── .env.example
```

---

## 🧩 Tech Stack (ඔයා ඉල්ලූ විදිහට)

| Layer | භාවිතය |
|---|---|
| **Frontend** | HTML5 + Tailwind CSS (CDN) + Vanilla JavaScript — build step එකක් නෑ |
| **Backend** | Node.js (built-in `http`, Express ඕනෑ නෑ) — `server.js`. Firebase/Supabase විකල්ප පහළ බලන්න |
| **Database** | JSON files (`data/*.json`) — MongoDB/Firestore/PostgreSQL වලට මාරු කරන්න API එකම තියාගන්න |

---

## ✨ Features — ඉල්ලූ හැමදේම තියෙනවා

**Step 1 — Frontend UI**
- 🎴 **Cover Page / Envelope** — "Open Invitation" tap කරලා තමයි invitation එක ඇරෙන්නේ
- ⏳ **Hero + Countdown** — නම්, දිනය, venue + Days/Hours/Minutes/Seconds live countdown
- 📖 **Our Story** — timeline milestones (මුණගැසුණු ආකාරය, proposal…)
- 💒 **Event Details** — Wedding / Poruwa / Homecoming cards: වේලාව, ස්ථානය,
  **Google Maps button**, Dress Code
- ✉️ **RSVP Form** — නම, phone, පැමිණෙනවාද නැද්ද, guests සංඛ්‍යාව, meal, message + live stats
- 🌸 **Wishes + Gallery** — සුබ පැතුම් wall + photo gallery (click → lightbox)

**Step 2 — Dynamic / Reusable (Config-driven)**
- හැම දෙයක්ම `wedding.config.json` (හෝ `weddings/<slug>.json`) වලින් එන්නේ
- Page load එකේදී JSON කියවලා UI ස්වයංක්‍රීයව වෙනස් වේ — code එකක් නෑ
- එකම template එකෙන් අසීමිත weddings: `?wedding=kasun-shanika`, `/kasun-shanika`

**Step 3 — Backend + Database**
- `POST /api/rsvp` → `data/rsvps.json` (weddingId එකට යටත්ව)
- `POST /api/wishes` → `data/wishes.json`
- Backend නැති static mode එකේ localStorage fallback එකක්

**Step 4 — Admin Dashboard** (`admin.html`)
- නම, දිනය, photo, theme, events, story, gallery, music — හැමදේම form එකෙන්
- **Live Preview** (iframe), **Slug/URL auto-generate** (`yourdomain.com/kasun-shanika`)
- Save → `POST /api/weddings` (server එකේ `weddings/<slug>.json`) නැත්තම් JSON download
- **QR Code** generate (print කරන card වලට), RSVP table, **CSV export**

**Step 5 — Hosting / Deployment** — පහළ බලන්න

**Extra Features**
- 🎵 Background Music (Play/Pause floating button, Cover open එකේ auto-play try)
- 💬 WhatsApp Share (pre-filled message + link)
- 📅 Add to Calendar (`.ics` download — Google/Apple/Outlook හැමටම වැඩ)
- 🔗 Copy Link, 🎨 4 Themes (Burgundy Gold / Royal Emerald / Blush Rose / Midnight Silver)

---

## 👩‍❤️‍👨 අලුත් Couple කෙනෙකුට දෙන්නේ කොහොමද? (Reusable Workflow)

**Option A — Admin Builder (coding නැතිව)**
1. `admin.html` එක අරින්න → නම, දිනය, photo, theme, events පුරවන්න
2. **Live Preview** බලන්න → **Save Wedding** ඔබන්න
3. Server එකෙන් publish වුණා නම් link එක: `yourdomain.com/?wedding=<slug>` (හෝ `/<slug>`)
   - Static mode නම්: **Download JSON** → `weddings/<slug>.json` ලෙස දාන්න
4. **Copy Share Link** + QR එක couple එකට දෙන්න

**Option B — Manual (JSON)**
```bash
cp wedding.config.json weddings/tharindu-nimali.json   # නම වෙනස් කරන්න
# weddings/tharindu-nimali.json එක edit කරන්න (නම, දිනය, events, photos…)
```
ඊට පස්සේ: `https://yourdomain.com/?wedding=tharindu-nimali`
හෝ Vercel එකේ pretty URL: `https://yourdomain.com/tharindu-nimali`

> ⚠️ Date format: ISO 8601 — `"2027-02-14T09:00:00+05:30"` (Sri Lanka = +05:30).
> Photos/music: වෙනත් තැනක upload කරලා URL එක දාන්න (Imgur, Cloudinary, Google Drive direct link…).

---

## 🗄️ API Reference (Backend)

| Method | Endpoint | විස්තර |
|---|---|---|
| `GET` | `/api/config/:slug` | Wedding config JSON |
| `GET` | `/api/weddings` | හැම weddings ලැයිස්තුව |
| `POST` | `/api/weddings` | Config save (slug auto-generate) |
| `POST` | `/api/rsvp` | `{weddingId,name,phone,attending,guests,meal,message}` |
| `GET` | `/api/rsvp?weddingId=` | RSVP list |
| `POST` / `GET` | `/api/wishes` | Wish save / list |
| `GET` | `/api/stats?weddingId=` | attending / regret / guests counts |

Example:
```bash
curl -X POST localhost:3000/api/rsvp -H "Content-Type: application/json" \
  -d '{"weddingId":"kasun-shanika","name":"Test","attending":"yes","guests":2}'
```

---

## ☁️ Deployment

**1. Node backend සහිතව (RSVP real-time) — Render / Railway / VPS**
```bash
# Build Command: (none)   Start Command: node server.js   Port: $PORT
```
`data/*.json` persist කරන්න ඕනෑ නම් disk එකක් තියෙන host එකක් තෝරන්න
(හෝ පහළ Firebase/Supabase බලන්න).

**2. Static only (GitHub Pages / Netlify / Vercel)**
- Folder එක GitHub repo එකකට දාන්න → Pages/Netlify/Vercel connect කරන්න
- `vercel.json` නිසා `/kasun-shanika` pretty URL වැඩ කරයි (Vercel වල)
- ⚠️ Static mode එකේ RSVP හැමෝම තමන්ගේ browser එකේ විතරයි තියාගන්නේ.
  Real shared RSVP වලට Node backend එකක් ඕනෑ.

**3. Domain setup**
- Vercel/Netlify → Project → Settings → Domains → ඔබේ domain එක add කරන්න
- Couple එකේ link එක: `https://wedding.com/kasun-shanika` ආකාරයට

---

## 🔥 Firebase / Supabase විකල්පය (BaaS — server නඩත්තු කරන්න ඕනෑ නෑ)

`server.js` එකේ JSON file database එක වෙනුවට මේක දාන්න පුළුවන්:

**Firebase Firestore**
1. [Firebase Console](https://console.firebase.google.com) → Project create → Firestore database
2. Collections: `weddings/{slug}` (config), `rsvps/{id}` (+`weddingId` field), `wishes/{id}`
3. Frontend එකේ `js/invitation.js` තුළ `apiOrLocal()` function එක Firestore
   `addDoc()` / `onSnapshot()` වලට මාරු කරන්න (10 රැස් විතර)

**Supabase (PostgreSQL)**
```sql
create table rsvps (id uuid primary key default gen_random_uuid(),
  wedding_id text, name text, phone text, attending text, guests int,
  meal text, message text, created_at timestamptz default now());
create table wishes (id uuid primary key default gen_random_uuid(),
  wedding_id text, name text, message text, created_at timestamptz default now());
```
ඊට පස්සේ PostgREST API (`/rest/v1/rsvps`) එකට `POST` කරන්න — frontend එකේ
`API` base URL එක Supabase URL එක කරන්න.

> මේ දෙකම කරන්න ඕනෑ නෑ — default Node + JSON setup එකම ගොඩක්
> use-case වලට ප්‍රමාණවත්. Scale කරන්න ඕනෑ වුණාම මාරු කරන්න.

---

## 🔧 දැනගන්න ඕනෑ දේවල්

- **Music autoplay**: browsers block කරන නිසා Cover එකේ "Open" ඔබනකොට තමයි play වෙන්නේ.
- **Guest name personalize**: link එකට `?to=Amma` දාන්න → Cover එකේ "Dear Amma" කියලා පෙන්වයි.
- **Custom API URL**: `index.html?api=https://your-backend.com`
- **Theme**: Admin එකේ preset එකක් තෝරන්න, නැත්තම් color picker වලින් custom කරන්න.
- **Security**: `server.js` එක slug sanitize කරනවා, body limit 1MB, path traversal protect කරලා තියෙනවා.

---

## 🔒 Admin Security (Password Gate)

Admin panel එක password එකකින් ආරක්ෂා කරලා තියෙනවා — අවසර නැති අයට builder එක පෙන්වන්නේ නෑ.

- **Admin link:** `https://nuonecreations.github.io/inviteaura-builder/admin.html` — owner විතරක් දන්න ඕනෑ.
  Public invitation එකේ Admin link එක නෑ.
- **Login:** Admin page එක විවෘත කළාම 🔒 password gate එකක් එනවා. හරි password එක දැම්මම විතරයි builder එක load වෙන්නේ (`js/admin.js` login එකෙන් පස්සේ තමයි load වෙන්නේ).
- **Session:** Tab එක වැසුවම auto logout. **🔒 Lock** button එකෙන් වහා lock කරන්න පුළුවන්.
- **Brute-force protection:** වැරදි උත්සාහන 5කින් පස්සේ තාවකාලික lock + හැම උත්සාහනයකම delay එකක්.
- **Password storage:** `js/admin-auth.js` එකේ තියෙන්නේ password එකේ **SHA-256 hash** එකක් විතරයි — password එකම code එකේ නෑ.
- **වැදගත් සීමාව (Static site):** GitHub Pages යනු static hosting එකක් — මෙය client-side gate එකක්. එය casual access එක නවතනවා. Live invitation එක වෙනස් කරන්න තව කොන්දේසියක් ඕනෑ: **owner ගේ GitHub token එක** (Publish එකට). Token එක නැතිව කාටවත් live site එක වෙනස් කරන්න බෑ.
  තවත් වැඩි ආරක්ෂාවක් ඕනෑ නම්: Admin එක backend එකක් (Render + login) පිටුපස තියන්න, නැත්තම් Cloudflare Access වගේ service එකක් භාවිතා කරන්න.

### 🔑 Password එක වෙනස් කරන්න

1. අලුත් strong password එකක් තෝරන්න (16+ අක්ෂර).
2. Browser console එකේ (F12 → Console) මේක run කරන්න:
   ```js
   await crypto.subtle.digest("SHA-256", new TextEncoder().encode("YOUR_NEW_PASSWORD"))
     .then(b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2,"0")).join(""))
   ```
3. එන hex එක `js/admin-auth.js` එකේ `passwordHash` එක තැනට දාන්න → commit & push → ~1 min වලින් අලුත් password එක වැඩ කරයි.

---

## 📋 Checklist — අලුත් Wedding එකක් Publish කරන්න

- [ ] `weddings/<slug>.json` හදන්න (Admin හෝ copy කරලා)
- [ ] නම / දිනය (ISO format) / venue / events / maps links / dress code
- [ ] Photo URLs (hero + gallery) + music URL
- [ ] Theme තෝරන්න
- [ ] Test: `/?wedding=<slug>` → countdown, RSVP, wishes, WhatsApp, calendar
- [ ] QR + link එක couple එකට දෙන්න

Happy Weddings! 💍🎉
