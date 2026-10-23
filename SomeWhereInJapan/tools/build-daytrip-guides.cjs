'use strict';
const fs = require('node:fs');
const path = require('node:path');
const trips = require('../daytrips.js').DAY_TRIPS;
const root = path.join(__dirname, '..');
const base = 'https://decniner.github.io/Den-Lab/SomeWhereInJapan/day-trips/';
const editions = {
  kawagoe: {
    area: 'SAITAMA · KANTO',
    title: 'Kawagoe by old streets',
    lead: 'A half day or an unhurried full day among thick-walled merchant houses, a still-ringing bell tower and the small sweet shops of Penny Candy Lane.',
    story: 'Kawagoe makes its history part of the street rather than placing it behind a museum door. The merchant storehouses of Ichibangai were built to protect goods from fire; their dark plaster, heavy shutters and projecting rooflines still shape the scale of the street. Then the Bell of Time sounds above them. It has marked the hour in Kawagoe since the early Edo period and rings four times each day. The route works best on foot, with the loop bus used to bridge the station and the castle grounds.',
    fit: 'A strong fit for first-time visitors who want a readable historic centre, a compact food stop and an easy rail day.',
    watch: 'The old town is busiest on weekends and holidays. The castle palace is a separate visit with its own closing days; check before setting out.',
    season: 'Comfortable for walking in most seasons. Summer heat, rain and weekend crowds change the pace; the bell tower and streets remain outdoor stops.',
    phone: 'Kawagoe tourism information: +81 49-227-9496. Honmaru Goten: +81 49-222-5399.',
    contacts: [['Koedo Kawagoe Tourism Association', 'https://koedo.or.jp/contact/'], ['Honmaru Goten visitor information', 'https://koedo.or.jp/en/spot_007/']],
    sources: [['Kawagoe Tourism Association · access by rail and car', 'https://koedo.or.jp/access/'], ['Tobu Railway · current fare reference', 'https://www.tobu.co.jp/campaign/use-pasmo/'], ['Official castle-town walking course', 'https://www.koedo.or.jp/en/route/%E5%9F%8E%E4%B8%8B%E7%94%BA%E3%83%BB%E5%B7%9D%E8%B6%8A-%E6%AD%B4%E5%8F%B2%E3%82%81%E3%81%90%E3%82%8A%E3%82%B3%E3%83%BC%E3%82%B9/'], ['Official English visitor map', 'https://koedo.or.jp/wp-content/uploads/KAWAGOE-Sightseeing-Map-Eng.pdf']],
    fare: 'The Tokyo Station to Ikebukuro rail leg and Kawagoe local buses were missing from the old subtotal, so no complete total is shown. Tobu lists Ikebukuro-Kawagoe at JPY 490 one way in March 2026; the official Kawagoe course lists Honmaru Goten admission at JPY 100. Confirm the Tokyo connection and local bus before budgeting.',
    limitation: 'Most of the centre is level, but pavements can be crowded and uneven. The old castle building has thresholds and interior level changes; ask the venue about step-free access.'
  },
  sawara: {
    area: 'CHIBA · KANTO',
    title: 'Sawara along the water',
    lead: 'A canal town best experienced slowly: merchant facades at street level, willow reflections from a boat and festival craft inside two small museums.',
    story: 'Sawara grew by moving goods along the waterways that connected the Tone River region with Edo. The Ono River still cuts through the preserved district, where bridges, old shopfronts and former merchant homes meet at walking pace. For a different view, the local boat ride places the town at water level. The Float Museum then reveals the carving and enormous figures carried through the streets for the festivals. A direct bus makes this a practical Tokyo day, but its limited daily service makes the return departure the first thing to plan.',
    fit: 'For travellers who enjoy a quieter historic centre, local food and a day organised around one timed return connection.',
    watch: 'The direct highway bus runs only one to three round trips each day. Lock in the return time first; check festival traffic control in July and October.',
    season: 'Spring and autumn are comfortable for the open riverside walk. Festival periods bring a much livelier town and may change access or bus operations.',
    phone: 'Inoh Tadataka Museum: +81 478-54-1118. Suigo Sawara Float Museum: +81 478-52-4104.',
    contacts: [['Katori City sightseeing information', 'https://www.city.katori.lg.jp/sightseeing/multilingual/en/index.html'], ['Inoh Tadataka Museum', 'https://www.city.katori.lg.jp/sightseeing/museum/en/guide.html']],
    sources: [['Katori City · current highway-bus service notice', 'https://www.city.katori.lg.jp/living/kotsu_doro/kokyo_kotsu/bus/highway_bus.html'], ['Kanto Railway · Tokyo–Sawara fare and stop list', 'https://www.kantetsu.co.jp/highwaybus/hokota-tokyo'], ['Katori City · Suigo Sawara Float Museum', 'https://www.city.katori.lg.jp/sightseeing/multilingual/en/en-season/en-sawara/en-s_midokoro/Float_Museum.html'], ['Katori City · Inoh Tadataka Museum hours, admission and access', 'https://www.city.katori.lg.jp/sightseeing/museum/en/guide.html'], ['Katori City · historic district', 'https://www.city.katori.lg.jp/sightseeing/multilingual/en/en-machinami.html']],
    fare: 'The direct coach fare from Tokyo Station to Sawara is ¥1,900 each way (¥3,800 return), listed by Kanto Railway from 1 March 2026. The outing estimate also includes the ¥800 adult combination museum ticket and a ¥1,500–2,500 meal allowance. Boat ride and purchases are extra.',
    limitation: 'The riverside walk is mostly level but old paving can be uneven. The Inoh museum is about a 10-minute walk from JR Sawara Station; confirm step-free access with each venue.'
  },
  mitake: {
    area: 'TOKYO · OME',
    title: 'Mount Mitake above the valley',
    lead: 'A mountain day with a real choice at its centre: take the short shrine approach, or commit to a longer streamside trail over rough ground.',
    story: 'The journey changes character twice before the walk begins: an Ome Line train gives way to a local bus, then a steep six-minute cable-car climb lifts the route above the valley. At the upper station, pause before choosing the day. Musashi Mitake Shrine is reached on foot through a mountain village and a long flight of steps. The Rock Garden is a much longer, rough trail, with water, roots and elevation changes. Keeping it optional is the difference between a beautiful mountain outing and an overpacked plan.',
    fit: 'For hikers who are comfortable checking mountain weather, managing stairs and starting early enough to respect the return timetable.',
    watch: 'Do not treat Rock Garden as a short add-on. It involves unpaved terrain and several hours; skip it in storms, ice, extreme heat or when daylight is short.',
    season: 'The mountain is most forgiving in mild spring and autumn weather. Cable-car or bus service and trail conditions can change; confirm both on the day.',
    phone: 'Mitake Tozan Railway: +81 428-78-8121. Nishi Tokyo Bus contact details are listed on its route information site.',
    contacts: [['Mitake Tozan Railway · timetable, fare and service notices', 'https://www.mitaketozan.co.jp/timetable.html'], ['Nishi Tokyo Bus · JR Mitake Station bus stop', 'https://www.nisitokyobus.co.jp/rosen/noriba/mitake.html']],
    sources: [['Mitake Tozan Railway · timetable and fare effective 1 October 2026', 'https://www.mitaketozan.co.jp/timetable.html'], ['Mitake Tozan Railway · shrine and trail model courses', 'https://www.mitaketozan.co.jp/ti_modelcourse.html'], ['Nishi Tokyo Bus · Mitake Station boarding point', 'https://www.nisitokyobus.co.jp/rosen/noriba/mitake.html'], ['Nishi Tokyo Bus · current timetable and fare lookup', 'https://www.nisitokyobus.co.jp/rosen/pocket.html'], ['Ome City · Gyokudo Art Museum and area visitor information', 'https://www.city.ome.tokyo.jp/uploaded/attachment/47177.pdf']],
    fare: 'The cable-car return ticket is JPY 1,400 adult from 1 October 2026. Tokyo rail and Nishi Tokyo Bus fares and route-day service have not been reconciled into a complete outing total; the old estimate is not used for budget matching.',
    limitation: 'This route is not step-free. The shrine approach has a long stairway; the optional trail is steep and unpaved. Wear grippy footwear, carry water and check official weather and service notices.'
  },
  narita: {
    area: 'CHIBA · KANTO',
    title: 'Narita by the temple approach',
    lead: 'Follow a sloping old-town street to one of Japan’s major temple precincts, then trade the shop-lined approach for a garden of ponds, pines and waterfalls.',
    story: 'Narita’s Omotesando is not a forecourt added for visitors; it is the town street that leads to the temple, with food shops and everyday storefronts lining the descent. Inside the precinct the scale opens up. The main hall, pagoda and other buildings make a sequence worth walking slowly, while the park behind them shifts the focus to paths, water and seasonal planting. The route is close enough to the airport to work during a longer layover, but it deserves more than a rushed dash from an airport train.',
    fit: 'A flexible culture-and-food day for visitors who want a substantial temple visit without a complicated transfer from Tokyo or the airport.',
    watch: 'New Year worship draws exceptionally large crowds. Some halls and the calligraphy museum have separate admission and opening calendars; the park paths include stairs and slopes.',
    season: 'The temple precinct is open year-round. Spring flowers and autumn foliage give the garden a seasonal frame; summer afternoons can be hot on Omotesando.',
    phone: 'Naritasan Shinsho-ji general enquiries: +81 476-22-2111, 08:00–16:00.',
    contacts: [['Naritasan Shinsho-ji · contact and address', 'https://www.naritasan.or.jp/contact/'], ['Naritasan · precinct map', 'https://www.naritasan.or.jp/tour/map/']],
    sources: [['Naritasan Shinsho-ji · train, car and parking access', 'https://www.naritasan.or.jp/access/'], ['Naritasan · official precinct map', 'https://www.naritasan.or.jp/tour/map/'], ['Naritasan · park and calligraphy museum hours and admission', 'https://www.naritasan.or.jp/tour/other/']],
    fare: 'The previous Tokyo rail subtotal combined JR and Keisei options without defining one route and return fare. The temple precinct is free to enter, but separate museums are optional extras. No complete total is shown until one return rail route is verified.',
    limitation: 'The approach street slopes. Temple precincts have stairs and uneven surfaces; the official map is the best access reference. Ask the temple directly about an individual route.'
  },
  odawara: {
    area: 'KANAGAWA · KANTO',
    title: 'Odawara through the castle gates',
    lead: 'Read the castle from the outside in: moat, formal approach, successive gates, then a museum keep with the bay beyond its upper floor.',
    story: 'Odawara Castle is easier to understand as a route than as a single photograph. The official approach follows the old post-town side of the city through Ohoribata-dori, then enters by Umadashi Gate and crosses successive defensive thresholds toward the keep. Inside, maps, documents and armour put the castle in the context of the Hojo domain and its place on the Tokaido corridor. The ticket to the keep also includes the Samurai Museum, so the two visits form one connected story rather than two separate add-ons.',
    fit: 'For history-minded travellers who want a clear half-day visit and a station-to-castle walk with good indoor time.',
    watch: 'The castle advises public transport: roads are busy on weekends and holidays, and there is no general parking lot inside the park. The keep has stairs and limited step-free access.',
    season: 'The park is open in every season. Cherry blossom time is popular; summer has heat and sun exposure. The keep and Samurai Museum make a useful wet-weather core.',
    phone: 'Odawara Castle visitor facilities: +81 465-22-3818. Castle park administration: +81 465-23-1373.',
    contacts: [['Odawara Castle · visitor information and contact', 'https://odawaracastle.com/info/'], ['Odawara Castle · access and official approach', 'https://odawaracastle.com/access/']],
    sources: [['Odawara Castle · current hours, closure days and admission', 'https://odawaracastle.com/info/'], ['Odawara Castle · station access, parking and formal approach', 'https://odawaracastle.com/access/'], ['Odawara City · rail access reference', 'https://www.city.odawara.kanagawa.jp/kanko/service/tetudo.html']],
    fare: 'From 1 March 2026, the official adult keep ticket is JPY 1,000 and includes the Samurai Museum. The conventional JR Tokyo-Odawara return fare and other required components have not been verified together here; no complete total is shown.',
    limitation: 'The castle tower has stairs and limited step-free access. The official route is a town walk with paved sections; contact the castle about current lift/access arrangements.'
  }
};
function cleanMojibake(value) {
  if (typeof value === 'string') {
    return value
      .replaceAll('\u00c2\u00b7', ' · ')
      .replaceAll('\u00e2\u20ac\u201c', '–')
      .replaceAll('\u00e2\u20ac\u201d', '—')
      .replaceAll('\u00e2\u20ac\u2122', '’')
      .replaceAll('\u00e2\u20ac\u02dc', '‘')
      .replaceAll('\u00e2\u20ac\u2018', '‘')
      .replaceAll('\u00e2\u20ac\u2019', '’');
  }
  if (Array.isArray(value)) return value.map(cleanMojibake);
  if (value && typeof value === 'object') {
    Object.keys(value).forEach((key) => { value[key] = cleanMojibake(value[key]); });
  }
  return value;
}
trips.forEach(cleanMojibake);
function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function url(value) { return esc(value); }
function slugText(value) { return value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase(); }
function makeMap(stops, slug) {
  const lats = stops.map((item) => item.lat), lons = stops.map((item) => item.lon);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const x = (item) => maxLon === minLon ? 50 : 12 + ((item.lon - minLon) / (maxLon - minLon)) * 76;
  const y = (item) => maxLat === minLat ? 50 : 18 + ((maxLat - item.lat) / (maxLat - minLat)) * 64;
  const points = stops.map((item) => `${(x(item) * 10).toFixed(1)},${(y(item) * 3.8).toFixed(1)}`).join(' ');
  const pins = stops.map((item, index) => `<button class="route-map-pin${index === 0 ? ' is-selected' : ''}" type="button" style="left:${x(item).toFixed(1)}%;top:${y(item).toFixed(1)}%" data-stop-select="${index}" aria-pressed="${index === 0}" aria-label="Select map point ${index + 1}: ${esc(item.name)}"><span>${String(index + 1).padStart(2, '0')}</span></button>`).join('');
  const context = slug === "kawagoe" ? `<a class="route-street-map-link" href="https://www.openstreetmap.org/?mlat=35.918&amp;mlon=139.486#map=15/35.918/139.486" target="_blank" rel="noopener noreferrer">Open the Kawagoe street map on OpenStreetMap <span aria-hidden="true">&#8599;</span><small>Approximate town-center view; the numbered plot below shows approximate stop positions. Connectors are not walking paths.</small></a><small>Street data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>.</small>` : ""; return `${context}<div class="route-map-interactive"><svg viewBox="0 0 1000 380" preserveAspectRatio="none" aria-hidden="true"><polyline points="${points}" vector-effect="non-scaling-stroke"/></svg><div class="route-map-pins">${pins}</div><span class="route-map-north" aria-hidden="true">N north</span></div>`;
}
function render(trip, index) {
  const info = editions[trip.slug];
  const profile = trip.modes.public.profiles.full || Object.values(trip.modes.public.profiles)[0];
  const short = trip.guide.shortPlan;
  const groundMin = Math.max(0, profile.totalHours.min - profile.roundTripHours.max - 1);
  const groundMax = Math.max(0, profile.totalHours.max - profile.roundTripHours.min - 0.75);
  const stops = trip.guide.stops;
  const name = trip.name;
  const canonical = `${base}${trip.slug}/`;
  const sourceLinks = info.sources.map(([label, href]) => `<li><a href="${url(href)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">↗</span></a></li>`).join('');
  const contactLinks = info.contacts.map(([label, href]) => `<a href="${url(href)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`).join('');
  const pointRows = stops.map((item, i) => {
    const id = `guide-stop-${String(i + 1).padStart(2, '0')}`;
    const previous = stops[i - 1];
    const walkUrl = previous
      ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(previous.address)}&destination=${encodeURIComponent(item.address)}&travelmode=walking`
      : item.maps;
    return `<li id="${id}" class="route-stop-row${i === 0 ? ' is-selected' : ''}" data-stop-row="${i}" aria-current="step"><button class="route-stop-select" type="button" data-stop-select="${i}" aria-pressed="${i === 0}"><span class="route-stop-number">${String(i + 1).padStart(2, '0')}</span><span class="route-stop-copy"><strong>${esc(item.name)}</strong><span>${esc(item.address)}</span><span>${esc(item.walk)} · ${esc(item.duration)}</span><span>${esc(item.story)}</span></span></button><div class="route-stop-links"><a href="${url(item.maps)}" target="_blank" rel="noopener noreferrer">Open pin ↗</a><a href="${url(walkUrl)}" target="_blank" rel="noopener noreferrer">${previous ? 'Walk from previous stop' : 'Open arrival point'} ↗</a></div></li>`;
  }).join('');
  const profileStats = `<div class="route-facts"><p><b>Reference origin</b> Tokyo Station</p><p><b>Arrival</b> ${esc(profile.arrival)}</p><p><b>Door to door</b> ${profile.totalHours.min}-${profile.totalHours.max} hours, planning range</p><p><b>Round-trip travel</b> ${profile.roundTripHours.min}-${profile.roundTripHours.max} hours, verify for date</p><p><b>Budget status</b> ${profile.estimateStatus === 'complete' ? `JPY ${profile.costYen.min.toLocaleString('en-US')}-${profile.costYen.max.toLocaleString('en-US')} per adult` : 'Incomplete; excluded from budget matches'}</p><p><b>Effort</b> ${esc(trip.effort)}</p></div>`;
  const ordered = stops.map((item, i) => `<li><b>${esc(item.name)}.</b> ${esc(item.walk)} Allow ${esc(item.duration)} at this stop. <a href="#guide-stop-${String(i + 1).padStart(2, '0')}">Select point ${String(i + 1).padStart(2, '0')}</a></li>`).join('');
  const query = encodeURIComponent(`${name} Japan official travel guide`);
  const next = trips[(index + 1) % trips.length];
  const navigation = trips.map((item) => `<a href="../${item.slug}/">${esc(item.name)}</a>`).join('');
  const photoRecord=trip.image?.verification;
  const photoReady=Boolean(trip.image?.url&&photoRecord?.verified===true&&photoRecord.source_page&&photoRecord.credit&&photoRecord.license&&photoRecord.alt&&trip.image.source===photoRecord.source_page&&trip.image.credit===photoRecord.credit&&trip.image.license===photoRecord.license&&trip.image.alt===photoRecord.alt);
  if(trip.image&&!photoReady)throw new Error(`Unverified trip photo: ${trip.slug}`);
  const photoSourceMarkup=photoReady?`<li><a href="${url(photoRecord.source_page)}" target="_blank" rel="noopener noreferrer">Image source and license: ${esc(photoRecord.credit)} / ${esc(photoRecord.license)} &#8599;</a></li>`:'';
  const copy=`<div class="route-visual-copy"><span>${esc(info.area)} &#183; AN EDITORIAL FIELD GUIDE</span><strong>${esc(name)}<br><em>${esc(trip.subtitle)}</em></strong><small>Route and visit estimates are planning guidance. Check operator sources for conditions on your travel date.</small></div>`;
  const photoMarkup=photoReady?`<figure class="route-visual route-visual-photo"><div class="route-photo-frame"><img data-photo-verified="true" data-photo-source="${url(photoRecord.source_page)}" data-photo-credit="${esc(photoRecord.credit)}" data-photo-license="${esc(photoRecord.license)}" data-photo-alt="${esc(photoRecord.alt)}" src="${url(trip.image.url)}" alt="${esc(photoRecord.alt)}" onerror="this.remove();const f=this.closest('figure');f.classList.remove('route-visual-photo');f.classList.add('route-visual-no-photo');f.querySelector('.route-photo-frame')?.remove();f.querySelector('figcaption')?.remove()" width="1600" height="1000" loading="eager" fetchpriority="high"><a class="route-photo-credit" href="${url(photoRecord.source_page)}" target="_blank" rel="noopener noreferrer">${esc(photoRecord.credit)} / ${esc(photoRecord.license)} / Photo source</a></div>${copy}<figcaption>Photograph: ${esc(photoRecord.credit)}, licensed ${esc(photoRecord.license)}. <a href="${url(photoRecord.source_page)}" target="_blank" rel="noopener noreferrer">Review the original image and license</a></figcaption></figure>`:`<div class="route-visual route-visual-no-photo">${copy}</div>`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#eee9de">
<meta name="description" content="An editorial, practical Tokyo day-trip guide to ${esc(name)}: a detailed route, exact places, walking map, weather plan, costs and official access links."><title>${esc(name)} from Tokyo · A Somewhere in Japan field guide</title>
<link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(info.title)} · Somewhere in Japan"><meta property="og:description" content="${esc(info.lead)}"><meta property="og:url" content="${canonical}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(info.title)}"><meta name="twitter:description" content="${esc(info.lead)}">
<link rel="stylesheet" href="../../styles.css?v=20261022-32"><link rel="sitemap" type="application/xml" href="../../sitemap.xml"></head>
<body><main class="route-guide route-guide-premium" data-route-guide="${trip.slug}"><header class="field-note-topbar"><a class="field-note-brand" href="../../index.html" aria-label="Somewhere in Japan home">SOMEWHERE <i>IN</i> JAPAN</a><nav aria-label="Breadcrumb"><a href="../../index.html">Home</a><span aria-hidden="true">/</span><a href="../../index.html#daytrips">Tokyo field desk</a><span aria-hidden="true">/</span><span>${esc(name)}</span></nav></header>
<p class="eyebrow">FIELD GUIDE ${String(index + 1).padStart(2, '0')} · ${esc(info.area)}</p><h1>${esc(info.title.split(' ').slice(0, -2).join(' '))} <em>${esc(info.title.split(' ').slice(-2).join(' '))}</em></h1><p class="route-deck">${esc(info.lead)}</p>

