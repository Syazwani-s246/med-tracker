# AmikUbat 💊

A warm, offline-first Progressive Web App for tracking your medications. No account, no cloud — everything lives on your device.

> *"Track your meds. Take care of yourself."*

---

## Features

- **Today view** — see everything you've taken today at a glance
- **Log medication** — autocomplete from common Malaysian OTC meds, pick a symptom, and rate how it helped
- **Safety checks** — friendly warning if you're logging the same med too soon (e.g. Panadol < 4 hours apart)
- **History** — reverse-chronological log grouped by date, searchable, editable
- **Weekly / monthly insights** — plain-English summaries generated locally, no AI needed
- **Export & import** — JSON (full data) or CSV (easy to share with a doctor)
- **Fully offline** — works after first load, even with no internet
- **Installable PWA** — add to home screen on iOS and Android

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | React 19 + Vite 8 |
| Routing | React Router v7 |
| Icons | react-icons |
| Styling | CSS Modules |
| PWA | vite-plugin-pwa (Workbox) |
| Storage | localStorage (no backend) |
| Fonts | Plus Jakarta Sans + Nunito (Google Fonts) |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Regenerate PWA icons from source SVG
npm run generate-icons
```

The app runs at `http://localhost:5173`.

---

## Project Structure

```
/
├── public/
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   ├── manifest.json               ← static fallback manifest
│   └── icons/
│       ├── source.svg              ← EDIT THIS to change the app icon
│       ├── pwa-64x64.png
│       ├── pwa-192x192.png
│       ├── pwa-512x512.png
│       ├── maskable-icon-512x512.png
│       └── apple-touch-icon-180x180.png
├── src/
│   ├── main.jsx                    ← entry point
│   ├── App.jsx                     ← router + global modals
│   ├── index.css                   ← global resets + body styles
│   ├── db.js                       ← all localStorage read/write
│   ├── medications.js              ← medication list + safety intervals
│   ├── insights.js                 ← weekly/monthly insight generation
│   ├── components/
│   │   ├── BottomNav.jsx
│   │   ├── MedCard.jsx             ← single log entry card
│   │   ├── SafetyModal.jsx         ← "you took this X hours ago" warning
│   │   ├── Toast.jsx               ← auto-dismiss notification
│   │   ├── DisclaimerModal.jsx     ← first-launch disclaimer
│   │   └── InstallPrompt.jsx       ← "Add to Home Screen" banner
│   └── pages/
│       ├── Landing.jsx
│       ├── Today.jsx
│       ├── LogMed.jsx
│       ├── History.jsx
│       └── Summary.jsx
├── pwa-assets.config.js            ← icon generation config
└── vite.config.js                  ← Vite + PWA plugin config
```

---

## Replacing the App Icon

1. Edit `public/icons/source.svg` with your new icon (512×512 artboard recommended)
2. Run `npm run generate-icons`
3. All sizes (64, 192, 512, maskable, apple-touch-icon, favicon) are regenerated automatically

---

## Adding or Editing Medications

Open [`src/medications.js`](src/medications.js). Each entry has a `name` and a `interval` (minimum hours between doses — set to `0` for no warning):

```js
{ name: 'Panadol',    interval: 4 },
{ name: 'Ibuprofen',  interval: 6 },
{ name: 'Nexium',     interval: 0 },  // no safety interval
```

The `searchMedications()` function powers the autocomplete in the Log page.

---

## Data Schema

All data is stored under the key `amikubat_logs` in `localStorage` as a JSON array.

```json
[
  {
    "id": "uuid-v4",
    "name": "Panadol",
    "dose": "500mg",
    "timestamp": "2026-03-22T08:32:00.000Z",
    "reason": "headache",
    "effect": "helped",
    "notes": ""
  }
]
```

### Field reference

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | Yes | Auto-generated on import if missing |
| `name` | string | Yes | Medication name, free text |
| `dose` | string | No | e.g. `"500mg"`, `"1 tablet"` |
| `timestamp` | ISO 8601 string | Yes | Used for dedup on import — must be unique per `name` |
| `reason` | string | No | Symptom / reason for taking |
| `effect` | string | Yes | One of: `"helped"` · `"somewhat"` · `"none"` · `"unknown"` |
| `notes` | string | No | Free text notes |

### `effect` values

| Value | Meaning |
|---|---|
| `"helped"` | ✅ Helped |
| `"somewhat"` | 〰️ Somewhat |
| `"none"` | ❌ Didn't Help |
| `"unknown"` | 🤔 Not sure yet |

---

## Importing Your Own Data

1. Prepare a `.json` file matching the schema above (see `example-import.json` in this repo)
2. Open the app → **Summary** tab → **Import Data**
3. Select your file — duplicates (same `timestamp` + `name`) are skipped automatically

The import merges with existing data, so it's safe to run multiple times.

---

## PWA Details

| Feature | Implementation |
|---|---|
| Service worker | Workbox via `vite-plugin-pwa`, `autoUpdate` mode |
| Cache strategy | Cache-first for JS/CSS/images; Google Fonts cached 1 year |
| Offline routing | `navigateFallback: /index.html` for SPA routes |
| Install prompt | `beforeinstallprompt` (Android/Chrome); Share hint (iOS) |
| iOS meta | `apple-mobile-web-app-capable`, status bar, splash screens |
| Manifest shortcuts | "Log Medication" and "Today" deep-link shortcuts |

---

## Safety Intervals

| Medication | Min. hours between doses |
|---|---|
| Paracetamol / Panadol / Uphamol / Anarex | 4 hours |
| Aspirin | 4 hours |
| Ibuprofen | 6 hours |
| Antihistamines (Piriton, Polaramine, Loratadine, Clarinase) | 6 hours |
| Voltaren / Buscopan | 8 hours |
| All others | No warning |

---

## Disclaimer

AmikUbat is a personal record-keeping tool only. It does not provide medical advice. Always consult a licensed doctor or pharmacist for health decisions.

**In an emergency, call 999 or go to your nearest hospital.**
