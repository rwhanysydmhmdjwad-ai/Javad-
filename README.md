# CS Knowledge Atlas

A static, client-side atlas mapping computer-science concepts, constraints, goals, and real-world achievements. No build step or backend is required.

## Files
- `index.html` — page shell and four-tier atlas.
- `styles.css` — responsive desktop and touch layouts.
- `app.js` — search, domain filtering, relationship traversal/highlighting, SVG links, matrix display, desktop drag-and-drop, and touch press-and-hold impact view.
- `data.json` — editable seed dataset: 8 domains and 84 nodes (34 concepts, 18 constraints, 17 goals, 15 achievements). Influence scores are illustrative ordinal estimates, not measured benchmarks.
- `manifest.json` — optional installable-app metadata.

## Relationship schema
IDs are exact and case-sensitive. `mappings.goalToTier1` maps each goal ID to concept IDs, `mappings.goalToTier2` maps each goal to constraint IDs, and `mappings.achievementToGoals` maps each achievement ID to goal IDs. Both goal maps contain every tier-3 goal exactly once; achievement mapping contains every tier-4 achievement exactly once. Parent relationships (`parentId`) are also included. The app validates mapping endpoints at startup and traces relationships in both directions, including parent/child paths.

## Run
Serve this directory with any static web server (for example, an editor's Live Server extension) and open `index.html`. Browsers commonly block `fetch()` when the page is opened directly as `file://`. External fonts are optional; system fallbacks work offline.

On desktop, select a node to highlight its connected graph; drag an achievement onto the impact bar for its profile. On touch devices, tap to select and press-and-hold an achievement to open its profile. Escape or tap outside the profile to close it.
