# CS Knowledge Atlas

A dependency-free, static interactive atlas connecting computer-science foundations, constraints, abstract goals, and real-world achievements. The interface uses a dark, iOS-inspired frosted-glass treatment and adapts from desktop to mobile.

## Contents

- `index.html` — semantic page structure, search, four-tier building, impact drop target, and bubble matrix.
- `styles.css` — responsive glass UI, tier accents, selection/drop states, and animated influence bubbles.
- `app.js` — asynchronous data loading and validation, built-in empty fallback, rendering, search, keyboard access, drag-and-drop and touch-pointer gestures, scoring, and reset/close behavior.
- `data.json` — 8 domains and 84 concepts (34 Tier 1, 18 Tier 2, 17 Tier 3, 15 Tier 4), including influence scores and goal mappings.
- `manifest.json` — installable-web-app metadata.

## Run locally

Browsers restrict `fetch()` from `file://`, so do not open `index.html` directly. From this directory run either:

```sh
python3 -m http.server 8000
```

Then visit <http://localhost:8000>. Alternatively use any static HTTP server. All assets are relative; no build step or JavaScript dependency is required. The optional Google Fonts import falls back to system fonts if unavailable.

## Deploy

Upload the contents of this directory to any static host (for example GitHub Pages, Netlify, or an object-storage website endpoint) and serve over HTTPS. Keep the five files together at the site root. The manifest provides app metadata; an offline service worker and app icons are intentionally not included, so this is a static PWA-ready package rather than an offline-caching implementation.

## Interaction

Select or drag a Tier 4 card into the top Impact lens. On touch devices, drag a card into the same target; tapping a Tier 4 card is an accessible alternative. The matrix averages each mapped concept's ordinal 1–10 influence values across Performance, Reliability, Scalability, and Security. Search filters cards as you type (`/` focuses search, `Esc` clears or closes). “Reset view” clears the selection and query; × closes the current impact view.

## Data notes

The included editorial seed dataset is illustrative and provisional, not verified benchmarks or factual ratings. Influence values are ordinal estimates on a 1–10 scale. Customize `data.json` to fit your context while preserving its `domains`, `tiers`, `mappings`, and `impactDimensions` structure. If data cannot be fetched (including when opened via `file://`), the app reports the issue and remains safe to use with empty fallback data.