${photoMarkup}
${profileStats}
<section class="guide-story-block"><p class="guide-story-kicker">THE PLACE, IN ITS OWN RHYTHM</p><h2>${esc(info.title)}</h2><p>${esc(info.story)}</p><div class="guide-decision"><article><h3>A good fit when</h3><p>${esc(info.fit)}</p></article><article><h3>Plan around</h3><p>${esc(info.watch)}</p></article></div><aside class="short-route-card"><p class="guide-story-kicker">WHEN YOU HAVE LESS TIME</p><h3>${esc(short.duration)}</h3><p>${esc(short.route)}</p><p><strong>Leave out:</strong> ${esc(short.omitted)}</p><p>This is a planning outline, not a live timetable. Do not use it as a half-day match unless the date’s published transport times leave enough time on the ground.</p></aside></section>
<section class="guide-route-section"><p class="guide-story-kicker">THE ORDER OF THE DAY</p><h2>Follow the day, one stop at a time</h2><p class="route-section-intro">This route is organized from the arrival point. Select a number on the plot or a stop below to pair them; the page will not move your focus.</p><div class="guide-route-map route-map-panel"><div class="route-map-title"><strong>${esc(name)} · stop plot</strong><span>Approximate geographic points</span></div>${makeMap(stops, trip.slug)}<p class="route-map-legend">Dashed connectors show stop order only, not a verified walking path. Use each walking-directions link for turn-by-turn navigation. Pin positions are approximate; verify exact entrances with the linked official map. Coordinates and individual place details are linked in the sources below.</p><p class="route-map-live" role="status" aria-live="polite">Selected: ${esc(stops[0].name)}</p></div>
<ol class="route-stops-list">${pointRows}</ol><p class="route-return-leg"><strong>Return to the arrival station</strong> Treat this as a separate leg; verify service and last departures before travel. <a href="https://www.google.com/maps/dir/?api=1&amp;origin=${encodeURIComponent(stops[stops.length-1].address)}&amp;destination=${encodeURIComponent(stops[0].address)}&amp;travelmode=transit" target="_blank" rel="noopener noreferrer">Directions back to ${esc(stops[0].name)}</a></p>
<h3 class="route-itinerary-title">Pacing notes</h3><ol class="route-pacing-list">${ordered}</ol></section>
<section class="guide-plan-section"><p class="guide-story-kicker">TIME, COST & PRACTICALITIES</p><h2>Planning ranges with stated gaps</h2><dl class="guide-estimate-grid"><div><dt>Rail / bus time</dt><dd>${profile.roundTripHours.min}-${profile.roundTripHours.max} hours round trip; planning range</dd></div><div><dt>Planned day</dt><dd>${profile.totalHours.min}-${profile.totalHours.max} hours door to door; planning range</dd></div><div><dt>Required transport</dt><dd>${profile.estimateStatus === 'complete' ? `JPY ${profile.costBreakdown.transport.min.toLocaleString('en-US')}-${profile.costBreakdown.transport.max.toLocaleString('en-US')}` : 'Not fully verified'}</dd></div><div><dt>Listed admission</dt><dd>${profile.estimateStatus === 'complete' ? `JPY ${profile.costBreakdown.admissions.min.toLocaleString('en-US')}-${profile.costBreakdown.admissions.max.toLocaleString('en-US')}` : 'Required fees not fully verified'}</dd></div><div><dt>Meal allowance</dt><dd>${profile.estimateStatus === 'complete' ? `JPY ${profile.costBreakdown.meal.min.toLocaleString('en-US')}-${profile.costBreakdown.meal.max.toLocaleString('en-US')}` : 'Not included in a total'}</dd></div><div><dt>Total per adult</dt><dd>${profile.estimateStatus === 'complete' ? `JPY ${profile.costYen.min.toLocaleString('en-US')}-${profile.costYen.max.toLocaleString('en-US')}` : 'Incomplete; not budget matched'}</dd></div></dl>${profile.timeBudget ? `<h3>How the day length is estimated</h3><dl class="guide-day-budget">${Object.entries(profile.timeBudget).map(([label, range]) => `<div><dt>${esc(label)}</dt><dd>${range.min}-${range.max} hours</dd></div>`).join('')}</dl>` : '<p class="guide-estimate-copy">Detailed travel, walking, visit, meal and buffer components are not verified for this itinerary.</p>'}<p class="guide-estimate-copy">${esc(info.fare)}</p><p class="guide-caution-copy">${esc(profile.estimateNote)} Day duration ranges are planning guidance, not a scheduled itinerary. Recheck service times and access for your date.</p><h3>Season, access and effort</h3><p>${esc(info.season)} ${esc(info.limitation)}</p><h3>If weather changes</h3><p>${esc(trip.guide.rainPlan)}</p></section>
<section class="guide-access-section"><p class="guide-story-kicker">GET THERE, THEN GET AROUND</p><h2>Choose your way in</h2><p>The detailed estimates on this page start at Tokyo Station and use public transport. Other cities, driving and airport arrivals can change the route and price; use the operator’s current route planner before setting out.</p><div class="guide-mode-links"><a href="https://www.google.com/maps/dir/?api=1&amp;origin=Tokyo%20Station&amp;destination=${encodeURIComponent(stops[0].address)}&amp;travelmode=transit" target="_blank" rel="noopener noreferrer">Plan public transport from Tokyo ↗</a><a href="https://www.google.com/maps/dir/?api=1&amp;origin=Tokyo%20Station&amp;destination=${encodeURIComponent(stops[0].address)}&amp;travelmode=driving" target="_blank" rel="noopener noreferrer">Check a driving route ↗</a><a href="https://www.google.com/maps/dir/?api=1&amp;origin=Narita%20International%20Airport&amp;destination=${encodeURIComponent(stops[0].address)}&amp;travelmode=transit" target="_blank" rel="noopener noreferrer">Check airport connections ↗</a><a href="https://www.youtube.com/results?search_query=${query}" target="_blank" rel="noopener noreferrer">Watch visitor videos on YouTube ↗</a></div><p>${esc(info.phone)}</p><div class="guide-contact-links">${contactLinks}</div></section>
<section class="guide-sources-section"><p class="guide-story-kicker">CHECKED ${esc(trip.checkedOn)}</p><h2>Sources to verify before departure</h2><p>Access, timetables, admission, closures and conditions can change. These primary sources support the route details above.</p><ul class="route-sources">${sourceLinks}${photoSourceMarkup}</ul></section>
<nav class="route-guide-directory" aria-label="All Tokyo field guides"><h2>More days from Tokyo</h2><div>${navigation}</div></nav><nav class="route-next-links" aria-label="Continue exploring"><a href="../../index.html#daytrips">Return to the day-trip finder ↗</a><a href="../${next.slug}/">Next field guide · ${esc(next.name)} ↗</a></nav><p class="guide-method-note">Editorial planning guide · reviewed 22 October 2026 · no live booking or fare service. Route point coordinates are approximate. Stop-to-stop connectors are deliberately schematic and are not walking instructions.</p></main><script src="../../field-notes.js?v=20261022-2" defer></script></body></html>`;
}
for (const [index, trip] of trips.entries()) {
  if (!editions[trip.slug] || !trip.guide) throw new Error(`Missing guide content for ${trip.slug}`);
  fs.writeFileSync(path.join(root, 'day-trips', trip.slug, 'index.html'), render(trip, index), 'utf8');
}
console.log(`Generated ${trips.length} static guide pages from shared trip data.`);