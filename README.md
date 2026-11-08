# CS Knowledge Atlas — Static

A zero-dependency, static client-side explorer connecting computer-science concepts and tools (Tier 1), engineering constraints (Tier 2), abstract goals (Tier 3), and real-world systems (Tier 4). It is a public, non-account-based website; no server-side application, build step, package install, analytics, or external library is needed.

## Run it

Browsers block `fetch()` from `file://`; serve the folder locally or publish the files as a static site:

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000>. Upload the six files to any static host to publish. No build is required.

## How the map works

- **Click a Tier 4 achievement:** illuminates its mapped goals and their mapped Tier 1 concepts and Tier 2 constraints. SVG lines show only actual declared links: achievement → goal → concept/constraint. There are no direct Tier 4 → Tier 1/2 edges.
- **Click a Tier 1, 2, or 3 node:** computes its full reverse dependency closure and pulses every real-world achievement that uses it. Choosing one of those achievements then traces its complete path; the original lower-tier node retains a distinct white outline.
- **Hold and drag a Tier 4 node** for about 430 ms. Drag toward the liquid-glass drop target at the top and release to open the impact bubble view. A click remains an ordinary graph selection. A blank-backdrop click or Escape closes the view. Touch uses pointer events; text selection and accidental copying are disabled on nodes.
- Search and domain filters narrow the visible nodes. Reset clears selection. Keyboard users can tab to nodes and activate them with Enter/Space.

## Data and editorial caveats

`data.json` is the complete source of domains, nodes, descriptions, mappings, and impact scores. It contains eight primary domains, 22 concepts/tools, 12 constraints, 12 goals, and 14 real-world achievements. The links are curated, plausible engineering dependencies; they are **not** a formal proof of necessity or an exhaustive causal model. Tier 4 links only to Tier 3; Tier 1/2 links are reached through those goals. The four impact dimensions use discrete bubble diameters based on the mean of ordinal 1–10 estimates (performance, reliability, scalability, security); estimates are illustrative, not measured benchmarks. Edit mapping arrays and IDs in `data.json` to adapt the atlas.

## Package contents

- `index.html` — accessible page shell and controls
- `styles.css` — responsive visual design, focus/drag/bubble states, reduced-motion treatment
- `app.js` — data validation, graph traversal, SVG edges, search/filter, pointer drag and bubbles
- `data.json` — curated dependency graph and impact estimates
- `manifest.json` — installable-web-app metadata (no icon assets required)
- `README.md` — this guide

All app assets are local. No external fonts, APIs, frameworks, or runtime dependencies.
