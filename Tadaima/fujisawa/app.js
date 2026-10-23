/* Tadaima! — Fujisawa edition. Transparent "worth a look" ranking.
   Score = Value 45 + Location 30 + Space 15 + Confidence 10, minus 7 per major caution.
   Every component is explained on the card and in the detail view. No black box. */
(function () {
  "use strict";
  var D = window.TADAIMA_DATA;
  var props = D.properties.slice();
  var TSUBO = 3.305785; // m2 per tsubo

  var TIER = { "Fujisawa": 8,
               "Hon-Kugenuma": 6,
               "Shonandai": 6,
               "Tsujido": 6 };
  var WALK_BAND = function (w) { return w <= 5 ? 120 : (w <= 10 ? 82 : 72); }; // 万円/坪, MLIT transactions via Utinokati — Fujisawa's observed land gradient (≈ −35% by a 10-minute walk at Fujisawa station, −45% by 16+ minutes city-wide); house prices fall only ~19% over the same range, see benchmarks note in the data

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
    // --- Confidence (10)
    if (p.source.verified === "detail") {
      parts.confidence = p.source.infoDate >= "2026-10-15" ? 10 : (p.source.infoDate >= "2026-09-01" ? 9 : 8);
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

  // ---------- UI ----------
  var state = { type: "all", maxPrice: 5000, maxWalk: 15, station: "all", sort: "score", q: "", savedOnly: false };
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem("tadaima-saved") || "{}"); } catch (e) { saved = {}; }

  var $ = function (id) { return document.getElementById(id); };
  var grid = $("grid"), count = $("count");

  var TYPE_LABEL = { "house-new": ["New house", "新築一戸建て"], "house-used": ["Used house", "中古一戸建て"], "land": ["Land / lot", "土地"] };

  function priceText(p) {
    return (p.priceFrom ? "from " : "") + "¥" + fmt(p.priceMan) + "万";
  }
  function mapsUrl(p) {
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("神奈川県藤沢市" + p.districtJa + " " + p.stationJa + "駅");
  }

  function card(p) {
    var s = p._score;
    var top = ranked.indexOf(p) < 3;
    var el = document.createElement("article");
    el.className = "card" + (top ? " card-top" : "");
    var reasonsTop = s.reasons.slice().sort(function (a, b) { return b.pts / b.max - a.pts / a.max; }).slice(0, 2);
    el.innerHTML =
      '<div class="card-head"><span class="type-chip">' + TYPE_LABEL[p.type][0] + " · " + TYPE_LABEL[p.type][1] + "</span>" +
      (top ? '<span class="top-chip">Top pick #' + p._rank + "</span>" : "") +
      (p.isNew ? '<span class="new-chip">New this week</span>' : "") +
      (p.priceDropMan ? '<span class="drop-chip">Price ↓ ¥' + fmt(p.priceDropMan) + "万</span>" : "") +
      '<button class="save-btn" aria-pressed="' + !!saved[p.id] + '" title="Save this property">' + (saved[p.id] ? "♥" : "♡") + "</button></div>" +
      '<h3 class="card-district">' + p.district + ' <span class="jp">' + p.districtJa + "</span></h3>" +
      '<p class="card-title">' + p.title + "</p>" +
      '<div class="price-row"><span class="price">' + priceText(p) + '</span><span class="unit">' + p._unit + "</span></div>" +
      '<div class="score-row"><span class="score-num">' + s.total + '</span><span class="score-label">Worth-a-look score<br><span class="score-sub">Value · Location · Space · Confidence</span></span>' +
      '<span class="score-bar"><span style="width:' + s.total + '%"></span></span></div>' +
      '<dl class="specs">' +
      "<div><dt>Station</dt><dd>" + p.station + " · " + p.walkMin + " min</dd></div>" +
      "<div><dt>Land</dt><dd>" + fmt(p.landM2, 1) + " m²</dd></div>" +
      (p.buildingM2 ? "<div><dt>Building</dt><dd>" + fmt(p.buildingM2, 1) + " m² · " + p.layout + "</dd></div>"
                    : "<div><dt>Zoning</dt><dd>" + (p.zoning || "See listing") + "</dd></div>") +
      (p.built ? "<div><dt>Built</dt><dd>" + p.built + "</dd></div>" : "<div><dt>Cover / FAR</dt><dd>" + (p.coverageFar || "—") + "</dd></div>") +
      "</dl>" +
      '<ul class="reasons">' + reasonsTop.map(function (r) { return "<li><strong>" + r.label + ":</strong> " + r.text + "</li>"; }).join("") + "</ul>" +
      (p.cautions.length ? '<p class="caution">⚠ ' + p.cautions[0] + (p.cautions.length > 1 ? " (+" + (p.cautions.length - 1) + " more in details)" : "") + "</p>" : "") +
      '<div class="card-actions"><button class="btn btn-detail">View details</button>' +
      '<a class="btn btn-source" href="' + p.source.url + '" target="_blank" rel="noopener">Original listing ↗</a></div>' +
      '<p class="src">Source: ' + p.source.name + " · checked " + D.site.researchedOn + "</p>";
    el.querySelector(".save-btn").addEventListener("click", function () {
      if (saved[p.id]) { delete saved[p.id]; } else { saved[p.id] = 1; }
      try { localStorage.setItem("tadaima-saved", JSON.stringify(saved)); } catch (e) { /* storage blocked — save still shows for this session */ }
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
    if (state.savedOnly && !saved[p.id]) return false;
    if (state.q) {
      var hay = (p.district + " " + p.districtJa + " " + p.station + " " + p.title).toLowerCase();
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
  }

  // Detail dialog
  var dlg = $("detail");
  function openDetail(p) {
    var s = p._score;
    $("dBody").innerHTML =
      '<p class="type-chip">' + TYPE_LABEL[p.type][0] + " · " + TYPE_LABEL[p.type][1] + "</p>" +
      "<h3>" + p.district + ' <span class="jp">' + p.districtJa + "</span></h3>" +
      '<p class="card-title">' + p.title + "</p>" +
      '<p class="price">' + priceText(p) + ' <span class="unit">' + p._unit + "</span></p>" +
      '<h4>Why this score — ' + s.total + " / 100</h4>" +
      s.reasons.map(function (r) {
        return '<div class="bar-row"><span>' + r.label + " (" + Math.round(r.pts) + "/" + r.max + ')</span><span class="score-bar"><span style="width:' + Math.round(r.pts / r.max * 100) + '%"></span></span></div><p class="why">' + r.text + "</p>";
      }).join("") +
      (s.penalty ? '<p class="caution">Score reduced by ' + s.penalty + " for the major caution below.</p>" : "") +
      (p.highlights.length ? "<h4>Highlights</h4><ul>" + p.highlights.map(function (h) { return "<li>" + h + "</li>"; }).join("") + "</ul>" : "") +
      (p.cautions.length ? "<h4>Check before you visit</h4><ul>" + p.cautions.map(function (c) { return "<li>" + c + "</li>"; }).join("") + "</ul>" : "") +
      "<h4>Facts as listed</h4><dl class=\"specs\">" +
      "<div><dt>Station</dt><dd>" + p.stationJa + " " + p.station + " · " + p.lineJa + " · walk " + p.walkMin + " min</dd></div>" +
      "<div><dt>Land</dt><dd>" + fmt(p.landM2, 2) + " m² (" + fmt(p.landM2 / TSUBO, 2) + " tsubo)</dd></div>" +
      (p.buildingM2 ? "<div><dt>Building</dt><dd>" + fmt(p.buildingM2, 2) + " m² · " + p.layout + "</dd></div>" : "") +
      (p.built ? "<div><dt>Built</dt><dd>" + p.built + "</dd></div>" : "") +
      (p.zoning ? "<div><dt>Zoning</dt><dd>" + p.zoning + "</dd></div>" : "") +
      (p.coverageFar ? "<div><dt>Coverage / FAR</dt><dd>" + p.coverageFar + "</dd></div>" : "") +
      "</dl>" +
      '<div class="card-actions"><a class="btn btn-source" href="' + p.source.url + '" target="_blank" rel="noopener">Open original listing on ' + p.source.name + ' ↗</a>' +
      '<a class="btn" href="' + mapsUrl(p) + '" target="_blank" rel="noopener">See the area on a map ↗</a></div>' +
      '<p class="src">Source: ' + p.source.name + " · information date " + p.source.infoDate + " · collected " + D.site.researchedOn + ". Listings change and sell — always confirm price and availability on the original listing.</p>";
    dlg.showModal();
  }
  $("dClose").addEventListener("click", function () { dlg.close(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });

  // Controls
  document.querySelectorAll("[data-type]").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll("[data-type]").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      state.type = b.getAttribute("data-type");
      render();
    });
  });
  $("fPrice").addEventListener("change", function () { state.maxPrice = +this.value; render(); });
  $("fWalk").addEventListener("change", function () { state.maxWalk = +this.value; render(); });
  $("fSort").addEventListener("change", function () { state.sort = this.value; render(); });
  $("fSearch").addEventListener("input", function () { state.q = this.value; render(); });
  $("fSaved").addEventListener("click", function () {
    state.savedOnly = !state.savedOnly;
    this.classList.toggle("active", state.savedOnly);
    render();
  });
  var stSel = $("fStation");
  Array.from(new Set(props.map(function (p) { return p.station; }))).sort().forEach(function (s) {
    var o = document.createElement("option"); o.value = s; o.textContent = s; stSel.appendChild(o);
  });
  stSel.addEventListener("change", function () { state.station = this.value; render(); });

  // Hero stats
  $("statTotal").textContent = props.length;
  $("statHouses").textContent = props.filter(function (p) { return p.type !== "land"; }).length;
  $("statLand").textContent = props.filter(function (p) { return p.type === "land"; }).length;
  $("statTop").textContent = priceText(ranked[0]) + " — " + ranked[0].district;

  render();
})();
