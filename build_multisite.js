const fs = require("fs");
const path = require("path");

const root = __dirname;
const sourcePath = path.join(root, "defi_timeline.html");
const assetsDir = path.join(root, "assets");
fs.mkdirSync(assetsDir, { recursive: true });

const source = fs.readFileSync(sourcePath, "utf8");
const scriptStart = source.indexOf("<script>");
const scriptEnd = source.indexOf("</script>", scriptStart);
if (scriptStart < 0 || scriptEnd < 0) {
  throw new Error("Could not find script block in defi_timeline.html");
}

const script = source.slice(scriptStart + "<script>".length, scriptEnd);
const dataStart = script.indexOf("const sources =");
const dataEnd = script.indexOf("const activeFilters");
if (dataStart < 0 || dataEnd < 0) {
  throw new Error("Could not find data block boundaries");
}

const dataBlock = script.slice(dataStart, dataEnd).trim();

function extractSectionByHeadingId(id) {
  const headingIndex = source.indexOf(`id="${id}"`);
  if (headingIndex < 0) {
    throw new Error(`Could not find legacy section: ${id}`);
  }
  const start = source.lastIndexOf("    <section", headingIndex);
  const next = source.indexOf("\n    <section", headingIndex + 1);
  const mainEnd = source.indexOf("\n  </main>", headingIndex);
  const end = next > -1 ? next : mainEnd;
  if (start < 0 || end < 0) {
    throw new Error(`Could not extract legacy section: ${id}`);
  }
  return source.slice(start, end).trim();
}

function extractLegacyHero() {
  const start = source.indexOf("  <header>");
  const end = source.indexOf("\n  </header>", start);
  if (start < 0 || end < 0) {
    throw new Error("Could not extract legacy hero");
  }
  return source
    .slice(start, end + "\n  </header>".length)
    .trim()
    .replace(/^<header>/, '<section class="legacy-lp-hero">')
    .replace(/<\/header>$/, "</section>")
    .replace('id="entryCount"', "data-total-count");
}

const legacyHero = extractLegacyHero();
const legacySections = {
  phases: extractSectionByHeadingId("phases"),
  timeline: extractSectionByHeadingId("timelineTitle"),
  deepCases: extractSectionByHeadingId("deepCases"),
  underworldResearch: extractSectionByHeadingId("underworldResearch"),
  taxonomy: extractSectionByHeadingId("taxonomy"),
  failureCases: extractSectionByHeadingId("failureCases"),
  multilingual: extractSectionByHeadingId("multilingual"),
  researchMethod: extractSectionByHeadingId("researchMethod"),
  sources: extractSectionByHeadingId("sourcesTitle")
};

const legacyVisibleSections = [
  legacySections.phases,
  legacySections.timeline,
  legacySections.deepCases,
  legacySections.underworldResearch,
  legacySections.taxonomy,
  legacySections.failureCases,
  legacySections.multilingual,
  legacySections.researchMethod,
  legacySections.sources
].join("\n");

const dataJs = `// Generated from defi_timeline.html by build_multisite.js.
// Edit the source timeline data there, then rerun this script.
(function () {
${dataBlock}

  window.DEFI_HISTORY = {
    sources,
    entries,
    supplementalEntries,
    underworldEntries,
    timelineEntries,
    categoryLabels,
    depthLabels,
    statusLabels,
    chainLabels,
    depthGroups
  };
})();
`;

const css = `:root {
  --bg: #f6f3ec;
  --ink: #17181c;
  --muted: #5f6470;
  --line: #d8d2c6;
  --card: #fffdf8;
  --accent: #0f766e;
  --red: #9f3a38;
  --blue: #315a91;
  --gold: #7a4a10;
  --shadow: 0 14px 42px rgba(31, 26, 17, 0.08);
  --radius: 8px;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: var(--bg);
  color: var(--ink);
  line-height: 1.65;
}
a { color: var(--blue); text-underline-offset: 3px; }
.wrap { width: min(1180px, calc(100vw - 32px)); margin: 0 auto; }
.site-header {
  border-bottom: 1px solid var(--line);
  background: rgba(255, 253, 248, 0.92);
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(12px);
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 58px;
}
.brand {
  color: var(--ink);
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
}
.nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}
.nav a {
  padding: 6px 9px;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--muted);
  text-decoration: none;
  font-size: 14px;
}
.nav a.active, .nav a:hover {
  border-color: var(--line);
  background: var(--card);
  color: var(--ink);
}
.hero {
  padding: 52px 0 28px;
  border-bottom: 1px solid var(--line);
  background:
    linear-gradient(180deg, rgba(255, 253, 248, 0.94), rgba(246, 243, 236, 0.98)),
    repeating-linear-gradient(90deg, rgba(15, 118, 110, 0.12) 0 1px, transparent 1px 42px);
}
.kicker {
  display: inline-flex;
  width: fit-content;
  margin-bottom: 14px;
  padding: 4px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted);
  background: rgba(255, 253, 248, 0.72);
  font-size: 13px;
}
h1 {
  margin: 0;
  max-width: 980px;
  font-size: clamp(38px, 7vw, 78px);
  line-height: 0.98;
}
.lead {
  max-width: 920px;
  margin: 18px 0 0;
  color: #333843;
  font-size: 18px;
}
main { padding: 34px 0 72px; }
.section-title {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin: 0 0 16px;
}
h2 { margin: 0; font-size: 28px; line-height: 1.2; }
.section-title p { max-width: 620px; margin: 0; color: var(--muted); font-size: 14px; }
.grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow);
}
.card h3 { margin: 0 0 8px; font-size: 18px; line-height: 1.3; }
.card p, .card li { color: #343943; font-size: 14px; }
.legacy-lp-hero {
  border-bottom: 1px solid var(--line);
  background:
    linear-gradient(180deg, rgba(255, 253, 248, 0.94), rgba(246, 243, 236, 0.98)),
    repeating-linear-gradient(90deg, rgba(15, 118, 110, 0.12) 0 1px, transparent 1px 42px);
}
.legacy-lp-hero .hero {
  min-height: 58vh;
  display: grid;
  align-content: center;
  gap: 28px;
  border-bottom: 0;
  background: transparent;
}
.quick-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 6px;
}
.stat-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 24px; }
.stat {
  padding: 14px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.stat b { display: block; font-size: 28px; line-height: 1.1; }
.stat span { display: block; margin-top: 4px; color: var(--muted); font-size: 13px; }
.phase-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 28px;
}
.phase {
  min-height: 170px;
  padding: 16px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.phase time {
  display: block;
  margin-bottom: 8px;
  color: var(--red);
  font-weight: 720;
  font-size: 13px;
}
.phase h3 { margin: 0 0 8px; font-size: 18px; line-height: 1.3; }
.phase p { margin: 0; color: #3f434b; font-size: 14px; }
.deep-section { margin-top: 44px; }
.deep-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.deep-card {
  padding: 16px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.deep-card h3 { margin: 0 0 8px; font-size: 18px; line-height: 1.35; }
.deep-card p, .deep-card li { color: #343943; font-size: 14px; }
.deep-card ul { margin: 12px 0 0; padding-left: 18px; }
.matrix {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.matrix-card {
  padding: 14px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
}
.matrix-card b { display: block; margin-bottom: 6px; }
.matrix-card span { color: #343943; font-size: 14px; }
.language-notes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.language-notes div {
  padding: 14px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  color: #343943;
  font-size: 14px;
}
.language-notes b {
  display: block;
  margin-bottom: 6px;
  color: var(--ink);
}
.note {
  padding: 12px 14px;
  border-left: 4px solid var(--accent);
  background: rgba(255, 253, 248, 0.82);
  color: #34363b;
  font-size: 14px;
}
.timeline-layout {
  display: grid;
  grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
  gap: 22px;
  align-items: start;
}
.timeline-layout.filters-collapsed { grid-template-columns: minmax(0, 1fr); }
.filter-sidebar {
  position: sticky;
  top: 72px;
  max-height: calc(100vh - 88px);
  overflow: auto;
  padding: 12px;
  background: rgba(246, 243, 236, 0.94);
  border: 1px solid var(--line);
  border-radius: var(--radius);
}
.timeline-layout.filters-collapsed .filter-sidebar { display: none; }
.filter-open {
  display: none;
  margin: 0 0 12px;
  border-color: var(--accent);
  background: #e2f1ee;
  color: #074b45;
  font-weight: 720;
}
.timeline-layout.filters-collapsed .filter-open { display: inline-flex; }
.filter-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
}
.filter-group { display: grid; gap: 6px; margin-bottom: 10px; }
.controls { display: grid; gap: 10px; }
.control-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.control-row .filter-group { flex: 1 1 260px; }
.filter-panel {
  display: grid;
  gap: 10px;
}
.timeline-main { min-width: 0; }
.filter-title {
  color: var(--muted);
  font-size: 12px;
  font-weight: 760;
  text-transform: uppercase;
}
.filters, .years, .links {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
button, input {
  min-height: 36px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--card);
  color: var(--ink);
  font: inherit;
  font-size: 14px;
}
button { padding: 6px 10px; cursor: pointer; }
button.active {
  border-color: var(--accent);
  background: #e2f1ee;
  color: #074b45;
  font-weight: 700;
}
input { width: 100%; padding: 7px 10px; }
.timeline { display: grid; gap: 18px; }
.year-block { display: grid; grid-template-columns: 100px minmax(0, 1fr); gap: 18px; align-items: start; }
.year-label {
  position: sticky;
  top: 76px;
  padding: 7px 8px;
  border-top: 3px solid var(--ink);
  font-size: 28px;
  line-height: 1;
  font-weight: 780;
}
.cards { display: grid; gap: 12px; border-left: 2px solid var(--line); padding-left: 18px; }
.entry {
  position: relative;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow);
}
.entry::before {
  content: "";
  position: absolute;
  left: -25px;
  top: 24px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  border: 3px solid var(--bg);
}
.entry-header { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.date, .tag {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--line);
  color: var(--muted);
  background: #faf7ef;
  font-size: 12px;
  white-space: nowrap;
}
.date { background: #efe8dc; color: #4f3d24; font-weight: 720; }
.depth-core { border-color: #0f766e; color: #075c55; background: #e2f1ee; }
.depth-major { border-color: #315a91; color: #254777; background: #e9eef7; }
.depth-niche { border-color: #7a4a10; color: #663e0d; background: #f6ead7; }
.depth-degen { border-color: #9f3a38; color: #81302f; background: #f7e4e3; }
.depth-incident { border-color: #4b5563; color: #374151; background: #edf0f3; }
.depth-emerging { border-color: #6d4aa4; color: #553985; background: #eee7f7; }
.entry h3 { margin: 0 0 7px; font-size: 20px; line-height: 1.25; }
.entry p { margin: 0; color: #343943; font-size: 15px; }
.entry dl {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 6px 12px;
  margin: 12px 0 0;
  padding-top: 12px;
  border-top: 1px solid var(--line);
  font-size: 14px;
}
.entry dt { color: var(--muted); font-weight: 700; }
.entry dd { margin: 0; color: #343943; }
.sources, .related-search {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
  font-size: 12px;
}
.sources a, .related-search a {
  padding: 2px 7px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #faf7ef;
  color: var(--blue);
  text-decoration: none;
}
.related-search a { background: #eef3f2; color: #0f5f58; }
.empty {
  display: none;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--card);
  color: var(--muted);
  text-align: center;
}
.source-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 0;
  list-style: none;
}
.source-toolbar {
  display: grid;
  gap: 12px;
  margin: 0 0 18px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: rgba(255, 253, 248, 0.76);
}
.source-search-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: stretch;
}
.source-result-count {
  min-width: 86px;
  padding: 6px 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #faf7ef;
  text-align: center;
}
.source-result-count b { display: block; font-size: 18px; line-height: 1.1; }
.source-result-count span { color: var(--muted); font-size: 12px; }
.source-list li {
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--card);
  font-size: 14px;
  overflow-wrap: anywhere;
}
.source-item-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.source-item-title {
  color: var(--blue);
  font-weight: 760;
  text-decoration-thickness: 1px;
}
.source-kind {
  display: inline-flex;
  flex: 0 0 auto;
  min-height: 24px;
  align-items: center;
  padding: 2px 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #eef3f2;
  color: #0f5f58;
  font-size: 12px;
  font-weight: 720;
}
.source-url {
  display: block;
  margin-top: 6px;
  color: var(--muted);
  font-size: 12px;
}
.source-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.source-context {
  margin: 10px 0 0;
  color: #343943;
  font-size: 13px;
}
.source-empty {
  grid-column: 1 / -1;
  color: var(--muted);
  text-align: center;
}
.protocol-toolbar {
  display: grid;
  gap: 10px;
  margin: 0 0 18px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: rgba(255, 253, 248, 0.76);
}
.protocol-toolbar input { width: 100%; }
.protocol-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.protocol-card {
  box-shadow: none;
  overflow-wrap: anywhere;
}
.protocol-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
.protocol-card h3 {
  margin: 0 0 8px;
  font-size: 20px;
  line-height: 1.25;
}
.protocol-card dl {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 6px 10px;
  margin: 12px 0 0;
  padding-top: 12px;
  border-top: 1px solid var(--line);
  font-size: 14px;
}
.protocol-card dt { color: var(--muted); font-weight: 760; }
.protocol-card dd { margin: 0; color: #343943; }
.protocol-card .points {
  margin: 10px 0 0;
  padding-left: 18px;
}
.protocol-card .points li { margin: 4px 0; }
.research-link-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 18px 0 28px;
}
.research-link-grid ul {
  margin: 8px 0 0;
  padding-left: 18px;
}
.research-link-grid li { margin: 4px 0; overflow-wrap: anywhere; }
.category-dashboard {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 0 0 18px;
}
.category-research-list {
  display: grid;
  gap: 14px;
}
.category-research-card {
  display: grid;
  gap: 14px;
  padding: 18px;
}
.category-research-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 12px;
}
.category-research-head h3 {
  margin: 0 0 6px;
  font-size: 24px;
  line-height: 1.2;
}
.category-research-head p {
  margin: 0;
  color: #343943;
}
.category-count {
  min-width: 92px;
  padding: 8px 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #faf7ef;
  text-align: center;
}
.category-count b { display: block; font-size: 26px; line-height: 1.1; }
.category-count span { color: var(--muted); font-size: 12px; }
.category-detail-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr 1fr;
  gap: 12px;
}
.category-detail-panel {
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: rgba(250, 247, 239, 0.58);
}
.category-detail-panel h4 {
  margin: 0 0 8px;
  font-size: 14px;
  line-height: 1.3;
}
.category-detail-panel ul {
  margin: 0;
  padding-left: 18px;
}
.category-detail-panel li {
  margin: 4px 0;
  color: #343943;
  font-size: 13px;
}
.category-protocol-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.category-mini-stats {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 6px;
}
.mini-stat {
  padding: 7px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #fffdf8;
  font-size: 12px;
}
.mini-stat b { display: block; font-size: 17px; line-height: 1.1; }
.academic-library {
  margin: 0 0 24px;
}
.finding-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 0 0 24px;
}
.finding-card b {
  display: block;
  font-size: 23px;
  line-height: 1.15;
}
.finding-card span {
  display: block;
  margin-top: 6px;
  color: #343943;
  font-size: 13px;
}
.finding-card a {
  display: inline-flex;
  margin-top: 8px;
  font-size: 12px;
}
footer { padding: 30px 0 48px; border-top: 1px solid var(--line); color: var(--muted); font-size: 13px; }
@media (max-width: 900px) {
  .grid, .grid.two, .stat-grid, .quick-stats, .phase-grid, .deep-grid, .matrix, .language-notes, .source-list, .protocol-grid, .research-link-grid, .category-dashboard, .category-detail-grid, .category-mini-stats, .finding-grid { grid-template-columns: 1fr; }
  .source-search-row { grid-template-columns: 1fr; }
  .source-result-count { width: fit-content; }
  .category-research-head { display: grid; }
  .category-count { width: fit-content; }
  .topbar { align-items: flex-start; flex-direction: column; padding: 10px 0; }
  .nav { justify-content: flex-start; }
  .timeline-layout, .timeline-layout.filters-collapsed { grid-template-columns: 1fr; }
  .filter-sidebar { position: static; max-height: none; }
  .year-block { grid-template-columns: 1fr; }
  .year-label { position: static; width: fit-content; margin-top: 12px; }
}
`;

