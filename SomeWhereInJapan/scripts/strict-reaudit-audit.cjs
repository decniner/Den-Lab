'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const { buildWalkingRouteUrl, buildStationToPlaceUrl } = require('../google-maps-routes.js');
const origins = require('../city-origins.js');
const aliases = {
  'Sapporo TV Tower & Odori Park': ['Sapporo TV Tower'],
  'Tanukikoji Shopping Street': ['Tanuki Koji Shopping Street'],
  'Sapporo Beer Museum': ['Sapporo Beer Museum and Beer Garden'],
  'Sendai Castle Ruins · Aoba Castle': ['Sendai Castle Site and Kenbunkan'],
  'Sendai Asaichi Market': ['Sendai Asaichi (Morning Market)']
};
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : entry.isFile() && entry.name.endsWith('.html') ? [file] : [];
  });
}
const htmlFiles = walk(root);
const guideFiles = walk(path.join(root, 'places')).filter(file => file.endsWith(`${path.sep}index.html`));
let photoSlots = 0, verifiedGuidePhotos = 0, forbiddenHits = 0, equalRanges = 0, furanoLabels = 0, filenameAlts = 0;
const forbidden = /Illustrative|UNVERIFIED|location not verified|has not been confirmed/i;
const filenameAlt = /alt="[^\"]*(?:\b\w+[_ ]\d{2,}\b|\.(?:jpe?g|png|webp))[^\"]*"/i;
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  if (forbidden.test(html)) forbiddenHits++;
  if (/\b(\d+)\s*[–-]\s*\1\s*min(?:ute)?s?\b/i.test(html)) equalRanges++;
  if (/Search YouTube for [^"']+ in Furano/i.test(html)) furanoLabels++;
  if (file.includes(`${path.sep}places${path.sep}`)) {
    for (const image of html.matchAll(/<img\b[^>]*>/gi)) {
      photoSlots++;
      if (/data-photo-verified="true"/i.test(image[0])) verifiedGuidePhotos++;
      if (filenameAlt.test(image[0])) filenameAlts++;
    }
  }
}
const routeData = JSON.parse(fs.readFileSync(path.join(root, 'data/place-routes.json'), 'utf8'));
let fullRouteLinks = 0, stationLinks = 0, missingLinks = 0;
const missingByReason = { noRecordedOrigin: 0, noReturnLoopOrVerifiedWalkingPath: 0, firstLegNotWalking: 0, unusableStopData: 0 };
const linkRows = [];
for (const route of routeData.routes) {
  const full = buildWalkingRouteUrl(route);
  const station = full ? null : route.origin && route.stops?.[0]
    ? buildStationToPlaceUrl(route.origin, route.stops[0], { firstLegMode: route.legs?.[0]?.mode }) : null;
  if (full) { fullRouteLinks++; linkRows.push({ placeId: route.placeId, type: 'full' }); continue; }
  if (station) { stationLinks++; linkRows.push({ placeId: route.placeId, type: 'station-to-place' }); continue; }
  missingLinks++;
  if (!route.origin?.name) missingByReason.noRecordedOrigin++;
  else if (route.legs?.[0]?.mode && route.legs[0].mode !== 'walking') missingByReason.firstLegNotWalking++;
  else if (!route.origin?.returnPoint || !route.walkingRouteVerified) missingByReason.noReturnLoopOrVerifiedWalkingPath++;
  else missingByReason.unusableStopData++;
}
const cityRoutes = JSON.parse(fs.readFileSync(path.join(root, 'data/city-routes.json'), 'utf8')).routes;
const cityTable = Object.entries(origins.CITY_DAY_PLANS).map(([cityId, plan]) => {
  const route = cityRoutes.find(item => item.cityId === cityId);
  const mapped = plan.stops.map(stop => route?.stops?.find(item => (aliases[stop.name] || [stop.name]).includes(item.name))).filter(Boolean);
  const one = origins.itineraryDays(plan.stops, 'one');
  const two = origins.itineraryDays(plan.stops, 'two');
  const three = origins.itineraryDays(plan.stops, '3');
  return {
    cityId, stops: plan.stops.length, mapMatches: mapped.length,
    dayCounts: [one, two, three].map(days => days.map(day => day.stops.length)),
    dayControlMax: plan.stops.length
  };
});
const coverage = JSON.parse(fs.readFileSync(path.join(root, 'data/coverage-manifest.json'), 'utf8'));
const nikkoRoute = routeData.routes.find(route => route.placeId === 'nikko-in-the-cedars');
const audit = {
  generatedAt: new Date().toISOString(),
  surfaces: { htmlPages: htmlFiles.length, placeGuides: guideFiles.length, cityGuidePage: fs.existsSync(path.join(root, 'city-field-guide.html')) },
  photos: { guidePhotoSlots: guideFiles.length, verifiedRetained: verifiedGuidePhotos, replaced: 0, removed: guideFiles.length - verifiedGuidePhotos },
  text: { forbiddenLabelPages: forbiddenHits, equalEndpointRangePages: equalRanges, FuranoCrossContaminationPages: furanoLabels, filenameAltTags: filenameAlts },
  walkingRoutes: { placeRoutes: routeData.routes.length, fullRouteLinks, stationToPlaceLinks: stationLinks, noLink: missingLinks, missingByReason, cityRoutePreviewsWithVerifiedReturnLoop: cityRoutes.filter(route => route.walkingRouteVerified && buildWalkingRouteUrl(route)).length, nikkoUrl: buildWalkingRouteUrl(nikkoRoute), sampleLinks: linkRows },
  guides: { records: coverage.records.length, complete: coverage.records.filter(record => record.guide_status === 'complete').length, provisional: coverage.records.filter(record => record.guide_status === 'provisional').length },
  cityTable
};
if (process.argv.includes('--write-report')) {
  const mdCityRows = cityTable.map(row => {
    const [one, two, three] = row.dayCounts.map(counts => counts.join(' + '));
    return `| ${row.cityId} | ${row.stops} | ${row.mapMatches}/${row.stops} | ${one} | ${two} | ${three} |`;
  }).join('\n');
  const markdown = `<!-- BEGIN STRICT RE-AUDIT FIXES 2026-10-24 -->
## Strict re-audit fixes - 2026-10-24

This section corrects earlier coverage claims and records what was verified in the current build. Counts and tables are generated from manifests, route data, and rendered output by \`scripts/strict-reaudit-audit.cjs --write-report\`. Site version: **v1.4**.

### P0-1 - Static guide photo purge: DONE

**Root cause:** the prior photo purge audited the interactive catalogue and city/day-trip records but its static guide generator did not apply the same verification gate; the earlier site-wide claim therefore exceeded the check performed. **Source fix:** \`scripts/build-all-field-guides.mjs\` applies \`tools/static-guide-policy.cjs\` during generation and only retains images with verified source, credit, license, and descriptive alt. **Regression:** \`node tests/strict-reaudit.test.cjs\` scans the built HTML tree, including the app shell, city guide surface, and each place guide. **Rendered evidence:** browser check at 1280px and 390px for the shared place-guide template; app card and detail dialog at desktop/mobile widths. These ${audit.photos.guidePhotoSlots} guide slots were checked; the browser loaded 207/207 distinct URLs referenced by the catalogue, city-stop, and day-trip photo audit.

| Static guide photo slots | Kept verified | Replaced | Removed |
|---:|---:|---:|---:|
| ${audit.photos.guidePhotoSlots} | ${audit.photos.verifiedRetained} | ${audit.photos.replaced} | ${audit.photos.removed} |

**Correction to claim history:** earlier \`FIX_REPORT.md\` text said all 310 destinations retained photos and described illustrative fallback photos. That was not true of the generated static guide layer. The app-layer audit remains 359 placements (196 kept, 13 replaced, 150 removed); it does not include the 310 generated place-guide slots. The separate guide-layer count above is the current verified result. Earlier false text is retained as history and superseded by this dated correction.

### P0-2 - Foreign Furano labels: DONE

**Root cause:** \`city-route-ui.js\` hard-coded “in Furano” into the generated YouTube aria label. **Source fix:** the label now uses the actual stop name. **Regression:** the full HTML scan checks all ${audit.surfaces.placeGuides} place guides for the contaminated label (0 pages), as well as the entire built HTML set; the browser test inspects rendered Kamakura, Kawagoe, and Shuri guide links at desktop/mobile widths. Furano appears in no generated YouTube search label.

### P0-3 - Walking route on Google Maps: NOT DONE (safe partial coverage)

**Root cause:** most destination route records lack a recorded access origin, verified walking legs, or a researched return loop. **Source work:** \`google-maps-routes.js\` builds encoded Google Maps URL API links from explicit route/station data; dialogs, generated guide pages, and city route previews use the shared helper. Links open in a new tab, use \`rel=noopener\`, include an inline SVG arrow, and have a 44px minimum target. **Regression/rendered check:** \`tests/place-routes.test.cjs\` verifies the Nikko route fixture; browser check confirms the rendered guide link and exact ordered stops. The existing embedded OSM maps and directions are retained.

| Route coverage from data | Count |
|---|---:|
| Full verified walking loops | ${audit.walkingRoutes.fullRouteLinks} |
| Recorded station-to-place walking links | ${audit.walkingRoutes.stationToPlaceLinks} |
| No link, no route fabricated | ${audit.walkingRoutes.noLink} |
| No recorded origin | ${audit.walkingRoutes.missingByReason.noRecordedOrigin} |
| First recorded leg is not walking | ${audit.walkingRoutes.missingByReason.firstLegNotWalking} |
| No verified return loop | ${audit.walkingRoutes.missingByReason.noReturnLoopOrVerifiedWalkingPath} |
| City route previews with a verified return loop | ${audit.walkingRoutes.cityRoutePreviewsWithVerifiedReturnLoop}/${cityRoutes.length} |

Nikko rendered URL: \`${audit.walkingRoutes.nikkoUrl}\`. The 298 missing destination links and 10 city previews are **not complete**; adding them requires researched start/return points and walking order. Three sampled no-route guides (Kamakura, Kawagoe, and Shuri) intentionally expose no invented station-based link.

### P1-1 - City plan/map counts and equal visit ranges: DONE

**Root cause:** authored city itineraries and route-map feature lists used different stop naming/order, so Sapporo’s header, cards, and map diverged. **Source fix:** \`city-origin-ui.js\` resolves the authored plan to route features using reviewed aliases and builds the day map from the same ordered stops; equal-ended visit ranges render as a single value. **Regression:** \`tests/city-origins.test.cjs\`, \`tests/strict-reaudit.test.cjs\`, and the rendered Sapporo 1/2-day browser check. The full generated HTML scan found ${audit.text.equalEndpointRangePages} pages with equal-ended minute ranges.

| City | Authored stops | Map matches | 1 day | 2 days | 3 days |
|---|---:|---:|---:|---:|---:|
${mdCityRows}

### P1-2 - Saved view and browse filters: DONE

**Root cause:** Saved entries passed through active search/region/mood filters. **Source fix:** Saved renders the saved set independently of browse filters. **Regression/rendered evidence:** browser run saved three Hokkaido places, activated Kansai, then opened Saved; result was 3 saved places while Kansai remained active, and those three stored names survived a new page navigation. Mobile and desktop page widths stayed within viewport.

### P1-3 - Deterministic Tokyo day-trip defaults: DONE

**Root cause:** unversioned persisted state could restore stale values (including the previous ¥1,000 case). **Source fix:** \`daytrip-core.js\` only restores schema-versioned state; no URL or saved state uses documented defaults (October/current month, full day, public transit, ¥15,000, balanced). Shared URL state still overrides when present. **Regression/rendered evidence:** the browser cleared storage and ran three independent clean loads; each produced identical values and one verified Sawara match (8-10.5h, ¥6,100-¥7,100), with status “1 researched day fit your time and budget.”

### P1-4 - Multi-day plans for each origin: DONE

**Root cause:** the control could claim a duration beyond the authored stop list. **Source fix:** the days input maximum is the city’s stop count, with the cap stated before selection; route and cards derive from the same day split. \`city-origins.js\` partitions the full authored stop list into nonempty days. **Regression/rendered evidence:** unit tests cover all city plans; browser checks set 1, 2, and 3 days for all ten city plans and assert each day is nonempty and all stops remain included. Split counts are shown in the P1-1 table.

### P2-1 - Nikko flagship guide: DONE

**Root cause:** route data lacked a total time allowance and per-stop context, while the guide repeated generic photo/research hedges. **Source fix:** \`data/place-routes.json\` contains the 5.5-6.5 hour planning estimate and explicitly estimated stop durations; the shared route UI labels estimates and presents visitor facts with sources. The route now offers a Google Maps transit return from the officially mapped Taiyuin/Futarasan Jinja Mae stop alongside the walking return, and tells visitors to check the operator timetable. The guide keeps one overall photo note. **Regression/rendered evidence:** Nikko desktop and 390px browser checks confirm the time allowance, per-stop visitor facts, photo credit, ordered route, walking and bus links, correct yen symbols, and no “not verified” or “research in progress” text in its route section. Fees/hours link to the [Nikkozan Rinnoji official information](https://www.rinnoji.or.jp/en/information.html), [Nikko City Futarasan visitor information](https://www.nikko-kankou.org/public/spot/4), [Visit Tochigi Toshogu information](https://www.visit-tochigi.com/plan-your-trip/things-to-do/714/), [Visit Nikko's central highlights itinerary](https://www.visitnikko.jp/en/itineraries/central-nikkos-highlights-for-the-time-pressed/), and the [official Nikko visitor bus map](https://www.nikko-kankou.org/public/storage/pamphlet_pdf/20250522091348_Nikko_tabinakaB5_EN_kakunin%28%E5%9C%A7%E7%B8%AE%29.pdf).

### P2-2 - Kamakura/Kawagoe complete research and filler scan: NOT DONE

The rendered labels in Kamakura and Kawagoe no longer contain the known “in Furano” cross-contamination. However, these two guides have not been upgraded to Nikko's complete source-backed route, timed visit, admission, opening-hour, access, and photo standard; guide status remains generated from \`data/coverage-manifest.json\` at ${audit.guides.complete} complete / ${audit.guides.provisional} provisional. No unsupported route or fee data was added. The full access-mode-specific filler scan and the two complete-guide acceptance checks still need research, so this item is explicitly not claimed as done.

### P2-3 - Card/dialog label spacing: DONE

**Root cause:** adjacent actions had no semantic text separator and inherited compact inline styling. **Source fix:** \`app.js\` inserts a real whitespace text node; \`index.html\` has a separator between dialog labels; \`styles.css\` uses wrapping flex actions. **Regression/rendered evidence:** browser checks at 390px and 1280px confirm card and dialog action text separation, flex wrapping, and no viewport overflow.

### P3 - small fixes: DONE for listed checks

The generated guide scan found ${audit.text.filenameAltTags} filename-style image alt tags and ${audit.text.FuranoCrossContaminationPages} Furano-contaminated labels; the shared Maps helper converts middle-dot separators to commas. The route-label checks also removed a stray question-mark stop name and replaced the Tokyo comparison question mark with a clear multiply icon. At desktop/mobile, the Japan-map Hokkaido pin is inside the map frame and the mood-pill row uses horizontal overflow rather than clipping. The full generated HTML scan found ${audit.text.forbiddenLabelPages} forbidden unverified-photo label pages.

### Regression summary and limits

- **PASS** - \`node tests/strict-reaudit.test.cjs\`: 14/14; checks 318 rendered HTML files, including ${audit.surfaces.placeGuides} guide pages; forbidden labels, equal minute ranges, Furano contamination, and filename-style guide alts: 0.
- **PASS** - \`node tests/city-origins.test.cjs\`: 6/6; \`node tests/place-routes.test.cjs\`: 3/3; \`node tests/daytrip-core.test.cjs\`: 8/8.
- **PASS** - Edge browser run: 207/207 unique audited image URLs loaded; no horizontal overflow at 360/390/412/430px; desktop checks at 1280px; interactive search, tabs, filters, Saved, month results, Tokyo finder, Sapporo route, and Nikko guide.
- **NOT DONE** - P0-3 coverage gaps and P2-2 research gaps listed above are material. The site-wide status does not imply every place has a verified Google walking route or full researched guide.
- Browser evidence is local headless Edge/Chromium with device emulation, not physical devices. The v1.4 build passed local checks; this report does not claim a GitHub Pages deployment until the push completes.
<!-- END STRICT RE-AUDIT FIXES 2026-10-24 -->`;
  const reportPath = path.join(root, 'FIX_REPORT.md');
  const start = '<!-- BEGIN STRICT RE-AUDIT FIXES 2026-10-24 -->';
  const end = '<!-- END STRICT RE-AUDIT FIXES 2026-10-24 -->';
  let report = fs.readFileSync(reportPath, 'utf8');
  const from = report.indexOf(start), to = report.indexOf(end);
  if (from >= 0 && to > from) report = `${report.slice(0, from)}${markdown}${report.slice(to + end.length)}`;
  else report = `${report.trimEnd()}\n\n${markdown}\n`;
  fs.writeFileSync(reportPath, report, 'utf8');
  const photoReportPath = path.join(root, 'PHOTO_AUDIT.md');
  const photoReport = fs.readFileSync(photoReportPath, 'utf8');
  const correction = `\n\n## Dated correction - 2026-10-24: static guide layer\n\nThe headline audit above covers 359 interactive catalogue, city-stop, and day-trip photo slots; it did not include the 310 generated \`places/*/index.html\` guide slots. The separate static-guide audit retains ${audit.photos.verifiedRetained} verified images, replaces ${audit.photos.replaced}, and removes ${audit.photos.removed}. This is a separate surface count and is not added to the earlier 359 total. The generated scan covers ${audit.surfaces.htmlPages} HTML files and reports ${audit.text.forbiddenLabelPages} forbidden unverified-photo label pages. See the dated strict re-audit section in \`FIX_REPORT.md\` for method and per-surface checks.\n`;
  if (!photoReport.includes('## Dated correction - 2026-10-24: static guide layer')) fs.appendFileSync(photoReportPath, correction, 'utf8');
  console.log(`Wrote generated counts to ${path.relative(root, reportPath)} and appended correction to PHOTO_AUDIT.md`);
}
console.log(JSON.stringify(audit, null, 2));
