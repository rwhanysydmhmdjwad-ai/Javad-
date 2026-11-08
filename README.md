# CS Knowledge Atlas — Ring Edition

An English-only static redesign. No build command, backend, API key, account system, or environment file is needed by the application.

## Put it online

1. Extract `atlas-ring.zip`.
2. Upload the extracted `atlas-ring` folder to your static hosting provider (for example, a manual Netlify deployment). The folder you upload must contain `index.html` directly, alongside the other files.
3. Open the HTTPS address supplied by the host on your phone or computer.

Once hosted, the files are served by the hosting provider: your computer does not have to stay on. No live deployment has been made or verified as part of this delivery. Hosting account requirements and service limits depend on your provider.

Do not upload another project's `.env` file or private credentials. Browser-delivered HTML, CSS, JavaScript, and JSON are public; this is not a private application.

Opening `index.html` directly with `file://` is not supported because the application fetches `data.json`. For local development, if Python 3 is already installed, run `python3 -m http.server 8000` from this folder and open `http://localhost:8000`. This local server is only a preview, not permanent hosting.

## Explore

- Select any lower-tier node. Its genuinely reachable achievements are highlighted.
- Select a highlighted achievement to expand its recorded path. The original source retains its white outline.
- Domain and search filters affect achievements only; the lower three tiers remain present. Search keeps the active achievement visible. Changing domain clears an achievement outside that domain.
- Open **Recorded relationships** for the textual list of explicit links and the selected source's separate parent/child hierarchy.
- **Score bars** shows four provisional node ratings, not validated measurements.
- Select **Explore achievement**, click an achievement's dotted handle, or hold and drag an achievement/handle into the floating glass bar.
- Dragging reveals the bar and blurs the background. Approaching the bar shrinks and tints the dragged card. Releasing in the bar, or holding inside it briefly, starts the absorption animation and opens the bubble view.
- On touch screens, achievement cards reserve their gestures for dragging. Scroll the page from the spaces between cards or other non-draggable areas. The button-based route is available without dragging.
- Choose a scoring dimension or the equal-weight mean. Select a numbered bubble or its matching list entry for details.
- Use **Larger diagram** to inspect a pannable diagram rather than fitting it to the available width. The list provides an alternative to small touch targets.
- Use **Close**, Escape, or an empty area of the dialog to return. Reset clears the source, achievement, domain, and search.
- Ctrl/Cmd+K focuses search. Buttons, bubble nodes, and controls support keyboard interaction; the modal includes focus containment and return. Reduced-motion preferences suppress decorative animation.

## Data and scoring rules

The supplied `data.json` is unchanged. It contains 84 nodes, including 15 achievements, and eight provisional domains. The model extracts 120 distinct directed mapping edges and 59 separate within-tier hierarchy edges.

Achievements connect only to Tier 3 goals. Goals connect to the Tier 1 or Tier 2 targets explicitly recorded in the data. No direct achievement-to-foundation edges are created. Hierarchy is displayed as parent labels and a textual list, and is never used to infer additional impact paths.

Fifteen entries are filed under a different mapping tier key than their target node's actual tier. The implementation preserves each recorded endpoint, routes it to that node's actual tier, deduplicates repeated pairs, and reports the discrepancy in the interface. It does not edit the source data or infer replacement relationships.

Bubble view shows every distinct related node in the selected achievement's explicit path, excluding the achievement itself. Scores are the existing node ratings, not achievement-specific or edge-specific effects. Available dimensions are performance, reliability, scalability, and security. The equal-weight mean requires all four valid ratings.

For a valid score `s` from 1 to 10:

```
radius = 14 * sqrt(s)
area   = pi * 14^2 * s
```

The same scale is used for all nodes. Fit-to-width changes the screen scale, not the within-diagram area ratios. Missing or invalid ratings use a hollow, fixed-size marker, not a fabricated score. The central disc, ring placement, and colors are decorative and do not encode impact.

These are provisional ordinal ratings, not benchmarks or a validated scientific scale. Twice the area does not demonstrate twice the real-world impact.

## Files

- `index.html`: English page, controls, four tiers, and dialog.
- `app.js`: selection, filters, graph paths, dragging, animation, and details.
- `core.js`: isolated model validation, explicit graph traversal, scoring, and ring layout.
- `ring.css`: additive redesign and responsive styling.
- `styles.css`, `data.json`, `manifest.json`: unchanged supplied baseline assets.
- `CHECKS.md`: checks actually performed and remaining limitations.

The supplied baseline stylesheet requests Google Fonts. System fonts are provided as fallbacks; those external font requests still occur when permitted by the browser. There are no analytics added by this redesign. The manifest alone does not provide offline caching; no service worker or offline installation guarantee is included.

The original five baseline files remain available separately in `atlas-original-backup.zip`. This redesign does not overwrite that archive or the earlier project folders.
