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
  function sourceBtnText(p) { return isDetail(p) ? "Original listing ↗" : "Portal results ↗"; }
  function sourceLine(p) {
    return isDetail(p)
      ? "Source: " + p.source.name + " · checked " + D.site.researchedOn
      : "Source: " + p.source.name + " · found via an index page — open the portal results to locate the current listing · checked " + D.site.researchedOn;
  }
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
      cs.push("Building/land figures as listed — implausible ratio (" + fmt(p.buildingM2, 1) + " m² building on " + fmt(p.landM2, 1) + " m² of land), unverified. Confirm both figures with the agent.");
    }
    return cs;
  }

  // Precompute group medians for houses (price per m2 of floor area)
  var groupMedian = {};
  ["house-new", "house-used"].forEach(function (t) {
    groupMedian[t] = median(props.filter(function (p) { return p.type === t; })
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
      reasons.push({ pts: parts.value, max: 45, label: "Value",
        text: "¥" + fmt(ppT, 1) + "万 per tsubo vs ¥" + fmt(bench, 1) + "万 benchmark for " + p.station +
              " (" + (diff >= 0 ? diff + "% below" : Math.abs(diff) + "% above") + " MLIT transaction averages)" });
      p._unit = "¥" + fmt(ppT, 1) + "万/坪";
    } else {
      var ppM = p.priceMan / p.buildingM2;
      var med = groupMedian[p.type];
      var r = ppM / med;
      parts.value = lerp([[0.7, 45], [1.0, 24], [1.3, 4]], r);
      var d2 = Math.round((1 - r) * 100);
      reasons.push({ pts: parts.value, max: 45, label: "Value",
        text: "¥" + fmt(ppM, 1) + "万 per m² of floor area vs ¥" + fmt(med, 1) + "万 median for " +
              (p.type === "house-new" ? "new" : "used") + " houses in this collection (" +
              (d2 >= 0 ? d2 + "% below" : Math.abs(d2) + "% above") + ")" });
      p._unit = "¥" + fmt(ppM, 1) + "万/m²";
    }
    // --- Location (30)
    var walkPts = 22 - (p.walkMin - 2) * (14 / 13);
    parts.location = clamp(walkPts, 8, 22) + (TIER[p.station] || 4);
    reasons.push({ pts: parts.location, max: 30, label: "Location",
      text: p.walkMin + " min walk to " + p.station + " Station (" + p.line + ")" });
    // --- Space (15)
    if (p.type === "land") {
      parts.space = lerp([[70, 4], [100, 8], [130, 11], [170, 14], [220, 15], [320, 12], [400, 11]], p.landM2);
      reasons.push({ pts: parts.space, max: 15, label: "Space",
        text: fmt(p.landM2, 1) + " m² of land (" + fmt(p.landM2 / TSUBO, 1) + " tsubo)" });
    } else {
      parts.space = lerp([[80, 5], [120, 15]], p.buildingM2);
      reasons.push({ pts: parts.space, max: 15, label: "Space",
        text: fmt(p.buildingM2, 1) + " m² floor area on " + fmt(p.landM2, 1) + " m² of land" });
    }
    // --- Confidence (10) — bands are AGES relative to the edition's
    // researchedOn date, never hardcoded calendar dates (2026-10-24 fix:
    // the old "2026-10-15"/"2026-09-01" thresholds rotted silently).
    if (p.source.verified === "detail") {
      var age = staleDays(p);
      parts.confidence = age <= 14 ? 10 : (age <= 60 ? 9 : 8);
      reasons.push({ pts: parts.confidence, max: 10, label: "Confidence",
        text: "Verified on the " + p.source.name + " listing page (information date " + p.source.infoDate + ")" });
    } else {
      parts.confidence = 6;
      reasons.push({ pts: parts.confidence, max: 10, label: "Confidence",
        text: "Taken from a " + p.source.name + " index page — re-check the live listing before visiting" });
    }
    var penalty = 7 * (p.majorCautions || 0);
    var total = Math.round(parts.value + parts.location + parts.space + parts.confidence - penalty);
    return { total: clamp(total, 1, 99), parts: parts, penalty: penalty, reasons: reasons };
  }

  props.forEach(function (p) { p._score = score(p); });
  var ranked = props.slice().sort(function (a, b) { return b._score.total - a._score.total; });
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
    note.textContent = "Saved list reset — it previously mixed properties from different cities. Your saves are now kept separately for each city.";
    var controlsEl = document.querySelector(".controls");
    if (controlsEl && controlsEl.parentNode) controlsEl.parentNode.insertBefore(note, controlsEl);
  }

  var TYPE_LABEL = { "house-new": ["New house", "新築一戸建て"], "house-used": ["Used house", "中古一戸建て"], "land": ["Land / lot", "土地"] };

  function priceText(p) {
    return (p.priceFrom ? "from " : "") + "¥" + fmt(p.priceMan) + "万";
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
    var scoreAria = "Worth-a-look score " + s.total + " out of 100. " + s.reasons.map(function (r) { return r.label + " " + Math.round(r.pts) + " of " + r.max + "."; }).join(" ");
    el.innerHTML =
      '<div class="card-head"><span class="type-chip">' + TYPE_LABEL[p.type][0] + " · " + TYPE_LABEL[p.type][1] + "</span>" +
      (top ? '<span class="top-chip">Top pick #' + p._rank + "</span>" : "") +
      (p.isNew ? '<span class="new-chip">New this week</span>' : "") +
      (p.priceDropMan ? '<span class="drop-chip">Price ↓ ¥' + fmt(p.priceDropMan) + "万</span>" : "") +
      '<button class="save-btn" aria-pressed="' + !!saved[p.id] + '" aria-label="' + (saved[p.id] ? "Remove this property from saved" : "Save this property") + '" title="Save this property">' + (saved[p.id] ? "♥" : "♡") + "</button></div>" +
      '<h3 class="card-district">' + p.district + ' <span class="jp">' + p.districtJa + "</span></h3>" +
      '<p class="card-title">' + p.title + "</p>" +
      '<div class="price-row"><span class="price">' + priceText(p) + '</span><span class="unit">' + p._unit + "</span></div>" +
      '<div class="score-row" role="img" aria-label="' + scoreAria + '"><span class="score-num">' + s.total + '</span><span class="score-label">Worth-a-look score<br><span class="score-sub">Value · Location · Space · Confidence</span></span>' +
      '<span class="score-bar" aria-hidden="true"><span style="width:' + s.total + '%"></span></span></div>' +
      '<dl class="specs">' +
      "<div><dt>Station</dt><dd>" + p.station + " · " + p.walkMin + " min</dd></div>" +
      "<div><dt>Land</dt><dd>" + fmt(p.landM2, 1) + " m²</dd></div>" +
      (p.buildingM2 ? "<div><dt>Building</dt><dd>" + fmt(p.buildingM2, 1) + " m² · " + p.layout + "</dd></div>"
                    : "<div><dt>Zoning</dt><dd>" + (p.zoning || "See listing") + "</dd></div>") +
      (p.built ? "<div><dt>Built</dt><dd>" + p.built + "</dd></div>" : "<div><dt>Cover / FAR</dt><dd>" + (p.coverageFar || "—") + "</dd></div>") +
      "</dl>" +
      '<ul class="reasons">' + reasonsTop.map(function (r) { return "<li><strong>" + r.label + ":</strong> " + r.text + "</li>"; }).join("") + "</ul>" +
      (isStale(p) ? '<p class="stale">⏳ Listing info from ' + monthYear(p.source.infoDate) + " — re-check availability before visiting.</p>" : "") +
      (cautions.length ? '<p class="caution">⚠ ' + cautions[0] + (cautions.length > 1 ? " (+" + (cautions.length - 1) + " more in details)" : "") + "</p>" : "") +
      '<div class="card-actions"><button class="btn btn-detail">View details</button>' +
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
    if (p.walkMin > state.maxWalk) return false;
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

  function render() {
    var list = ranked.filter(passes);
    if (state.sort === "price") list.sort(function (a, b) { return a.priceMan - b.priceMan; });
    if (state.sort === "walk") list.sort(function (a, b) { return a.walkMin - b.walkMin; });
    if (state.sort === "score") list.sort(function (a, b) { return b._score.total - a._score.total; });
    grid.innerHTML = "";
    list.forEach(function (p) { grid.appendChild(card(p)); });
    count.textContent = list.length + " of " + props.length + " properties";
    $("empty").style.display = list.length ? "none" : "block";
    $("savedCount").textContent = Object.keys(saved).length;
    syncURL();
  }

  // Detail dialog
  var dlg = $("detail");
  var lastFocus = null;
  function openDetail(p) {
    lastFocus = document.activeElement;
    var s = p._score;
    var cautions = effectiveCautions(p);
    $("dBody").innerHTML =
      '<p class="type-chip">' + TYPE_LABEL[p.type][0] + " · " + TYPE_LABEL[p.type][1] + "</p>" +
      "<h3>" + p.district + ' <span class="jp">' + p.districtJa + "</span></h3>" +
      '<p class="card-title">' + p.title + "</p>" +
      '<p class="price">' + priceText(p) + ' <span class="unit">' + p._unit + "</span></p>" +
      "<h4>Why this score — " + s.total + " / 100</h4>" +
      s.reasons.map(function (r) {
        return '<div class="bar-row"><span>' + r.label + " (" + Math.round(r.pts) + "/" + r.max + ')</span><span class="score-bar"><span style="width:' + Math.round(r.pts / r.max * 100) + '%"></span></span></div><p class="why">' + r.text + "</p>";
      }).join("") +
      (s.penalty ? '<p class="caution">Score reduced by ' + s.penalty + " for the major caution below.</p>" : "") +
      (p.highlights.length ? "<h4>Highlights</h4><ul>" + p.highlights.map(function (h) { return "<li>" + h + "</li>"; }).join("") + "</ul>" : "") +
      (cautions.length ? "<h4>Check before you visit</h4><ul>" + cautions.map(function (c) { return "<li>" + c + "</li>"; }).join("") + "</ul>" : "") +
      (isStale(p) ? '<p class="stale">⏳ Listing information date ' + p.source.infoDate + " — older than 90 days at research time. Re-check availability before visiting.</p>" : "") +
      "<h4>Facts as listed</h4><dl class=\"specs\">" +
      "<div><dt>Station</dt><dd>" + p.stationJa + " " + p.station + " · " + p.lineJa + " · walk " + p.walkMin + " min</dd></div>" +
      "<div><dt>Land</dt><dd>" + fmt(p.landM2, 2) + " m² (" + fmt(p.landM2 / TSUBO, 2) + " tsubo)</dd></div>" +
      (p.buildingM2 ? "<div><dt>Building</dt><dd>" + fmt(p.buildingM2, 2) + " m² · " + p.layout + "</dd></div>" : "") +
      (p.built ? "<div><dt>Built</dt><dd>" + p.built + "</dd></div>" : "") +
      (p.zoning ? "<div><dt>Zoning</dt><dd>" + p.zoning + "</dd></div>" : "") +
      (p.coverageFar ? "<div><dt>Coverage / FAR</dt><dd>" + p.coverageFar + "</dd></div>" : "") +
      "</dl>" +
      '<div class="card-actions"><a class="btn btn-source" href="' + p.source.url + '" target="_blank" rel="noopener">' + (isDetail(p) ? "Open original listing on " : "Open portal results on ") + p.source.name + ' ↗</a>' +
      '<a class="btn" href="' + mapsUrl(p) + '" target="_blank" rel="noopener">See the area on a map ↗</a></div>' +
      '<p class="src">Source: ' + p.source.name + " · information date " + p.source.infoDate + " · collected " + D.site.researchedOn + ". Listings change and sell — always confirm price and availability on the original listing.</p>";
    dlg.showModal();
  }
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

  // Hero stats
  $("statTotal").textContent = props.length;
  $("statHouses").textContent = props.filter(function (p) { return p.type !== "land"; }).length;
  $("statLand").textContent = props.filter(function (p) { return p.type === "land"; }).length;
  $("statTop").textContent = priceText(ranked[0]) + " — " + ranked[0].district;

  render();
})();
