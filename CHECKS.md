# Verification and limitations

## Checks performed in this environment

- JavaScript syntax checks with `node --check` for `app.js` and `core.js`.
- Loaded the supplied JSON through `createModel`: 84 unique nodes, 15 achievements, 120 distinct mapping edges, and 59 hierarchy edges. Model construction includes parent existence/tier checks and hierarchy cycle checks.
- Traversed all 15 achievement paths: achievement edges target Tier 3; traversal uses mapping edges only; each reached node identifies that achievement as a candidate.
- Generated layouts for every supplied achievement (up to 19 related nodes). Verified that all circles fit the diagram and do not overlap even when every circle uses the maximum score-10 radius.
- Verified that the squared-radius ratio for scores 8 and 2 is 4, so area, not radius, is proportional to score. Checked missing/out-of-range score handling and empty selection.
- Parsed HTML and checked local stylesheet/script/manifest references, duplicate IDs, and the JavaScript's literal ID references.
- Parsed JSON files and checked delivered HTML/JS/JSON/CSS for Arabic/Persian-script text; none was found.
- Compared `data.json`, `styles.css`, and `manifest.json` byte-for-byte against `atlas-original-backup.zip`: unchanged.

These checks establish limited syntax, data, and mathematical properties. They do not establish visual quality or browser compatibility.

## Known data issue

The model reports 15 mapping entries whose tier-key name differs from the recorded target's actual tier. The existing endpoints are used without changing the JSON. The interface explicitly discloses this. Relationships and ratings have not been scientifically or editorially validated.

## Not performed

- No browser launch, screenshot review, browser automation, or visual regression test.
- No iPhone, Safari, Android, desktop browser, touch, screen-reader, or assistive-technology test.
- No live deployment, public URL check, hosting availability check, or offline/PWA installation test.
- No security audit, performance benchmark, scientific validation, or validation of the provisional scores.
- No browser, testing framework, or package was installed for this delivery.

The drag gestures, animations, responsive layout, CSS effects, and modal focus behavior are implemented but remain unverified in a real browser. The interface also provides ordinary buttons and a numbered list so dragging or precise bubble tapping is not required. It uses modern browser APIs including Pointer Events, SVG, `inert`, and optional Web Animations; compatibility should be checked on the devices actually used.
