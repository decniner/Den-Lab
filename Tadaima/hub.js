/* Tadaima! hub — city cards rendered from the cities registry (cities.js),
   which is generated from each city's own data file so counts never drift. */
(function () {
  "use strict";
  var CITIES = window.TADAIMA_CITIES || [];
  var grid = document.getElementById("cityGrid");
  var noMatch = document.getElementById("noMatch");
  var input = document.getElementById("citySearch");

  function fmt(n) { return n.toLocaleString("en-US"); }

  function card(c) {
    var el = document.createElement("article");
    el.className = "city-card" + (c.status === "live" ? "" : " research");
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

  CITIES.forEach(function (c) { grid.appendChild(card(c)); });

  function applyFilter() {
    var q = input.value.trim().toLowerCase();
    var visible = 0, firstLive = null;
    Array.prototype.forEach.call(grid.children, function (el, i) {
      var show = !q || el.dataset.hay.indexOf(q) !== -1;
      el.style.display = show ? "" : "none";
      if (show) { visible++; if (!firstLive && CITIES[i].status === "live") firstLive = CITIES[i]; }
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