const appJs = `const DATA = window.DEFI_HISTORY;
const {
  timelineEntries,
  sources,
  categoryLabels,
  depthLabels,
  statusLabels,
  chainLabels,
  depthGroups
} = DATA;

const officialDirectory = [
  { match: /Uniswap/i, links: [["公式X", "https://x.com/Uniswap"], ["公式", "https://uniswap.org/"]] },
  { match: /Aave/i, links: [["公式X", "https://x.com/aave"], ["公式", "https://aave.com/"]] },
  { match: /Curve/i, links: [["公式X", "https://x.com/CurveFinance"], ["公式", "https://curve.fi/"]] },
  { match: /Compound/i, links: [["公式X", "https://x.com/compoundfinance"], ["公式", "https://compound.finance/"]] },
  { match: /\\b(Maker|DAI|Spark)\\b/i, links: [["Maker X", "https://x.com/MakerDAO"], ["Sky X", "https://x.com/SkyEcosystem"]] },
  { match: /Yearn/i, links: [["公式X", "https://x.com/iearnfinance"], ["公式", "https://yearn.fi/"]] },
  { match: /Sushi/i, links: [["公式X", "https://x.com/SushiSwap"], ["公式", "https://www.sushi.com/"]] },
  { match: /Balancer/i, links: [["公式X", "https://x.com/Balancer"], ["公式", "https://balancer.fi/"]] },
  { match: /Convex/i, links: [["公式X", "https://x.com/ConvexFinance"], ["公式", "https://www.convexfinance.com/"]] },
  { match: /Frax/i, links: [["公式X", "https://x.com/fraxfinance"], ["公式", "https://frax.finance/"]] },
  { match: /Pendle/i, links: [["公式X", "https://x.com/pendle_fi"], ["公式", "https://www.pendle.finance/"]] },
  { match: /Ethena/i, links: [["公式X", "https://x.com/ethena_labs"], ["公式", "https://www.ethena.fi/"]] },
  { match: /Morpho/i, links: [["公式X", "https://x.com/MorphoLabs"], ["公式", "https://morpho.org/"]] },
  { match: /GMX/i, links: [["公式X", "https://x.com/GMX_IO"], ["公式", "https://gmx.io/"]] },
  { match: /dYdX/i, links: [["公式X", "https://x.com/dYdX"], ["公式", "https://dydx.trade/"]] },
  { match: /Lido/i, links: [["公式X", "https://x.com/LidoFinance"], ["公式", "https://lido.fi/"]] },
  { match: /Rocket Pool/i, links: [["公式X", "https://x.com/Rocket_Pool"], ["公式", "https://rocketpool.net/"]] },
  { match: /Pancake/i, links: [["公式X", "https://x.com/PancakeSwap"], ["公式", "https://pancakeswap.finance/"]] },
  { match: /1inch/i, links: [["公式X", "https://x.com/1inch"], ["公式", "https://1inch.io/"]] },
  { match: /CoW/i, links: [["公式X", "https://x.com/CoWSwap"], ["公式", "https://cow.fi/"]] },
  { match: /Thorchain|THORChain/i, links: [["公式X", "https://x.com/THORChain"], ["公式", "https://thorchain.org/"]] },
  { match: /Bancor/i, links: [["公式X", "https://x.com/Bancor"], ["公式", "https://bancor.network/"]] },
  { match: /Kyber/i, links: [["公式X", "https://x.com/KyberNetwork"], ["公式", "https://kyberswap.com/"]] },
  { match: /DODO/i, links: [["公式X", "https://x.com/BreederDodo"], ["公式", "https://dodoex.io/"]] }
];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function sourceLinks(entry) {
  const saved = (entry.sources || []).map((id) => sources[id]).filter(Boolean);
  const direct = entry.refs || [];
  return [...saved, ...direct]
    .map(([label, url]) => \`<a href="\${url}" target="_blank" rel="noreferrer">\${escapeHtml(label)}</a>\`)
    .join("");
}

function relatedLinks(entry) {
  const queryBase = \`\${entry.name} DeFi protocol\`;
  const xQuery = encodeURIComponent(\`"\${entry.name}" DeFi\`);
  const rektQuery = encodeURIComponent(\`\${entry.name} site:rekt.news\`);
  const docsQuery = encodeURIComponent(\`\${entry.name} docs OR documentation DeFi\`);
  const official = officialDirectory.filter((item) => item.match.test(entry.name)).flatMap((item) => item.links);
  return [
    ...official,
    ["X検索", \`https://x.com/search?q=\${xQuery}&src=typed_query&f=live\`],
    ["Web検索", \`https://www.google.com/search?q=\${encodeURIComponent(queryBase)}\`],
    ["Docs検索", \`https://www.google.com/search?q=\${docsQuery}\`],
    ["DeFiLlama", \`https://defillama.com/search?query=\${encodeURIComponent(entry.name)}\`],
    ["Rekt検索", \`https://www.google.com/search?q=\${rektQuery}\`]
  ].map(([label, url]) => \`<a href="\${url}" target="_blank" rel="noreferrer">\${label}</a>\`).join("");
}

const researchLinkGroups = [
  {
    title: "公式Docsで深掘り",
    links: [
      ["Uniswap concentrated liquidity", "https://developers.uniswap.org/docs/get-started/concepts/liquidity-providers/concentrated-liquidity"],
      ["Uniswap v4 hooks", "https://developers.uniswap.org/docs/get-started/concepts/hooks"],
      ["Aave v3 overview", "https://aave.com/docs/aave-v3/overview"],
      ["Compound III docs", "https://docs.compound.finance/"],
      ["CoW Protocol docs", "https://docs.cow.fi/cow-protocol/"],
      ["0x Protocol docs", "https://docs.0xprotocol.org/en/latest/"]
    ]
  },
  {
    title: "新しい設計カテゴリ",
    links: [
      ["Synthetix docs", "https://docs.synthetix.io/"],
      ["Hyperliquid docs", "https://hyperliquid.gitbook.io/hyperliquid-docs"],
      ["EigenCloud / EigenLayer docs", "https://docs.eigencloud.xyz/"],
      ["Ondo docs", "https://docs.ondo.finance/"],
      ["Maple docs", "https://docs.maple.finance/"]
    ]
  },
  {
    title: "Rug研究",
    links: [
      ["Token Spammers, Rug Pulls, and SniperBots", "https://arxiv.org/abs/2206.08202"],
      ["CRPWarner: Contract-related Rug Pull", "https://arxiv.org/abs/2403.01425"],
      ["SoK: Yield Aggregators in DeFi", "https://arxiv.org/abs/2105.13891"],
      ["Emergent Outcomes of the veToken Model", "https://arxiv.org/abs/2311.17589"],
      ["Rekt search", "https://www.google.com/search?q=site%3Arekt.news+DeFi+exploit+yield+farm+rug"]
    ]
  }
];

const protocolDetailProfiles = [
  { match: /0x|Matcha/i, points: ["オンチェーン注文板DEXのUX限界に対し、署名済みオフチェーン注文とオンチェーン決済を組み合わせた初期の交換インフラ。", "後年のMatcha/RFQ/aggregator設計につながり、AMMだけではないプロのマーケットメイカー価格をDeFiに入れた。", "調査ではExchange Proxy、Transformers、RFQ、protocol fee、v3/v4の互換性を追うと変化が見える。"], links: [["0x docs", "https://docs.0xprotocol.org/en/latest/"], ["0x X", "https://x.com/0xProject"]] },
  { match: /Uniswap/i, points: ["v1はETHを中継資産にしたx*y=k AMM、v2はERC20/ERC20、TWAP、flash swapでDeFi legoの中心になった。", "v3は価格範囲を指定する集中流動性とtickでLPを能動的なマーケットメイクに近づけた。", "v4はHooks、Singleton、flash accountingでAMMをアプリケーション・プラットフォーム化する方向へ進んだ。"], links: [["Uniswap CL docs", "https://developers.uniswap.org/docs/get-started/concepts/liquidity-providers/concentrated-liquidity"], ["Uniswap Hooks", "https://developers.uniswap.org/docs/get-started/concepts/hooks"], ["Uniswap X", "https://x.com/Uniswap"]] },
  { match: /Bancor/i, points: ["Uniswap以前からオンチェーンAMMを試した古典。BNTを中継資産に使う設計が特徴。", "v2/v2.1では単側LPやImpermanent Loss保護を打ち出し、LP損益の社会化という難しいテーマに踏み込んだ。", "後続AMMを理解する際、資本効率だけでなくLP保護・保険的設計の限界を見る入口になる。"], links: [["Bancor", "https://bancor.network/"], ["Bancor X", "https://x.com/Bancor"]] },
  { match: /Curve|StableSwap|crvUSD/i, points: ["StableSwap invariantで同値に近い資産のスリッページを抑え、stablecoin/LST市場の基盤になった。", "veCRV、gauge、bribe、Convexを通じて流動性配分そのものが政治・市場になった。", "crvUSD/LLAMMAでは清算をAMM化し、貸付とDEXの境界をさらに曖昧にした。"], links: [["Curve", "https://curve.fi/"], ["Curve X", "https://x.com/CurveFinance"], ["veToken research", "https://arxiv.org/abs/2311.17589"]] },
  { match: /Balancer/i, points: ["50/50だけでなく任意比率のweighted poolを一般化し、指数・トレジャリー運用・LBPに応用された。", "Vault architectureでpoolロジックと資産保管を分離し、複数pool間の効率を高めた。", "調査ではBalancer v1、v2 Vault、LBP、veBAL、Composable Stable Poolを分けて見ると理解しやすい。"], links: [["Balancer", "https://balancer.fi/"], ["Balancer X", "https://x.com/Balancer"]] },
  { match: /Aave|ETHLend/i, points: ["ETHLendのP2P貸付から共有流動性プールへ移行し、aToken、flash loan、health factorをDeFi標準にした。", "v3ではE-Mode、Isolation Mode、Siloed Borrowingなど、資本効率とリスク分離の両立を進めた。", "GHO、Aave Earn、V4構想を見ると、貸付市場から信用・ステーブル・アプリ基盤へ広がっている。"], links: [["Aave v3 docs", "https://aave.com/docs/aave-v3/overview"], ["Aave X", "https://x.com/aave"]] },
  { match: /Compound/i, points: ["cToken、利用率ベース金利、清算インセンティブを簡潔にまとめ、DeFiレンディングの基礎形を作った。", "COMP配布は流動性マイニングを爆発させ、DeFi Summerの直接的な起点になった。", "Compound IIIでは単一base asset市場のCometに寄せ、担保管理と借入資産を整理した。"], links: [["Compound III docs", "https://docs.compound.finance/"], ["Compound X", "https://x.com/compoundfinance"]] },
  { match: /Maker|DAI|Spark|Sky/i, points: ["Vault/CDP、過剰担保、清算オークション、DSRでDeFiネイティブstablecoinの基本形を作った。", "USDC PSMやRWA導入により、完全オンチェーン理想と現実の担保多様化の緊張を体現した。", "Spark/Sky以後は、貸付、sDAI、RWA、ガバナンス再編を含む広義の金融OSとして追う必要がある。"], links: [["Sky", "https://sky.money/"], ["Maker X", "https://x.com/MakerDAO"], ["Sky X", "https://x.com/SkyEcosystem"]] },
  { match: /Synthetix|Kwenta|Lyra|Polynomial/i, points: ["SNX担保の共有債務プールからSynth、perps、オプション系アプリへ広がったデリバティブ基盤。", "oracle、funding、skew、debt poolをどう設計するかが、AMMではない合成資産市場の核心。", "Optimism以後はfront-end/protocol separationが進み、Kwenta、Lyra、Polynomialなど周辺アプリも合わせて見る。"], links: [["Synthetix docs", "https://docs.synthetix.io/"], ["Synthetix X", "https://x.com/synthetix_io"]] },
  { match: /Yearn|yEarn|Idle|Pickle|Harvest|Beefy|Autofarm/i, points: ["利回り探索・harvest・再投資・手数料モデルをVaultに閉じ込め、DeFiを受動運用商品にした。", "Yearn v1/v2、Pickle、Harvest、Idleは戦略の透明性、ストラテジスト報酬、事故対応の歴史として読むと濃い。", "ERC-4626以後はVaultが規格化され、戦略市場・貸付市場・LST/LRTポイント狙いへ広がった。"], links: [["Yearn", "https://yearn.fi/"], ["SoK Yield Aggregators", "https://arxiv.org/abs/2105.13891"], ["Yearn X", "https://x.com/iearnfinance"]] },
  { match: /Sushi|SushiSwap|Sashimi|Kimchi/i, points: ["Uniswap LP tokenを奪うvampire attackで、AMM fork、匿名創業、コミュニティ買収、移行イベントを一気に可視化した。", "MasterChef型の報酬配布はDeFi Summer後半からBSC Rug farmまで大量複製された。", "Chef Nomi事件は、admin key、migration権限、匿名チーム、トークン配布設計を見る教材として重要。"], links: [["Sushi", "https://www.sushi.com/"], ["Sushi X", "https://x.com/SushiSwap"]] },
  { match: /Yam|Based|Empty Set Dollar|Basis Cash|Dynamic Set Dollar|bDollar|Tomb|Seigniorage/i, points: ["rebaseやseigniorageでペッグ維持を試みた高APR実験群。短命でもDeFiの投機的設計を理解する材料になる。", "失敗の多くは反射的インセンティブ、流動性不足、oracle/peg防衛の限界に起因した。", "後のOHM系、algorithmic stablecoin、Tomb fork、Terra崩壊まで線で追うと市場心理が見える。"], links: [["Yam X search", "https://x.com/search?q=YAM%20DeFi%202020&src=typed_query"], ["Basis Cash search", "https://www.google.com/search?q=Basis+Cash+algorithmic+stablecoin+DeFi"]] },
  { match: /Cover|Nexus Mutual|InsurAce|Sherlock|Armor/i, points: ["スマートコントラクト保険は、oracleよりもクレーム判定・資本効率・リスク査定が難しい分野。", "Cover Protocol周辺はYearn合併文化、カバレッジ市場、短命プロトコルの代表例として追う価値がある。", "Nexus/Sherlock以後は保険だけでなく監査、バグバウンティ、アンダーライティングの組み合わせへ進んだ。"], links: [["Nexus Mutual", "https://nexusmutual.io/"], ["Sherlock", "https://www.sherlock.xyz/"]] },
  { match: /PancakeSwap|Goose|ApeSwap|Bakery|JulSwap|Ellipsis|Wombat/i, points: ["BNB Chainの低手数料環境で、Uniswap/Sushi/Chef forkが大量発生し、Farm UXが大衆化した。", "PancakeSwapは長期存続した一方、周辺forkは高APR、反射税、LP移行、監査バッジ競争を繰り返した。", "Rug調査ではMasterChef owner、migrator、timelock、deposit fee、LPロック、トークン発行速度を確認する。"], links: [["PancakeSwap", "https://pancakeswap.finance/"], ["BSC rug pull research", "https://arxiv.org/abs/2206.08202"]] },
  { match: /PancakeBunny|AutoShark|ApeRocket|Merlin|Belt|Value DeFi/i, points: ["yield optimizer型のRugでは、Vault価格計算、LP mint/burn、flash loan耐性、報酬トークン価格操作が攻撃面になった。", "BUNNY型の事件は高APRの自動複利が単なるUXではなく、価格操作と会計ロジックの複合リスクを持つことを示した。", "調査時は攻撃トランザクション、post mortem、fork元との差分、監査会社の指摘を並べて読む。"], links: [["Rekt farm exploit search", "https://www.google.com/search?q=site%3Arekt.news+BSC+yield+farm+exploit"], ["Flash loan research", "https://arxiv.org/abs/2102.00626"]] },
  { match: /Uranium|Meerkat|Compounder|TurtleDex|Snowdog|ZKasino|BALD|SafeMoon|Iron Finance/i, points: ["Rug/incident系は悪意ある権限、壊れた会計、市場操作を分けて見ると整理しやすい。", "BSC/新興チェーンでは1日だけ存在するトークン、LP抜き、honeypot、owner mint、proxy upgradeが典型パターンになった。", "日本語のRug文脈では、名前・チェーン・発生日だけでなく、当時のTelegram/Xの煽り、APR、LPロック表記も記録価値がある。"], links: [["Rug pull taxonomy", "https://arxiv.org/abs/2403.01425"], ["Token spam and BSC rugs", "https://arxiv.org/abs/2206.08202"], ["Rekt search", "https://www.google.com/search?q=site%3Arekt.news+Uranium+Meerkat+PancakeBunny"]] },
  { match: /Olympus|OHM|Wonderland|Klima|Redacted|Tokemak/i, points: ["DeFi 2.0は流動性を借りるのではなくProtocol Owned Liquidityとして所有する物語を打ち出した。", "bonding、rebasing、(3,3)、treasury backingは一時熱狂したが、価格下落時の反射性も強かった。", "Curve Warsとの接続、bribe市場、treasury管理、クロスチェーンforkの崩壊事例を合わせて追う。"], links: [["Olympus", "https://www.olympusdao.finance/"], ["Redacted", "https://redacted.finance/"], ["veToken research", "https://arxiv.org/abs/2311.17589"]] },
  { match: /Convex|Votium|Hidden Hand|Bribe|vlCVX/i, points: ["Convexは個人が直接veCRVを扱う複雑さを吸収し、Curve gauge powerを集約するメタガバナンス層になった。", "Votium/Hidden Handは投票権を価格付けし、流動性インセンティブそのものを市場化した。", "FraxやRedactedなどの動きを追うと、プロトコルがLP報酬を買う時代の構図が見える。"], links: [["Convex", "https://www.convexfinance.com/"], ["veToken research", "https://arxiv.org/abs/2311.17589"]] },
  { match: /Frax|FRAX|sFRAX|FPI|frxETH/i, points: ["部分担保アルゴ型stablecoinから始まり、AMO、Curve/Convex戦略、frxETH、RWA利回りへ変化した。", "Fraxはstablecoin単体ではなく、流動性・メタガバナンス・LST・利回り商品を束ねるプロトコルとして見るべき。", "FRAX v1、Frax v2 AMO、Frax v3、sFRAX、frxETHの順に整理すると進化が追いやすい。"], links: [["Frax", "https://frax.finance/"], ["Frax X", "https://x.com/fraxfinance"]] },
  { match: /Terra|Anchor|Mirror|Astroport|UST|Luna/i, points: ["Anchorの高固定利回りはUST需要を作ったが、利回り補助金と償還圧力が崩れるとシステム全体が連鎖した。", "Mirror/Astroport/MarsなどはTerra内DeFiの厚みを作ったが、ベース資産UST/LUNA依存が単一障害点になった。", "RWAやEthenaなど後年のドル商品を理解する際も、担保・償還・流動性・利回り原資の分解が必要。"], links: [["Terra collapse search", "https://www.google.com/search?q=Terra+Anchor+UST+collapse+DeFi"], ["Anchor docs search", "https://www.google.com/search?q=Anchor+Protocol+docs+UST+yield"]] },
  { match: /GMX|Gains|GNS|Perpetual Protocol|Perp/i, points: ["vAMM、oracle price、shared liquidity vaultなど、オンチェーンperpsは注文板以外の実行設計を模索した。", "GMXはGLP/GMでLPがトレーダーの相手方になる構造を普及させ、real yield物語にもつながった。", "調査ではoracle遅延、skew、funding、LP損益、最大OI、keeper/liquidationを確認する。"], links: [["GMX", "https://gmx.io/"], ["Perpetual Protocol", "https://perp.com/"]] },
  { match: /dYdX|Hyperliquid|Drift|Mango|Serum|Aevo|Vertex|Perennial/i, points: ["CLOB/perps系はAMM DeFiと中央集権取引所UXの中間を狙い、L2・独自L1・appchainへ分岐した。", "HyperliquidはL1、HyperBFT、HyperCore order book、HyperEVMという形で注文板と汎用実行環境を統合する方向。", "Mango/Serum/FTX文脈は、DeFiでも運営・マーケットメイカー・担保資産・oracleが集中しうることを示した。"], links: [["Hyperliquid docs", "https://hyperliquid.gitbook.io/hyperliquid-docs"], ["dYdX", "https://dydx.trade/"]] },
  { match: /Lido|Rocket Pool|stETH|rETH|StakeWise|Frax Ether/i, points: ["LSTはPoS利回りをERC-20化し、Curve、Aave、Maker、Pendleなどの担保・利回り市場へ組み込まれた。", "stETH/ETH流動性、validator operator set、withdrawal queue、slashing、governance captureが主要論点。", "Rocket PoolやStakeWiseは分散性の代替設計として比較するとよい。"], links: [["Lido", "https://lido.fi/"], ["Rocket Pool", "https://rocketpool.net/"], ["Lido X", "https://x.com/LidoFinance"]] },
  { match: /EigenLayer|Eigen|ether.fi|Renzo|Kelp|Swell|Puffer/i, points: ["RestakingはETH/LSTの経済安全性をAVSへ再利用し、LRTとポイント市場を生んだ。", "利回りはstaking rewardだけでなくAVS報酬・points・airdrop期待を含み、リスクはslashingと相関障害に広がる。", "調査ではAVS一覧、operator集中、withdrawal、LRT担保利用、Pendle PT/YT市場まで見る。"], links: [["EigenCloud docs", "https://docs.eigencloud.xyz/"], ["EigenLayer X", "https://x.com/eigenlayer"]] },
  { match: /Pendle|Element|Sense|Swivel|Notional|Yield Protocol/i, points: ["利回りを元本部分と変動利回り部分に分解し、固定金利・将来利回り売買・ポイント投機を可能にした。", "PendleはLST/LRTサイクルでPT/YTを大衆化し、利回りそのもののDEXになった。", "調査では満期、implied APY、YT価格、underlying yield source、oracle、liquidity incentivesを見る。"], links: [["Pendle", "https://www.pendle.finance/"], ["Pendle X", "https://x.com/pendle_fi"]] },
  { match: /CoW|CowSwap|1inch|ParaSwap|Hashflow|DODO|Clipper|Kyber/i, points: ["DEX aggregatorはAMM単体の時代から、RFQ、intent、batch auction、solver競争へ進化した。", "CoW Protocolはユーザーの署名済みintentをbatch化し、solverがCoincidence of Wantsや外部流動性から最良実行を探す。", "MEV保護、private order flow、solver decentralization、手数料抽出の分配が現在の焦点。"], links: [["CoW docs", "https://docs.cow.fi/cow-protocol/"], ["1inch", "https://1inch.io/"], ["CoW X", "https://x.com/CoWSwap"]] },
  { match: /Ondo|Maple|Centrifuge|Goldfinch|Credix|Clearpool|Usual|Backed|OpenEden/i, points: ["RWAはDeFi利回りを国債・短期金融・私募信用・請求債権などオフチェーン資産へ接続した。", "OndoはUSDY/OUSGなどトークン化金融商品、Mapleは機関向け貸付とSyrupで代表的な事例。", "スマコンよりもKYC、法域、償還、カストディ、破産隔離、レポーティングが核心リスクになる。"], links: [["Ondo docs", "https://docs.ondo.finance/"], ["Maple docs", "https://docs.maple.finance/"], ["Ondo X", "https://x.com/OndoFinance"], ["Maple X", "https://x.com/maplefinance"]] },
  { match: /Morpho|Euler|Silo|Ajna|Fluid|Gearbox|Rari|Fuse/i, points: ["貸付市場は単一共有poolから、isolated market、peer-to-peer matching、curated vaultへ細分化した。", "Euler/Rari Fuseの事故は、permissionless listingとoracle/担保設計の難しさを示した。", "Morpho/MetaMorpho以後はキュレーター、risk curator、vault allocatorが貸付市場の新しい役割になった。"], links: [["Morpho", "https://morpho.org/"], ["Euler", "https://www.euler.finance/"], ["Morpho X", "https://x.com/MorphoLabs"]] },
  { match: /Ethena|USDe|sUSDe/i, points: ["USDeは現物担保とデリバティブショートを組み合わせる合成ドルで、利回りはfunding/basisに依存する。", "担保カストディ、取引所リスク、funding反転、ヘッジ執行、償還流動性をstablecoinとは別枠で見る必要がある。", "Terra以後の高利回りドル商品として、利回り原資の透明性を重点的に比較したい。"], links: [["Ethena", "https://www.ethena.fi/"], ["Ethena X", "https://x.com/ethena_labs"]] },
  { match: /Sudoswap|Blur|LooksRare|NFTfi|BendDAO|JPEG/i, points: ["NFTfiはAMM、レンディング、担保ローン、ロイヤリティ市場を通じてNFTを金融化した。", "sudoswapはNFTをbonding curveプールで売買し、Blurはorder flowとインセンティブで市場構造を変えた。", "流動性が薄い非代替資産では、oracle、floor price、清算、wash tradingが主要リスクになる。"], links: [["Sudoswap", "https://sudoswap.xyz/"], ["NFTfi", "https://www.nftfi.com/"]] }
];

const categoryResearchAngles = {
  "DEX/AMM": ["不変式、価格発見、LP損益、fee tier、oracle、MEV耐性を分けて読む。", "forkの場合は元プロトコルとの差分、トークン配布、移行権限、流動性インセンティブを見る。"],
  "Lending": ["担保係数、oracle、清算、金利モデル、隔離市場、bad debt処理を確認する。", "permissionless listing型は、誰がリスクをキュレーションしているかが重要。"],
  "Stablecoin": ["担保、償還、価格安定メカニズム、利回り原資、流動性バックストップを分解する。", "アルゴ型は成長期と縮小期のインセンティブが別物になる。"],
  "Derivatives": ["oracle、funding、margin、liquidation、keeper、LPが誰の相手方になるかを見る。", "CLOB、vAMM、oracle-settled、vault counterparty型でリスクが大きく違う。"],
  "Yield": ["利回り源泉、harvest頻度、strategy権限、performance fee、share price計算を確認する。", "高APRは報酬トークン価格、TVL流入、売り圧の循環で見る。"],
  "Governance": ["投票権のロック、委任、bribe、quorum、timelock、実行権限を確認する。", "veToken系は投票権市場と流動性インセンティブの接続を追う。"],
  "Risk": ["事故後のpost mortem、損失補填、攻撃tx、監査指摘、再発防止策をセットで記録する。", "単なる被害額ではなく、どの設計仮定が壊れたかを残す。"],
  "Ponzi/Rug": ["owner/migrator/proxy admin、LP lock、mint権限、blacklist、fee変更、marketing walletを確認する。", "X/Telegramの煽り、APR、fork元、監査ロゴ、発生日、消滅日を残すとRug調査資料として価値が上がる。"],
  "Infrastructure": ["プロトコル単体ではなく、order flow、oracle、bridge、solver、keeper、data availabilityなどの依存関係を見る。", "集中点がどこにあるかを地図化する。"],
  "Insurance": ["資本提供者、査定者、クレーム判定、支払条件、除外条件、事故時のガバナンスを確認する。", "保険という名前でも、実態は監査・保証・担保プールの混合であることが多い。"],
  "Prediction": ["市場作成、resolution oracle、流動性補助、規制、UIの扱いを確認する。", "結果判定の曖昧さが最大のUX/信頼リスクになる。"],
  "LST/Restaking": ["validator set、withdrawal、slashing、担保利用、流動性、ポイント/airdrop期待を分ける。", "LRTは基礎利回りとAVS報酬と投機的ポイントが混ざる。"],
  "RWA": ["法域、KYC、カストディ、償還、担保報告、破産隔離、オンチェーン証明を確認する。", "スマコンリスクよりもオフチェーン実務が本体になる。"],
  "Asset Management": ["戦略の裁量、手数料、rebalance、管理者権限、基礎プロトコル依存を確認する。", "Vault規格化後はERC-4626互換性も重要。"],
  "Aggregator": ["価格改善だけでなく、MEV保護、RFQ、solver、失敗時のfallback、手数料抽出を確認する。", "intent型は誰が実行品質を保証するかを追う。"],
  "NFTfi": ["floor price oracle、清算、ロイヤリティ、wash trading、担保の非流動性を確認する。", "ERC-20 DeFiの常識がそのまま通用しない。"],
  "Other": ["何の制約を解こうとした実験か、既存カテゴリのどこから逸脱したかを記録する。", "短命でも、後続プロトコルに再利用された概念がないかを見る。"]
};

const academicSourceLibrary = {
  sokDefi: ["SoK: Decentralized Finance (DeFi)", "https://arxiv.org/abs/2101.08778"],
  sokDefiTaxonomy: ["SoK: DeFi Fundamentals, Taxonomy and Risks", "https://arxiv.org/abs/2404.11281"],
  defiSurvey: ["Decentralized Finance (DeFi): A Survey", "https://arxiv.org/abs/2308.05282"],
  ammSok: ["SoK: DEX with AMM Protocols", "https://arxiv.org/abs/2103.12732"],
  cfmmOracle: ["Improved Price Oracles: CFMMs", "https://arxiv.org/abs/2003.10001"],
  cfmmConvex: ["CFMMs: Multi-Asset Trades via Convex Optimization", "https://arxiv.org/abs/2107.12484"],
  lvr: ["Automated Market Making and Loss-Versus-Rebalancing", "https://arxiv.org/abs/2208.06046"],
  mev: ["Flash Boys 2.0 / MEV", "https://arxiv.org/abs/1904.05234"],
  liquidations: ["Empirical Study of DeFi Liquidations", "https://arxiv.org/abs/2106.06389"],
  yieldAggregators: ["SoK: Yield Aggregators in DeFi", "https://arxiv.org/abs/2105.13891"],
  rugTokens: ["Token Spammers, Rug Pulls, and SniperBots", "https://arxiv.org/abs/2206.08202"],
  crpWarner: ["CRPWarner: Contract-related Rug Pulls", "https://arxiv.org/abs/2403.01425"],
  vetoken: ["Emergent Outcomes of the veToken Model", "https://arxiv.org/abs/2311.17589"],
  bridgeAttacks: ["Detecting Attack Transactions on Cross-chain Bridges", "https://arxiv.org/abs/2410.14493"],
  rwaTokenization: ["Exploration on Real World Assets and Tokenization", "https://arxiv.org/abs/2503.01111"],
  intentBridges: ["Intent-based Bridge Liquidity Exhaustion Attacks", "https://arxiv.org/abs/2602.17805"]
};

const academicFindings = [
  {
    value: "約60%",
    label: "Token Spammers/Rug Pulls研究で、分析対象トークンのうち1日未満しか活動しないものが約60%と報告された。",
    source: "rugTokens"
  },
  {
    value: "$240M",
    label: "同研究は1-day rug pullの利益を約2.4億ドルと推定し、BNB Chain側で特に顕著とした。",
    source: "rugTokens"
  },
  {
    value: "$39.88B+",
    label: "DeFi清算研究は、対象時点の lending TVL が398.8億ドル超で、Aave/Compound/Maker/dYdXがEthereum貸付市場の大半を占めるとした。",
    source: "liquidations"
  },
  {
    value: "85%+",
    label: "同清算研究では、Aave、Compound、MakerDAO、dYdXがEthereum lending marketの85%以上を代表するとして分析された。",
    source: "liquidations"
  },
  {
    value: "$4.3B",
    label: "BridgeGuard研究は、2021年以降のクロスチェーンブリッジ攻撃損失を約43億ドルと整理した。",
    source: "bridgeAttacks"
  },
  {
    value: "3.5M / $9.24B",
    label: "2026年のintent bridge研究は、2025年6-11月の主要intent bridgeで350万件・92.4億ドル相当のintentを分析した。",
    source: "intentBridges"
  }
];

const categoryProfiles = {
  "DEX/AMM": {
    thesis: "DeFiの価格発見と流動性の中心。注文板ではなく、関数・在庫・裁定・LP損益で市場を作るジャンル。",
    mechanisms: ["constant product / StableSwap / weighted pool / concentrated liquidity", "price impact、slippage、fee tier、oracle、LP range、MEV", "vampire attack、流動性インセンティブ、LPトークンの担保利用"],
    metrics: ["出来高/TVL/手数料", "価格乖離と裁定頻度", "LPのimpermanent loss / LVR", "MEV抽出・sandwich頻度"],
    questions: ["LPは手数料でLVRを上回れるか。", "集中流動性は資本効率と運用難度をどう変えたか。", "solver/intents時代にAMMの役割はどう残るか。"],
    papers: ["ammSok", "cfmmOracle", "cfmmConvex", "lvr", "mev"]
  },
  "Lending": {
    thesis: "過剰担保、金利モデル、清算、oracleを組み合わせるDeFiの信用市場。共有poolから分離市場とキュレーションへ進化した。",
    mechanisms: ["utilization rate model、collateral factor、health factor", "liquidation bonus、close factor、bad debt処理", "isolated market、e-mode、peer-to-pool、curated vault"],
    metrics: ["借入残高/供給残高", "清算件数と清算割引", "担保集中度", "oracle依存・bad debt"],
    questions: ["清算は借り手に過剰なコストを課していないか。", "permissionless listingとリスク管理は両立できるか。", "キュレーターは新しい銀行的役割になるか。"],
    papers: ["liquidations", "sokDefi", "sokDefiTaxonomy"]
  },
  "Stablecoin": {
    thesis: "DeFiの会計単位と信用創造。担保、償還、ペッグ維持、収益源を分解しないと危険度を判断できない。",
    mechanisms: ["CDP/Vault、PSM、AMO、algorithmic seigniorage", "oracle、liquidation、peg defense、redemption queue", "RWA利回り、basis/funding、protocol-owned liquidity"],
    metrics: ["peg deviation", "担保率と担保構成", "流動性深度", "償還量・発行量・利回り原資"],
    questions: ["ペッグは担保で守られているのか、期待で守られているのか。", "利回りの原資は持続可能か。", "危機時に誰が最後の流動性を出すのか。"],
    papers: ["sokDefiTaxonomy", "defiSurvey", "liquidations"]
  },
  "Derivatives": {
    thesis: "perps、options、synthetic assetsは、oracle、margin、funding、LP/保険基金を通じてオンチェーンにレバレッジを持ち込む。",
    mechanisms: ["vAMM、CLOB、oracle-settled market、portfolio margin", "funding rate、skew、open interest cap", "liquidation keeper、insurance fund、LP counterparty"],
    metrics: ["OI/volume/funding", "清算件数", "oracle delay", "LP損益と保険基金残高"],
    questions: ["LPはトレーダーの相手方リスクを適切に価格付けできるか。", "CLOB型とoracle-settled型の弱点はどこか。", "perpsのUXは中央集権取引所にどこまで近づくか。"],
    papers: ["mev", "sokDefi", "defiSurvey"]
  },
  "Yield": {
    thesis: "利回り源泉を束ね、戦略をVault化するジャンル。DeFi Summer以後のAPY文化、戦略リスク、事故史を読む入口。",
    mechanisms: ["vault shares、harvest、auto-compounding", "strategy権限、performance fee、報酬トークン売却", "利回りtokenization、fixed yield、points farming"],
    metrics: ["APYの内訳", "share price", "harvest frequency", "strategy allocation", "報酬トークン売り圧"],
    questions: ["表示APYはどの資産から生まれているか。", "戦略管理者権限はどこまで強いか。", "Vault標準化でリスクは見えやすくなったか。"],
    papers: ["yieldAggregators", "sokDefi", "defiSurvey"]
  },
  "Governance": {
    thesis: "DAO、veToken、bribe、metagovernanceは、トークンを単なる手数料請求権ではなく将来の資源配分権にした。",
    mechanisms: ["token voting、delegation、timelock、quorum", "vote escrow、gauge voting、bribe marketplace", "treasury management、protocol owned liquidity"],
    metrics: ["投票参加率", "投票権集中度", "bribe/投票単価", "treasury runway", "timelock期間"],
    questions: ["投票権市場は効率化か、買収可能性か。", "metagovernanceはリスクを集約しすぎないか。", "DAOの実行権限は誰が持つのか。"],
    papers: ["vetoken", "sokDefiTaxonomy", "sokDefi"]
  },
  "Infrastructure": {
    thesis: "oracle、bridge、keeper、solver、account abstractionなど、表面の金融アプリを支える依存層。事故時の波及が大きい。",
    mechanisms: ["cross-chain messaging、liquidity bridge、oracle network", "keeper/liquidator/solver、MEV relay、private order flow", "data availability、sequencer、shared security"],
    metrics: ["bridge transfer volume", "validator/solver集中度", "oracle update delay", "失敗tx/再実行率", "attack loss"],
    questions: ["インフラ接続は流動性を増やす一方で、攻撃面をどれだけ増やすか。", "solverやkeeperは分散化されているか。", "oracle停止時のfail-safeはあるか。"],
    papers: ["bridgeAttacks", "intentBridges", "mev", "sokDefiTaxonomy"]
  },
  "Insurance": {
    thesis: "スマートコントラクトリスクを市場化する試み。保険というより、資本プール、査定、監査、ガバナンス判断の複合体。",
    mechanisms: ["cover pool、claim assessment、risk underwriter", "audit-linked coverage、slashing/guarantee", "mutual model、capital efficiency"],
    metrics: ["coverage capacity", "claim payout ratio", "資本利用率", "risk premium", "査定期間"],
    questions: ["事故判定は客観化できるか。", "tail riskに十分な資本があるか。", "保険購入者と資本提供者の情報非対称をどう扱うか。"],
    papers: ["sokDefi", "defiSurvey"]
  },
  "Prediction": {
    thesis: "予測市場はAMMとoracle問題の古典的応用。結果判定、流動性補助、規制がプロトコル設計の中心になる。",
    mechanisms: ["market scoring rule、binary outcome token", "resolution oracle、dispute window", "liquidity subsidy、fee model"],
    metrics: ["open interest", "market depth", "resolution dispute", "予測価格と実結果の乖離"],
    questions: ["誰が結果を決めるのか。", "曖昧なイベントをどう定義するか。", "流動性が薄い市場に価格情報はあるか。"],
    papers: ["sokDefi", "ammSok"]
  },
  "LST/Restaking": {
    thesis: "staking利回りを流動化し、さらにAVSへ再利用するジャンル。利回り商品、担保、ポイント市場を同時に作った。",
    mechanisms: ["liquid staking token、withdrawal queue、validator operator set", "restaking、AVS、LRT、slashing", "PT/YT、points trading、looped leverage"],
    metrics: ["LST supply", "validator/operator concentration", "peg/liquidity depth", "slashable exposure", "points implied valuation"],
    questions: ["ETHのセキュリティを再利用することは、相関リスクを増やさないか。", "LRT担保化は清算連鎖を生むか。", "ポイント市場は利回り市場か投機市場か。"],
    papers: ["sokDefiTaxonomy", "defiSurvey"]
  },
  "RWA": {
    thesis: "国債、私募信用、請求債権などオフチェーン資産をDeFiに接続する領域。スマコンより法務・カストディ・償還が本体になる。",
    mechanisms: ["tokenized treasury、private credit vault", "KYC/transfer restriction、custodian、proof of reserve", "redemption window、legal wrapper、bankruptcy remoteness"],
    metrics: ["AUM/TVL", "償還期間", "担保証明頻度", "借り手集中度", "法域と規制ステータス"],
    questions: ["トークン保有者は何の法的権利を持つのか。", "償還停止時に誰が保護されるか。", "オンチェーン透明性はオフチェーン資産にどこまで届くか。"],
    papers: ["rwaTokenization", "sokDefiTaxonomy", "defiSurvey"]
  },
  "Asset Management": {
    thesis: "Vault、指数、robo-advisor、structured productを通じて、DeFiをポートフォリオ運用商品に変換する。",
    mechanisms: ["index token、strategy vault、rebalance", "management/performance fee、ERC-4626", "risk budget、strategy whitelisting"],
    metrics: ["AUM", "turnover", "tracking error", "fee drag", "strategy concentration"],
    questions: ["運用者裁量はどこまで透明か。", "Vault規格化は比較可能性を高めるか。", "オンチェーン指数は流動性危機に耐えるか。"],
    papers: ["yieldAggregators", "sokDefiTaxonomy"]
  },
  "Aggregator": {
    thesis: "流動性を直接持たず、最良執行、RFQ、solver、intentで注文フローを束ねる層。",
    mechanisms: ["route splitting、RFQ、batch auction", "intent、solver competition、MEV protection", "private order flow、surplus capture"],
    metrics: ["price improvement", "failure rate", "solver share", "surplus distribution", "MEV saved"],
    questions: ["最良執行の品質はどう測るか。", "solver市場は集中しないか。", "ユーザー余剰は誰に配分されるか。"],
    papers: ["mev", "intentBridges", "sokDefiTaxonomy"]
  },
  "Risk": {
    thesis: "攻撃、oracle操作、ガバナンス買収、清算連鎖など、DeFiの失敗モードを横断的に扱うカテゴリ。",
    mechanisms: ["flash loan、oracle manipulation、reentrancy", "governance attack、bridge exploit、bad debt", "post mortem、whitehat recovery、insurance fund"],
    metrics: ["損失額", "攻撃tx数", "TVL比損失", "補填率", "修正までの時間"],
    questions: ["原因はコードバグか、経済設計か、運用権限か。", "同じ失敗がforkで再発していないか。", "攻撃後のガバナンス対応は妥当か。"],
    papers: ["mev", "liquidations", "bridgeAttacks", "sokDefi"]
  },
  "Ponzi/Rug": {
    thesis: "Rug、food farm、1-day token、honeypot、Rugpullを、詐欺史だけでなく市場構造・権限設計・情報非対称として記録する。",
    mechanisms: ["MasterChef fork、migrator、owner mint、blacklist", "LP抜き、proxy upgrade、deposit fee、反射税", "Telegram/X煽り、監査バッジ、APR表示"],
    metrics: ["token lifespan", "LP lock有無", "creator addressの反復", "初日出来高", "rug profit", "sniper bot activity"],
    questions: ["短命プロトコルはどのパターンで量産されたか。", "BSC/新興チェーンでなぜRugが増えたか。", "ユーザーはどの情報でリスクを誤認したか。"],
    papers: ["rugTokens", "crpWarner", "sokDefi"]
  },
  "Other": {
    thesis: "既存カテゴリに収まりにくい実験。短命でも、後続に概念だけ残るものがある。",
    mechanisms: ["novel token economics", "experimental settlement", "new collateral/use case", "social coordination"],
    metrics: ["実験期間", "fork数", "後続採用例", "コミュニティ/ガバナンス反応"],
    questions: ["何を解こうとした実験か。", "失敗しても再利用された部品はあるか。", "既存分類を増やすべきか。"],
    papers: ["sokDefi", "defiSurvey"]
  }
};

function protocolProfileFor(entry) {
  const profile = protocolDetailProfiles.find((item) => item.match.test(entry.name));
  if (profile) return profile;
  return { points: categoryResearchAngles[entry.category] || categoryResearchAngles.Other, links: [] };
}

function linkPills(links) {
  return (links || []).map(([label, url]) => '<a href="' + escapeHtml(url) + '" target="_blank" rel="noreferrer">' + escapeHtml(label) + '</a>').join("");
}

function entryCard(entry) {
  return \`<article class="entry">
    <div class="entry-header">
      <span class="date">\${escapeHtml(entry.date)}</span>
      <span class="tag">\${escapeHtml(categoryLabels[entry.category] || entry.category)}</span>
      <span class="tag depth-\${entry.depth}">\${escapeHtml(depthLabels[entry.depth] || entry.depth)}</span>
      <span class="tag">\${escapeHtml(statusLabels[entry.state] || entry.state)}</span>
      \${entry.chains.slice(0, 3).map((chain) => \`<span class="tag">\${escapeHtml(chainLabels[chain] || chain)}</span>\`).join("")}
      \${(entry.tags || []).map((tag) => \`<span class="tag">\${escapeHtml(tag)}</span>\`).join("")}
    </div>
    <h3>\${escapeHtml(entry.name)}</h3>
    <p>\${escapeHtml(entry.summary)}</p>
    <dl>
      <dt>技術種別</dt><dd>\${escapeHtml(entry.tech)}</dd>
      <dt>現在/影響</dt><dd>\${escapeHtml(entry.status)}</dd>
    </dl>
    <div class="sources">\${sourceLinks(entry)}</div>
    <div class="related-search">\${relatedLinks(entry)}</div>
  </article>\`;
}

function groupByYear(entries) {
  const map = new Map();
  entries.forEach((entry) => {
    if (!map.has(entry.year)) map.set(entry.year, []);
    map.get(entry.year).push(entry);
  });
  return map;
}

function renderTimeline(target, entries) {
  if (!entries.length) {
    target.innerHTML = '<div class="empty" style="display:block">該当する項目がありません。</div>';
    return;
  }
  target.innerHTML = [...groupByYear(entries)].map(([year, items]) => \`
    <section class="year-block" id="year-\${year}">
      <div class="year-label">\${year}</div>
      <div class="cards">\${items.map(entryCard).join("")}</div>
    </section>
  \`).join("");
}

function selectedDepthValues(filters) {
  if (filters.depth.size === 0) return null;
  const selected = new Set();
  filters.depth.forEach((depth) => {
    const group = depthGroups[depth];
    if (group) group.forEach((item) => selected.add(item));
    else selected.add(depth);
  });
  return selected;
}

function filterEntries(filters, searchValue = "") {
  const q = searchValue.trim().toLowerCase();
  const depthSelection = selectedDepthValues(filters);
  return timelineEntries.filter((entry) => {
    const categoryOk = filters.category.size === 0 || filters.category.has(entry.category);
    const depthOk = !depthSelection || depthSelection.has(entry.depth);
    const statusOk = filters.status.size === 0 || filters.status.has(entry.state);
    const chainOk = filters.chain.size === 0 || entry.chains.some((chain) => filters.chain.has(chain));
    const haystack = [
      entry.year, entry.date, entry.name, entry.category, entry.summary, entry.tech, entry.status,
      entry.depth, depthLabels[entry.depth], entry.state, statusLabels[entry.state],
      ...entry.chains, ...(entry.tags || [])
    ].join(" ").toLowerCase();
    return categoryOk && depthOk && statusOk && chainOk && (!q || haystack.includes(q));
  });
}

function setupTimelinePage() {
  const target = document.getElementById("timeline");
  if (!target) return;
  const layout = document.getElementById("timelineLayout");
  document.getElementById("filterToggle")?.addEventListener("click", () => layout.classList.add("filters-collapsed"));
  document.getElementById("filterOpen")?.addEventListener("click", () => layout.classList.remove("filters-collapsed"));
  const filters = { category: new Set(), depth: new Set(), status: new Set(), chain: new Set() };
  const params = new URLSearchParams(location.search);
  ["category", "depth", "status", "chain"].forEach((key) => {
    params.getAll(key).forEach((value) => {
      if (value && value !== "all") filters[key].add(value);
    });
  });

  const groups = [
    ["category", document.getElementById("filters"), ["all", ...new Set(timelineEntries.map((e) => e.category))], categoryLabels],
    ["depth", document.getElementById("depthFilters"), ["all", "curated", "core", "major", "niche", "degen", "incident", "emerging"], depthLabels],
    ["status", document.getElementById("statusFilters"), ["all", "active", "legacy", "failed", "incident", "emerging"], statusLabels],
    ["chain", document.getElementById("chainFilters"), ["all", ...new Set(timelineEntries.flatMap((e) => e.chains))], chainLabels]
  ];

  function syncButtons(type) {
    document.querySelectorAll(\`button[data-type="\${type}"]\`).forEach((button) => {
      const value = button.dataset.value;
      const active = value === "all" ? filters[type].size === 0 : filters[type].has(value);
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function render() {
    renderTimeline(target, filterEntries(filters, document.getElementById("search")?.value || ""));
  }

  groups.forEach(([type, el, values, labels]) => {
    if (!el) return;
    el.innerHTML = values.map((value) => {
      const label = value === "all" ? "すべて" : (labels[value] || value);
      return \`<button type="button" data-type="\${type}" data-value="\${escapeHtml(value)}" aria-pressed="false">\${escapeHtml(label)}</button>\`;
    }).join("");
    el.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-type]");
      if (!button) return;
      const value = button.dataset.value;
      if (value === "all") filters[type].clear();
      else if (filters[type].has(value)) filters[type].delete(value);
      else filters[type].add(value);
      syncButtons(type);
      render();
    });
    syncButtons(type);
  });

  const years = document.getElementById("yearNav");
  if (years) {
    years.innerHTML = [...new Set(timelineEntries.map((entry) => entry.year))]
      .map((year) => \`<button type="button" data-year="\${year}">\${year}</button>\`).join("");
    years.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-year]");
      if (button) document.getElementById(\`year-\${button.dataset.year}\`)?.scrollIntoView({ behavior: "smooth" });
    });
  }
  document.getElementById("search")?.addEventListener("input", render);
  render();
}

function setupCategoriesPage() {
  const target = document.getElementById("categoryGrid");
  if (!target) return;
  const counts = timelineEntries.reduce((acc, entry) => {
    acc[entry.category] = (acc[entry.category] || 0) + 1;
    return acc;
  }, {});

  const total = timelineEntries.length;
  const active = timelineEntries.filter((entry) => entry.state === "active").length;
  const failed = timelineEntries.filter((entry) => entry.state === "failed" || entry.state === "incident").length;
  const chainCount = new Set(timelineEntries.flatMap((entry) => entry.chains)).size;
  const dashboard = document.getElementById("categoryDashboard");
  if (dashboard) {
    dashboard.innerHTML = [
      ["掲載項目", total, "プロトコル/事件"],
      ["稼働/継続", active, "稼働中"],
      ["失敗/事件", failed, "失敗・事件"],
      ["チェーン/市場", chainCount, "分類に登場"]
    ].map(([label, value, note]) => '<article class="card stat"><b>' + escapeHtml(value) + '</b><span>' + escapeHtml(label) + " / " + escapeHtml(note) + '</span></article>').join("");
  }

  const categoryAcademicSourceLabels = {
    sokDefi: "DeFi全体の体系化研究",
    sokDefiTaxonomy: "DeFi分類とリスクの研究",
    ammSok: "AMM型DEXの体系化研究",
    cfmmOracle: "CFMMとオラクルの研究",
    cfmmConvex: "CFMM設計の数理研究",
    lvr: "LP損益とLVRの研究",
    mev: "MEVと取引順序の研究",
    liquidations: "清算メカニズムの実証研究",
    yieldAggregators: "利回りアグリゲータ研究",
    rugTokens: "Rug tokenの大規模分析",
    crpWarner: "流動性プール悪用検知研究",
    vetoken: "veTokenと投票市場の研究",
    bridgeAttacks: "ブリッジ攻撃の測定研究",
    rwaTokenization: "RWAトークン化の研究",
    intentBridges: "Intent型ブリッジの測定研究",
    defiSurvey: "DeFiサーベイ論文"
  };

  function academicSourceLabel(id) {
    return categoryAcademicSourceLabels[id] || academicSourceLibrary[id]?.[0] || id;
  }

  const findings = document.getElementById("categoryFindings");
  if (findings) {
    findings.innerHTML = academicFindings.map((item) => {
      const source = academicSourceLibrary[item.source];
      return '<article class="card finding-card"><b>' + escapeHtml(item.value) + '</b><span>' + escapeHtml(item.label) + '</span><a href="' + escapeHtml(source[1]) + '" target="_blank" rel="noreferrer">' + escapeHtml(academicSourceLabel(item.source)) + '</a></article>';
    }).join("");
  }

  const library = document.getElementById("categoryAcademicLibrary");
  if (library) {
    const libraryIds = ["sokDefi", "sokDefiTaxonomy", "ammSok", "cfmmOracle", "lvr", "mev", "liquidations", "yieldAggregators", "rugTokens", "crpWarner", "vetoken", "bridgeAttacks", "rwaTokenization"];
    library.innerHTML = libraryIds.map((id) => {
      const source = academicSourceLibrary[id];
      return '<li><a href="' + escapeHtml(source[1]) + '" target="_blank" rel="noreferrer">' + escapeHtml(academicSourceLabel(id)) + '</a></li>';
    }).join("");
  }

  function listItems(items) {
    return (items || []).map((item) => '<li>' + escapeHtml(item) + '</li>').join("");
  }

  function academicLinks(ids) {
    return (ids || []).map((id) => academicSourceLibrary[id]).filter(Boolean)
      .map((source) => {
        const id = Object.keys(academicSourceLibrary).find((key) => academicSourceLibrary[key] === source);
        return '<a href="' + escapeHtml(source[1]) + '" target="_blank" rel="noreferrer">' + escapeHtml(academicSourceLabel(id)) + '</a>';
      }).join("");
  }

  function profileFor(category) {
    return categoryProfiles[category] || {
      thesis: (categoryResearchAngles[category] || categoryResearchAngles.Other).join(" "),
      mechanisms: categoryResearchAngles[category] || categoryResearchAngles.Other,
      metrics: ["TVL", "出来高", "ユーザー数", "事故履歴"],
      questions: ["このカテゴリ固有のリスクは何か。", "後続プロトコルに何が残ったか。"],
      papers: ["sokDefi", "defiSurvey"]
    };
  }

  function representativeEntries(category) {
    const rank = { core: 0, major: 1, incident: 2, emerging: 3, niche: 4, degen: 5 };
    return timelineEntries
      .filter((entry) => entry.category === category)
      .slice()
      .sort((a, b) => (rank[a.depth] ?? 9) - (rank[b.depth] ?? 9) || a.year - b.year || a.name.localeCompare(b.name))
      .slice(0, 10);
  }

  function miniStats(entries) {
    const coreMajor = entries.filter((entry) => entry.depth === "core" || entry.depth === "major").length;
    const nicheDegen = entries.filter((entry) => entry.depth === "niche" || entry.depth === "degen").length;
    const incidents = entries.filter((entry) => entry.depth === "incident" || entry.state === "incident").length;
    const activeCount = entries.filter((entry) => entry.state === "active").length;
    const failedLegacy = entries.filter((entry) => entry.state === "failed" || entry.state === "legacy").length;
    const chains = new Set(entries.flatMap((entry) => entry.chains)).size;
    return [
      ["基礎/重要", coreMajor],
      ["周辺/短命", nicheDegen],
      ["事件", incidents],
      ["稼働中", activeCount],
      ["失敗/縮小", failedLegacy],
      ["チェーン数", chains]
    ].map(([label, value]) => '<div class="mini-stat"><b>' + escapeHtml(value) + '</b><span>' + escapeHtml(label) + '</span></div>').join("");
  }

  target.innerHTML = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => {
      const profile = profileFor(category);
      const entries = timelineEntries.filter((entry) => entry.category === category);
      const reps = representativeEntries(category);
      return '<article class="category-research-card card" id="category-' + escapeHtml(category.replace(/[^a-z0-9]+/gi, "-").toLowerCase()) + '">' +
        '<div class="category-research-head"><div><h3>' + escapeHtml(categoryLabels[category] || category) + '</h3><p>' + escapeHtml(profile.thesis) + '</p></div><div class="category-count"><b>' + escapeHtml(count) + '</b><span>掲載項目</span></div></div>' +
        '<div class="category-mini-stats">' + miniStats(entries) + '</div>' +
        '<div class="category-detail-grid">' +
          '<div class="category-detail-panel"><h4>設計メカニズム</h4><ul>' + listItems(profile.mechanisms) + '</ul></div>' +
          '<div class="category-detail-panel"><h4>学術・オンチェーン指標</h4><ul>' + listItems(profile.metrics) + '</ul></div>' +
          '<div class="category-detail-panel"><h4>研究課題</h4><ul>' + listItems(profile.questions) + '</ul></div>' +
        '</div>' +
        '<div class="category-detail-panel"><h4>代表プロトコル/事件</h4><div class="category-protocol-row">' + reps.map((entry) => '<span class="tag">' + escapeHtml(entry.name) + '</span>').join("") + '</div></div>' +
        '<div class="sources">' + academicLinks(profile.papers) + '<a href="timeline.html?category=' + encodeURIComponent(category) + '">年表で見る</a><a href="protocols.html">詳細カードで読む</a></div>' +
      '</article>';
    }).join("");
}

function setupSourcesPage() {
  const target = document.getElementById("sourceList");
  if (!target) return;
  const searchInput = document.getElementById("sourceSearch");
  const countTarget = document.getElementById("sourceResultCount");
  const typeTarget = document.getElementById("sourceTypeFilters");
  const categoryTarget = document.getElementById("sourceCategoryFilters");
  const filters = { type: new Set(), category: new Set() };
  const typeLabels = {
    all: "すべて",
    docs: "Docs/公式",
    paper: "論文",
    security: "Rug/セキュリティ",
    data: "データ",
    article: "記事/解説",
    other: "その他"
  };
  const typeOrder = ["docs", "paper", "security", "data", "article", "other"];

  function sourceType(label, url) {
    const text = (label + " " + url).toLowerCase();
    if (text.includes("arxiv.org") || text.includes("paper") || text.includes("sok:")) return "paper";
    if (text.includes("rekt") || text.includes("rug") || text.includes("immunefi") || text.includes("losses")) return "security";
    if (text.includes("defillama") || text.includes("dataset") || text.includes("leaderboard") || text.includes("report")) return "data";
    if (text.includes("wikipedia") || text.includes("investopedia") || text.includes("axios") || text.includes("blog.") || text.includes("coin98") || text.includes("upside.vn")) return "article";
    if (text.includes("docs") || text.includes("gitbook") || text.includes("developers.") || text.includes("documentation")) return "docs";
    return "other";
  }

  const usage = Object.fromEntries(Object.keys(sources).map((id) => [id, { entries: [], categories: new Set() }]));
  timelineEntries.forEach((entry) => {
    (entry.sources || []).forEach((id) => {
      if (!usage[id]) return;
      usage[id].entries.push(entry);
      usage[id].categories.add(entry.category);
    });
  });

  const rows = Object.entries(sources).map(([id, [label, url]]) => {
    const itemUsage = usage[id] || { entries: [], categories: new Set() };
    const categories = [...itemUsage.categories].sort((a, b) => (categoryLabels[a] || a).localeCompare(categoryLabels[b] || b));
    return {
      id,
      label,
      url,
      type: sourceType(label, url),
      categories,
      entries: itemUsage.entries
    };
  }).sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type) || b.entries.length - a.entries.length || a.label.localeCompare(b.label));

  function syncButtons(type) {
    document.querySelectorAll('button[data-source-type="' + type + '"]').forEach((button) => {
      const value = button.dataset.value;
      const active = value === "all" ? filters[type].size === 0 : filters[type].has(value);
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function renderButtons(type, el, values, labels) {
    if (!el) return;
    el.innerHTML = values.map((value) => {
      const label = value === "all" ? "すべて" : (labels[value] || value);
      return '<button type="button" data-source-type="' + type + '" data-value="' + escapeHtml(value) + '" aria-pressed="false">' + escapeHtml(label) + '</button>';
    }).join("");
    el.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-source-type]");
      if (!button) return;
      const value = button.dataset.value;
      if (value === "all") filters[type].clear();
      else if (filters[type].has(value)) filters[type].delete(value);
      else filters[type].add(value);
      syncButtons(type);
      render();
    });
    syncButtons(type);
  }

  function rowHaystack(row) {
    return [
      row.label,
      row.url,
      typeLabels[row.type],
      ...row.categories,
      ...row.categories.map((category) => categoryLabels[category] || category),
      ...row.entries.map((entry) => entry.name)
    ].join(" ").toLowerCase();
  }

  function renderSource(row) {
    const categories = row.categories.length
      ? row.categories.map((category) => '<span class="tag">' + escapeHtml(categoryLabels[category] || category) + '</span>').join("")
      : '<span class="tag">未紐付け</span>';
    const context = row.entries.slice(0, 4).map((entry) => entry.name).join(" / ");
    const extra = row.entries.length > 4 ? " ほか" + (row.entries.length - 4) + "件" : "";
    return '<li class="source-item">' +
      '<div class="source-item-head"><a class="source-item-title" href="' + escapeHtml(row.url) + '" target="_blank" rel="noreferrer">' + escapeHtml(row.label) + '</a><span class="source-kind">' + escapeHtml(typeLabels[row.type]) + '</span></div>' +
      '<span class="source-url">' + escapeHtml(row.url) + '</span>' +
      '<div class="source-meta"><span class="tag">' + escapeHtml(row.entries.length) + '件で参照</span>' + categories + '</div>' +
      (context ? '<p class="source-context">' + escapeHtml(context + extra) + '</p>' : '') +
    '</li>';
  }

  function render() {
    const query = (searchInput?.value || "").trim().toLowerCase();
    const visible = rows.filter((row) => {
      const typeOk = filters.type.size === 0 || filters.type.has(row.type);
      const categoryOk = filters.category.size === 0 || row.categories.some((category) => filters.category.has(category));
      const searchOk = !query || rowHaystack(row).includes(query);
      return typeOk && categoryOk && searchOk;
    });
    if (countTarget) countTarget.textContent = visible.length;
    target.innerHTML = visible.length
      ? visible.map(renderSource).join("")
      : '<li class="source-empty">該当する出典がありません。</li>';
  }

  const typeValues = ["all", ...typeOrder.filter((type) => rows.some((row) => row.type === type))];
  const categoryValues = ["all", ...new Set(rows.flatMap((row) => row.categories))];
  renderButtons("type", typeTarget, typeValues, typeLabels);
  renderButtons("category", categoryTarget, categoryValues, categoryLabels);
  searchInput?.addEventListener("input", render);
  render();
}

function protocolCard(entry) {
  const profile = protocolProfileFor(entry);
  const meta = [
    entry.date,
    categoryLabels[entry.category] || entry.category,
    depthLabels[entry.depth] || entry.depth,
    statusLabels[entry.state] || entry.state,
    ...entry.chains.slice(0, 4).map((chain) => chainLabels[chain] || chain)
  ];
  const points = (profile.points || []).map((point) => "<li>" + escapeHtml(point) + "</li>").join("");
  const links = sourceLinks(entry) + linkPills(profile.links) + relatedLinks(entry);
  return '<article class="protocol-card card">' +
    '<div class="protocol-meta">' + meta.map((item) => '<span class="tag">' + escapeHtml(item) + '</span>').join("") + '</div>' +
    '<h3>' + escapeHtml(entry.name) + '</h3>' +
    '<p>' + escapeHtml(entry.summary) + '</p>' +
    '<dl>' +
      '<dt>技術</dt><dd>' + escapeHtml(entry.tech) + '</dd>' +
      '<dt>現在</dt><dd>' + escapeHtml(entry.status) + '</dd>' +
      '<dt>深掘り</dt><dd><ul class="points">' + points + '</ul></dd>' +
    '</dl>' +
    '<div class="sources">' + links + '</div>' +
  '</article>';
}

function setupResearchLinkGrid() {
  const target = document.getElementById("researchLinkGrid");
  if (!target) return;
  target.innerHTML = researchLinkGroups.map((group) =>
    '<article class="card"><h3>' + escapeHtml(group.title) + '</h3><ul>' +
    group.links.map(([label, url]) => '<li><a href="' + escapeHtml(url) + '" target="_blank" rel="noreferrer">' + escapeHtml(label) + '</a></li>').join("") +
    '</ul></article>'
  ).join("");
}

function setupProtocolsPage() {
  const target = document.getElementById("protocolGrid");
  if (!target) return;
  const filters = { category: new Set(), depth: new Set(), status: new Set() };
  const groups = [
    ["category", document.getElementById("protocolCategoryFilters"), ["all", ...new Set(timelineEntries.map((entry) => entry.category))], categoryLabels],
    ["depth", document.getElementById("protocolDepthFilters"), ["all", "curated", "core", "major", "niche", "degen", "incident", "emerging"], depthLabels],
    ["status", document.getElementById("protocolStatusFilters"), ["all", "active", "legacy", "failed", "incident", "emerging"], statusLabels]
  ];

  function syncButtons(type) {
    document.querySelectorAll('button[data-protocol-type="' + type + '"]').forEach((button) => {
      const value = button.dataset.value;
      const active = value === "all" ? filters[type].size === 0 : filters[type].has(value);
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function searchHaystack(entry, profile) {
    return [
      entry.name,
      entry.date,
      entry.year,
      entry.category,
      categoryLabels[entry.category],
      entry.summary,
      entry.tech,
      entry.status,
      depthLabels[entry.depth],
      statusLabels[entry.state],
      ...entry.chains,
      ...(entry.tags || []),
      ...((profile && profile.points) || [])
    ].join(" ").toLowerCase();
  }

  function render() {
    const query = (document.getElementById("protocolSearch")?.value || "").trim().toLowerCase();
    const depthSelection = selectedDepthValues(filters);
    const rows = timelineEntries.filter((entry) => {
      const profile = protocolProfileFor(entry);
      const categoryOk = filters.category.size === 0 || filters.category.has(entry.category);
      const depthOk = !depthSelection || depthSelection.has(entry.depth);
      const statusOk = filters.status.size === 0 || filters.status.has(entry.state);
      const searchOk = !query || searchHaystack(entry, profile).includes(query);
      return categoryOk && depthOk && statusOk && searchOk;
    });
    document.getElementById("protocolResultCount").textContent = rows.length;
    target.innerHTML = rows.map(protocolCard).join("");
  }

  groups.forEach(([type, el, values, labels]) => {
    if (!el) return;
    el.innerHTML = values.map((value) => {
      const label = value === "all" ? "すべて" : (labels[value] || value);
      return '<button type="button" data-protocol-type="' + type + '" data-value="' + escapeHtml(value) + '" aria-pressed="false">' + escapeHtml(label) + '</button>';
    }).join("");
    el.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-protocol-type]");
      if (!button) return;
      const type = button.dataset.protocolType;
      const value = button.dataset.value;
      if (value === "all") filters[type].clear();
      else if (filters[type].has(value)) filters[type].delete(value);
      else filters[type].add(value);
      syncButtons(type);
      render();
    });
    syncButtons(type);
  });

  document.getElementById("protocolSearch")?.addEventListener("input", render);
  render();
}

function setupStats() {
  document.querySelectorAll("[data-total-count]").forEach((el) => { el.textContent = timelineEntries.length; });
  document.querySelectorAll("#timelineCountText").forEach((el) => { el.textContent = timelineEntries.length + "件"; });
  document.querySelectorAll("[data-underworld-count]").forEach((el) => {
    el.textContent = timelineEntries.filter((entry) => entry.category === "Ponzi/Rug").length;
  });
}

function setupUnderworldPage() {
  const target = document.getElementById("underworldTimeline");
  if (target) renderTimeline(target, timelineEntries.filter((entry) => entry.category === "Ponzi/Rug"));
}

setupStats();
setupTimelinePage();
setupCategoriesPage();
setupSourcesPage();
setupResearchLinkGrid();
setupProtocolsPage();
setupUnderworldPage();
`;

