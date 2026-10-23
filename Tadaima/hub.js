/* Tadaima! hub — city cards rendered from the cities registry (cities.js),
   which is generated from each city's own data file so counts never drift.
   Cards are grouped by prefecture under a header, with prefecture filter
   chips generated from the same registry — new prefectures appear on their
   own as cities are added. A Japan map stays parked until coverage reaches
   roughly ten cities across several prefectures (see the roadmap note). */
(function () {
  "use strict";
  var CITIES = window.TADAIMA_CITIES || [];
  var grid = document.getElementById("cityGrid");
  var chipsBox = document.getElementById("prefChips");
  var noMatch = document.getElementById("noMatch");
  var input = document.getElementById("citySearch");
  var currentPref = "all";

  function fmt(n) { return n.toLocaleString("en-US"); }

  function card(c, idx) {
    var el = document.createElement("article");
    el.className = "city-card" + (c.status === "live" ? "" : " research");
    el.dataset.idx = idx;
    el.dataset.hay = (c.name + " " + c.nameJa + " " + c.prefecture + " " + c.prefectureJa + " " +
      (c.stations || []).join(" ") + " " + (c.stationsJa || []).join(" ") + " " +
      (c.districts || []).join(" ") + " " + c.blurb).toLowerCase();
    var html =
      '<div class="city-top"><h3 class="city-name">' + c.name + ' <span class="jp">' + c.nameJa + "</span></h3>" +
      (c.status === "live" ? '<span class="live-chip">Live</span>' : '<span class="research-chip">In research</span>') + "</div>" +
      '<p class="city-where">' + c.prefecture + " · " + c.prefectureJa + "</p>" +
      '<p class="city-blurb">' + c.blurb + "</p>";
    if (c.status === "live") {
      html +=
        '<div class="city-stats">' +
        '<div class="cstat"><b>' + c.counts.total + "</b><span>properties</span></div>" +
        '<div class="cstat"><b>' + c.counts.houses + "</b><span>houses 新築・中古</span></div>" +
        '<div class="cstat"><b>' + c.counts.land + "</b><span>land / lots 土地</span></div></div>" +
        '<p class="city-from">Houses from <b>¥' + fmt(c.fromHouseMan) + "万</b> · Land from <b>¥" + fmt(c.fromLandMan) + "万</b></p>" +
        '<p class="city-from">' + c.commute + "</p>" +
        '<div class="station-chips">' + c.stations.map(function (s) { return "<span>" + s + "</span>"; }).join("") + "</div>" +
        '<div class="city-actions"><a class="btn" href="' + c.slug + '/">Explore ' + c.name + " →</a>" +
        '<span class="city-date">Researched ' + c.researchedOn + "</span></div>";
    } else {
      html += '<div class="city-actions"><span class="city-date">Research in progress — same brief, same score. It goes live only when the data is ready.</span></div>';
    }
    el.innerHTML = html;
    return el;
  }

  // Group by prefecture, in first-appearance order from the registry.
  var prefOrder = [], byPref = {};
  CITIES.forEach(function (c, i) {
    if (!byPref[c.prefecture]) { byPref[c.prefecture] = { ja: c.prefectureJa, cities: [] }; prefOrder.push(c.prefecture); }
    byPref[c.prefecture].cities.push({ c: c, i: i });
  });

  var groups = [];
  prefOrder.forEach(function (pref) {
    var g = byPref[pref];
    var total = g.cities.reduce(function (s, e) { return s + (e.c.status === "live" ? e.c.counts.total : 0); }, 0);
    var sec = document.createElement("section");
    sec.className = "pref-group";
    sec.dataset.pref = pref;
    var head = document.createElement("h3");
    head.className = "pref-head";
    head.innerHTML = pref + ' <span class="jp">' + g.ja + '</span> <span class="pref-meta">' +
      g.cities.length + (g.cities.length === 1 ? " city" : " cities") + " · " + total + " properties</span>";
    sec.appendChild(head);
    var inner = document.createElement("div");
    inner.className = "city-grid";
    g.cities.forEach(function (e) { inner.appendChild(card(e.c, e.i)); });
    sec.appendChild(inner);
    grid.appendChild(sec);
    groups.push(sec);
  });

  // Prefecture filter chips: All + one per prefecture present in the registry.
  var chipEls = [];
  function addChip(label, ja, pref) {
    var b = document.createElement("button");
    b.className = "pref-chip" + (pref === "all" ? " active" : "");
    b.dataset.pref = pref;
    b.innerHTML = label + (ja ? ' <span class="jp">' + ja + "</span>" : "");
    b.addEventListener("click", function () {
      currentPref = pref;
      chipEls.forEach(function (x) { x.classList.toggle("active", x === b); });
      applyFilter();
    });
    chipsBox.appendChild(b);
    chipEls.push(b);
  }
  addChip("All", "", "all");
  prefOrder.forEach(function (pref) { addChip(pref, byPref[pref].ja, pref); });

  function applyFilter() {
    var q = input.value.trim().toLowerCase();
    var visible = 0, firstLive = null;
    groups.forEach(function (sec) {
      var groupVisible = 0;
      Array.prototype.forEach.call(sec.querySelectorAll(".city-card"), function (el) {
        var c = CITIES[+el.dataset.idx];
        var show = (currentPref === "all" || c.prefecture === currentPref) &&
                   (!q || el.dataset.hay.indexOf(q) !== -1);
        el.style.display = show ? "" : "none";
        if (show) { visible++; groupVisible++; if (!firstLive && c.status === "live") firstLive = c; }
      });
      sec.style.display = groupVisible ? "" : "none";
    });
    noMatch.style.display = visible ? "none" : "block";
    return firstLive;
  }
  input.addEventListener("input", applyFilter);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      var first = applyFilter();
      if (first) window.location.href = first.slug + "/";
    }
  });
})();

