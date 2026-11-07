# CS Knowledge Atlas

A self-contained, client-side knowledge map for computer science. It uses plain HTML, CSS, and vanilla JavaScript; there is no backend, account system, Face ID, passkey, build step, or Node.js runtime.

## Included files

- `index.html` — application shell and four-tier layout.
- `styles.css` — responsive dark glass UI, motion, and reduced-motion support.
- `app.js` — search, domain filters, relationship highlighting, SVG paths, matrix, and drag interaction.
- `data.json` — supplied editorial dataset (8 domains, 4 tiers, 84 nodes, mappings, and ordinal influence scores).
- `manifest.json` — optional installable-app metadata.

## Run locally

Open `index.html` from a static web server so the browser can fetch `data.json` (for example, use your editor's Live Server extension). No compilation or package installation is needed. Google Fonts are an optional external enhancement; system fonts remain available offline.

## Deploy to Netlify

### Drag and drop
1. Keep the project files together in the `cs-knowledge-atlas-static` folder.
2. In Netlify, open **Add new site → Deploy manually** (or the deploy drop zone).
3. Drag the project folder, or a ZIP containing its files, into the drop zone. Ensure `index.html` is at the published root, not nested inside an extra folder.

### Git-based deployment
1. Push these files to a GitHub, GitLab, or Bitbucket repository.
2. In Netlify choose **Add new site → Import an existing project** and select the repository.
3. Leave the build command blank and set the publish directory to the repository root (`.`).
4. Deploy. There is no server-side configuration required.

## GitHub Pages
Commit the files to a repository, then enable Pages for the chosen branch and root folder. The app is static and needs no build workflow.

## Using the atlas
- Choose one of the eight domain filters or search across node labels, IDs, and domains.
- Select a node to highlight its connected lineage and mappings; select it again or press **Reset** to clear.
- Toggle **Bubble Matrix** to compare the four 1–10 influence dimensions at each node.
- Drag a Tier 4 achievement onto the top drop bar to open its cinematic impact profile. Click outside the bubbles or press Escape to return.
- Press **⌘/Ctrl + K** to focus search.

## Data note
The supplied `data.json` is retained as the source dataset. Its editorial notice states that scores and relationships are illustrative, provisional estimates—not verified benchmarks or measured performance. Edit the JSON directly to tailor the atlas; keep IDs unique and mapping references consistent. The visual scale is proportional to the provided ordinal scores.