const pages = {
  "index.html": {
    nav: "home",
    title: "DeFi History Atlas",
    body: `${legacyHero}
    <main class="wrap">
      ${legacySections.phases}
      <section class="deep-section" aria-labelledby="readingOrder">
        <div class="section-title"><h2 id="readingOrder">読む順番</h2><p>旧LPの情報を落とさず、目的別に複数ページへ分割した。</p></div>
        <div class="grid">
          <article class="card"><h3>1. 年表</h3><p>全件を複数フィルターで探索。<a href="timeline.html">時系列を見る</a></p></article>
          <article class="card"><h3>2. カテゴリ</h3><p>DEX/AMM、貸付、ステーブル、Rugなどから入る。<a href="categories.html">カテゴリを見る</a></p></article>
          <article class="card"><h3>3. Protocols</h3><p>全プロトコルを詳細カード化し、調査リンクと深掘り観点を付ける。<a href="protocols.html">詳細を見る</a></p></article>
          <article class="card"><h3>4. Rug</h3><p>ポンジDEX、food farm、rugpull、破綻例に集中。<a href="underworld.html">Rugを見る</a></p></article>
          <article class="card"><h3>5. 深掘り</h3><p>旧LPの長文解説、技術系譜、失敗・攻撃の教訓を収録。<a href="deep-research.html">深掘りを見る</a></p></article>
          <article class="card"><h3>6. 調査方法</h3><p>多言語検索、X、Wayback、Explorer、Rektから掘る。<a href="research-method.html">調査方法を見る</a></p></article>
          <article class="card"><h3>7. 出典</h3><p>公式docs、論文、Rekt、補助資料。<a href="sources.html">出典を見る</a></p></article>
        </div>
      </section>
    </main>`
  },
  "categories.html": {
    nav: "categories",
    title: "カテゴリ",
    body: `<main class="wrap">
      <div class="section-title"><h2>カテゴリ研究ノート</h2><p>DeFiを単なるジャンル名ではなく、設計メカニズム、オンチェーン指標、代表プロトコル、学術研究の対応関係で読む。</p></div>
      <div class="category-dashboard" id="categoryDashboard"></div>
      <section class="deep-section" aria-labelledby="academicFindingsTitle">
        <div class="section-title"><h2 id="academicFindingsTitle">学術データ・ハイライト</h2><p>論文・測定研究から、カテゴリ理解に使える定量的な観測値を抜き出す。</p></div>
        <div class="finding-grid" id="categoryFindings"></div>
      </section>
      <section class="academic-library deep-section" aria-labelledby="academicSources">
        <div class="section-title"><h2 id="academicSources">学術・研究ソース</h2><p>各カテゴリカードに紐づける主要論文。AMM、清算、MEV、利回り、Rug、ブリッジ、RWAまで横断する。</p></div>
        <div class="card"><ul class="source-list" id="categoryAcademicLibrary"></ul></div>
      </section>
      <div class="category-research-list" id="categoryGrid"></div>
    </main>`
  },
  "protocols.html": {
    nav: "protocols",
    title: "プロトコル詳細",
    body: `<main class="wrap">
      <div class="section-title"><h2>プロトコル詳細</h2><p>年表の全項目を詳細カード化。検索と複数選択フィルターで、技術・事件・Rug・RWA・LST/LRTなどを横断して読む。</p></div>
      <div class="research-link-grid" id="researchLinkGrid"></div>
      <div class="protocol-toolbar">
        <div class="filter-group"><span class="filter-title">検索</span><input id="protocolSearch" type="search" placeholder="例: MasterChef, Curve, RWA, restaking, BSC, rug"></div>
        <div class="filter-group"><span class="filter-title">カテゴリ</span><div class="filters" id="protocolCategoryFilters"></div></div>
        <div class="filter-group"><span class="filter-title">深さ / 重要度</span><div class="filters" id="protocolDepthFilters"></div></div>
        <div class="filter-group"><span class="filter-title">状態</span><div class="filters" id="protocolStatusFilters"></div></div>
        <p class="note">同じグループ内はOR、カテゴリ・深さ・状態の間はAND。表示中: <b id="protocolResultCount">0</b> / <span data-total-count>0</span>件。</p>
      </div>
      <div class="protocol-grid" id="protocolGrid"></div>
    </main>`
  },
  "timeline.html": {
    nav: "timeline",
    title: "時系列年表",
    body: `<main class="wrap">
      ${legacySections.timeline}
    </main>`
  },
  "underworld.html": {
    nav: "underworld",
    title: "Rug",
    body: `<main class="wrap">
      ${legacySections.underworldResearch}
      <div class="section-title"><h2>Rug</h2><p>高APR、匿名、フォーク、短命Farm、rugpull、設計破綻をRugリスクとしてまとめる。</p></div>
      <div class="grid two">
        <article class="card"><h3>読む観点</h3><p>単なる詐欺リストではなく、MasterChef fork、Vault権限、proxy upgrade、LP所有、oracle、buyback、ポイント/プレセールなどのパターンで見る。</p></article>
        <article class="card"><h3>収録数</h3><p><b data-underworld-count>0</b>件。年表ページではカテゴリ「Rug」でも絞り込める。</p></article>
      </div>
      <div class="section-title" style="margin-top:30px"><h2>時系列</h2><p>Rektや論文で裏を取りやすいものを優先。</p></div>
      <div class="timeline" id="underworldTimeline"></div>
    </main>`
  },
  "deep-research.html": {
    nav: "deep",
    title: "深掘り事例",
    body: `<main class="wrap">
      ${legacySections.deepCases}
      ${legacySections.taxonomy}
      ${legacySections.failureCases}
    </main>`
  },
  "research-method.html": {
    nav: "method",
    title: "調査方法",
    body: `<main class="wrap">
      ${legacySections.multilingual}
      ${legacySections.researchMethod}
    </main>`
  },
  "sources.html": {
    nav: "sources",
    title: "出典",
    body: `<main class="wrap">
      <section aria-labelledby="sourceFilterTitle" style="margin-top:44px">
        <div class="section-title">
          <h2 id="sourceFilterTitle">出典フィルター</h2>
          <p>種別、関連カテゴリ、キーワードで出典を絞り込みます。各カードには参照件数と主な関連プロトコルを表示します。</p>
        </div>
        <div class="source-toolbar" id="sourceToolbar">
          <div class="source-search-row">
            <input id="sourceSearch" type="search" placeholder="出典名・URL・カテゴリ・プロトコルで検索" aria-label="出典検索">
            <div class="source-result-count" aria-live="polite"><b id="sourceResultCount">0</b><span>件</span></div>
          </div>
          <div class="filter-group">
            <div class="filter-title">種別</div>
            <div class="filters" id="sourceTypeFilters"></div>
          </div>
          <div class="filter-group">
            <div class="filter-title">関連カテゴリ</div>
            <div class="filters" id="sourceCategoryFilters"></div>
          </div>
        </div>
      </section>
      ${legacySections.sources}
      <section class="deep-section" aria-labelledby="extraSources">
        <div class="section-title"><h2 id="extraSources">追加調査リンク</h2><p>複数ページ化後に追加した公式Docs、論文、Rug調査導線。</p></div>
      </section>
      <div class="research-link-grid" id="researchLinkGrid"></div>
    </main>`
  }
};