/* Property-level search across every edition (2026-10-24, P2-1).
   Data: search-index.js, generated by build_registry.py from the same
   per-city properties.json files as the cards — never hand-maintained.
   Results deep-link into the city page with its shareable filter URL. */
(function () {
  "use strict";
  var INDEX = window.TADAIMA_PROP_INDEX || [];
  var input = document.getElementById("propSearch");
  if (!input || !INDEX.length) return;
  var box = document.getElementById("propResults");
  var count = document.getElementById("propCount");
  var TYPE_LABEL = { "house-new": "New house", "house-used": "Used house", "land": "Land / lot" };
  function fmt(n) { return n.toLocaleString("en-US"); }
  function render() {
    var q = input.value.trim().toLowerCase();
    if (!q) { box.innerHTML = ""; count.textContent = ""; return; }
    var hits = INDEX.filter(function (e) { return e.hay.indexOf(q) !== -1; });
    count.textContent = hits.length + (hits.length === 1 ? " property matches" : " properties match") + (hits.length > 12 ? " — showing the first 12, refine the search to narrow it down" : "");
    box.innerHTML = "";
    hits.slice(0, 12).forEach(function (e) {
      var a = document.createElement("a");
      a.className = "prop-result";
      a.href = e.slug + "/?q=" + encodeURIComponent(e.district) + "&type=" + e.type;
      a.innerHTML = "<b>" + e.city + "</b><span>" + e.district + ' <span class="jp">' + e.districtJa + "</span></span>" +
        '<span class="pr-price">¥' + fmt(e.priceMan) + "万</span>" +
        '<span class="pr-meta">' + TYPE_LABEL[e.type] + (e.layout ? " · " + e.layout : "") + " · " + e.station + " · " + e.walkMin + " min walk · land " + e.landM2 + " m²</span>";
      box.appendChild(a);
    });
  }
  input.addEventListener("input", render);
})();
