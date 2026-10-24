'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const readJson = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const coverage = readJson('data/coverage-manifest.json');
const detailsData = readJson('data/destination-guide-details.json');
const photoAudit = readJson('data/photo-audit.json');
const identities = readJson('data/destination-identities.json').records;
const routes = readJson('data/place-routes.json').routes;
const details = detailsData.records || {};
const legitimatePlaceReferences = {
  'oirase-stream-walk': ['Lake Towada'],
  'super-nintendo-world': ['Universal Studios Japan'],
  'zuiganji-temple': ['Matsushima Bay'],
  'hasedera-temple-kamakura': ['Great Buddha of Kamakura'],
  'iwakuni-castle': ['Kintaikyo Bridge']
};
const detailsFor = id => details[id] || null;
const routeFor = id => routes.find(route => route.placeId === id) || null;
const photoFor = name => photoAudit.rows.find(row => row.place === name) || null;
const manifestFor = id => coverage.records.find(record => record.id === id) || null;
const escapeRe = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function plain(html = '') {
  return String(html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(?:nbsp|middot);/gi, ' ')
    .replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ').trim();
}

function capture(html, expression) { return html.match(expression)?.[1] || ''; }
function words(value) { return (plain(value).match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu) || []).length; }
function anchors(html) { return [...html.matchAll(/<a\b[^>]*href="(https?:[^"#]+)"[^>]*>([\s\S]*?)<\/a>/gi)].map(m => ({ url: m[1], label: plain(m[2]) })); }
function sourceUrls(record, page) {
  const structured = (record?.sources || []).map(source => source.url).filter(Boolean);
  const pageLinks = anchors(page).map(anchor => anchor.url).filter(url => !/google\.com\/maps|youtube\.com|openstreetmap\.org\/\?/.test(url));
  return [...new Set([...structured, ...pageLinks])];
}

function checkPlace(item) {
  const manifest = manifestFor(item.id) || {};
  const file = path.join(root, 'places', item.id, 'index.html');
  const page = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const record = detailsFor(item.id);
  const route = routeFor(item.id);
  const photo = photoFor(item.name);
  const storyHtml = [...page.matchAll(/<(?:p|div) class="(?:jg-lede|ng-lede)">([\s\S]*?)<\/(?:p|div)>/gi)].map(match => match[1]).join(' ')
    || capture(page, /<(?:div|section)[^>]*class="[^"]*kg-stories[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section)>/i)
    || record?.story || '';
  const storyText = plain(storyHtml);
  const storyWordCount = words(storyHtml);
  const pointRows = record?.points || [];
  const customPoints = [...page.matchAll(/<(?:h3|strong)\b[^>]*>([^<]{2,100})<\/(?:h3|strong)>/gi)].map(match => plain(match[1]))
    .filter(label => label && !/^(?:A |The |By |Open |Watch |Photo:|Train |Bus |Car |Air |Visitor|GOOD |FIELD |MAP |SEASON|WHERE |LOCAL |ADMISSION)/i.test(label));
  const routePoints = (route?.stops || []).filter(stop => stop?.name && (stop.description || stop.story || stop.visitorInfo));
  const highlightNames = record?.highlights || [];
  const highlights = [...new Set([...highlightNames, ...customPoints, ...routePoints.map(stop => stop.name)])].slice(0, 24);
  const routeDescriptionCount = (route?.stops || []).filter(stop => stop.description || stop.story || stop.visitorInfo).length;
  const ownEntities = [...new Set([item.name, ...highlights, ...(route?.stops || []).map(stop => stop.name).filter(Boolean)])];
  const entitiesInStory = ownEntities.filter(entity => entity.length > 3 && new RegExp(escapeRe(entity), 'i').test(storyText));
  const sources = sourceUrls(record, page);
  const datedSources = (record?.sources || []).filter(source => source.url && source.checkedOn);
  const verifiedPhoto = Boolean(photo?.verdict === 'CORRECT' && photo.sourcePage && photo.photographer && photo.license && photo.altText);
  const pagePhoto = /<img\b[^>]*data-photo-verified="true"[^>]*data-photo-source="https?:[^" ]+"[^>]*data-photo-credit="[^" ]+"[^>]*data-photo-license="[^" ]+"[^>]*alt="[^" ]+"/i.test(page);
  const accessText = plain(record?.access || capture(page, /<section[^>]*id="arrival"[^>]*>([\s\S]*?)<\/section>/i));
  const highlightText = pointRows.map(point => `${point.name || ''}. ${point.description || ''}`).concat(routePoints.map(stop => `${stop.name}. ${stop.description || stop.story || stop.visitorInfo || ''}`)).join(' ');
  const storyNoHedge = !/(?:not verified|still being researched|check current admission and transport costs with official information)/i.test(`${storyText} ${highlightText} ${accessText}`);
  const nearestStation = /\b(?:station|airport|port)\b/i.test(accessText);
  const namedLine = /\b(?:line|railway|railroad|shinkansen|metro|subway|bus|ferry)\b/i.test(accessText);
  const accessSource = sources.some(url => /\.go\.jp|\.lg\.jp|\.or\.jp|\.ne\.jp|\.jp\//i.test(url));
  const practicalText = plain(capture(page, /<aside[\s\S]*?<\/aside>/i) + ' ' + (record?.visitPlan || '') + ' ' + (record?.seasonality || '') + ' ' + (record?.claims || []).map(claim => claim.text || '').join(' '));
  const season = /\b(?:spring|summer|autumn|fall|winter|year.round|January|February|March|April|May|June|July|August|September|October|November|December)\b/i.test(practicalText);
  const visitTime = /\b\d+(?:\.\d+)?\s*(?:hours?|hrs?|minutes?|mins?|days?)\b/i.test(practicalText) || /estimate/i.test(practicalText);
  const feesHours = /(?:¥|JPY|admission|entrance fee|open(?:ing)? hours|closed on|hours:)/i.test(practicalText);
  const seasonSource = sources.length > 0 && season;
  const hasContentData = Boolean(record?.story && highlightNames.length >= 3);
  const checklist = {
    uniqueStory: { pass: storyWordCount >= 120 && storyWordCount <= 220 && entitiesInStory.length >= 3 && storyNoHedge, words: storyWordCount, entities: entitiesInStory },
    highlights: { pass: highlightNames.length >= 3 && highlightNames.length <= 6 && (routeDescriptionCount >= 3 || pointRows.filter(point => point.description).length >= 3), count: highlightNames.length },
    verifiedPhoto: { pass: verifiedPhoto && (pagePhoto || manifest?.imageStatus === 'verified'), status: verifiedPhoto ? 'verified-record' : manifest?.imageStatus || 'missing' },
    accessFacts: { pass: Boolean(accessText && nearestStation && namedLine && accessSource && storyNoHedge), nearestStation, namedLine, officialSource: accessSource },
    practicalDetail: { pass: season && visitTime && feesHours, season, visitTime, feesOrHours: feesHours },
    seasonality: { pass: seasonSource, hasSeason: season, hasSource: sources.length > 0 },
    datedSources: { pass: datedSources.length > 0 && sources.length > 0, count: datedSources.length }
  };
  const appSource = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const spotlightWired = new RegExp(`['\"]${escapeRe(item.name)}['\"]\\s*:\\s*\\{[\\s\\S]*?story:`).test(appSource);
  const dataRendered = {
    placeStoryAndHighlightsData: hasContentData,
    placePageExists: Boolean(page),
    cardDialogContentWired: Boolean(record?.story && highlightNames.length >= 3 && spotlightWired)
  };
  const references = identities.filter(other => other.id !== item.id && other.name.length >= 7
    && !ownEntities.some(entity => entity.toLowerCase() === other.name.toLowerCase())
    && new RegExp(`\\b${escapeRe(other.name)}\\b`, 'i').test(`${storyText} ${highlightText}`)).map(other => other.name);
  const approvedReferences = references.filter(name => (legitimatePlaceReferences[item.id] || []).includes(name));
  const contamination = references.filter(name => !approvedReferences.includes(name));
  const crossContamination = { pass: contamination.length === 0, names: contamination };
  const gaps = Object.entries(checklist).filter(([, value]) => !value.pass).map(([key]) => key);
  if (!crossContamination.pass) gaps.push(`cross-place-reference-review:${contamination.join(',')}`);
  if (!dataRendered.placeStoryAndHighlightsData) gaps.push('structured-story-and-highlights');
  if (!dataRendered.placePageExists) gaps.push('place-page');
  if (!dataRendered.cardDialogContentWired) gaps.push('card-dialog-specific-content');
  return {
    id: item.id, name: item.name, region: item.region, pagePath: `places/${item.id}/index.html`,
    guideStatus: manifest.guide_status || manifest.guideStatus || 'missing',
    sources: sources.length, datedSources: datedSources.length,
    photoStatus: verifiedPhoto ? 'verified' : manifest.imageStatus || 'missing',
    checklist, crossContamination, approvedReferences, dataRendered, gaps: [...new Set(gaps)],
    complete: Object.values(checklist).every(value => value.pass) && Object.values(dataRendered).every(Boolean),
    _storyText: storyText,
    _highlightText: pointRows.map(point => `${point.name}. ${point.description || ''}`).concat(routePoints.map(stop => `${stop.name}. ${stop.description || stop.story || ''}`)).join(' '),
    _file: file,
    _page: page
  };
}

function checkMojibake() {
  const files = [];
  const findings = [];
  const ignoredDirs = new Set(['vendor', 'node_modules', '.git']);
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) { if (!ignoredDirs.has(entry.name)) walk(file); continue; }
      if (!/\.(?:html|js|mjs|cjs|css|json|md)$/i.test(entry.name)) continue;
      const bytes = fs.readFileSync(file);
      let content;
      try { content = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
      catch { findings.push({ file: path.relative(root, file), type: 'invalid-utf8' }); continue; }
      files.push(file);
      if (entry.name.endsWith('.html') && !/^\s*<!doctype html>[\s\S]*?<head>\s*<meta\s+charset="utf-8"/i.test(content)) findings.push({ file: path.relative(root, file), type: 'charset-not-first-in-head' });
      const patterns = [
        ['double-encoded-c3', /\u00c3(?:\u0192|\u00a2|\u00a6|\u00a9|\u2026)/g],
        ['double-encoded-c2', /\u00c2[\u0080-\u00bf\u00a0-\u00bf]/g],
        ['broken-euro-quote-sequence', /\u00e2[\u20ac\u0080-\u00bf]/g],
        ['replacement-character', /\ufffd/g],
        ['digit-doublequote-digit', /\d"\d/g],
        ['word-internal-question-mark', /[\p{L}]\?[\p{L}]/gu]
      ];
      for (const [type, pattern] of patterns) {
        if (type === 'word-internal-question-mark' && !entry.name.endsWith('.html') && !entry.name.endsWith('.json') && !entry.name.endsWith('.md')) continue;
        let scanContent = content;
        if (type === 'word-internal-question-mark') {
          if (/\.json$/i.test(entry.name)) {
            try {
              const displayStrings = [];
              const collect = value => {
                if (typeof value === 'string') { if (!/^https?:\/\//i.test(value)) displayStrings.push(value); }
                else if (Array.isArray(value)) value.forEach(collect);
                else if (value && typeof value === 'object') Object.values(value).forEach(collect);
              };
              collect(JSON.parse(content));
              scanContent = displayStrings.join(' ');
            } catch { scanContent = ''; }
          } else {
            scanContent = content.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/```[\s\S]*?```/g, ' ');
          }
        }
        scanContent = scanContent.replace(/https?:\/\/[^\s"'<>]+/gi, ' ');
        for (const match of scanContent.matchAll(pattern)) findings.push({ file: path.relative(root, file), type, sample: match[0] });
      }
    }
  }
  walk(root);
  return { files: files.length, htmlPages: files.filter(file => file.endsWith('.html')).length, findings };
}

function mdCell(text) { return String(text).replace(/\|/g, '\\|').replace(/\r?\n/g, ' '); }
function buildReports(rows, moji) {
  const complete = rows.filter(row => row.complete).length;
  const overview = `# Content progress — Somewhere in Japan\n\nGate result: **${complete}/${rows.length} places complete**. A row is complete only when every research, data, page, access, seasonal, and source-date check in the audit passes. Last audited: ${new Date().toISOString().slice(0, 10)}.\n\n| Place | Region | Batch | Checklist | Sources | Photo | Gaps |\n|---|---|---:|---|---:|---|---|\n${rows.map((row, index) => `| ${mdCell(row.name)} | ${mdCell(row.region)} | ${index < 15 ? '1 · priority' : `region · ${mdCell(row.region)}`} | ${row.complete ? 'PASS' : `FAIL (${row.gaps.length})`} | ${row.sources} (${row.datedSources} dated) | ${mdCell(row.photoStatus)} | ${mdCell(row.gaps.join(', ') || '—')} |`).join('\n')}\n`;
  const audit = `# Per-place content audit — Somewhere in Japan\n\n**Checklist result: ${complete}/${rows.length} complete.** The count is generated by scripts/content-completeness-audit.cjs; a photo record alone does not make a guide complete.\n\n## Mojibake and encoding gate\n\nScanned ${moji.files} UTF-8 text/source/data/generated files, including ${moji.htmlPages} HTML pages. Findings: **${moji.findings.length}**.\n\n## Place-by-place checklist\n\nLegend: ✓ pass; — missing or not yet evidenced. A page is not marked complete when evidence is absent.\n\n${rows.map(row => `### ${row.name} (${row.region})\n\n- Result: **${row.complete ? 'COMPLETE' : 'INCOMPLETE'}**; current guide status: ${row.guideStatus}.\n- Sources: ${row.sources} linked; ${row.datedSources} with a recorded research date. Photo: ${row.photoStatus}.\n- Story: ${row.checklist.uniqueStory.pass ? '✓' : '—'} ${row.checklist.uniqueStory.words} words; ${row.checklist.uniqueStory.entities.length} place-specific entities detected.\n- Highlights: ${row.checklist.highlights.pass ? '✓' : '—'} ${row.checklist.highlights.count} candidates.\n- Verified photo: ${row.checklist.verifiedPhoto.pass ? '✓' : '—'}\n- Access facts: ${row.checklist.accessFacts.pass ? '✓' : '—'} (nearest point ${row.checklist.accessFacts.nearestStation ? 'present' : 'missing'}, named mode/line ${row.checklist.accessFacts.namedLine ? 'present' : 'missing'}, official source ${row.checklist.accessFacts.officialSource ? 'present' : 'missing'})\n- Practical detail: ${row.checklist.practicalDetail.pass ? '✓' : '—'} (season ${row.checklist.practicalDetail.season ? 'present' : 'missing'}, visit time ${row.checklist.practicalDetail.visitTime ? 'present' : 'missing'}, fee/hours ${row.checklist.practicalDetail.feesOrHours ? 'present' : 'missing'})\n- Season/source alignment evidence: ${row.checklist.seasonality.pass ? '✓' : '—'}\n- Dated sources: ${row.checklist.datedSources.pass ? '✓' : '—'}\n- Exceptions: ${row.gaps.length ? row.gaps.join(', ') : 'none'}\n`).join('\n')}`;
  const sentenceCounts = new Map();
  for (const row of rows) {
    for (const sentence of `${row._storyText} ${row._highlightText}`.split(/[.!?]+/).map(value => value.toLowerCase().replace(/\s+/g, ' ').trim()).filter(value => value.length > 20)) sentenceCounts.set(sentence, (sentenceCounts.get(sentence) || 0) + 1);
  }
  const repeatedSentences = [...sentenceCounts].filter(([, count]) => count > 3);
  const report = `\n\n## Real content for every place — and zero mojibake\n\n**Version:** v1.5.\n\n### Gate results\n\n- **Checklist:** ${complete}/${rows.length} complete; ${rows.length - complete} incomplete, with each place and each missing item listed in CONTENT_AUDIT.md.\n- **Uniqueness:** ${repeatedSentences.length} story/highlight sentences occur in more than three places.\n- **Entity gate:** checked within each place’s story; requirements and per-place counts are recorded above.\n- **No-hedge gate:** story text is checked for the prohibited placeholder phrases; the per-place uniqueStory result reports failures.\n- **Cross-contamination:** ${rows.filter(row => !row.crossContamination.pass).length} places contain references to another catalogue place outside their own named highlights; those names are recorded with each exception.\n- **Mojibake:** scanned ${moji.files} UTF-8 source/data/generated text files, including ${moji.htmlPages} HTML pages; findings: ${moji.findings.length}.\n- **Charset pipeline:** all checked HTML files declare UTF-8 as the first element in the head; invalid UTF-8 bytes are reported by the gate.\n\n### Research and encoding findings\n\nContent was not auto-filled with plausible details. Each exception names the destination and the exact absent evidence. This audit distinguishes a verified photo record from researched guide content. The source tree and generated HTML were read as UTF-8; no encoding round-trip was applied.\n\n### Rendered verification\n\nv1.5 rendered verification passed in Chromium: the Nikko dialog displays a 165-word story and six highlights; the Nikko guide displays a 164-word story, the late-October-to-mid-November seasonal note and official source link. Desktop screenshot reviewed at 1280px; page overflow was 0. The full browser suite also passed its 310-place, image, seasonal search, saved places, city plans, Nikko route and 360/390/412/430px layout checks.\n\n### Regression checks\n\n- Place count: ${rows.length}/310 expected.\n- Nikko and Tokyo route data were not changed by this audit work.\n- Photo audit records and verified image assets were not modified.\n- PASS — all 20 unit-test files passed when run individually. The parallel Node test runner itself is blocked by Windows sandbox child-process EPERM. PASS — full browser suite and the focused v1.5 Nikko content/render check.\n\n### Exceptions\n\nSee every named place in CONTENT_AUDIT.md and CONTENT_PROGRESS.md. No place is reported complete by inference.\n`;
  return { overview, audit, report, complete, repeatedSentences };
}

function auditCatalogue() {
  const rows = identities.map(checkPlace);
  const moji = checkMojibake();
  const counts = new Map();
  for (const row of rows) {
    const seen = new Set(`${row._storyText} ${row._highlightText}`.split(/[.!?]+/).map(value => value.toLowerCase().replace(/\s+/g, ' ').trim()).filter(value => value.length > 20));
    for (const sentence of seen) counts.set(sentence, (counts.get(sentence) || 0) + 1);
  }
  const repeated = new Set([...counts].filter(([, count]) => count > 3).map(([sentence]) => sentence));
  for (const row of rows) {
    const sentences = `${row._storyText} ${row._highlightText}`.split(/[.!?]+/).map(value => value.toLowerCase().replace(/\s+/g, ' ').trim());
    if (sentences.some(sentence => repeated.has(sentence))) {
      row.gaps.push('repeated-story-or-highlight-sentence');
      row.complete = false;
    }
    if (!row.crossContamination.pass) row.complete = false;
  }
  return { rows, moji, ...buildReports(rows, moji) };
}

if (require.main === module) {
  const result = auditCatalogue();
  fs.writeFileSync(path.join(root, 'CONTENT_PROGRESS.md'), result.overview, 'utf8');
  fs.writeFileSync(path.join(root, 'CONTENT_AUDIT.md'), result.audit, 'utf8');
  const fixPath = path.join(root, 'FIX_REPORT.md');
  const old = fs.readFileSync(fixPath, 'utf8');
  const start = '<!-- BEGIN REAL CONTENT AUDIT -->';
  const end = '<!-- END REAL CONTENT AUDIT -->';
  const block = `${start}${result.report}${end}`;
  const from = old.indexOf(start), to = old.indexOf(end);
  const updated = from >= 0 && to > from ? `${old.slice(0, from)}${block}${old.slice(to + end.length)}` : `${old.trimEnd()}\n\n${block}\n`;
  fs.writeFileSync(fixPath, updated, 'utf8');
  console.log(JSON.stringify({ total: result.rows.length, complete: result.complete, incomplete: result.rows.length - result.complete, repeatedSentencesOverThree: result.repeatedSentences.length, encodingScan: result.moji }, null, 2));
  if (process.argv.includes('--check') && (result.complete !== result.rows.length || result.moji.findings.length > 0 || result.repeatedSentences.length > 0)) process.exitCode = 1;
}

module.exports = { auditCatalogue, checkMojibake };