const navItems = [
  ["home", "index.html", "概要"],
  ["timeline", "timeline.html", "年表"],
  ["categories", "categories.html", "カテゴリ"],
  ["protocols", "protocols.html", "プロトコル"],
  ["underworld", "underworld.html", "Rug事例"],
  ["deep", "deep-research.html", "深掘り"],
  ["method", "research-method.html", "調査方法"],
  ["sources", "sources.html", "出典"]
];

function pageShell(page) {
  const nav = navItems.map(([key, href, label]) => {
    const cls = key === page.nav ? " class=\"active\"" : "";
    return `<a${cls} href="${href}">${label}</a>`;
  }).join("");
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${page.title} - DeFi History Atlas</title>
  <link rel="stylesheet" href="assets/site.css">
</head>
<body>
  <header class="site-header">
    <div class="wrap topbar">
      <a class="brand" href="index.html">DeFi History Atlas</a>
      <nav class="nav">${nav}</nav>
    </div>
  </header>
  ${page.body}
  <footer><div class="wrap">作成目的: DeFiプロトコル進化の調査・参照用。日付とステータスは市場やドキュメント更新で変わる可能性がある。</div></footer>
  <script src="assets/defi-data.js"></script>
  <script src="assets/site.js"></script>
</body>
</html>
`;
}

fs.writeFileSync(path.join(assetsDir, "defi-data.js"), dataJs, "utf8");
fs.writeFileSync(path.join(assetsDir, "site.css"), css, "utf8");
fs.writeFileSync(path.join(assetsDir, "site.js"), appJs, "utf8");

for (const [filename, page] of Object.entries(pages)) {
  fs.writeFileSync(path.join(root, filename), pageShell(page), "utf8");
}

console.log(`Generated ${Object.keys(pages).length} pages and shared assets.`);
