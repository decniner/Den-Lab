/* Tadaima! — SHARED edition app for all cities (2026-10-24 improvement pass).
   One app serves every edition; per-city differences (station tiers,
   walk-band benchmarks, Maps query prefix) come from the edition's own
   data.js `scoring` block, injected by apply_site_config.py.
   Transparent "worth a look" ranking:
   Score = Value 45 + Location 30 + Space 15 + Confidence 10, minus 7 per
   major caution. Every component is explained on the card and in the
   detail view. No black box. */
(function () {
  "use strict";
  var D = window.TADAIMA_DATA;
  var props = D.properties.slice();
  var TSUBO = 3.305785; // m2 per tsubo
  var SCORING = D.scoring || {};
  var TIER = SCORING.tier || {};
  var WB = SCORING.walkBand || [40, 40, 40];

  // ---------- Japanese UI (Phase 5) ----------
  // LANG switches every string this app renders, plus the interface chrome
  // of the (uniform) static page. Editorial prose (lede, market analysis)
  // stays as written; legal/financial terms use the exact Japanese terms.
  var LANG = "en";
  try { LANG = localStorage.getItem("tadaima-lang") === "ja" ? "ja" : "en"; } catch (e) { /* storage blocked */ }
  var STR = {
    from:        { en: "from ", ja: "" },
    fromSuffix:  { en: "", ja: "〜" },
    originalListing: { en: "Original listing ↗", ja: "元の掲載ページ ↗" },
    portalResults:   { en: "Portal results ↗", ja: "ポータルの検索結果 ↗" },
    srcDetail:   { en: function (p) { return "Source: " + p.source.name + " · listing info " + p.source.infoDate + " · checked " + D.site.researchedOn; },
                   ja: function (p) { return "出典: " + p.source.name + " · 掲載情報 " + p.source.infoDate + " · " + D.site.researchedOn + " 確認"; } },
    srcIndex:    { en: function (p) { return "Source: " + p.source.name + " · found via an index page — open the portal results to locate the current listing · listing info " + p.source.infoDate + " · checked " + D.site.researchedOn; },
                   ja: function (p) { return "出典: " + p.source.name + " · 一覧ページ経由で収録 — 現在の掲載はポータル結果から確認してください · 掲載情報 " + p.source.infoDate + " · " + D.site.researchedOn + " 確認"; } },
    value:       { en: "Value", ja: "価格" },
    location:    { en: "Location", ja: "立地" },
    space:       { en: "Space", ja: "広さ" },
    confidence:  { en: "Confidence", ja: "信頼度" },
    scoreName:   { en: "Worth-a-look score", ja: "注目度スコア" },
    scoreSub:    { en: "Value · Location · Space · Confidence", ja: "価格 · 立地 · 広さ · 信頼度" },
    topPick:     { en: "Top pick #", ja: "おすすめ #" },
    newWeek:     { en: "New this week", ja: "今週の新着" },
    priceDrop:   { en: "Price ↓ ¥", ja: "値下げ ¥" },
    save:        { en: "Save this property", ja: "この物件を保存" },
    unsave:      { en: "Remove this property from saved", ja: "保存を取り消す" },
    station:     { en: "Station", ja: "駅" },
    land:        { en: "Land", ja: "土地" },
    building:    { en: "Building", ja: "建物" },
    zoning:      { en: "Zoning", ja: "用途地域" },
    seeListing:  { en: "See listing", ja: "掲載を確認" },
    built:       { en: "Built", ja: "築年月" },
    coverFar:    { en: "Cover / FAR", ja: "建ぺい率 / 容積率" },
    viewDetails: { en: "View details", ja: "詳細を見る" },
    moreCautions:{ en: " more in details", ja: " 件の注意点が詳細にあります" },
    stale:       { en: function (p) { return "⏳ Listing info from " + monthYear(p.source.infoDate) + " — re-check availability before visiting."; },
                   ja: function (p) { return "⏳ 掲載情報は " + monthYear(p.source.infoDate) + " 時点 — 見学前に空き状況を再確認してください。"; } },
    countOf:     { en: function (a, b) { return a + " of " + b + " properties"; },
                   ja: function (a, b) { return b + " 件中 " + a + " 件"; } },
    whyScore:    { en: "Why this score", ja: "このスコアの理由" },
    penalty:     { en: function (n) { return "Score reduced by " + n + " for the major caution below."; },
                   ja: function (n) { return "下記の重要な注意点により " + n + " 点減点されています。"; } },
    highlights:  { en: "Highlights", ja: "おすすめポイント" },
    checkFirst:  { en: "Check before you visit", ja: "見学前に確認すること" },
    facts:       { en: "Facts as listed", ja: "掲載内容（事実）" },
    walkMin:     { en: " min", ja: " 分" },
    openOriginal:{ en: "Open original listing on ", ja: "元の掲載を開く: " },
    openPortal:  { en: "Open portal results on ", ja: "ポータルの結果を開く: " },
    seeMap:      { en: "See the area on a map ↗", ja: "地図で周辺を見る ↗" },
    srcLine:     { en: function (p) { return "Source: " + p.source.name + " · information date " + p.source.infoDate + " · collected " + D.site.researchedOn + ". Listings change and sell — always confirm price and availability on the original listing."; },
                   ja: function (p) { return "出典: " + p.source.name + " · 情報公開日 " + p.source.infoDate + " · 収集日 " + D.site.researchedOn + "。掲載は変わり、売れてしまうこともあります — 価格と空き状況は必ず元の掲載で確認してください。"; } },
    staleDetail: { en: function (p) { return "⏳ Listing information date " + p.source.infoDate + " — older than 90 days at research time. Re-check availability before visiting."; },
                   ja: function (p) { return "⏳ 情報公開日 " + p.source.infoDate + " — 調査時点で90日以上前の情報です。見学前に空き状況を再確認してください。"; } }
  };
  function t(key) { var v = STR[key]; return v ? v[LANG] : key; }
  function L2(en, ja) { return LANG === "ja" ? ja : en; }
  function tf(key) { var v = STR[key]; return v && v[LANG]; }
  var WALK_BAND = function (w) { return w <= 5 ? WB[0] : (w <= 10 ? WB[1] : WB[2]); }; // 万円/坪, MLIT transactions via Utinokati

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(points, x) {
    if (x <= points[0][0]) return points[0][1];
    for (var i = 1; i < points.length; i++) {
      if (x <= points[i][0]) {
        var x0 = points[i - 1][0], y0 = points[i - 1][1], x1 = points[i][0], y1 = points[i][1];
        return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
      }
    }
    return points[points.length - 1][1];
  }
  function median(arr) {
    var s = arr.slice().sort(function (a, b) { return a - b; });
    var m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  function fmt(n, d) { return n.toLocaleString("en-US", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  function daysBetween(a, b) { return Math.round((Date.parse(b) - Date.parse(a)) / 86400000); }
  function monthYear(iso) {
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var p = (iso || "").split("-");
    return p.length >= 2 ? months[+p[1] - 1] + " " + p[0] : iso;
  }

  // A source URL is only "the original listing" when it was verified on the
  // property's own detail page AND no other property in this edition shares
  // it. Everything else is a portal index/results page and is labelled so.
  var urlCounts = {};
  props.forEach(function (p) { urlCounts[p.source.url] = (urlCounts[p.source.url] || 0) + 1; });
  function isDetail(p) { return p.source.verified === "detail" && urlCounts[p.source.url] === 1; }
  function sourceBtnText(p) { return isDetail(p) ? t("originalListing") : t("portalResults"); }
  function sourceLine(p) { return tf(isDetail(p) ? "srcDetail" : "srcIndex")(p); }
  // Listing-info staleness, measured against the edition's research date.
  function staleDays(p) { return p.source.infoDate ? daysBetween(p.source.infoDate, D.site.researchedOn) : 0; }
  function isStale(p) { return staleDays(p) > 90; }
  // Implausible building/land ratio (figures as listed, unverified).
  function hasAnomaly(p) { return !!(p.buildingM2 && p.landM2 && p.buildingM2 > p.landM2 * 2); }
  function anomalyCovered(p) {
    return (p.cautions || []).some(function (c) { return /unverif|implausib/i.test(c); });
  }
  function effectiveCautions(p) {
    var cs = (p.cautions || []).slice();
    if (hasAnomaly(p) && !anomalyCovered(p)) {
      cs.push(LANG === "ja"
        ? "掲載値のまま — 建物 " + fmt(p.buildingM2, 1) + " m² に対し土地 " + fmt(p.landM2, 1) + " m² と比率が不自然で、未確認です。双方の数値を業者に確認してください。"
        : "Building/land figures as listed — implausible ratio (" + fmt(p.buildingM2, 1) + " m² building on " + fmt(p.landM2, 1) + " m² of land), unverified. Confirm both figures with the agent.");
    }
    return cs;
  }

  // Precompute group medians for houses (price per m2 of floor area).
  // Section records (e.g. Kawagoe's Shimohiroya extension) are scored
  // against the MAIN collection's medians and never move them, so adding
  // a section can never silently re-score the existing edition.
  var groupMedian = {};
  ["house-new", "house-used"].forEach(function (t) {
    groupMedian[t] = median(props.filter(function (p) { return p.type === t && !p.section; })
      .map(function (p) { return p.priceMan / p.buildingM2; }));
  });

  function score(p) {
    var parts = {}, reasons = [];
    // --- Value (45)
    if (p.type === "land") {
      var ppT = p.priceMan / (p.landM2 / TSUBO);
      var benchStation = D.benchmarks.landPerTsuboManByStation[p.station] || 40;
      var bench = (benchStation + WALK_BAND(p.walkMin)) / 2;
      var ratio = ppT / bench;
      parts.value = lerp([[0.45, 45], [1.0, 24], [1.6, 4]], ratio);
      var diff = Math.round((1 - ratio) * 100);
      reasons.push({ pts: parts.value, max: 45, label: t("value"),
        text: LANG === "ja"
          ? "坪単価 ¥" + fmt(ppT, 1) + "万 — " + p.stationJa + "駅のベンチマーク ¥" + fmt(bench, 1) + "万（国土交通省の取引平均より " + Math.abs(diff) + "% " + (diff >= 0 ? "割安" : "割高") + "）"
          : "¥" + fmt(ppT, 1) + "万 per tsubo vs ¥" + fmt(bench, 1) + "万 benchmark for " + p.station +
              " (" + (diff >= 0 ? diff + "% below" : Math.abs(diff) + "% above") + " MLIT transaction averages)" });
      p._unit = "¥" + fmt(ppT, 1) + "万/坪";
    } else {
      var ppM = p.priceMan / p.buildingM2;
      var med = groupMedian[p.type];
      var r = ppM / med;
      parts.value = lerp([[0.7, 45], [1.0, 24], [1.3, 4]], r);
      var d2 = Math.round((1 - r) * 100);
      reasons.push({ pts: parts.value, max: 45, label: t("value"),
        text: LANG === "ja"
          ? "床面積1m²あたり ¥" + fmt(ppM, 1) + "万 — 本コレクションの" + (p.type === "house-new" ? "新築" : "中古") + "住宅の中央値 ¥" + fmt(med, 1) + "万より " + Math.abs(d2) + "% " + (d2 >= 0 ? "割安" : "割高")
          : "¥" + fmt(ppM, 1) + "万 per m² of floor area vs ¥" + fmt(med, 1) + "万 median for " +
              (p.type === "house-new" ? "new" : "used") + " houses in this collection (" +
              (d2 >= 0 ? d2 + "% below" : Math.abs(d2) + "% above") + ")" });
      p._unit = "¥" + fmt(ppM, 1) + "万/m²";
    }
    // --- Location (30)
    var walkPts = 22 - (p.walkMin - 2) * (14 / 13);
    parts.location = clamp(walkPts, 8, 22) + (TIER[p.station] || 4);
    reasons.push({ pts: parts.location, max: 30, label: t("location"),
      text: LANG === "ja" ? p.stationJa + "駅まで徒歩" + p.walkMin + "分（" + p.lineJa + "）"
                          : p.walkMin + " min walk to " + p.station + " Station (" + p.line + ")" });
    // --- Space (15)
    if (p.type === "land") {
      parts.space = lerp([[70, 4], [100, 8], [130, 11], [170, 14], [220, 15], [320, 12], [400, 11]], p.landM2);
      reasons.push({ pts: parts.space, max: 15, label: t("space"),
        text: LANG === "ja" ? "土地 " + fmt(p.landM2, 1) + " m²（" + fmt(p.landM2 / TSUBO, 1) + " 坪）"
                            : fmt(p.landM2, 1) + " m² of land (" + fmt(p.landM2 / TSUBO, 1) + " tsubo)" });
    } else {
      parts.space = lerp([[80, 5], [120, 15]], p.buildingM2);
      reasons.push({ pts: parts.space, max: 15, label: t("space"),
        text: LANG === "ja" ? "延床 " + fmt(p.buildingM2, 1) + " m²（土地 " + fmt(p.landM2, 1) + " m²）"
                            : fmt(p.buildingM2, 1) + " m² floor area on " + fmt(p.landM2, 1) + " m² of land" });
    }
    // --- Confidence (10) — bands are AGES relative to the edition's
    // researchedOn date, never hardcoded calendar dates (2026-10-24 fix:
    // the old "2026-10-15"/"2026-09-01" thresholds rotted silently).
    if (p.source.verified === "detail") {
      var age = staleDays(p);
      parts.confidence = age <= 14 ? 10 : (age <= 60 ? 9 : 8);
      reasons.push({ pts: parts.confidence, max: 10, label: t("confidence"),
        text: LANG === "ja" ? p.source.name + " の物件詳細ページで確認済み（情報公開日 " + p.source.infoDate + "）"
                            : "Verified on the " + p.source.name + " listing page (information date " + p.source.infoDate + ")" });
    } else {
      parts.confidence = 6;
      reasons.push({ pts: parts.confidence, max: 10, label: t("confidence"),
        text: LANG === "ja" ? p.source.name + " の一覧ページから収録 — 見学前に最新の掲載を確認してください"
                            : "Taken from a " + p.source.name + " index page — re-check the live listing before visiting" });
    }
    var penalty = 7 * (p.majorCautions || 0);
    var total = Math.round(parts.value + parts.location + parts.space + parts.confidence - penalty);
    return { total: clamp(total, 1, 99), parts: parts, penalty: penalty, reasons: reasons };
  }

  props.forEach(function (p) { p._score = score(p); });
  // Section records are scored by the same maths but ranked only inside
  // their section — they never take an edition top-pick slot (or shift a
  // rank) away from the main collection.
  function computeRanked() {
    return props.filter(function (p) { return !p.section; })
      .sort(function (a, b) { return b._score.total - a._score.total; });
  }
  var ranked = computeRanked();
  ranked.forEach(function (p, i) { p._rank = i + 1; });

  // ---------- Saved (namespaced per city — the pre-2026-10-24 key
  // "tadaima-saved" was shared by every edition while property IDs repeat
  // in each city, so a save in one city lit up the same ID everywhere).
  var SLUG = (D.site.edition || "city").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  var SAVE_KEY = "tadaima-saved-v2-" + SLUG;
  var saved = {};
  var legacyReset = false;
  try {
    if (localStorage.getItem("tadaima-saved") !== null) {
      localStorage.removeItem("tadaima-saved"); // ambiguous across cities by definition — cleared, never guessed
      legacyReset = true;
    }
    saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
  } catch (e) { saved = {}; }

  // ---------- UI ----------
  var state = { type: "all", maxPrice: 5000, maxWalk: 15, station: "all", sort: "score", q: "", savedOnly: false, layout: "all", minLand: 0 };
  // Filters are shareable: state initialises from the URL and is written
  // back on every change (2026-10-24, P1-4).
  try {
    var qs = new URLSearchParams(window.location.search);
    if (qs.get("type")) state.type = qs.get("type");
    if (qs.get("price")) state.maxPrice = +qs.get("price") || state.maxPrice;
    if (qs.get("walk")) state.maxWalk = +qs.get("walk") || state.maxWalk;
    if (qs.get("station")) state.station = qs.get("station");
    if (qs.get("sort")) state.sort = qs.get("sort");
    if (qs.get("q")) state.q = qs.get("q");
    if (qs.get("saved")) state.savedOnly = qs.get("saved") === "1";
    if (qs.get("layout")) state.layout = qs.get("layout");
    if (qs.get("minland")) state.minLand = +qs.get("minland") || 0;
  } catch (e) { /* no URL state — defaults apply */ }
  function syncURL() {
    try {
      var q = new URLSearchParams();
      if (state.type !== "all") q.set("type", state.type);
      if (state.maxPrice !== 5000) q.set("price", state.maxPrice);
      if (state.maxWalk !== 15) q.set("walk", state.maxWalk);
      if (state.station !== "all") q.set("station", state.station);
      if (state.sort !== "score") q.set("sort", state.sort);
      if (state.q) q.set("q", state.q);
      if (state.savedOnly) q.set("saved", "1");
      if (state.layout !== "all") q.set("layout", state.layout);
      if (state.minLand) q.set("minland", state.minLand);
      var s = q.toString();
      history.replaceState(null, "", s ? "?" + s : window.location.pathname);
    } catch (e) { /* history unavailable (e.g. file://) — filtering still works */ }
  }

  var $ = function (id) { return document.getElementById(id); };
  var grid = $("grid"), count = $("count");

  if (legacyReset) {
    var note = document.createElement("p");
    note.className = "saved-reset-note";
    note.textContent = LANG === "ja"
      ? "保存リストをリセットしました — 以前は都市の異なる物件が混ざっていました。今後は都市ごとに別々に保存されます。"
      : "Saved list reset — it previously mixed properties from different cities. Your saves are now kept separately for each city.";
    var controlsEl = document.querySelector(".controls");
    if (controlsEl && controlsEl.parentNode) controlsEl.parentNode.insertBefore(note, controlsEl);
  }

  var TYPE_LABEL = { "house-new": ["New house", "新築一戸建て"], "house-used": ["Used house", "中古一戸建て"], "land": ["Land / lot", "土地"] };

  function priceText(p) {
    return (p.priceFrom ? t("from") : "") + "¥" + fmt(p.priceMan) + "万" + (p.priceFrom ? t("fromSuffix") : "");
  }
  function mapsUrl(p) {
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent((SCORING.mapsQuery || D.site.areaJa) + p.districtJa + " " + p.stationJa + "駅");
  }

  function card(p) {
    var s = p._score;
    var top = ranked.indexOf(p) < 3;
    var el = document.createElement("article");
    el.className = "card" + (top ? " card-top" : "");
    var reasonsTop = s.reasons.slice().sort(function (a, b) { return b.pts / b.max - a.pts / a.max; }).slice(0, 2);
    var cautions = effectiveCautions(p);
    var scoreAria = t("scoreName") + " " + s.total + (LANG === "ja" ? " / 100。" : " out of 100. ") + s.reasons.map(function (r) { return r.label + " " + Math.round(r.pts) + (LANG === "ja" ? " / " : " of ") + r.max + (LANG === "ja" ? "。" : "."); }).join(" ");
    el.innerHTML =
      '<div class="card-head"><span class="type-chip">' + TYPE_LABEL[p.type][0] + " · " + TYPE_LABEL[p.type][1] + "</span>" +
      (top ? '<span class="top-chip">' + t("topPick") + p._rank + "</span>" : "") +
      (p.isNew ? '<span class="new-chip">' + t("newWeek") + "</span>" : "") +
      (p.priceDropMan ? '<span class="drop-chip">' + t("priceDrop") + fmt(p.priceDropMan) + "万</span>" : "") +
      (p.section && D.sections && D.sections[p.section] ? '<span class="sec-chip">' + (LANG === "ja" ? D.sections[p.section].chipJa : D.sections[p.section].chip) + "</span>" : "") +
      '<button class="save-btn" aria-pressed="' + !!saved[p.id] + '" aria-label="' + (saved[p.id] ? t("unsave") : t("save")) + '" title="' + t("save") + '">' + (saved[p.id] ? "♥" : "♡") + "</button></div>" +
      '<h3 class="card-district">' + p.district + ' <span class="jp">' + p.districtJa + "</span></h3>" +
      '<p class="card-title">' + p.title + "</p>" +
      '<div class="price-row"><span class="price">' + priceText(p) + '</span><span class="unit">' + p._unit + "</span></div>" +
      '<div class="score-row" role="img" aria-label="' + scoreAria + '"><span class="score-num">' + s.total + '</span><span class="score-label">' + t("scoreName") + '<br><span class="score-sub">' + t("scoreSub") + '</span></span>' +
      '<span class="score-bar" aria-hidden="true"><span style="width:' + s.total + '%"></span></span></div>' +
      '<dl class="specs">' +
      "<div><dt>" + t("station") + "</dt><dd>" + (LANG === "ja" ? p.stationJa + " · 徒歩" + p.walkMin + "分" : p.station + " · " + p.walkMin + " min") + "</dd></div>" +
      "<div><dt>" + t("land") + "</dt><dd>" + fmt(p.landM2, 1) + " m²</dd></div>" +
      (p.buildingM2 ? "<div><dt>" + t("building") + "</dt><dd>" + fmt(p.buildingM2, 1) + " m² · " + p.layout + "</dd></div>"
                    : "<div><dt>" + t("zoning") + "</dt><dd>" + (p.zoning || t("seeListing")) + "</dd></div>") +
      (p.built ? "<div><dt>" + t("built") + "</dt><dd>" + p.built + "</dd></div>" : "<div><dt>" + t("coverFar") + "</dt><dd>" + (p.coverageFar || "—") + "</dd></div>") +
      "</dl>" +
      '<ul class="reasons">' + reasonsTop.map(function (r) { return "<li><strong>" + r.label + ":</strong> " + r.text + "</li>"; }).join("") + "</ul>" +
      (isStale(p) ? '<p class="stale">' + tf("stale")(p) + "</p>" : "") +
      (cautions.length ? '<p class="caution">⚠ ' + cautions[0] + (cautions.length > 1 ? " (+" + (cautions.length - 1) + t("moreCautions") + ")" : "") + "</p>" : "") +
      '<div class="card-actions"><button class="btn btn-detail">' + t("viewDetails") + '</button>' +
      '<a class="btn btn-source" href="' + p.source.url + '" target="_blank" rel="noopener">' + sourceBtnText(p) + "</a></div>" +
      '<p class="src">' + sourceLine(p) + "</p>";
    el.querySelector(".save-btn").addEventListener("click", function () {
      if (saved[p.id]) { delete saved[p.id]; } else { saved[p.id] = 1; }
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(saved)); } catch (e) { /* storage blocked — save still shows for this session */ }
      render();
    });
    el.querySelector(".btn-detail").addEventListener("click", function () { openDetail(p); });
    return el;
  }

  function passes(p) {
    if (state.type !== "all" && p.type !== state.type) return false;
    if (p.priceMan > state.maxPrice) return false;
    // Section records are exempt from the walk cap only — breaching it is
    // their section's stated premise, flagged on the section heading and
    // on every section card. Every other filter still applies to them.
    if (p.walkMin > state.maxWalk && !p.section) return false;
    if (state.station !== "all" && p.station !== state.station) return false;
    if (state.layout !== "all" && p.layout !== state.layout) return false;
    if (state.minLand && p.landM2 < state.minLand) return false;
    if (state.savedOnly && !saved[p.id]) return false;
    if (state.q) {
      var hay = (p.district + " " + p.districtJa + " " + p.station + " " + p.stationJa + " " + p.title).toLowerCase();
      if (hay.indexOf(state.q.toLowerCase()) === -1) return false;
    }
    return true;
  }

  function sortList(list) {
    if (state.sort === "price") list.sort(function (a, b) { return a.priceMan - b.priceMan; });
    if (state.sort === "walk") list.sort(function (a, b) { return a.walkMin - b.walkMin; });
    if (state.sort === "score") list.sort(function (a, b) { return b._score.total - a._score.total; });
    return list;
  }
  function sectionHead(key) {
    var meta = D.sections[key];
    var el = document.createElement("div");
    el.className = "section-head";
    el.id = "section-" + key;
    el.innerHTML = "<h2>" + (LANG === "ja" ? meta.titleJa : meta.title) + ' <span class="jp">' + meta.nameJa + "</span></h2>" +
      "<p>" + (LANG === "ja" ? meta.noteJa : meta.note) + "</p>";
    return el;
  }
  function render() {
    var list = sortList(ranked.filter(passes));
    grid.innerHTML = "";
    list.forEach(function (p) { grid.appendChild(card(p)); });
    var shown = list.length;
    // Extension sections (data-driven via D.sections; only Kawagoe has
    // one today) render under their own heading after the main grid.
    if (D.sections) {
      Object.keys(D.sections).forEach(function (key) {
        var slist = sortList(props.filter(function (p) { return p.section === key; }).filter(passes));
        if (!slist.length) return;
        grid.appendChild(sectionHead(key));
        slist.forEach(function (p) { grid.appendChild(card(p)); });
        shown += slist.length;
      });
    }
    count.textContent = tf("countOf")(shown, props.length);
    $("empty").style.display = shown ? "none" : "block";
    $("savedCount").textContent = Object.keys(saved).length;
    syncURL();
  }

  // ---------- True-cost estimator (Phase 2, 2026-10-24) ----------
  // Every rate is a published figure, printed next to its line with its
  // source, and every input is adjustable. The one thing no listing shows —
  // the fixed-asset-tax assessed value (評価額) — is an explicit planning
  // assumption the user can replace, never a hidden constant.
  function brokerageYen(priceYen) {
    // Legal maximum, MLIT cap under the Real Estate Transaction Business Act:
    // >¥4M: (3% + ¥60,000) + 10% consumption tax; ¥2–4M: (4% + ¥20,000) + tax;
    // ≤¥2M: 5% + tax.
    if (priceYen > 4000000) return Math.round((priceYen * 0.03 + 60000) * 1.1);
    if (priceYen > 2000000) return Math.round((priceYen * 0.04 + 20000) * 1.1);
    return Math.round(priceYen * 0.05 * 1.1);
  }
  function stampYen(priceYen) {
    // Reduced stamp-duty bands for real-estate contracts to 31 Mar 2027 (NTA).
    if (priceYen <= 1000000) return 200;
    if (priceYen <= 5000000) return 1000;
    if (priceYen <= 10000000) return 5000;
    if (priceYen <= 50000000) return 10000;
    return 30000;
  }
  var costState = { assessedPct: 70, landShare: 50, depositPct: 10, loan: false, buildTsuboPrice: 0, buildTsubo: 30 };
  var currentDetail = null;
  function yen(n) { return "¥" + Math.round(n).toLocaleString("en-US"); }
  function costModel(p) {
    var price = p.priceMan * 10000;
    var assessed = price * costState.assessedPct / 100;
    var landShare = p.type === "land" ? 100 : costState.landShare;
    var aLand = assessed * landShare / 100, aBldg = assessed - aLand;
    var lines = [];
    lines.push({ label: L2("Purchase price", "物件価格"), formula: L2("as listed", "掲載価格") + (p.priceFrom ? L2(" (starting price — subdivision range)", "（分譲地の最低価格）") : ""), yen: price });
    var brok = brokerageYen(price);
    lines.push({ label: L2("Brokerage 仲介手数料 (legal maximum)", "仲介手数料（法定上限）"), formula: price > 4000000 ? L2("(price × 3% + ¥60,000) × 1.10 consumption tax — MLIT cap", "（価格 × 3% + ¥60,000）× 消費税10% — 国土交通省の上限") : L2("MLIT tiered cap + 10% consumption tax", "国土交通省の段階制上限 + 消費税10%"), yen: brok,
      note: p.type === "house-new" ? L2("Often not charged when buying a new build directly from the developer — ask.", "新築をデベロッパーから直接買う場合は不要なことが多い — 要確認。") : null });
    lines.push({ label: L2("Stamp duty 印紙税", "印紙税"), formula: L2("reduced band for contracts to 31 Mar 2027 (National Tax Agency)", "2027年3月31日までの契約に適用される軽減税率（国税庁）"), yen: stampYen(price) });
    lines.push({ label: L2("Registration tax 登録免許税", "登録免許税"), formula: L2("assessed land × 1.5% (rate to 31 Mar 2029) + assessed building × 2%", "土地の評価額 × 1.5%（2029年3月31日までの税率）+ 建物の評価額 × 2%"), yen: aLand * 0.015 + aBldg * 0.02 });
    lines.push({ label: L2("Real-estate acquisition tax 不動産取得税", "不動産取得税"), formula: L2("(assessed land × ½ + assessed building) × 3% — residential rates to 31 Mar 2027; billed by the prefecture months later; home-buyer deductions not applied here", "（土地の評価額 × ½ + 建物の評価額）× 3% — 2027年3月31日までの住宅税率。数か月後に都道府県から課税。住宅向け軽減は未適用"), yen: (aLand * 0.5 + aBldg) * 0.03 });
    lines.push({ label: L2("Judicial scrivener 司法書士報酬", "司法書士報酬"), formula: L2("market estimate — 2024 national survey average ¥56,678 for a transfer registration; varies by office", "市場目安 — 2024年全国調査の平均は所有権移転登記で ¥56,678。事務所により異なる"), yen: 60000 });
    var loanAmt = 0;
    if (costState.loan) {
      loanAmt = Math.max(0, price * (100 - costState.depositPct) / 100);
      lines.push({ label: L2("Mortgage registration tax", "抵当権設定の登録免許税"), formula: L2("loan × 0.4% (登録免許税; 0.1% for a qualifying own-home loan)", "借入額 × 0.4%（登録免許税。自宅用の要件を満たす場合は 0.1%）"), yen: loanAmt * 0.004 });
    }
    var buildCost = 0;
    if (p.type === "land" && costState.buildTsuboPrice > 0) {
      buildCost = costState.buildTsuboPrice * 10000 * costState.buildTsubo;
      lines.push({ label: L2("New-build construction (your figures)", "新築建築費（入力値）"), formula: L2("¥" + fmt(costState.buildTsuboPrice, 0) + "万 per tsubo × " + costState.buildTsubo + " tsubo — a planning figure you set, not a quote", "坪単価 ¥" + fmt(costState.buildTsuboPrice, 0) + "万 × " + costState.buildTsubo + " 坪 — 見積もりではなく、あなたが設定した計画値"), yen: buildCost });
    }
    var fees = lines.slice(1).reduce(function (a, l) { return a + l.yen; }, 0);
    var cashNeeded = costState.loan ? (price - loanAmt + fees) : (price + fees);
    // First-year fixed asset + city planning tax estimate on the same
    // assessed-value assumption, with the residential-land base reductions.
    var lm2 = p.landM2 || 0;
    var smallShare = lm2 ? Math.min(lm2, 200) / lm2 : 0;
    var fatBase = aLand * (smallShare / 6 + (1 - smallShare) / 3) + aBldg;
    var cptBase = aLand * (smallShare / 3 + (1 - smallShare) * 2 / 3) + aBldg;
    var annual = fatBase * 0.014 + cptBase * 0.003;
    return { lines: lines, fees: fees, cashNeeded: cashNeeded, loanAmt: loanAmt, buildCost: buildCost, annual: annual };
  }
  function costRowsHtml(p) {
    var m = costModel(p);
    var rows = m.lines.map(function (l) {
      return '<div class="cost-row"><span>' + l.label + "<br><small>" + l.formula + "</small>" + (l.note ? "<br><small>" + l.note + "</small>" : "") + '</span><span class="cost-yen">' + yen(l.yen) + "</span></div>";
    }).join("");
    return rows +
      '<div class="cost-row cost-total"><span>' + (costState.loan ? L2("Cash needed at purchase (deposit + fees; rest is the loan of ", "購入時に必要な現金（手付金 + 諸費用。残りは借入 ") + yen(m.loanAmt) + ")" : L2("Total cash at purchase (price + one-time costs)", "購入時の現金総額（価格 + 一時費用）")) + '</span><span class="cost-yen">' + yen(m.cashNeeded) + "</span></div>" +
      '<p class="why">' + L2("One-time costs above the price: ", "価格に上乗せされる一時費用: ") + yen(m.fees) + " (" + (100 * m.fees / (p.priceMan * 10000)).toFixed(1) + L2("% of price). Estimated first-year fixed asset tax 固定資産税 + city planning tax 都市計画税 on the same assessed-value assumption, with the residential-land base reductions (⅙ up to 200 m²): about ", "%）。同じ評価額の前提で、住宅用地の軽減（200 m²まで ⅙）を適用した初年度の固定資産税 + 都市計画税の目安: 年額約 ") + yen(m.annual) + L2(" per year. Rates as published Oct 2026; this is a transparent estimate you can recompute from the formulas, not financial advice.", "。税率は2026年10月時点の公表値。式から再計算できる透明な目安であり、財務助言ではありません。") + "</p>";
  }
  function costHtml(p) {
    return '<div id="costBox"><h4>' + L2("True cost — what you actually pay", "総費用 — 実際に支払う金額") + "</h4>" +
      '<div class="cost-inputs">' +
      '<label>' + L2("Assessed value 評価額", "固定資産税評価額") + ' = <input type="number" id="cAssessed" min="10" max="150" step="5" value="' + costState.assessedPct + '"> ' + L2("% of price", "% （価格比）") + " <small>" + L2("(planning assumption — replace with the figure on the seller's tax notice)", "（計画上の前提 — 売主の納税通知書の評価額が分かれば差し替えてください）") + "</small></label>" +
      (p.type !== "land" ? '<label>' + L2("Land share of assessed value", "評価額に占める土地の割合") + ' <input type="number" id="cLandShare" min="0" max="100" step="5" value="' + costState.landShare + '"> %</label>' : "") +
      '<label>' + L2("Deposit", "手付金") + ' <input type="number" id="cDeposit" min="0" max="100" step="5" value="' + costState.depositPct + '"> %</label>' +
      '<label><input type="checkbox" id="cLoan"' + (costState.loan ? " checked" : "") + "> " + L2("Model a mortgage for the rest", "残額を住宅ローンでまかなう") + "</label>" +
      (p.type === "land" ? '<label>' + L2("Optional new build: ¥", "任意で新築: 坪単価 ¥") + '<input type="number" id="cBuildPrice" min="0" step="5" value="' + costState.buildTsuboPrice + '">' + L2("万 per tsubo × ", "万 × ") + '<input type="number" id="cBuildTsubo" min="0" step="1" value="' + costState.buildTsubo + '"> ' + L2("tsubo", "坪") + "</label>" : "") +
      "</div>" +
      '<div id="costRows">' + costRowsHtml(p) + "</div></div>";
  }

  // Detail dialog
  var dlg = $("detail");
  var lastFocus = null;
  function openDetail(p) {
    currentDetail = p;
    lastFocus = document.activeElement;
    var s = p._score;
    var cautions = effectiveCautions(p);
    $("dBody").innerHTML =
      '<p class="type-chip">' + TYPE_LABEL[p.type][0] + " · " + TYPE_LABEL[p.type][1] + "</p>" +
      "<h3>" + p.district + ' <span class="jp">' + p.districtJa + "</span></h3>" +
      '<p class="card-title">' + p.title + "</p>" +
      '<p class="price">' + priceText(p) + ' <span class="unit">' + p._unit + "</span></p>" +
      "<h4>" + t("whyScore") + " — " + s.total + " / 100</h4>" +
      s.reasons.map(function (r) {
        return '<div class="bar-row"><span>' + r.label + " (" + Math.round(r.pts) + "/" + r.max + ')</span><span class="score-bar"><span style="width:' + Math.round(r.pts / r.max * 100) + '%"></span></span></div><p class="why">' + r.text + "</p>";
      }).join("") +
      (s.penalty ? '<p class="caution">' + tf("penalty")(s.penalty) + "</p>" : "") +
      (p.highlights.length ? "<h4>" + t("highlights") + "</h4><ul>" + p.highlights.map(function (h) { return "<li>" + h + "</li>"; }).join("") + "</ul>" : "") +
      (cautions.length ? "<h4>" + t("checkFirst") + "</h4><ul>" + cautions.map(function (c) { return "<li>" + c + "</li>"; }).join("") + "</ul>" : "") +
      (isStale(p) ? '<p class="stale">' + tf("staleDetail")(p) + "</p>" : "") +
      "<h4>" + t("facts") + "</h4>" +
      '<dl class="specs">' +
      "<div><dt>" + t("station") + "</dt><dd>" + p.stationJa + " " + p.station + " · " + p.lineJa + " · " + (LANG === "ja" ? "徒歩" + p.walkMin + "分" : "walk " + p.walkMin + " min") + "</dd></div>" +
      "<div><dt>" + t("land") + "</dt><dd>" + fmt(p.landM2, 2) + " m² (" + fmt(p.landM2 / TSUBO, 2) + " tsubo)</dd></div>" +
      (p.buildingM2 ? "<div><dt>" + t("building") + "</dt><dd>" + fmt(p.buildingM2, 1) + " m² · " + p.layout + "</dd></div>"
                    : "<div><dt>" + t("zoning") + "</dt><dd>" + (p.zoning || t("seeListing")) + "</dd></div>") +
      (p.built ? "<div><dt>" + t("built") + "</dt><dd>" + p.built + "</dd></div>" : "<div><dt>" + t("coverFar") + "</dt><dd>" + (p.coverageFar || "—") + "</dd></div>") +
      "</dl>" +
      "<h4>" + (LANG === "ja" ? "ハザードと周辺情報 — 公的情報源" : "Hazard &amp; context — official sources") + "</h4>" +
      '<p class="why">' + (LANG === "ja"
        ? "Tadaimaはハザードリスクをスコア化しません。このページのどのスコアも安全性を示すものではありません。所在地（" + p.districtJa + "、" + D.site.areaJa + "）については、公的情報源でご自身で確認してください:"
        : "Tadaima does not score hazard risk, and no score on this page says anything about safety. For this address — " + p.districtJa + ", " + D.site.areaJa + " — check the official sources yourself:") + "</p>" +
      "<ul>" +
      '<li><a href="https://www.reinfolib.mlit.go.jp/" target="_blank" rel="noopener">' + (LANG === "ja" ? "国土交通省 不動産情報ライブラリ ↗" : "MLIT Real Estate Information Library ↗") + "</a> — " + (LANG === "ja" ? "公的な取引価格・用途地域・ハザード情報" : "official transaction prices, zoning and hazard overlays for the area") + "</li>" +
      '<li><a href="https://disaportal.gsi.go.jp/" target="_blank" rel="noopener">' + (LANG === "ja" ? "ハザードマップポータルサイト（国土交通省/国土地理院）↗" : "Hazard Map Portal Site (MLIT/GSI) ↗") + "</a> — " + (LANG === "ja" ? "洪水・土砂災害・津波の地図。" + p.districtJa + " で検索" : "flood, landslide and tsunami maps; search for " + p.districtJa) + "</li>" +
      '<li><a href="https://www.j-shis.bosai.go.jp/" target="_blank" rel="noopener">J-SHIS (防災科学技術研究所) ↗</a> — ' + (LANG === "ja" ? "地震ハザード情報" : "seismic hazard information for the location") + "</li>" +
      "</ul>" +
      '<div class="card-actions"><a class="btn btn-source" href="' + p.source.url + '" target="_blank" rel="noopener">' + (isDetail(p) ? t("openOriginal") : t("openPortal")) + p.source.name + ' ↗</a>' +
      '<a class="btn" href="' + mapsUrl(p) + '" target="_blank" rel="noopener">' + t("seeMap") + "</a></div>" +
      costHtml(p) +
      '<p class="src">' + tf("srcLine")(p) + "</p>";
    dlg.showModal();
  }
  // Estimator inputs: update state and re-render only the figures, so the
  // field being typed in never loses focus.
  $("dBody").addEventListener("input", function (e) {
    if (!currentDetail) return;
    var t = e.target;
    var changed = true;
    if (t.id === "cAssessed") costState.assessedPct = Math.min(150, Math.max(0, +t.value || 0));
    else if (t.id === "cLandShare") costState.landShare = Math.min(100, Math.max(0, +t.value || 0));
    else if (t.id === "cDeposit") costState.depositPct = Math.min(100, Math.max(0, +t.value || 0));
    else if (t.id === "cLoan") costState.loan = t.checked;
    else if (t.id === "cBuildPrice") costState.buildTsuboPrice = Math.max(0, +t.value || 0);
    else if (t.id === "cBuildTsubo") costState.buildTsubo = Math.max(0, +t.value || 0);
    else changed = false;
    if (changed) {
      var box = $("costRows");
      if (box) box.innerHTML = costRowsHtml(currentDetail);
    }
  });
  $("dClose").addEventListener("click", function () { dlg.close(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () { if (lastFocus && lastFocus.focus) lastFocus.focus(); });

  // Controls
  document.querySelectorAll("[data-type]").forEach(function (b) {
    b.classList.toggle("active", b.getAttribute("data-type") === state.type);
    b.addEventListener("click", function () {
      document.querySelectorAll("[data-type]").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      state.type = b.getAttribute("data-type");
      render();
    });
  });
  $("fPrice").value = String(state.maxPrice);
  $("fPrice").addEventListener("change", function () { state.maxPrice = +this.value; render(); });
  $("fWalk").value = String(state.maxWalk);
  $("fWalk").addEventListener("change", function () { state.maxWalk = +this.value; render(); });
  $("fSort").value = state.sort;
  $("fSort").addEventListener("change", function () { state.sort = this.value; render(); });
  $("fSearch").value = state.q;
  $("fSearch").addEventListener("input", function () { state.q = this.value; render(); });
  $("fSaved").classList.toggle("active", state.savedOnly);
  $("fSaved").addEventListener("click", function () {
    state.savedOnly = !state.savedOnly;
    this.classList.toggle("active", state.savedOnly);
    render();
  });
  var stSel = $("fStation");
  Array.from(new Set(props.map(function (p) { return p.station; }))).sort().forEach(function (s) {
    var o = document.createElement("option"); o.value = s; o.textContent = s; stSel.appendChild(o);
  });
  stSel.value = state.station;
  stSel.addEventListener("change", function () { state.station = this.value; render(); });
  var laySel = $("fLayout");
  if (laySel) {
    Array.from(new Set(props.filter(function (p) { return p.layout; }).map(function (p) { return p.layout; }))).sort().forEach(function (s) {
      var o = document.createElement("option"); o.value = s; o.textContent = s; laySel.appendChild(o);
    });
    laySel.value = state.layout;
    laySel.addEventListener("change", function () { state.layout = this.value; render(); });
  }
  var landSel = $("fMinLand");
  if (landSel) {
    landSel.value = String(state.minLand);
    landSel.addEventListener("change", function () { state.minLand = +this.value; render(); });
  }

  // ---------- Saved shortlist: compare + viewing-trip planner (Phase 2) --
  // Built entirely in JS so every edition gets it from this one file.
  var cmpDlg = document.createElement("dialog");
  cmpDlg.id = "compare";
  cmpDlg.setAttribute("aria-label", L2("Compare saved properties and plan a viewing trip", "保存した物件の比較と内見プラン"));
  cmpDlg.innerHTML = '<div id="cmpBody"></div><div class="card-actions"><button class="btn" id="cmpClose">' + L2("Close", "閉じる") + '</button></div>';
  document.body.appendChild(cmpDlg);
  var cmpBtn = document.createElement("button");
  cmpBtn.className = "chip";
  cmpBtn.id = "fCompare";
  cmpBtn.textContent = L2("⇄ Compare saved", "⇄ 保存した物件を比較");
  var savedChip = $("fSaved");
  if (savedChip && savedChip.parentNode) savedChip.parentNode.insertBefore(cmpBtn, savedChip.nextSibling);
  cmpDlg.querySelector("#cmpClose").addEventListener("click", function () { cmpDlg.close(); });
  cmpDlg.addEventListener("click", function (e) { if (e.target === cmpDlg) cmpDlg.close(); });

  function savedProps() { return props.filter(function (p) { return saved[p.id]; }); }
  function rowBest(vals, mode) {
    var best = mode === "min" ? Math.min.apply(null, vals) : Math.max.apply(null, vals);
    return vals.map(function (v) { return v === best; });
  }
  function openCompare() {
    var list = savedProps();
    var body = cmpDlg.querySelector("#cmpBody");
    if (list.length < 2) {
      body.innerHTML = "<h3>" + L2("Compare saved properties", "保存した物件を比較") + "</h3><p class='why'>" + L2("Save at least two properties (tap the ♥ on any card) and they will line up here side by side — price, true cost, walk, space and score, with the strongest figure on each row marked.", "物件を2つ以上保存すると（カードの ♥ をタップ）、価格・総費用・駅からの徒歩・広さ・スコアを横並びで比較できます。各行で最も優れた数値に印が付きます。") + "</p>";
      cmpDlg.showModal(); return;
    }
    var costs = list.map(function (p) { return costModel(p).cashNeeded; });
    var units = list.map(function (p) { return p.type === "land" ? p.priceMan / (p.landM2 / TSUBO) : p.priceMan / p.buildingM2; });
    function row(label, vals, bests, fmtFn) {
      return "<tr><th>" + label + "</th>" + vals.map(function (v, i) {
        return "<td" + (bests && bests[i] ? ' class="cmp-best"' : "") + ">" + fmtFn(v) + "</td>";
      }).join("") + "</tr>";
    }
    var f0 = function (v) { return v; };
    var html = "<h3>" + L2("Your shortlist, side by side", "保存リストの比較") + "</h3>" +
      '<div class="cmp-wrap"><table class="cmp"><thead><tr><th></th>' +
      list.map(function (p) { return "<th>" + p.district + "<br><small>" + p.districtJa + " · " + priceText(p) + "</small></th>"; }).join("") +
      "</tr></thead><tbody>" +
      row(L2("Score", "スコア"), list.map(function (p) { return p._score.total; }), rowBest(list.map(function (p) { return p._score.total; }), "max"), f0) +
      row(L2("Price", "価格"), list.map(function (p) { return p.priceMan; }), rowBest(list.map(function (p) { return p.priceMan; }), "min"), function (v) { return "¥" + fmt(v) + "万"; }) +
      row(L2("Est. cash at purchase (true cost)", "購入時の現金目安（総費用）"), costs, rowBest(costs, "min"), function (v) { return yen(v); }) +
      row(L2("Per tsubo (land) / per m² (houses)", "坪単価（土地）／ m²単価（住宅）"), units, rowBest(units, "min"), function (v) { return "¥" + fmt(v, 1) + "万"; }) +
      row(L2("Walk to station", "最寄り駅まで徒歩"), list.map(function (p) { return p.walkMin; }), rowBest(list.map(function (p) { return p.walkMin; }), "min"), function (v) { return v + L2(" min", "分"); }) +
      row(t("station"), list.map(function (p) { return p.station; }), null, f0) +
      row(t("land"), list.map(function (p) { return p.landM2; }), rowBest(list.map(function (p) { return p.landM2; }), "max"), function (v) { return fmt(v, 1) + " m²"; }) +
      row(t("building"), list.map(function (p) { return p.buildingM2 || 0; }), rowBest(list.map(function (p) { return p.buildingM2 || 0; }), "max"), function (v) { return v ? fmt(v, 1) + " m²" : "—"; }) +
      row(L2("Layout", "間取り"), list.map(function (p) { return p.layout || "—"; }), null, f0) +
      row(t("built"), list.map(function (p) { return p.built || "—"; }), null, f0) +
      row(L2("Major cautions", "重大な注意点"), list.map(function (p) { return p.majorCautions || 0; }), rowBest(list.map(function (p) { return p.majorCautions || 0; }), "min"), f0) +
      row(L2("All cautions listed", "注意点の件数"), list.map(function (p) { return effectiveCautions(p).length; }), null, f0) +
      "</tbody></table></div>" +
      '<p class="why">' + L2("True cost uses the estimator defaults (assessed value 70% of price, no mortgage). Open any property's detail view to adjust the assumptions — the ranking here follows the same formulas.", "総費用は概算ツールの初期値（評価額は価格の70%、住宅ローンなし）で計算しています。各物件の詳細画面で前提を変更できます。ここの並びも同じ計算式に基づきます。") + '</p>';
    // Viewing-trip planner: group by station, chain stations per line.
    var byStation = {};
    list.forEach(function (p) { (byStation[p.station] = byStation[p.station] || []).push(p); });
    var stations = Object.keys(byStation);
    var totalWalk = list.reduce(function (a, p) { return a + p.walkMin; }, 0);
    html += "<h4>" + (LANG === "ja" ? "内見プラン — 全" + list.length + "件・" + stations.length + "駅" : "Viewing trip — " + list.length + " properties at " + stations.length + " station" + (stations.length > 1 ? "s" : "")) + "</h4>" +
      stations.map(function (s) {
        var ps = byStation[s];
        return '<p class="why"><strong>' + (LANG === "ja" ? ps[0].stationJa + "駅" : s) + "</strong> (" + (LANG === "ja" ? ps[0].lineJa : ps[0].line) + ") — " + ps.length + (LANG === "ja" ? "件: " : " propert" + (ps.length > 1 ? "ies" : "y") + ": ") +
          ps.map(function (p) { return p.district + " (" + (LANG === "ja" ? "徒歩" + p.walkMin + "分" : p.walkMin + " min walk") + ")"; }).join("; ") + "</p>";
      }).join("") +
      '<p class="why">' + (LANG === "ja" ? "駅からの徒歩は合計約" + totalWalk + "分。これに駅間の電車移動時間が加わります。" : "Total walking from stations: about " + totalWalk + " minutes across the trip, plus train time between stations.") + '</p>';
    if (stations.length > 1) {
      var byLine = {};
      list.forEach(function (p) { (byLine[p.line] = byLine[p.line] || new Set()).add(p.station); });
      Object.keys(byLine).forEach(function (line) {
        var ss = [...byLine[line]];
        if (ss.length < 2) return;
        var q = function (s) { return encodeURIComponent(s + "駅 " + D.site.areaJa); };
        var url = "https://www.google.com/maps/dir/?api=1&travelmode=transit&origin=" + q(ss[0]) + "&destination=" + q(ss[ss.length - 1]) +
          (ss.length > 2 ? "&waypoints=" + ss.slice(1, -1).map(q).join("|") : "");
        html += '<p class="why"><a href="' + url + '" target="_blank" rel="noopener">' + (LANG === "ja" ? line + "での駅間ルート ↗" : "Station-to-station route on the " + line + " ↗") + "</a>" + (LANG === "ja" ? " — 各物件へは最寄り駅から表示の徒歩時間です。" : " — then each property is its listed walk from its station.") + "</p>";
      });
    }
    body.innerHTML = html;
    cmpDlg.showModal();
  }
  cmpBtn.addEventListener("click", openCompare);

  // ---------- Japanese UI: static chrome, toggle, summary (Phase 5) ----
  // The interface chrome is uniform across editions, so one exact-match
  // dictionary translates it. Editorial prose (lede, market) stays as
  // written; a generated Japanese summary paragraph stands in for it.
  var STATIC_JA = {
    "← All cities": "← 都市一覧へ",
    "Properties": "物件一覧",
    "How the ranking works": "ランキングの仕組み",
    "♥ Saved": "♥ 保存済み",
    "All": "すべて",
    "New houses": "新築一戸建て",
    "Used houses": "中古一戸建て",
    "Land": "土地",
    "Max price": "価格の上限",
    "Max walk": "徒歩の上限",
    "Station": "駅",
    "Sort": "並び替え",
    "Layout": "間取り",
    "Min land": "土地面積の下限",
    "All stations": "すべての駅",
    "All layouts": "すべての間取り",
    "Any size": "下限なし",
    "♥ Saved only": "♥ 保存のみ表示",
    "No properties match those filters. Try widening the price or walk limit.": "条件に合う物件がありません。価格や徒歩の上限を広げてみてください。",
    "properties collected": "収録物件数",
    "houses 新築・中古": "戸建て（新築・中古）",
    "land / lots 土地": "土地・分譲地",
    "cheapest way in — the #1 ranked property's price & area": "最安の入口 — ランキング1位の価格とエリア",
    "Part": "項目", "Points": "配点", "What it measures": "評価内容",
    "Value": "価格", "Location": "立地", "Space": "広さ", "Confidence": "信頼度",
    "New this week": "今週の新着", "Price ↓": "値下げ"
  };
  var langBtn = document.createElement("button");
  langBtn.type = "button"; langBtn.id = "langToggle"; langBtn.className = "lang-btn";
  var headNav = document.querySelector(".head-nav");
  if (headNav) headNav.insertBefore(langBtn, headNav.querySelector(".saved-pill"));
  langBtn.addEventListener("click", function () {
    LANG = LANG === "ja" ? "en" : "ja";
    try { localStorage.setItem("tadaima-lang", LANG); } catch (e) { /* storage blocked */ }
    applyLang();
  });
  var jaSummary = document.createElement("p");
  jaSummary.className = "lede ja-summary"; jaSummary.id = "jaSummary"; jaSummary.style.display = "none";
  var ledeEl = document.querySelector(".lede");
  if (ledeEl && ledeEl.parentNode) ledeEl.parentNode.insertBefore(jaSummary, ledeEl.nextSibling);
  function jaSummaryText() {
    var houses = props.filter(function (p) { return p.type !== "land"; }).length;
    var top = ranked[0];
    var secNote = "";
    if (D.sections) {
      var names = Object.keys(D.sections).map(function (k) { return D.sections[k].nameJa; }).join("・");
      secNote = "ただし" + names + "セクションの物件は徒歩15分を超えるものを含み、各カードに明示しています。";
    }
    return D.site.areaJa + "の戸建て・土地、全" + props.length + "件（戸建て" + houses + "件・土地" + (props.length - houses) + "件）を収録しています。条件は価格5,000万円以下、最寄り駅まで徒歩15分以内。" + secNote + "SUUMO・LIFULL HOME'S・atHome・goo住宅・不動産の掲載を横断収集し、価格の割安度（45点）・立地（30点）・広さ（15点）・情報の信頼度（10点）からなる透明なスコアで順位付けしました。現在の1位は" + top.districtJa + "の物件（" + priceText(top) + "、" + top._score.total + "点）。各カードにはスコアの根拠と注意点をすべて明記しています。";
  }
  function swapNodes(root, ja) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (n) {
      var raw = n.nodeValue, trimmed = raw.trim();
      if (!trimmed) return;
      if (n._en === undefined) {
        if (!STATIC_JA[trimmed]) return;
        n._en = trimmed;
      }
      var target = ja ? STATIC_JA[n._en] : n._en;
      if (target && trimmed !== target) n.nodeValue = raw.replace(trimmed, target);
    });
  }
  function applyLang() {
    var ja = LANG === "ja";
    document.documentElement.lang = ja ? "ja" : "en";
    props.forEach(function (p) { p._score = score(p); });
    ranked = computeRanked();
    ranked.forEach(function (p, i) { p._rank = i + 1; });
    swapNodes(document.querySelector("header.site-head"), ja);
    swapNodes(document.querySelector(".controls"), ja);
    swapNodes(document.querySelector(".hero"), ja);
    swapNodes(document.getElementById("how"), ja);
    swapNodes(document.getElementById("empty"), ja);
    var mk = document.querySelector('.head-nav a[href="#market"]');
    if (mk) mk.textContent = ja ? D.site.editionJa + "の市場" : D.site.edition + " market";
    Array.prototype.forEach.call($("fWalk").options, function (o) { o.textContent = o.value + (ja ? "分" : " min"); });
    var sortJa = { score: "おすすめ順", price: "価格の安い順", walk: "徒歩の短い順" };
    var sortEn = { score: "Worth a look", price: "Lowest price", walk: "Shortest walk" };
    Array.prototype.forEach.call($("fSort").options, function (o) { o.textContent = ja ? sortJa[o.value] : sortEn[o.value]; });
    var stJa = {};
    props.forEach(function (p) { stJa[p.station] = p.stationJa; });
    Array.prototype.forEach.call(stSel.options, function (o) {
      o.textContent = o.value === "all" ? (ja ? "すべての駅" : "All stations") : (ja ? stJa[o.value] + "駅" : o.value);
    });
    if (laySel) Array.prototype.forEach.call(laySel.options, function (o) {
      if (o.value === "all") o.textContent = ja ? "すべての間取り" : "All layouts";
    });
    if (landSel) Array.prototype.forEach.call(landSel.options, function (o) {
      if (o.value === "0") o.textContent = ja ? "下限なし" : "Any size";
    });
    var search = $("fSearch");
    search.placeholder = ja ? "地区名・駅名で検索…" : "Search district or station…";
    search.setAttribute("aria-label", search.placeholder);
    $("fSaved").textContent = ja ? "♥ 保存のみ表示" : "♥ Saved only";
    var dc = $("dClose"); if (dc) dc.setAttribute("aria-label", ja ? "閉じる" : "Close");
    cmpBtn.textContent = L2("⇄ Compare saved", "⇄ 保存した物件を比較");
    cmpDlg.setAttribute("aria-label", L2("Compare saved properties and plan a viewing trip", "保存した物件の比較と内見プラン"));
    var cc = cmpDlg.querySelector("#cmpClose"); if (cc) cc.textContent = L2("Close", "閉じる");
    langBtn.textContent = ja ? "English" : "日本語";
    jaSummary.textContent = jaSummaryText();
    jaSummary.style.display = ja ? "" : "none";
    $("statTop").textContent = priceText(ranked[0]) + " — " + (ja ? ranked[0].districtJa : ranked[0].district);
    render();
  }

  // Hero stats
  $("statTotal").textContent = props.length;
  $("statHouses").textContent = props.filter(function (p) { return p.type !== "land"; }).length;
  $("statLand").textContent = props.filter(function (p) { return p.type === "land"; }).length;
  $("statTop").textContent = priceText(ranked[0]) + " — " + ranked[0].district;

  applyLang();
})();
