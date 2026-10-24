const grid = document.querySelector('#destination-grid');
const filters = document.querySelector('#region-filters');
const moodFilters = document.querySelector('#mood-filters');
function placeDisplayName(name) {
  return name
    .replace(/,\s*.*$/, '')
    .replace(/\s+(?:in bloom|by lamplight|from above|after dark|in blossom|in the cedars|temple to tide|steam and springs|from the water|unhurried|under steep roofs|beneath the Alps|the mountain valley|at first light|after hours|between trees|after dusk|the old paths|a city of peace|land of old stories|art and sea|by bicycle|by river|steam rising|ancient green|harbor of many worlds|under Mount Yufu|island time|Ryukyu memory|by foot and bicycle|snow and neon|mirror of the sky|a mountain of steps|in every season|the little Edo|a temple town morning|the long way round|sea and sky|above Kyoto|at blue hour|at sunset|a sacred approach|Takamatsu|by boat|Japan’s far west|the Golden Pavilion)$/i, '');
}
const count = document.querySelector('#result-count');
const search = document.querySelector('#place-search');
const savedToggle = document.querySelector('#saved-toggle');
const savedCount = document.querySelector('#saved-count');
const savedNote = document.querySelector('#saved-note');
const placeDialog = document.querySelector('#place-dialog');
function verifiedPlacePhoto(place) {
  const photo = place?.photo;
  const record = photo?.verification;
  return photo?.url && record?.verified === true && record.source_page && record.credit && record.license && record.alt &&
    photo.source === record.source_page && photo.credit === record.credit && photo.license === record.license && photo.alt === record.alt ? photo : null;
}
function applyPhotoVerificationAttributes(image, photo) {
  if (!image || !photo) return;
  const record = photo.verification;
  image.dataset.photoVerified = 'true';
  image.dataset.photoSource = record.source_page;
  image.dataset.photoCredit = record.credit;
  image.dataset.photoLicense = record.license;
  image.dataset.photoAlt = record.alt;
}
document.querySelectorAll('[data-place-count]').forEach(node => { node.textContent = DESTINATIONS.length.toLocaleString(); });

function initHeroCarousel() {
  const panel = document.querySelector('.hero-image-panel'), slidesRoot = panel?.querySelector('.hero-carousel-slides');
  if (!panel || !slidesRoot) return;
  const verified = DESTINATIONS.filter(place => verifiedPlacePhoto(place)).slice(0, 9);
  if (!verified.length) return;
  const slides = verified.map((place, index) => {
    const slide = document.createElement('div'); slide.className = 'hero-carousel-slide'; slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide'); slide.setAttribute('aria-label', `${index + 1} of ${verified.length}: ${place.name}`); slide.hidden = true;
    const image = document.createElement('img'); applyPhotoVerificationAttributes(image, place.photo); image.src = place.photo.url.replace('width=1100', 'width=1800'); image.alt = place.photo.alt || place.name; image.width = 1800; image.height = 1180;
    image.addEventListener('error',()=>{image.hidden=true;slide.classList.add('hero-carousel-photo-unavailable');credit.replaceChildren();},{once:true});
    if (index === 0) image.fetchPriority = 'high'; slide.append(image); slidesRoot.append(slide); return slide;
  });
  const current = panel.querySelector('.hero-slide-current'), total = panel.querySelector('.hero-slide-total');
  const caption = panel.querySelector('.hero-slide-caption'), credit = panel.querySelector('.hero-slide-credit'), toggle = panel.querySelector('.hero-carousel-toggle');
  let index = 0, timer = 0, playing = false; total.textContent = String(slides.length).padStart(2, '0');
  function show(next) {
    index = (next + slides.length) % slides.length; slides.forEach((slide, i) => { slide.hidden = i !== index; });
    current.textContent = String(index + 1).padStart(2, '0'); caption.textContent = verified[index].name;
    const link = document.createElement('a'); link.href = verified[index].photo.source; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.textContent = `${verified[index].photo.credit} · ${verified[index].photo.license}`; link.setAttribute('aria-label', `Photo credit and license for ${verified[index].name}`); credit.replaceChildren(link);
  }
  function stop() { playing = false; window.clearInterval(timer); timer = 0; toggle.textContent = 'Start rotation'; toggle.setAttribute('aria-pressed', 'false'); }
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function start() { if (reducedMotion.matches) return; stop(); playing = true; toggle.textContent = 'Pause rotation'; toggle.setAttribute('aria-pressed', 'true'); timer = window.setInterval(() => show(index + 1), 7000); }
  panel.querySelector('.hero-carousel-prev').addEventListener('click', () => { stop(); show(index - 1); });
  panel.querySelector('.hero-carousel-next').addEventListener('click', () => { stop(); show(index + 1); });
  toggle.addEventListener('click', () => playing ? stop() : start()); panel.addEventListener('mouseenter', stop); panel.addEventListener('focusin', stop);
  const updateMotionControl = () => { toggle.disabled = reducedMotion.matches; toggle.textContent = reducedMotion.matches ? 'Rotation off' : 'Start rotation'; toggle.setAttribute('aria-pressed', 'false'); };
  reducedMotion.addEventListener?.('change', event => { if (event.matches) stop(); updateMotionControl(); }); updateMotionControl(); show(0);
}
initHeroCarousel();
let activeRegion = 'All places';
let savedOnly = false;
let query = '';
let activeMood = 'All moods';
let visibleLimit = 12;
let monthSearchEnabled = false;
let monthSearchManual = false;
let localFindsOnly = false;
let localFindsManual = false;
let searchAnnouncementTimer = null;
const LOCAL_FIND_NAMES = new Set([
  'The blue of Biei','Oirase stream walk','Hiraizumi\u2019s quiet temples','Tazawa\u2019s clear blue',
  'Aizu-Wakamatsu\u2019s samurai streets','Oze\u2019s open wetlands','Kiso Valley post towns',
  'Lake Biwa\u2019s eastern shore','Onomichi\u2019s hillside lanes','Iwami Ginzan\u2019s forest paths',
  'The Iya Valley','Cape Ashizuri\u2019s ocean edge','Konpira-san\u2019s long climb',
  'Ouchi-juku\u2019s thatched lanes','Shakotan\u2019s blue coast','Kawagoe, the little Edo',
  'Tottori\u2019s shifting dunes','Oshino Hakkai and Fuji views'
]);
const LOCAL_FIND_DETAILS = {
  'The blue of Biei': {spot:'Shirogane Blue Pond · lakeside boardwalk', query:'Shirogane Blue Pond, Biei, Hokkaido', story:'The pond was never meant to be an attraction. It formed during erosion-control work, where mineral-bearing water gathered among larch trees left standing in the shallows. Walk the quiet edge and the color seems to shift from turquoise to ink; snowmelt, rain, and sunlight all change the view.', source:'https://www.biei-hokkaido.jp/en/shirogane-blue-pond'},
  'Oirase stream walk': {spot:'Ishigedo rest area to Ashura Rapids', query:'Ishigedo, Oirase Gorge, Aomori', story:'Oirase is a rare kind of river walk: the trail stays close to the water, so the journey is measured in little scenes rather than one grand lookout. At Ashura Rapids, current gathers around dark rock and fallen branches beneath a dense canopy. The full gorge runs about 14 kilometres between Yakeyama and Lake Towada; even a short out-and-back gives the stream room to change its mood.', source:'https://faq.japan-travel.jnto.go.jp/national-parks/parks/towada-hachimantai/see-and-do/oirase-trail/'},
  'Hiraizumi\u2019s quiet temples': {spot:'Chūson-ji · Tsukimizaka approach and Konjikidō', query:'Chusonji Temple, Hiraizumi, Iwate', story:'Begin on Tsukimizaka, the Moon-Viewing Slope, where centuries-old cedar trunks close around the path. At the top, Chūson-ji opens into a temple precinct shaped by the ambitions of the northern Fujiwara clan. Its Konjikidō, completed in 1124 and preserved inside a protective hall, is a small, luminous counterpoint to the long, forested approach.', source:'https://www.chusonji.or.jp/language_en/'},
  'Tazawa\u2019s clear blue': {spot:'Goza-no-ishi Shrine and lakeshore rock', query:'Goza-no-ishi Shrine, Lake Tazawa, Akita', story:'On the quiet shore, a vermilion torii stands above the water beside the broad rock that gave this place its name. Local legend connects the shrine to Tatsuko, the lake’s dragon guardian; across the bay, the deep blue surface makes the story feel close to the landscape. Come for the small details—the gate, the rock, the line where forest meets water.', source:'https://www.city.semboku.akita.jp/en/sightseeing/spot/04_goza.html'},
  'Aizu-Wakamatsu\u2019s samurai streets': {spot:'Nanukamachi-dōri · station-to-town stroll', query:'Nanukamachi-dori Street, Aizuwakamatsu, Fukushima', story:'Nanukamachi’s history unfolds at walking speed. From the station, a 700-metre street of early-20th-century façades leads past lacquerware, hand-painted candles, Aizu cotton, sweets shops, and sake breweries. It is an everyday shopping street as much as a historic one; pause for a local taste, then follow the old road toward the castle quarter.', source:'https://www.tohokukanko.jp/en/attractions/detail_1192.html'},
  'Oze\u2019s open wetlands': {spot:'Hatomachi-tōge trailhead to Ozegahara Marsh', query:'Hatomachi-toge Pass, Oze National Park', story:'The forest path from Hatomachi-tōge opens gradually onto Ozegahara: a wide, open marsh framed by the silhouettes of Mt. Shibutsu and Mt. Hiuchi. Boardwalks carry visitors above the wetland, where seasonal flowers give way to autumn’s gold. The first marshland is about an hour from the trailhead; stay on the boards to protect the living peatland beneath.', source:'https://oze-fnd.or.jp/wp4/wp-content/uploads/2023/04/english1_c.pdf'},
  'Kiso Valley post towns': {spot:'Narai-juku · the old Nakasendō street', query:'Narai-juku, Shiojiri, Nagano', story:'Narai grew where travellers needed to rest on the demanding Nakasendō route across the mountains. Today, its long street of restored wooden inns and merchant houses still carries the scale of a working post town, not a museum set. Walk its length slowly; the Torii Pass begins nearby, following the old road over the ridge toward Yabuhara.', source:'https://en.visitkiso.com/nakasendo/yabuhara-narai'},
  'Lake Biwa\u2019s eastern shore': {spot:'Hikone Castle outer-moat walk', query:'Hikone Castle moat, Hikone, Shiga', story:'Hikone’s old moat is a reminder that this castle town once worked with the lake, not just beside it. Waterways carried goods toward the town, while walls, gates, and bridges shaped the approach to the keep. Trace the outer moat at street level to see how the castle sits in the fabric of modern Hikone; the keep itself is a separate, ticketed visit.', source:'https://japanheritage.jp/shiga/heritage/hikone-castle'},
  'Onomichi\u2019s hillside lanes': {spot:'Senkoji Temple Path · Temple Walk', query:'Senkoji Temple Path, Onomichi, Hiroshima', story:'Onomichi is built in layers: the busy waterfront below, then narrow lanes and temple roofs climbing the hillside. Follow the Temple Walk past stone steps and small precincts until the harbor opens between the buildings. This is a route for looking back as often as looking ahead; several stretches are steep, and the old paths reward a slower pace.', source:'https://www.city.onomichi.hiroshima.jp/site/onomichikanko/1247.html'},
  'Iwami Ginzan\u2019s forest paths': {spot:'Ōmori historic townscape to Ryūgenji Mabu mine tunnel', query:'Iwami Ginzan Park, Omori, Oda, Shimane', story:'At Ōmori, the silver-mine story is written into an inhabited town: tiled roofs, merchant homes, small cafés, and stone paths beneath wooded hills. Continue from Iwami Ginzan Park toward Ryūgenji Mabu, one of the mine tunnels open to visitors. The walk is about 2.3 kilometres each way, turning industrial history into a forest journey.', source:'https://www.ginzan-wm.jp/iwamiginzan_kankousyasama_oomori/'},
  'The Iya Valley': {spot:'Ochiai Village viewpoint', query:'Ochiai Village Viewpoint, Miyoshi, Tokushima', story:'Ochiai is best understood from across the valley. From the viewpoint, houses and fields cling to a steep green slope, joined by stone retaining walls built into the mountainside. The settlement’s scattered shape tells a story of making a home where flat ground is scarce. Look for the old thatched roofs among newer homes; the village is still lived in, not preserved behind a gate.', source:'https://www.japan.travel/en/spot/ma_188/'},
  'Cape Ashizuri\u2019s ocean edge': {spot:'Cape Ashizuri Observatory and Lighthouse', query:'Cape Ashizuri Observatory, Tosashimizu, Kochi', story:'At the southern tip of Shikoku, land narrows to a headland and the Pacific takes over the horizon. From the observatory, the view sweeps more than 270 degrees; below it, the white lighthouse has watched this exposed coast since 1914. The scale is the point here: wind, open water, and a horizon that refuses to feel close.', source:'https://kochi-tabi.jp/search_spot_infocenter.html?id=712'},
  'Konpira-san\u2019s long climb': {spot:'Kotohira-gū · Omotesandō to the Main Shrine', query:'Kotohira-gu Main Shrine, Kotohira, Kagawa', story:'The climb begins among the shops and udon restaurants of Kotohira’s approach street, then turns into a sequence of stone steps, gates, lanterns, and smaller shrines. At step 785, the Main Shrine sits high above town on the wooded slope of Mount Zōzu. The ascent is part of the visit: take breaks, notice the buildings along the way, and turn around for the widening view.', source:'https://www.konpira.or.jp/articles/20200616_guide/article.htm'},
  'Ouchi-juku\u2019s thatched lanes': {spot:'Ouchi-juku main street and Takakura Shrine first gate', query:'Ouchi-juku, Shimogo, Fukushima', story:'Ouchi-juku once served travellers crossing the mountains between Aizu and Nikko. Its broad main street is still lined with thatched-roof houses, with a water channel running along either side. Walk to the far end and the first gate of Takakura Shrine marks the village’s quieter edge. The preserved streetscape is striking, but the homes and shops remain part of a living community.', source:'https://www.tohokukanko.jp/en/attractions/detail_1546.html'},
  'Shakotan\u2019s blue coast': {spot:'Shimamui Coast observation deck and Shirara Path', query:'Shimamui Coast, Shakotan, Hokkaido', story:'The first view comes from above: clear blue water laid against dark coastal rock. From the Shimamui observation deck, follow the Shirara Path toward the shore and Joro-ko Rock when the route is open. In early summer, yellow daylilies brighten the cliffs; in every season, the peninsula’s exposed edge makes weather and sea conditions part of the experience.', source:'https://www.visit-hokkaido.jp/en/spot/detail_10340.html'},
  'Kawagoe, the little Edo': {spot:'Kurazukuri old town and Toki no Kane bell tower', query:'Toki no Kane, Kawagoe, Saitama', story:'Kawagoe’s storehouses were built to protect merchants’ goods from fire, and their dark, heavy façades still define the old town. Above them rises Toki no Kane, the bell tower that has marked the hours for generations. Listen for its four daily rings, then wander the side streets where the historic quarter still meets the routines of a modern city.', source:'https://www.koedo.or.jp/en/kawagoe/'},
  'Tottori\u2019s shifting dunes': {spot:'Umanose · the “Horse’s Back” dune ridge', query:'Umanose, Tottori Sand Dunes, Tottori', story:'At Umanose, the dune rises like a long ridge between the visitor and the sea. Climb its soft slope and the Sea of Japan appears beyond the crest; below, wind has combed the sand into patterns that will be gone by tomorrow. These dunes are always moving, shaped by river sediment, currents, and coastal wind over thousands of years.', source:'https://www.japan.travel/en/spot/949/'},
  'Oshino Hakkai and Fuji views': {spot:'Waku Pond and the traditional waterwheel lanes', query:'Waku Pond, Oshino Hakkai, Yamanashi', story:'Oshino’s eight spring-fed ponds are part of a village landscape, not isolated viewpoints. At Waku Pond, look through exceptionally clear water to the stones below, then follow the narrow lanes past thatched roofs and turning waterwheels. On a clear day, Mt. Fuji completes the view beyond the rooftops. The springs are fed by water that travels underground from the mountain.', source:'https://www.japan.travel/en/spot/1327/'}
};
function renderRegionSpotlight(region) {
  const places = DESTINATIONS.filter(place => region === 'All places' || place.region === region);
  const title = document.querySelector('#region-spotlight-name');
  const count = document.querySelector('#region-spotlight-count');
  const copy = document.querySelector('#region-spotlight-copy');
  const link = document.querySelector('#region-spotlight-link');
  if (!title || !count || !copy || !link) return;
  title.textContent = region === 'All places' ? 'Choose a region' : region;
  count.textContent = region === 'All places' ? 'YOUR STARTING POINT' : `${String(places.length).padStart(2,'0')} PLACES IN THIS REGION`;
  copy.textContent = region === 'All places'
    ? 'Nine regions, from Hokkaido’s northern forests to Okinawa’s subtropical islands. Pick a number on the map or use the list.'
    : places[0]?.description || 'Browse the places, stories and seasonal notes in this region.';
   link.textContent = region === 'All places' ? `Browse all ${DESTINATIONS.length} places ↗` : `Explore ${places.length} ${region} places ↗`;
  link.href = '#destinations';
   link.setAttribute('aria-label', region === 'All places' ? `Browse all ${DESTINATIONS.length} places` : `Browse ${places.length} places in ${region}`);
  const picks = document.querySelector('#region-spotlight-picks');
  if (picks) {
    const choices = region === 'All places' ? [...new Map(DESTINATIONS.map(place => [place.region, place])).values()].slice(0, 3) : places.slice(0, 3);
    picks.replaceChildren(...choices.map(place => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'region-pick';
      button.innerHTML = '<span></span><b></b>';
      button.querySelector('span').textContent = place.region;
      button.querySelector('b').textContent = placeDisplayName(place.name);
      button.setAttribute('aria-label', `Open the story for ${placeDisplayName(place.name)} in ${place.region}`);
      button.addEventListener('click', () => showPlace(place, DESTINATIONS.indexOf(place)));
      return button;
    }));
  }
}
const saved = new Set(readSaved());

function readSaved() {
  try { return JSON.parse(localStorage.getItem('somewhere-japan-saved') || '[]'); }
  catch { return []; }
}

function persistSaved() {
  try { localStorage.setItem('somewhere-japan-saved', JSON.stringify([...saved])); }
  catch { /* Keep the current session usable if storage is unavailable. */ }
}

function renderFilters() {
  filters.replaceChildren(...REGIONS.map(region => {
    const button = document.createElement('button');
    button.className = 'filter-button';
    button.type = 'button';
    button.textContent = region;
    button.setAttribute('aria-pressed', String(region === activeRegion));
    button.addEventListener('click', () => {
      activeRegion = region;
      renderFilters();
      renderRegionSpotlight(region);
      renderDestinations();
    });
    return button;
  }));
  document.querySelectorAll('[data-map-region]').forEach(link => {
    link.classList.toggle('is-current', link.dataset.mapRegion === activeRegion);
  });
  moodFilters.replaceChildren(...MOODS.map(mood => {
    const button = document.createElement('button');
    button.className = 'mood-button'; button.type = 'button'; button.textContent = mood;
    button.setAttribute('aria-pressed', String(mood === activeMood));
    button.addEventListener('click', () => { activeMood = mood; visibleLimit = 12; renderFilters(); renderDestinations(); });
    return button;
  }));
}

function toggleSavedPlace(place) {
  if (saved.has(place.name)) saved.delete(place.name); else saved.add(place.name);
  persistSaved(); updateSavedUI(); renderDestinations();
  if (placeDialog.open) updatePlaceDialogSave(place);
}

function updatePlaceDialogSave(place) {
  const button = document.querySelector('#place-dialog-save');
  const isSaved = saved.has(place.name);
  button.textContent = isSaved ? '♥ Saved to your places' : '♡ Save this place';
  button.setAttribute('aria-pressed', String(isSaved));
  button.setAttribute('aria-label', `${isSaved ? 'Remove' : 'Save'} ${place.name}`);
}

const PLACE_SPOTLIGHTS = {
  'Nikko in the cedars': {
    address:'Tobu-Nikko Station, Nikko, Tochigi, Japan', officialUrl:'https://www.visitnikko.jp/en/itineraries/central-nikkos-highlights-for-the-time-pressed/',
    story:'Read central Nikko as a connected sacred landscape. Shinkyo Bridge, a vermilion crossing over the Daiya River, marks the entrance to the mountain precinct. The Nikko Official Guide links it to Nikkosan Rinnoji Temple, Nikko Toshogu Shrine, Futarasan-jinja Shrine and Taiyuin; take the shaded approaches slowly, since these are distinct sacred sites rather than a single hall. Shinkyo belongs to Futarasan-jinja and carries a local legend about two snakes becoming a bridge. At Rinnoji, Sanbutsudo Hall contains three large Buddha images, and the temple traces its history to the priest Shodo. Taiyuin is the mausoleum of Tokugawa Iemitsu; its Nitenmon and Kokamon gates reward a closer look. With more time, extend the day to Kanmangafuchi Abyss, where the official itinerary describes a riverside path and a row of Jizo figures. Central Nikko’s fall foliage typically peaks from late October to mid-November, but traffic increases in peak season. For a one-day visit, allow 5.5–6.5 hours as a guide estimate and arrive early for quieter temple approaches.',
    access:'From Tobu-Nikko Station, take the World Heritage Sightseeing Bus about five minutes to Shinkyo. The guide route walks between the shrine and temple precincts; return by bus from Taiyuin/Futarasan-jinja-mae. From Tokyo, Tobu limited express trains run from Asakusa to Tobu-Nikko.',
    points:['Shinkyo Bridge','Rinnoji Sanbutsudo','Nikko Toshogu Shrine','Futarasan-jinja Shrine','Taiyuin Mausoleum','Kanmangafuchi Abyss']
  },
  'Kamakura, temple to tide': {
    address:'Kamakura Station, Kanagawa, Japan', officialUrl:'https://visit.trip-kamakura.com/access/', phone:'+81-467-22-3350',
    story:"Kamakura, temple to tide is a day shaped by changing scale: the broad approach to Tsurugaoka Hachimangu Shrine gives way to lanes of small shops, then the Enoden carries you toward the coast and the open-air presence of the Great Buddha of Kamakura. At Kotoku-in, the bronze Daibutsu has stood outdoors since the hall that once covered it was destroyed; the surviving foundation stones help make the statue's setting feel less like a monument and more like a place with a long memory. A short walk away, Hasedera Temple turns the visit upward through gardens to a lookout over the town and the sea. Give the central shrine precinct the quiet of the morning, then use the railway rather than a long road transfer to reach Hase. Hydrangeas make June especially popular, while Hasedera's outlook and temple grounds change with the season. For this central-to-western route, allow about 5 to 7 hours as a planning estimate, including rail transfers, breaks and time inside the sites.", access:'Take JR to Kamakura Station, then connect by Enoden, local bus and walking for the Hase area. The official guide recommends public transport because roads near popular sights are congested.',
    points:['Tsurugaoka Hachimangu Shrine','Great Buddha of Kamakura','Hasedera Temple, Kamakura','Kamakura Station','Enoden Hase Station']
  },
  'Hakone through the mist': {
    address:'Hakone-Yumoto Station, Kanagawa, Japan', officialUrl:'https://www.hakonenavi.jp/international/en/course/244', phone:'+81-460-85-5700',
    story:"Hakone through the mist is best understood as a journey across the mountain, not a cluster of nearby stops. Start at the Hakone Open-Air Museum, where sculpture sits in a landscape of hills and gardens, then climb from Gora by cable car and ropeway toward Owakudani. The volcanic valley makes the earth itself the spectacle: steam rises from the ground, and the view opens toward the surrounding caldera. Continue down to Togendai, where the sightseeing cruise crosses Lake Ashi to Motohakone; from the port, a walk leads to Hakone Shrine beneath cedar trees and to the lakeside torii. The sequence follows Hakone's linked transport rather than trying to drive between every viewpoint. June to mid-July brings hydrangeas along the mountain railway and cable-car route, while clear days offer the best chance of seeing Mount Fuji. Ropeway, cruise and road operations can change with weather, so check service notices before setting out. Allow roughly 7 to 9 hours as a guide estimate; admission is separate at museums and some attractions, and the full circuit rewards an early start.", access:'Follow the Hakone Tozan railway, cable car, ropeway and Lake Ashi cruise; use a local bus for the return to Hakone-Yumoto. Check operator service notices before departure.',
    points:['Hakone Open-Air Museum','Owakudani','Togendai Station and Port','Hakone Shrine','Hakone-Yumoto Station']
  },
  'Tokyo, in layers': {
    address:'Tokyo Station, Tokyo, Japan', officialUrl:'https://www.gotokyo.org/en/story/walks-and-tours/best-of-tokyo/index.html',
    story:"Tokyo, in layers rewards travelers who treat the capital as a series of neighborhoods instead of a checklist. Begin in Asakusa, where the Kaminarimon lantern, Nakamise's shopfronts and the temple precinct create a walkable introduction to older Tokyo. Ride west and the city changes scale: Harajuku's busy streets meet the wooded approach to Meiji Jingu, then the broad crossing at Shibuya gathers the movement of the modern city into one memorable pause. Tokyo Station and Marunouchi offer another contrast, with the red-brick station facade opening toward wide avenues and the Imperial Palace grounds. Each district works as its own half-day; combining two nearby areas makes a satisfying day, while trying to cross the city repeatedly turns the journey into station transfers. Spring brings blossoms and comfortable outdoor walks; June is humid and rainy, so keep an indoor museum or aquarium in reserve. For two connected districts, plan about 6 to 8 hours, then add time for exhibitions, observation decks or meals. Admission varies by attraction, and most landmarks have separate opening schedules.", access:'Narita and Haneda connect to Tokyo by train, bus and taxi. Within the city, use JR, Tokyo Metro, Toei Subway and private rail; choose a district pair before planning transfers.',
    points:['Asakusa','Tokyo Station and Marunouchi','Meiji Jingu and Harajuku','Shibuya']
  },
  "Furano in bloom": { address:"Furano in bloom, Japan", officialUrl:"https://www.visit-hokkaido.jp/en/spot/detail_10174.html", phone:"+81-167-39-3939", story:"Furano's summer is a working landscape turned into a flower calendar. Farm Tomita began growing lavender for fragrance, and its traditional field survived the decline of lavender production after a photograph brought visitors to the farm in the 1970s. That history changes how the rows feel: they are not a decorative set, but the remnant of a crop that found a second life through travel. Walk first through the traditional lavender slope, then follow the farm paths past the distillery and seasonal beds; the scent shifts as the wind crosses the basin. Lavender East lies about four kilometres away and is a separate outing, so it needs a car, taxi or planned transfer rather than an assumed stroll. Late June to early August is the main lavender window, with different varieties and other flowers extending colour beyond peak weeks. The surrounding Tokachi range gives the fields their horizon. Allow half a day for the main farm, or a full day if adding nearby sites; confirm bloom reports and summer train dates before setting out.", access:"JR Furano Line reaches Nakafurano; the summer-only Lavender Field Station is about seven minutes on foot from Farm Tomita. Asahikawa Airport is about 40 minutes by car and Furano Station about 15 minutes by car. By air, arrive at Asahikawa or New Chitose and continue by rail or rental car; by bus, use seasonal Furano-area services and confirm schedules. The farm has free parking, but summer traffic is heavy. The open fields are spread out, so a car or taxi is useful for Lavender East.", points:["Traditional Lavender Field","Distillery and seasonal fields","Lavender East"] },
  "The blue of Biei": { address:"The blue of Biei, Japan", officialUrl:"https://www.visit-hokkaido.jp/en/spot/detail_10511.html", phone:"+81-166-92-4378", story:"The Blue Pond is not a natural lake discovered unchanged in the forest. It formed during a 1980s erosion-control project, when a dam was built to protect Biei from volcanic mudflows. Mineral-rich water from the Shirahige Falls area enters the Biei River, and fine particles scatter light so the pond shifts between milky turquoise and deep cobalt. The pale larch trunks are dead trees, their stillness part of the scene rather than a planted display. Start at the designated paths and viewing area, then continue to Blue River Bridge for a different look at the blue water and falls; these are separate stops, so allow for the drive or bus connection. Biei's famous patchwork fields lie farther away and are working farmland: view them from public roads and never enter planted fields. The colour changes with weather, light and season, and winter access can be affected by snow or severe conditions. Plan two to three hours for the pond and falls, longer for the broader Biei countryside, and check local road and bus information before you go.", access:"The Blue Pond is about 20 minutes by car from JR Biei Station and about 40 minutes from Asahikawa Airport. By rail, reach Biei on the JR Furano Line, then use a seasonal bus, taxi or rental car; direct public transport is limited. Flights arrive through Asahikawa Airport, then continue by road. Parking is available and paid. By car, combine the pond with Shirogane Onsen and Shirahige Falls, but verify road conditions in winter.", points:["Shirogane Blue Pond","Shirahige Falls","Blue River Bridge"] },
  "Shiretoko’s wild edge": { address:"Shiretoko’s wild edge, Japan", officialUrl:"https://www.goko.go.jp/multilingual_eng/", phone:"+81-152-24-3323", story:"Shiretoko is a place to look carefully and leave space for the wild. At Shiretoko Goko, five lakes sit beneath the peninsula's mountain spine, with the Sea of Okhotsk appearing between trees on the elevated boardwalk. The short raised route is designed to remain accessible under conditions when the forest trails are restricted. The ground paths pass closer to the lakes, but their rules change by season and bear activity; during regulated periods, visitors may need to join a registered guide. This is not a park where a trail plan should be treated as fixed. Begin at the field house, check same-day notices, and choose the boardwalk or an authorized ground route according to current conditions. The experience is quieter when visitors keep their voices low, carry out all rubbish and never feed wildlife. From Utoro, the lakes are a substantial excursion along the national park road, best paired with the Nature Center or a planned coastal viewpoint rather than an improvised sequence of distant stops. Allow at least half a day including transport. Bring layers: sea wind, rain and visibility can change quickly.", access:"Reach Shiretoko by air through Memanbetsu or Nakashibetsu, then continue by road to Utoro. From JR Shiretoko-Shari Station, seasonal buses connect toward Utoro and the national park; services are limited. The Five Lakes are a further drive or bus trip from Utoro. A rental car gives flexibility, but check road notices and wildlife-related restrictions. There is no rail station in the park.", points:["Shiretoko Goko Field House","Elevated wooden boardwalk","Ground trail entrance"] },
  "Otaru by lamplight": { address:"Otaru by lamplight, Japan", officialUrl:"https://www.visit-hokkaido.jp/en/spot/detail_10040.html", phone:"+81-134-33-1661", story:"Otaru's canal tells a practical port story before it becomes a romantic evening scene. Completed in 1923, the 1,140-metre waterway let small vessels unload cargo from larger ships; after the port's role changed, the southern edge was reshaped into a promenade while the North Canal retained more of its original width. The old stone warehouses are now part of the town's daily life, with cafés, restaurants and museums occupying buildings that once served trade. Begin near Otaru Station and walk downhill to the canal, then follow the waterfront toward the former Temiya railway line and the Sakaimachi district. The Music Box Museum and Kitaichi Glass are indoor stops that make a useful afternoon alternative when the sea wind or winter snow makes a long waterfront stroll less comfortable. Return to the canal at dusk, when its gas lamps are lit and the warehouse reflections change the view. Most of the route is walkable, but it is a town walk with traffic crossings and winter footing to consider. Give it four to six hours, and check attraction opening times separately.", access:"JR Hakodate Line connects Otaru with Sapporo; the canal is about a 10-minute walk downhill from Otaru Station. Otaru has no major airport; fly to New Chitose and continue by JR rail or highway bus. By car, use Otaru IC and city parking, but the station-side route is easier on foot. Otaru Canal Cruise departs near Chuo Bridge; check seasonal departure times and book popular evening sailings.", points:["Otaru Canal","Former Temiya railway line","Sakaimachi and Music Box Museum"] },
  "Daisetsuzan high country": { address:"Daisetsuzan high country, Japan", officialUrl:"https://asahidake.hokkaido.jp/en/", phone:"+81-166-68-9111", story:"Daisetsuzan is a mountain system, not a single summit viewpoint, and its scale matters to the day plan. Asahidake, Hokkaido's highest peak, offers one of the most accessible introductions: the ropeway climbs from Asahidake Onsen to Sugatami, where alpine terrain begins above the forest. The loop around Sugatami Pond is about 1.7 kilometres and roughly an hour in fair conditions, but the elevation, wind and sudden weather shifts make it more demanding than a city walk. The first snow and autumn colour arrive early here; summer brings alpine plants in a brief season. Take the visitor center as a preparation stop, check the ropeway's live status and mountain weather, and turn back if visibility deteriorates. The summit climb is a separate serious hike requiring suitable equipment and experience; the ropeway does not make it a casual extension. Asahidake is reached by road or seasonal bus from Asahikawa, and services are limited compared with city transit. Allow a full day from Asahikawa and consider staying overnight at Asahidake Onsen to avoid a rushed return.", access:"Asahidake Ropeway is at Asahidake Onsen. From Asahikawa Station, the drive is about 1 hour 10 minutes; Asahikawa Airport is about 60 minutes by car. Seasonal buses connect Asahikawa with Asahidake, but frequency is limited. By air, use Asahikawa Airport and arrange onward transport; a rental car is the flexible option. Check the ropeway live status, parking information and mountain weather before departure.", points:["Asahidake Visitor Center","Sugatami Pond loop","Asahidake Ropeway"] },
  "Hakodate from above": { address:"Hakodate from above, Japan", officialUrl:"https://www.visit-hokkaido.jp/en/spot/detail_10094.html", phone:"+81-138-23-6288", story:"Hakodate's night view is shaped by geography: the city narrows to a bright strip between Hakodate Bay and the Tsugaru Strait. From the summit, the two dark waters frame the street grid and make the lights look unusually close. Arrive before sunset if you want to watch the colour move from blue hour into night, but expect the summit to be busy at the same time. The ropeway takes about three minutes from the Motomachi base station, and the summit observatory gives an all-weather viewing space; on clear days, the surrounding sea and hills are equally compelling. Pair the ascent with a separate walk through Motomachi's hillside streets, historic churches and Hachimanzaka, rather than trying to cover the whole city in one circuit. Private cars are restricted on the mountain road during seasonal evening hours, and the road closes to vehicles in snow season, so check whether the ropeway is operating. The ropeway may also pause for maintenance. Allow two to three hours around sunset, with extra time for queues and transit.", access:"The ropeway base is reached by city tram from Hakodate Station, followed by a short walk; the official tourism listing gives about six minutes by streetcar. Hakodate Airport is about 30 minutes from the city by car or airport bus. JR trains connect Hakodate with other Hokkaido cities. Private and rental cars are restricted on the mountain road during seasonal evening hours, and the road closes in snow season; check the ropeway status and maintenance dates.", points:["Motomachi hillside","Ropeway Sanroku Station","Summit observatory"] },
  "Lake Toya, volcanic calm": { address:"Lake Toya, volcanic calm, Japan", officialUrl:"https://www.visit-hokkaido.jp/en/spot/detail_10050.html", phone:"+81-142-75-2446", story:"Lake Toya is a caldera landscape where the lake's calm surface sits beside a very active volcanic story. Nakajima rises from the center of the water, while Mount Usu and Showa Shinzan form the southern edge of the view. The lakeside promenade turns this geology into an easy walk: outdoor sculptures interrupt the shore, hot-spring inns face the water, and the long-run fireworks illuminate the lake on scheduled evenings from late April through October. Start at the Toyako Visitor Center and Volcanic Science Museum to understand the eruptions and the settlements they changed, then walk the onsen waterfront before choosing a cruise or the Usu Ropeway as a separate excursion. The ropeway and Showa Shinzan are across the bay from the central onsen strip, so allow for a bus, taxi or car transfer. Clear weather brings the best mountain views, but lake conditions and attraction schedules vary. Allow a relaxed half-day for the onsen shore, or a full day to include the volcano area. Check current cruise and ropeway notices before committing to connections.", access:"JR Toya Station is about 20 minutes by bus from Toyako Onsen; the expressway interchange is about five minutes away. New Chitose Airport is roughly 90 minutes by car. By rail, reach Toya Station and transfer by local bus; by air, use New Chitose and continue by road. The shore is walkable, but Showa Shinzan and Usu Ropeway require a separate bus, taxi or car transfer.", points:["Toyako Visitor Center and Volcano Science Museum","Lake Toya promenade","Showa Shinzan and Usu Ropeway"] },
  "Matsushima Bay": { address:"Matsushima Bay, Japan", officialUrl:"https://www.tohokukanko.jp/en/attractions/detail_1405.html", phone:"+81-22-354-2618", story:"Matsushima's islands are best understood from two heights: close to the water by boat, and from the wooded viewpoints that look across the bay. More than two hundred islands break the waves and soften the open horizon; the shapes of pine-covered rocks change with each turn of the cruise route. On shore, the compact visitor district gathers temples, tea rooms and small islands connected by bridges. Begin at Matsushima-Kaigan Station, walk to the bayfront and choose a cruise before exploring Zuiganji and Entsuin; finish at Godaido, the small pavilion on an island reached by a vermilion bridge. This order keeps the walk compact and leaves the boat as a flexible loop rather than a forced connection. If you want the wider view, Mount Otakamori and the other Shitaikan viewpoints require a separate drive or local transport and more walking. The town has deep cultural history alongside the scenery, so leave time for the temple precincts rather than treating them as photo stops. Allow four to six hours for the station-side route, and check cruise departures and temple hours on the day.", access:"Take the JR Senseki Line from Sendai to Matsushima-Kaigan Station; the main bayfront sights, temples and cruise piers are within walking distance. By air, reach Sendai Airport and continue by rail via Sendai. By car, use the Matsushima-Kaigan area parking and expect congestion on weekends. The station-side core is walkable; the Shitaikan viewpoints are farther out and need a separate drive or local connection.", points:["Matsushima Bay cruise","Zuiganji and Entsuin","Godaido Hall"] },
  "Ginzan after dark": { address:"Ginzan after dark, Japan", officialUrl:"https://www.ginzanonsen.jp/access/", phone:"+81-237-28-3933", story:"Ginzan Onsen is a short, narrow riverside town whose atmosphere depends on staying long enough to notice small details. Wooden inns line the Ginzan River, and after dusk the lamps catch their façades, bridges and the moving water. Look for kote-e relief panels on the buildings, then follow the lane upstream to Shirogane Waterfall; on the way back, Warashiyu footbath offers a brief pause beside the river. The route is compact, but the streets are narrow and shared with residents, inn guests and service vehicles, so keep to the pedestrian areas and follow local entry rules. Winter snow gives the town its famous contrast, but it also brings visitor controls, road restrictions and heavy demand for buses and lodging. Access is via Oishida Station on the Yamagata Shinkansen and a bus of about 40 minutes; confirm the current reservation or shuttle requirements before traveling, especially in winter. The onsen town is a better overnight destination than a hurried late-night detour. Allow two to three hours in the town itself, plus the transfer time, and book accommodation well ahead for peak dates.", access:"Take the Yamagata Shinkansen to Oishida Station, then the scheduled bus to Ginzan Onsen, about 40 minutes. Yamagata Airport is about an hour by car. By car, use the designated parking and shuttle system; do not follow narrow mountain roads that the official access guide warns against. Seasonal visitor controls and reservations may apply, especially in winter. Check the official notice before travel.", points:["Shiroganebashi Bridge","Warashiyu footbath","Shirogane Waterfall"] },
  "Oirase stream walk": { address:"Oirase stream walk, Japan", officialUrl:"https://www.eco-oirase.com/en/access", phone:"+81-176-75-2425", story:"Oirase is a fourteen-kilometre river corridor where the route follows water from Lake Towada's outlet at Nenokuchi to the hot-spring area at Yakeyama. Rather than treating it as one long walk, choose a section and use the bus stops along the road to manage distance. The central stretch around Choshi Otaki is known for the river's force and spray; elsewhere, small cascades, moss-covered rocks and low bridges create a slower rhythm. In autumn, foliage reflects in the stream, while summer greenery keeps the gorge cool and shaded. The path shares a narrow valley with the road, so stay on signed pedestrian routes and watch for bicycles and vehicles at crossings. Bus frequency is limited, and schedules can be seasonal; decide your start and finish stops before you begin. From Aomori or Hachinohe, the JR bus ride takes around two hours or an hour and a half respectively to the gorge onsen area, with further travel to Lake Towada. Winter service can stop, and seasonal vehicle restrictions may introduce a shuttle. Allow half a day for a selected segment or a full day for a longer traverse. Check transport and road notices first.", access:"From Aomori or Shin-Aomori Station, JR Bus Mizuumi-go takes about two hours to Oirase Gorge Onsen; from Hachinohe Station, JR Bus Oirase-go takes about 90 minutes. Aomori and Misawa airports are the nearest air gateways, followed by bus, taxi or rental car. The road corridor has limited bus frequency and seasonal winter suspension. Traffic restrictions can introduce a shuttle, so check the official road and bus notices.", points:["Yakeyama gorge entrance","Choshi Otaki Falls","Nenokuchi at Lake Towada"] },
  "Furano in bloom": { address:"Furano in bloom, Japan", officialUrl:"https://www.visit-hokkaido.jp/en/spot/detail_10174.html", phone:"+81-167-39-3939", story:"Furano's summer is a working landscape turned into a flower calendar. Farm Tomita began growing lavender for fragrance, and its traditional field survived the decline of lavender production after a photograph brought visitors to the farm in the 1970s. That history changes how the rows feel: they are not a decorative set, but the remnant of a crop that found a second life through travel. Walk first through the traditional lavender slope, then follow the farm paths past the distillery and seasonal beds; the scent shifts as the wind crosses the basin. Lavender East lies about four kilometres away and is a separate outing, so it needs a car, taxi or planned transfer rather than an assumed stroll. Late June to early August is the main lavender window, with different varieties and other flowers extending colour beyond peak weeks. The surrounding Tokachi range gives the fields their horizon. Allow half a day for the main farm, or a full day if adding nearby sites; confirm bloom reports and summer train dates before setting out.", access:"JR Furano Line reaches Nakafurano; the summer-only Lavender Field Station is about seven minutes on foot from Farm Tomita. Asahikawa Airport is about 40 minutes by car and Furano Station about 15 minutes by car. By air, arrive at Asahikawa or New Chitose and continue by rail or rental car; by bus, use seasonal Furano-area services and confirm schedules. The farm has free parking, but summer traffic is heavy. The open fields are spread out, so a car or taxi is useful for Lavender East.", points:["Traditional Lavender Field","Distillery and seasonal fields","Lavender East"] },
  "The blue of Biei": { address:"The blue of Biei, Japan", officialUrl:"https://www.visit-hokkaido.jp/en/spot/detail_10511.html", phone:"+81-166-92-4378", story:"The Blue Pond is not a natural lake discovered unchanged in the forest. It formed during a 1980s erosion-control project, when a dam was built to protect Biei from volcanic mudflows. Mineral-rich water from the Shirahige Falls area enters the Biei River, and fine particles scatter light so the pond shifts between milky turquoise and deep cobalt. The pale larch trunks are dead trees, their stillness part of the scene rather than a planted display. Start at the designated paths and viewing area, then continue to Blue River Bridge for a different look at the blue water and falls; these are separate stops, so allow for the drive or bus connection. Biei's famous patchwork fields lie farther away and are working farmland: view them from public roads and never enter planted fields. The colour changes with weather, light and season, and winter access can be affected by snow or severe conditions. Plan two to three hours for the pond and falls, longer for the broader Biei countryside, and check local road and bus information before you go.", access:"The Blue Pond is about 20 minutes by car from JR Biei Station and about 40 minutes from Asahikawa Airport. By rail, reach Biei on the JR Furano Line, then use a seasonal bus, taxi or rental car; direct public transport is limited. Flights arrive through Asahikawa Airport, then continue by road. Parking is available and paid. By car, combine the pond with Shirogane Onsen and Shirahige Falls, but verify road conditions in winter.", points:["Shirogane Blue Pond","Shirahige Falls","Blue River Bridge"] },
  "Shiretoko’s wild edge": { address:"Shiretoko’s wild edge, Japan", officialUrl:"https://www.goko.go.jp/multilingual_eng/", phone:"+81-152-24-3323", story:"Shiretoko is a place to look carefully and leave space for the wild. At Shiretoko Goko, five lakes sit beneath the peninsula's mountain spine, with the Sea of Okhotsk appearing between trees on the elevated boardwalk. The short raised route is designed to remain accessible under conditions when the forest trails are restricted. The ground paths pass closer to the lakes, but their rules change by season and bear activity; during regulated periods, visitors may need to join a registered guide. This is not a park where a trail plan should be treated as fixed. Begin at the field house, check same-day notices, and choose the boardwalk or an authorized ground route according to current conditions. The experience is quieter when visitors keep their voices low, carry out all rubbish and never feed wildlife. From Utoro, the lakes are a substantial excursion along the national park road, best paired with the Nature Center or a planned coastal viewpoint rather than an improvised sequence of distant stops. Allow at least half a day including transport. Bring layers: sea wind, rain and visibility can change quickly.", access:"Reach Shiretoko by air through Memanbetsu or Nakashibetsu, then continue by road to Utoro. From JR Shiretoko-Shari Station, seasonal buses connect toward Utoro and the national park; services are limited. The Five Lakes are a further drive or bus trip from Utoro. A rental car gives flexibility, but check road notices and wildlife-related restrictions. There is no rail station in the park.", points:["Shiretoko Goko Field House","Elevated wooden boardwalk","Ground trail entrance"] },
  "Otaru by lamplight": { address:"Otaru by lamplight, Japan", officialUrl:"https://www.visit-hokkaido.jp/en/spot/detail_10040.html", phone:"+81-134-33-1661", story:"Otaru's canal tells a practical port story before it becomes a romantic evening scene. Completed in 1923, the 1,140-metre waterway let small vessels unload cargo from larger ships; after the port's role changed, the southern edge was reshaped into a promenade while the North Canal retained more of its original width. The old stone warehouses are now part of the town's daily life, with cafés, restaurants and museums occupying buildings that once served trade. Begin near Otaru Station and walk downhill to the canal, then follow the waterfront toward the former Temiya railway line and the Sakaimachi district. The Music Box Museum and Kitaichi Glass are indoor stops that make a useful afternoon alternative when the sea wind or winter snow makes a long waterfront stroll less comfortable. Return to the canal at dusk, when its gas lamps are lit and the warehouse reflections change the view. Most of the route is walkable, but it is a town walk with traffic crossings and winter footing to consider. Give it four to six hours, and check attraction opening times separately.", access:"JR Hakodate Line connects Otaru with Sapporo; the canal is about a 10-minute walk downhill from Otaru Station. Otaru has no major airport; fly to New Chitose and continue by JR rail or highway bus. By car, use Otaru IC and city parking, but the station-side route is easier on foot. Otaru Canal Cruise departs near Chuo Bridge; check seasonal departure times and book popular evening sailings.", points:["Otaru Canal","Former Temiya railway line","Sakaimachi and Music Box Museum"] },
  "Daisetsuzan high country": { address:"Daisetsuzan high country, Japan", officialUrl:"https://asahidake.hokkaido.jp/en/", phone:"+81-166-68-9111", story:"Daisetsuzan is a mountain system, not a single summit viewpoint, and its scale matters to the day plan. Asahidake, Hokkaido's highest peak, offers one of the most accessible introductions: the ropeway climbs from Asahidake Onsen to Sugatami, where alpine terrain begins above the forest. The loop around Sugatami Pond is about 1.7 kilometres and roughly an hour in fair conditions, but the elevation, wind and sudden weather shifts make it more demanding than a city walk. The first snow and autumn colour arrive early here; summer brings alpine plants in a brief season. Take the visitor center as a preparation stop, check the ropeway's live status and mountain weather, and turn back if visibility deteriorates. The summit climb is a separate serious hike requiring suitable equipment and experience; the ropeway does not make it a casual extension. Asahidake is reached by road or seasonal bus from Asahikawa, and services are limited compared with city transit. Allow a full day from Asahikawa and consider staying overnight at Asahidake Onsen to avoid a rushed return.", access:"Asahidake Ropeway is at Asahidake Onsen. From Asahikawa Station, the drive is about 1 hour 10 minutes; Asahikawa Airport is about 60 minutes by car. Seasonal buses connect Asahikawa with Asahidake, but frequency is limited. By air, use Asahikawa Airport and arrange onward transport; a rental car is the flexible option. Check the ropeway live status, parking information and mountain weather before departure.", points:["Asahidake Visitor Center","Sugatami Pond loop","Asahidake Ropeway"] },
  "Hakodate from above": { address:"Hakodate from above, Japan", officialUrl:"https://www.visit-hokkaido.jp/en/spot/detail_10094.html", phone:"+81-138-23-6288", story:"Hakodate's night view is shaped by geography: the city narrows to a bright strip between Hakodate Bay and the Tsugaru Strait. From the summit, the two dark waters frame the street grid and make the lights look unusually close. Arrive before sunset if you want to watch the colour move from blue hour into night, but expect the summit to be busy at the same time. The ropeway takes about three minutes from the Motomachi base station, and the summit observatory gives an all-weather viewing space; on clear days, the surrounding sea and hills are equally compelling. Pair the ascent with a separate walk through Motomachi's hillside streets, historic churches and Hachimanzaka, rather than trying to cover the whole city in one circuit. Private cars are restricted on the mountain road during seasonal evening hours, and the road closes to vehicles in snow season, so check whether the ropeway is operating. The ropeway may also pause for maintenance. Allow two to three hours around sunset, with extra time for queues and transit.", access:"The ropeway base is reached by city tram from Hakodate Station, followed by a short walk; the official tourism listing gives about six minutes by streetcar. Hakodate Airport is about 30 minutes from the city by car or airport bus. JR trains connect Hakodate with other Hokkaido cities. Private and rental cars are restricted on the mountain road during seasonal evening hours, and the road closes in snow season; check the ropeway status and maintenance dates.", points:["Motomachi hillside","Ropeway Sanroku Station","Summit observatory"] },
  "Lake Toya, volcanic calm": { address:"Lake Toya, volcanic calm, Japan", officialUrl:"https://www.visit-hokkaido.jp/en/spot/detail_10050.html", phone:"+81-142-75-2446", story:"Lake Toya is a caldera landscape where the lake's calm surface sits beside a very active volcanic story. Nakajima rises from the center of the water, while Mount Usu and Showa Shinzan form the southern edge of the view. The lakeside promenade turns this geology into an easy walk: outdoor sculptures interrupt the shore, hot-spring inns face the water, and the long-run fireworks illuminate the lake on scheduled evenings from late April through October. Start at the Toyako Visitor Center and Volcanic Science Museum to understand the eruptions and the settlements they changed, then walk the onsen waterfront before choosing a cruise or the Usu Ropeway as a separate excursion. The ropeway and Showa Shinzan are across the bay from the central onsen strip, so allow for a bus, taxi or car transfer. Clear weather brings the best mountain views, but lake conditions and attraction schedules vary. Allow a relaxed half-day for the onsen shore, or a full day to include the volcano area. Check current cruise and ropeway notices before committing to connections.", access:"JR Toya Station is about 20 minutes by bus from Toyako Onsen; the expressway interchange is about five minutes away. New Chitose Airport is roughly 90 minutes by car. By rail, reach Toya Station and transfer by local bus; by air, use New Chitose and continue by road. The shore is walkable, but Showa Shinzan and Usu Ropeway require a separate bus, taxi or car transfer.", points:["Toyako Visitor Center and Volcano Science Museum","Lake Toya promenade","Showa Shinzan and Usu Ropeway"] },
  "Matsushima Bay": { address:"Matsushima Bay, Japan", officialUrl:"https://www.tohokukanko.jp/en/attractions/detail_1405.html", phone:"+81-22-354-2618", story:"Matsushima's islands are best understood from two heights: close to the water by boat, and from the wooded viewpoints that look across the bay. More than two hundred islands break the waves and soften the open horizon; the shapes of pine-covered rocks change with each turn of the cruise route. On shore, the compact visitor district gathers temples, tea rooms and small islands connected by bridges. Begin at Matsushima-Kaigan Station, walk to the bayfront and choose a cruise before exploring Zuiganji and Entsuin; finish at Godaido, the small pavilion on an island reached by a vermilion bridge. This order keeps the walk compact and leaves the boat as a flexible loop rather than a forced connection. If you want the wider view, Mount Otakamori and the other Shitaikan viewpoints require a separate drive or local transport and more walking. The town has deep cultural history alongside the scenery, so leave time for the temple precincts rather than treating them as photo stops. Allow four to six hours for the station-side route, and check cruise departures and temple hours on the day.", access:"Take the JR Senseki Line from Sendai to Matsushima-Kaigan Station; the main bayfront sights, temples and cruise piers are within walking distance. By air, reach Sendai Airport and continue by rail via Sendai. By car, use the Matsushima-Kaigan area parking and expect congestion on weekends. The station-side core is walkable; the Shitaikan viewpoints are farther out and need a separate drive or local connection.", points:["Matsushima Bay cruise","Zuiganji and Entsuin","Godaido Hall"] },
  "Ginzan after dark": { address:"Ginzan after dark, Japan", officialUrl:"https://www.ginzanonsen.jp/access/", phone:"+81-237-28-3933", story:"Ginzan Onsen is a short, narrow riverside town whose atmosphere depends on staying long enough to notice small details. Wooden inns line the Ginzan River, and after dusk the lamps catch their façades, bridges and the moving water. Look for kote-e relief panels on the buildings, then follow the lane upstream to Shirogane Waterfall; on the way back, Warashiyu footbath offers a brief pause beside the river. The route is compact, but the streets are narrow and shared with residents, inn guests and service vehicles, so keep to the pedestrian areas and follow local entry rules. Winter snow gives the town its famous contrast, but it also brings visitor controls, road restrictions and heavy demand for buses and lodging. Access is via Oishida Station on the Yamagata Shinkansen and a bus of about 40 minutes; confirm the current reservation or shuttle requirements before traveling, especially in winter. The onsen town is a better overnight destination than a hurried late-night detour. Allow two to three hours in the town itself, plus the transfer time, and book accommodation well ahead for peak dates.", access:"Take the Yamagata Shinkansen to Oishida Station, then the scheduled bus to Ginzan Onsen, about 40 minutes. Yamagata Airport is about an hour by car. By car, use the designated parking and shuttle system; do not follow narrow mountain roads that the official access guide warns against. Seasonal visitor controls and reservations may apply, especially in winter. Check the official notice before travel.", points:["Shiroganebashi Bridge","Warashiyu footbath","Shirogane Waterfall"] },
  "Oirase stream walk": { address:"Oirase stream walk, Japan", officialUrl:"https://www.eco-oirase.com/en/access", phone:"+81-176-75-2425", story:"Oirase is a fourteen-kilometre river corridor where the route follows water from Lake Towada's outlet at Nenokuchi to the hot-spring area at Yakeyama. Rather than treating it as one long walk, choose a section and use the bus stops along the road to manage distance. The central stretch around Choshi Otaki is known for the river's force and spray; elsewhere, small cascades, moss-covered rocks and low bridges create a slower rhythm. In autumn, foliage reflects in the stream, while summer greenery keeps the gorge cool and shaded. The path shares a narrow valley with the road, so stay on signed pedestrian routes and watch for bicycles and vehicles at crossings. Bus frequency is limited, and schedules can be seasonal; decide your start and finish stops before you begin. From Aomori or Hachinohe, the JR bus ride takes around two hours or an hour and a half respectively to the gorge onsen area, with further travel to Lake Towada. Winter service can stop, and seasonal vehicle restrictions may introduce a shuttle. Allow half a day for a selected segment or a full day for a longer traverse. Check transport and road notices first.", access:"From Aomori or Shin-Aomori Station, JR Bus Mizuumi-go takes about two hours to Oirase Gorge Onsen; from Hachinohe Station, JR Bus Oirase-go takes about 90 minutes. Aomori and Misawa airports are the nearest air gateways, followed by bus, taxi or rental car. The road corridor has limited bus frequency and seasonal winter suspension. Traffic restrictions can introduce a shuttle, so check the official road and bus notices.", points:["Yakeyama gorge entrance","Choshi Otaki Falls","Nenokuchi at Lake Towada"] },
  "Hirosaki in blossom": { address:"Hirosaki in blossom, Japan", officialUrl:"https://www.hirosaki-kanko.or.jp/individual/cat02_spring_sakura/en_map.pdf", phone:"+81-172-37-5501", story:"Hirosaki’s spring spectacle is more than a sea of pink: blossoms sit inside a working castle town whose moat and stone walls frame the flowers. Old trees are carefully pruned, and fallen petals gather into the water in a fleeting scene known as hana-ikada, a flower raft. The keep now stands apart from its original stone base after repairs, a detail worth noticing after the first wide view. Follow the moat, pause in a quieter garden, then learn about Tsugaru’s summer festival craft. Peak bloom usually falls in late April or early May, but the forecast changes every year. Arrive early and leave several hours for the park. Hirosaki Castle Park. Walk the moat before crowds arrive; look for fallen petals gathering into the flower-raft scene. Fujita Memorial Garden. A traditional garden with pond, lawn and a western-style residence, offering a quieter pause nearby. Tsugaru-han Neputa Village. See festival floats, painted lantern panels and demonstrations of Tsugaru instruments.", access:"From Tokyo, take the Tohoku Shinkansen to Shin-Aomori and transfer to the JR Ou Main Line for Hirosaki Station. Aomori Airport has bus links; the park is about a 30-minute walk or short local-bus ride from Hirosaki Station. By car, use signed city parking and expect festival congestion. Highway buses also connect Hirosaki with Aomori and other Tohoku cities.", points:["Hirosaki Castle Park","Fujita Memorial Garden","Tsugaru-han Neputa Village"] },\n  "Hiraizumi’s quiet temples": { address:"Hiraizumi’s quiet temples, Japan", officialUrl:"https://www.japan.travel/en/spot/1803/", phone:"+81-191-46-2110", story:"Hiraizumi was built to make an idea of Buddhist paradise tangible. In the twelfth century, the northern Fujiwara rulers shaped halls, temples and gardens around a vision of a pure land. At Chusonji, a cedar-lined ascent leads to the Golden Hall, where lacquer, gold and mother-of-pearl contrast with the forest outside. Motsuji offers a different stillness: its pond garden preserves the classical composition of water, shore and island, inviting visitors to circle slowly. Takadachi Gikeido adds the human story of Yoshitsune to the valley’s history. A local loop bus links the principal sites in season, while bicycles suit flatter stretches. Spring greenery and autumn leaves bring colour; summer lotus at Chusonji recalls seeds preserved for centuries. Leave room for quiet between landmarks. Chusonji and Konjikido. Climb the cedar approach and see the Golden Hall’s fine lacquer and gold work. Motsuji Temple garden. Walk the broad pond garden and notice its island, pebble shore and Heian-era layout. Takadachi Gikeido Hall. A hilltop memorial associated with Minamoto no Yoshitsune and the region’s political history.", access:"Take the Tohoku Shinkansen to Ichinoseki, then the JR Tohoku Main Line one stop to Hiraizumi Station. A seasonal loop bus, local taxi and rental bicycle connect heritage sites. Chusonji is about a 10-minute bus ride or 30-minute walk away; Motsuji is closer. By car, use temple parking. Iwate Hanamaki Airport requires onward rail or road transfer.", points:["Chusonji and Konjikido","Motsuji Temple garden","Takadachi Gikeido Hall"] },\n  "Tazawa’s clear blue": { address:"Tazawa’s clear blue, Japan", officialUrl:"https://www.city.semboku.akita.jp/en/sightseeing/spot/04_tazawako.html", phone:"+81-187-43-2111", story:"Lake Tazawa holds two sights in the same blue circle: open water and the story of Tatsuko, remembered in gold on the western shore. The statue stands where mountain slopes meet the lake, while a vermilion torii and Goza-no-ishi Shrine mark a northern cove associated with feudal visitors. These points are not next door. The shoreline is about twenty kilometres around, so the visit is more rewarding as a planned loop than an improvised walk. From the water, a sightseeing boat or lakeside pause turns the scale into a clear horizon. On calm days, the surface mirrors surrounding mountains; wind and cloud quickly alter its colour. Use the local bus and seasonal circular service, or rent a car or bicycle for flexibility. Spring blossoms, summer lake activities and autumn colour suit different paces. Check connections before leaving the station. Tatsuko Statue. The golden figure on the western shore anchors a local legend and looks across the water. Goza-no-ishi Shrine. A red torii frames a quieter northern cove and a story connected to the lake. Katamae Park. A raised lakeside park with open views across blue water toward surrounding hills.", access:"The Akita Shinkansen reaches Tazawako Station from Tokyo. Ugo Kotsu buses connect the station with the lakeshore and seasonal circular route. Akita Airport has an airport liner for the Tazawako area. A car or bicycle helps because sights are spread around a roughly 20-kilometre shore; bus departures are limited, so check the timetable first.", points:["Tatsuko Statue","Goza-no-ishi Shrine","Katamae Park"] },\n  "The three mountains of Dewa": { address:"The three mountains of Dewa, Japan", officialUrl:"https://www.japan.travel/en/spot/2130/", phone:"+81-235-62-2355", story:"The Dewa Sanzan pilgrimage is traditionally told as a passage through birth, death and rebirth, but a visitor need not climb every sacred peak to feel its depth. Begin at Zuishinmon Gate on Mount Haguro and enter a forest of towering cedar, where the stone stairway turns the walk into a steady act of attention. The Five-Storied Pagoda appears quietly among the trees, its wood darkened by weather and time. Continue uphill to Sanjin Gosaiden, where deities of all three mountains are enshrined beneath a massive thatched roof. Haguro is the most accessible mountain year-round; Gassan and Yudono have shorter seasonal openings and should be separate outings. A bus can reach the summit, while the full stair climb is strenuous. Dress for rain, follow shrine etiquette and never photograph prohibited sacred areas. Zuishinmon Gate. The traditional gateway begins the cedar-lined pilgrimage climb; check weather before choosing the stairs. Five-Storied Pagoda. A National Treasure among old cedars; approach quietly and keep the narrow path clear. Sanjin Gosaiden. The summit shrine honors all three mountain deities beneath an extraordinary thatched roof.", access:"From Tokyo, travel by Shinkansen and rail to Tsuruoka. Shonai Airport has bus connections toward town. Shonai Kotsu buses serve Hagurozuishinmon and Haguro Sancho; schedules change seasonally. By car, use signed shrine parking and follow mountain road notices. Mount Gassan and Mount Yudono require separate access planning.", points:["Zuishinmon Gate","Five-Storied Pagoda","Sanjin Gosaiden"] },\n  "Aizu-Wakamatsu’s samurai streets": { address:"Aizu-Wakamatsu’s samurai streets, Japan", officialUrl:"https://www.aizukanko.com/spot/134/", phone:"+81-242-27-4005", story:"Aizu-Wakamatsu wears its history in layers: a red-roofed castle, a former samurai residence and a hill where young retainers made a final, tragic stand. At Tsuruga Castle, white walls and deep red roof tiles are striking against snow or spring blossoms; the museum traces the region’s turbulent past. Aizu Bukeyashiki reconstructs household life, from reception rooms to work spaces, making the social order tangible rather than distant. At Iimoriyama, the Byakkotai memorial asks for a quieter visit; the story should not be reduced to a photo stop. These places are spread across town, so connect them by loop bus, taxi or car instead of walking the entire route. Pause for lacquerware or local cuisine if time allows. Snow is atmospheric but brings cold and icy streets. Plan extra time between sites. Tsuruga Castle. Explore the reconstructed keep and moat; the red roof is a distinctive local restoration choice. Aizu Bukeyashiki. Walk a large samurai residence complex and see its rooms, garden and historic displays. Iimoriyama and Byakkotai memorial. Visit the hillside memorial thoughtfully and allow time for the young retainers’ story.", access:"Take the Tohoku Shinkansen to Koriyama and transfer to the JR Ban-Etsu West Line for Aizu-Wakamatsu Station. Fukushima Airport requires onward road or rail travel. Haikara-san and Akabee sightseeing buses connect the station with the castle and major sites. By car, use official paid lots; winter roads can be icy.", points:["Tsuruga Castle","Aizu Bukeyashiki","Iimoriyama and Byakkotai memorial"] },\n  "Yokohama’s harbor lights": { address:"Yokohama’s harbor lights, Japan", officialUrl:"https://www.yokohamajapan.com/information/information-centers/", phone:"+81-45-211-0111", story:"Yokohama’s waterfront is a walk through the city’s outward-facing history. The Red Brick Warehouse began as a customs facility when the port was modernizing; its halls still speak of cargo and arrival even as shops and exhibitions fill them. From the plaza, the harbor opens toward Osanbashi, whose timber deck rises into a green roof with views of ships, bridges and Minato Mirai. At dusk, the skyline glows behind the water. Yamashita Park gives the route a slower, sea-level finish, while the Hikawa Maru recalls the age of ocean liners. Landmarks remain connected by open public space. Start in Minato Mirai or Sakuragicho, pause at the warehouses and pier, then follow the promenade south. Allow half a day, and return after dark if you want the harbor transformed by lights. Minato Mirai waterfront. Begin beside the modern skyline and follow the open harbor edge toward the historic port buildings. Yokohama Red Brick Warehouse. Explore former customs buildings now used for shops and exhibitions; check event dates. Osanbashi and Yamashita Park. Walk the pier’s sculpted roof for harbor views, then continue to the park and Hikawa Maru.", access:"Reach the waterfront from JR Sakuragicho, Minatomirai or Nihon-odori stations. Haneda connects by rail and bus; Narita has rail and coach options. The Red Brick Warehouse and Osanbashi are linked by promenade. By car, use paid facility parking, though rail is easier on event days.", points:["Minato Mirai waterfront","Yokohama Red Brick Warehouse","Osanbashi and Yamashita Park"] },\n  "Kusatsu, steam and springs": { address:"Kusatsu, steam and springs, Japan", officialUrl:"https://www.kusatsu-onsen.ne.jp/english/", phone:"+81-279-88-0800", story:"Kusatsu announces itself with steam. At Yubatake, hot water pours through wooden cooling channels before flowing to town baths; mineral scent and rising vapour are part of daily life, not a staged effect. Look at the channels and the yunohana crystals that gather as water cools. A short walk leads to Netsunoyu, where yumomi performances demonstrate how bathers once cooled hot water with rhythmic paddles and song. Continue uphill to Sainokawara Park, where warm water threads through volcanic ground before collecting in an outdoor bath. The walk is compact but sloping, and winter ice changes the pace. Kusatsu is best as an overnight stay: evening steam, quiet lanes and a morning bath feel different from a quick bus stop. Mountain weather can be cooler than Tokyo; check road conditions and bathing schedules. Yubatake hot-water field. See mineral-rich water cooling through channels at the town center, especially atmospheric after dusk. Netsunoyu. Watch the local yumomi performance when scheduled and learn how the town manages hot spring water. Sainokawara Park. Follow the stream through a steaming volcanic basin to the outdoor bath; stay on signed paths.", access:"From Tokyo, travel by rail to Naganohara-Kusatsuguchi and use the JR bus to Kusatsu Onsen, or take a highway coach. The nearest airports are in Tokyo with onward rail and bus. By car, use designated town parking and check winter road advisories. Yubatake, Netsunoyu and Sainokawara Park connect on foot.", points:["Yubatake hot-water field","Netsunoyu","Sainokawara Park"] },\n  "Oze’s open wetlands": { address:"Oze’s open wetlands, Japan", officialUrl:"https://oze-fnd.or.jp/en/access-to-oze/", phone:"+81-27-220-4431", story:"Oze is a high-altitude wetland where the horizon feels unusually close. Wooden boardwalks cross the marsh without cutting into it, while mountains hold the edges of every view. At Yamanohana, the visitor center marks the threshold of Ozegahara; from there, the path opens toward Ushikubi Junction and Ryugu, where water disappears beneath the marsh and emerges downstream. The landscape changes by the week: skunk cabbage brightens late spring, cotton sedge turns to white fluff, daylilies colour July and autumn grasses glow copper before snow. This is a mountain walk, not a paved city stroll. Oze is normally open mid-May to late October; lingering snow and early closures can change plans. Carry rain gear, check bus returns and stay on the boardwalk to protect fragile peatland. A lodge night makes dawn and quieter hours worth planning for. Yamanohana Visitor Center. Check trail and weather information before entering the marsh; the boardwalk begins near this access point. Ushikubi Junction. A useful rest and route-decision point on the Ozegahara boardwalk, surrounded by open wetland views. Ryugu watercourse. See where a stream flows beneath the marsh and reappears; remain on boardwalk to protect habitat.", access:"Oze has several access gates and no road through the wetlands. From Tokyo, take rail to Numata or Jomo-Kogen, then seasonal buses toward Tokura and Hatomachi Toge. Drivers park at Tokura and use required shuttles when vehicle restrictions apply. Other routes enter from Fukushima and Niigata. Confirm your trailhead and last return before hiking.", points:["Yamanohana Visitor Center","Ushikubi Junction","Ryugu watercourse"] },\n  "Fuji, from the water": { address:"Fuji, from the water, Japan", officialUrl:"https://www.japan.travel/en/spot/1329/", phone:"+81-555-72-3168", story:"Lake Kawaguchi offers a memorable way to meet Mount Fuji: wait for a clear morning, then watch the reflection appear before wind breaks it apart. A short cruise puts shoreline and summit in the same frame, while the ropeway climbs above town for a wider view across the Fuji Five Lakes. Views depend on weather, so an overcast day is not a failed visit; lakeside museums and hot-spring baths give a useful alternative. At the Itchiku Kubota Art Museum, the setting matters as much as the kimono art: a garden path moves through stone and water before the textile collection reveals its colour. The sights circle the lake rather than form one walking street. Use the local bus, bicycle, taxi or rental car and choose a few stops. Give the area a full day or overnight, and check visibility before setting the alarm. Kawaguchiko sightseeing boat. See mountain and shoreline from the water when visibility and lake conditions allow. Mt. Fuji Panoramic Ropeway. Ride above the lakeside town for an elevated view; queues and wind can affect service. Itchiku Kubota Art Museum. Explore the artist’s silk-dyeing work and garden; allow time for grounds and galleries.", access:"From Tokyo, take the JR Chuo Line to Otsuki and transfer to Fujikyu Railway, or ride a highway bus from Shinjuku. Airports connect through Tokyo. By car, use the Chuo Expressway and designated parking; weekend traffic is heavy. Local buses and taxis connect attractions.", points:["Kawaguchiko sightseeing boat","Mt. Fuji Panoramic Ropeway","Itchiku Kubota Art Museum"] },\n  "Kanazawa, unhurried": { address:"Kanazawa, unhurried, Japan", officialUrl:"https://visitkanazawa.jp/en/itineraries/detail_3.html", phone:"+81-76-232-5555", story:"Kanazawa is a city of close contrasts: the energy of a fish market, a feudal castle and the careful compositions of a celebrated garden all sit within a compact center. Start at Omicho Market, where stalls and small restaurants make the morning feel lived in. Walk toward Kanazawa Castle Park and cross into Kenrokuen, where ponds, stone lanterns, bridges and old pines reward a slower pace. The famous Kotoji lantern is one pause among many; follow the water and look for borrowed views. Later, cross the Asano River to Higashi Chaya, a preserved teahouse district quieter before shops open and atmospheric at dusk. The loop bus makes the itinerary easy to shorten, but walking reveals craft shops and side lanes. Allow a full day and leave time for a second meal at Omicho rather than rushing every landmark. Omicho Market. Explore the covered market early, when seafood counters and breakfast shops are active. Kanazawa Castle Park and Kenrokuen. Pair castle grounds with the garden’s ponds, stonework and seasonal pine protection. Higashi Chaya District. Walk preserved teahouse streets and cross to Kazue-machi for a quieter riverside view.", access:"The Hokuriku Shinkansen reaches Kanazawa from Tokyo; the Thunderbird connects from Osaka and Kyoto via Tsuruga with a transfer. Komatsu Airport has limousine buses. The loop bus leaves the station; walking is practical between Omicho, the castle, Kenrokuen and Higashi Chaya. Use city parking outside narrow streets.", points:["Omicho Market","Kanazawa Castle Park and Kenrokuen","Higashi Chaya District"] },\n  "Shirakawa-go, under steep roofs": { address:"Shirakawa-go, under steep roofs, Japan", officialUrl:"https://shirakawa-go.gr.jp/en/access/", phone:"+81-5769-6-1013", story:"Ogimachi’s steep thatched roofs were built for practical reasons: heavy winter snow must slide away, and broad attic space once supported sericulture. From Shiroyama Viewpoint, the village seems almost theatrical, but gassho-zukuri houses remain homes and workplaces, not a museum set. Walk the lanes and notice how buildings face river and fields; the scale shifts from postcard panorama to lived settlement. Wada House and Kanda House reveal timber structure and household objects, with separate admission and hours. The bus terminal and suspension bridge are the main arrival route, and the village is compact enough to explore on foot. Winter brings deep snow and light-up events with strict reservation rules; spring and autumn are busy too. Stay on public paths, keep noise low near homes and take rubbish away. An overnight stay reveals the village after day visitors leave. Ogimachi village lanes. Walk quietly through the residential settlement and notice roof orientation, farm plots and river setting. Wada House and Kanda House. Enter preserved homes to understand timber frames, steep thatch and household history. Shiroyama Viewpoint. Look back over village roofs; use the shuttle if you prefer to avoid the steep climb.", access:"Shirakawa-go has no railway station. Highway buses connect Kanazawa, Toyama, Takayama and Nagoya; reserve popular departures. By air, travel via Toyama or Komatsu and transfer through a rail hub. By car, use Seseragi Park parking and cross Deai Bridge; light-up days have special reservations.", points:["Ogimachi village lanes","Wada House and Kanda House","Shiroyama Viewpoint"] },\n  "Takayama’s old quarter": { address:"Takayama’s old quarter, Japan", officialUrl:"https://www.hida.jp/english/", phone:"+81-577-32-5328", story:"Takayama’s old quarter is best read at walking speed. Dark wooden merchant houses line Sanmachi Suji, their lattice fronts recalling the town’s Edo-period prosperity as a mountain center of trade and craft. In the morning, Miyagawa Market gives the river edge another rhythm: growers, makers and small food stalls set out goods before the day warms. Takayama Jinya adds a less romantic but essential layer, showing how the shogunate administered this remote region. The streets are compact, yet hours vary and crowds build on the busiest lanes; arrive early, then branch onto side streets. Sake breweries mark entrances with cedar balls and often offer tastings when open. Takayama is useful as a base for Hida, but mountain valleys are separate excursions. Plan half a day for the old town or a full day for museums, markets and a slower meal. Takayama Jinya. Explore the preserved administrative compound, rooms, storehouses and courtyard. Sanmachi Suji old town. Follow merchant streets and look for brewery cedar balls, lattice facades and craft shops. Miyagawa Morning Market. Browse produce and local goods along the river; stalls vary by day and season.", access:"JR Takayama Main Line connects Nagoya and Toyama; highway buses serve Nagoya, Matsumoto, Kanazawa and Shirakawa-go. The old quarter is about a 15-minute walk from Takayama Station. Nearby airports require onward rail or bus. Use public parking outside narrow historic streets.", points:["Takayama Jinya","Sanmachi Suji old town","Miyagawa Morning Market"] },\n  "Matsumoto beneath the Alps": { address:"Matsumoto beneath the Alps, Japan", officialUrl:"https://visitmatsumoto.com/en/spot/index_1_2_7____.html", phone:"+81-263-34-3295", story:"Matsumoto Castle’s black keep seems to float above its moat, with the Northern Alps often visible behind it on clear days. It is a National Treasure and one of Japan’s oldest surviving keeps; steep stairs and low ceilings make the defensive design unmistakable. After the castle, town lanes reveal an everyday side. Nawate Street follows the Metoba River and is known for frog motifs, shops and snack stops. Nearby Nakamachi’s storehouse facades recall the merchant town beyond the moat. These sites are close enough to walk, so the visit can unfold without constant transit. Former Kaichi School adds an example of early modern education if time permits. Summer festivals bring visitors, while winter is crisp and quieter. Start early at the castle to avoid queues, then slow down over lunch in the old town. Matsumoto Castle. Walk the moat and enter the National Treasure keep; steep internal stairs require care. Nawate Street and Yohashira Shrine. Browse the riverfront lane and its frog motifs, then pause at the nearby shrine. Nakamachi Street. See storehouse facades and browse craft shops, cafes and local food.", access:"JR trains connect Matsumoto with Nagano and Shinjuku; highway buses reach Tokyo, Nagoya and Takayama. Matsumoto Airport has bus and taxi links. The castle is about a 15-minute walk from the station; Nawate and Nakamachi are nearby. Use public parking outside the moat.", points:["Matsumoto Castle","Nawate Street and Yohashira Shrine","Nakamachi Street"] },\n  "Kamikochi, the mountain valley": { address:"Kamikochi, the mountain valley, Japan", officialUrl:"https://www.kamikochi.org/thingstodo/walking", phone:"+81-263-95-2433", story:"Kamikochi is not a drive-through viewpoint. Private cars are kept out of the valley, so the final approach by bus or taxi leaves the Azusa River, forest and mountain air to take over. Begin at Kappa Bridge, where the river and Hotaka range create the familiar panorama, then follow the path toward Weston Monument and Tashiro Pond. Continue to Taisho Pond if time and conditions allow; it formed after Mount Yakedake’s eruption dammed the river, and its view changes as steam and mountain reflections shift. The official beginner route between Kappa Bridge and Taisho Pond is about 3.8 kilometres one way and around two and a half hours round trip, excluding stops. Paths are gentle but mountain weather changes quickly. Kamikochi is seasonally open, typically mid-April to mid-November. Check opening notices, reservations and last departures before leaving Matsumoto or Takayama. Kamikochi Bus Terminal. Use the terminal as the practical trailhead and return point for this valley walk. Kappa Bridge. The central valley landmark spans the Azusa River and opens to the Hotaka peaks. Weston Monument and Tashiro Pond. Follow the official riverside walking course through forest and wetland scenery. Taisho Pond. A volcanic lake formed in 1915, with mountain reflections and views toward Mount Yakedake.", access:"From Matsumoto, take the Alpico Railway to Shin-Shimashima and a bus to Kamikochi; from Takayama, use the Nohi bus via Hirayu. Drivers park at Sawando or Hirayu and transfer by shuttle or taxi; private cars cannot enter. Check reservations and last return buses.", points:["Kamikochi Bus Terminal","Kappa Bridge","Weston Monument and Tashiro Pond","Taisho Pond"] },\n  "Kiso Valley post towns": { address:"Kiso Valley post towns, Japan", officialUrl:"https://www.japan.travel/en/spot/1318/", phone:"+81-264-57-2001", story:"The Nakasendo route through Kiso Valley once carried travelers between Edo and Kyoto, and its post towns make that journey legible in the landscape. Magome rises along a stone-paved slope, with water channels, inns and timber storefronts arranged for people arriving on foot. Beyond town, the trail crosses forest toward Tsumago; teahouses and a bear-warning bell remind walkers this is a rural path, not a themed street. Tsumago’s preservation rules helped keep modern signs and overhead wires away from its central lanes, and evening quiet feels different from a day-trip crowd. The classic Magome–Tsumago walk is roughly eight kilometres and usually takes three to four hours, with direction and elevation affecting effort. Buses link both ends, but schedules are limited and seasonal. Carry water, check the return timetable, and leave time to explore both towns rather than treating them only as trailheads. Magome-juku. Walk the sloped post town early, when water channels and timber storefronts are quiet. Nakasendo forest trail. Follow the marked historic route through woods and hamlets; heed local trail notices. Tsumago-juku. Explore the preserved post town after the walk, including former honjin and wakihonjin buildings.", access:"Reach Magome from Nakatsugawa Station by bus or car; Tsumago is served from Nagiso Station by bus or taxi. JR Chuo Line connects with Nagoya and Matsumoto. The one-way trail needs a planned bus or taxi return. Use parking outside preserved streets.", points:["Magome-juku","Nakasendo forest trail","Tsumago-juku"] },\n  "Sado Island’s wild coast": { address:"Sado Island’s wild coast, Japan", officialUrl:"https://www.sadokisen.co.jp/en/access-map/", phone:"+81-259-27-5195", story:"Sado’s western coast feels shaped by weather. At Senkakuwan, sea and rock form narrow inlets, cliffs and offshore pinnacles; the lookout makes their scale clear, while a boat, when running, reveals coves from below. Nearby Aikawa carries another history. The Kitazawa Flotation Plant rises as a vast concrete ruin reclaimed by grass, a reminder of mining that transformed the island. Continue to Sado Gold Mine to follow tunnels and machinery through its mining story, including labor history that deserves careful attention. These points sit across a broad island, so a car gives the most flexibility; buses connect settlements but run less frequently. Ferries link Niigata with Ryotsu, while the jetfoil is faster and cannot carry cars. Sado rewards several days more than a rushed excursion. Check ferry reservations, bus timetables and coastal boat operation before choosing the order. Senkakuwan Bay. View jagged sea cliffs from the lookout; boat service depends on season and sea conditions. Kitazawa Flotation Plant. Walk industrial ruins and learn how ore processing shaped Aikawa. Sado Gold Mine. Explore preserved mine tunnels and exhibitions; allow time for the site’s labor history.", access:"Take a ferry or jetfoil from Niigata Port to Ryotsu; reach Niigata by JR rail, airport bus or car. Sado has no passenger railway or commercial airport. Rental cars near the port help connect coastal and mining sites; buses run less frequently. The west-coast stops are separated by road, not a walking path.", points:["Senkakuwan Bay","Kitazawa Flotation Plant","Sado Gold Mine"] },\n  "Kyoto at first light": { address:"Kyoto at first light, Japan", officialUrl:"https://kyoto.travel/en/getting-around/comfortable-access-to-fushimi-fushimi-inari-taisha-shrine/", phone:"+81-75-343-0548", story:"At Fushimi Inari Taisha, dawn changes the famous torii path from a crowded corridor into quiet thresholds. The shrine is open around the clock, but the mountain climb is longer than the first photograph suggests; even a short ascent brings smaller shrines, stone foxes and views over southern Kyoto. Begin early, carry water and turn back when the path no longer fits your time or energy. Tofukuji offers a different morning: broad grounds and bridges frame a ravine, especially in autumn. Nearby Sennyuji is a quieter temple complex with imperial connections and a contemplative pace. These sites sit in southern Kyoto and connect by rail and walking, though temple hours vary. Use the JR Nara Line to Inari Station or Keihan Railway to Fushimi-Inari Station. Leave the afternoon open for rest or a neighborhood meal. Fushimi Inari Taisha. Walk beneath vermilion torii and explore beyond the first photo spot. Tofukuji Temple. Cross the temple grounds and bridges for an architectural view into the maple ravine. Sennyuji Temple. Explore a quieter temple complex with imperial history and spacious approaches.", access:"From Kyoto Station take the JR Nara Line to Inari Station; the shrine entrance is outside. Keihan Fushimi-Inari is nearby. Tofukuji and Sennyuji are reached by JR or Keihan trains and short walks. Kansai Airport connects by JR Haruka; Itami uses airport bus and rail.", points:["Fushimi Inari Taisha","Tofukuji Temple","Sennyuji Temple"] },\n  "Osaka, after hours": { address:"Osaka, after hours, Japan", officialUrl:"https://www.osaka-info.jp/en/spot/dotonbori/", phone:"+81-6-6211-4542", story:"Osaka’s late evening has its own geography: a small temple courtyard, lantern-lit lanes and a canal catching bright signs. Start at Hozenji, where the moss-covered Mizukake Fudo statue is quietly doused with water by visitors. Step into Hozenji Yokocho, a narrow stone lane where restaurants keep the scale human. From there, Dotonbori’s neon feels like a change of scene rather than the whole story. Cross Ebisu Bridge, watch reflections on the canal and follow Tombori Riverwalk for a lower, slower view. The neighborhood’s food reputation is real, but lines and hours vary; choose a small restaurant away from the busiest frontage and give the meal time. Namba Station is served by several rail operators, so the area is easy to reach without a car. Weekends are crowded. Keep to pedestrian paths and respect residents in narrow lanes. Hozenji and Hozenji Yokocho. Pause at the moss-covered statue, then follow the lantern-lit lane quietly. Dotonbori and Ebisu Bridge. See canal-side signs and reflections, then step away from the bridge frontage for a calmer view. Tombori Riverwalk. Walk beside the canal and watch the district from a quieter angle.", access:"Namba is served by Osaka Metro, Nankai and Kintetsu railways. Kansai Airport connects by Nankai train or bus; Itami uses airport bus and rail. Hozenji, Dotonbori and Tombori Riverwalk are a short walk apart. Use paid garages outside the crowded center; rail is easier at night.", points:["Hozenji and Hozenji Yokocho","Dotonbori and Ebisu Bridge","Tombori Riverwalk"] },\n  "Nara, between trees": { address:"Nara, between trees, Japan", officialUrl:"https://www.visitnara.jp/venues/A00485/", phone:"+81-742-22-5511", story:"Nara Park is more than green space between temples. Open grass, old trees and free-roaming deer make sacred buildings appear gradually. Begin at Todai-ji’s Nandaimon Gate, where enormous guardian figures stand before the Great Buddha Hall. Inside, the bronze Buddha’s scale becomes clear only after your eyes adjust to the dark timber hall. Continue uphill to Nigatsudo, whose balcony opens over rooftops and trees toward the city. From there, follow the forest edge to Kasuga Taisha, known for rows of stone and bronze lanterns. Deer are wild animals: use designated crackers, feed them safely and never tease or surround them. Spring wisteria and autumn colour change the walk; summer heat calls for an early start. The route is walkable from Kintetsu Nara Station, with buses to shorten the approach. Allow half a day, more if adding a museum or Naramachi. Todai-ji and Nandaimon Gate. Pass the guardian figures and enter the Great Buddha Hall to understand Nara’s temple heritage. Nigatsudo Hall. Climb to the balcony for a broad view over temple grounds and city. Kasuga Taisha Shrine. Follow the tree-lined path to the lanterns and shrine precinct; heed wildlife guidance.", access:"Kintetsu Nara Station is closest to the park; JR Nara is farther west but linked by local bus. Osaka and Kyoto connect by Kintetsu and JR trains. Airports connect by rail and limousine bus. The sites link on foot. Use designated parking outside the busiest approaches.", points:["Todai-ji and Nandaimon Gate","Nigatsudo Hall","Kasuga Taisha Shrine"] },\n  "Arashiyama’s green corridor": { address:"Arashiyama’s green corridor, Japan", officialUrl:"https://www.kyoto.travel/en/areas/saga-arashiyama/", phone:"+81-75-343-0548", story:"Arashiyama is often reduced to one bamboo photograph, but its best day is a sequence of river, garden and neighborhood. Enter the Bamboo Grove early, before the narrow lane fills, and keep moving rather than stopping in the flow. Tenryuji offers a quieter counterpoint: its garden uses surrounding hills as borrowed scenery, so the landscape seems to continue beyond the temple wall. Drift toward Togetsukyo Bridge, whose name evokes a moon crossing the river; the view changes with rain, season and water level. Cross to the south-bank lanes and hillside viewpoints if time allows—the area is larger than the photo corridor. Sagano’s quieter streets and museums reward an afternoon, and the Randen tram or JR Sagano Line makes arrival straightforward. The bamboo path is public and free, while gardens charge admission. Never carve or tie objects to bamboo. Visit early, then let the river set the pace. Arashiyama Bamboo Grove. Follow the public lane early and keep moving so everyone can enjoy the narrow path. Tenryuji Temple garden. See the pond garden framed by hills; allow time to walk the full grounds. Togetsukyo Bridge and riverbank. Take in changing river and mountain views, then explore the south-bank lanes if time allows.", access:"From Kyoto Station take the JR Sagano Line to Saga-Arashiyama; Randen serves the area from central Kyoto and Hankyu reaches the south bank. Kansai Airport connects via JR Haruka and rail transfers. By car, use paid lots outside the busy center. The grove, Tenryuji and bridge are walkable.", points:["Arashiyama Bamboo Grove","Tenryuji Temple garden","Togetsukyo Bridge and riverbank"] },\n  'Tokyo Disney Resort': {
    address:'1-1 Maihama, Urayasu-shi, Chiba-ken', officialUrl:'https://www.japan.travel/en/spot/1556/',
    story:'Tokyo Disneyland and Tokyo DisneySea are two distinct parks connected by the Maihama resort. The main choice is whether you want classic storybook lands, DisneySea\'s waterfront worlds, or enough time to experience both across separate days.',
    access:'JR Keiyo Line to Maihama Station is the easiest rail arrival. The parks are a short walk from the station; airport buses also serve the resort.',
    points:['Tokyo Disneyland','Tokyo DisneySea','JR Maihama Station']
  },
  'Super Nintendo World': {
    address:'2-1-33 Sakurajima, Konohana-ku, Osaka-shi, Osaka-fu', officialUrl:'https://www.japan.travel/en/spot/1111/',
    story:'This game-inspired land sits inside Universal Studios Japan. The Mario Kart attraction and interactive details reward a slower look between rides; plan the park ticket and any timed-area entry before arriving.',
    access:'Take the JR Yumesaki Line to Universal City Station, then walk to the park. JNTO lists about 11 minutes by train from Osaka Station.',
    points:['Super Nintendo World entrance','Mario Kart: Koopa\'s Challenge','Universal City Station']
  },
  'Fuji-Q Highland': {
    address:'5-6-1 Shin-Nishihara, Fujiyoshida-shi, Yamanashi-ken', officialUrl:'https://www.japan.travel/en/spot/1332/',
    story:'Fuji-Q pairs major coasters with close views of Mount Fuji. Fujiyama, Takabisha, and Eejanaika are headline rides, while Thomas Land offers a gentler family area. Check the ride calendar and Fuji visibility before choosing the day.',
    access:'From Tokyo, take the Chuo Line to Otsuki and transfer to the Fujikyu Line for Fujikyu-Highland Station. Direct highway buses also run from Shinjuku.',
    points:['Fujiyama coaster','Takabisha coaster','Thomas Land']
  },
  'Ghibli Park': {
    address:'Expo 2005 Aichi Commemorative Park, 1533-1 Ibaragabasama, Nagakute-shi, Aichi-ken', officialUrl:'https://www.japan.travel/en/spot/2072/',
    story:'Ghibli Park spreads its film-inspired spaces through Expo 2005 Aichi Commemorative Park. Give the areas time between visits: Ghibli\'s Grand Warehouse, Hill of Youth, Dondoko Forest, Mononoke Village, and Valley of Witches each have their own atmosphere.',
    access:'From Nagoya, take the Higashiyama Subway Line to Fujigaoka, then Linimo to Ai-Chikyuhaku-Kinen-Koen Station. Check current ticket and parking details on the official visitor page before travelling.',
    points:['Ghibli\'s Grand Warehouse','Hill of Youth','Dondoko Forest','Valley of Witches']
  },
  'Tokyo Skytree': {
    address:'1-1-2 Oshiage, Sumida-ku, Tokyo-to', officialUrl:'https://www.japan.travel/en/spot/1680/',
    story:'The observatories make the skyline the main event: Tembo Deck at 350 metres and Tembo Galleria at 450 metres. Tokyo Solamachi, Sumida Aquarium, and the riverside walk add easy stops at ground level.',
    access:'Arrive at Tokyo Skytree Station on the Tobu Skytree Line or Oshiage Station by subway and Keisei lines. The observatory entrance is inside Tokyo Skytree Town.',
    points:['Tembo Deck','Tembo Galleria','Tokyo Solamachi','Sumida Aquarium']
  },
  'Tokyo Tower': {
    address:'4-2-8 Shibakoen, Minato-ku, Tokyo-to', officialUrl:'https://www.japan.travel/en/spot/1709/',
    story:'See the red-and-white tower from Shiba Park, then head up to the Main Deck or Top Deck for a different scale of Tokyo. Zojoji Temple and Shiba Park sit nearby and make a rewarding walk before or after sunset.',
    access:'Onarimon, Kamiyacho, and Akabanebashi stations are each about a five-minute walk, depending on the exit and route. Hamamatsucho Station is roughly a 15-minute walk.',
    points:['Tokyo Tower Main Deck','Tokyo Tower Top Deck','Zojoji Temple','Shiba Park']
  },
  'Kinkaku-ji, the Golden Pavilion': {
    address:'1 Kinkakujicho, Kita-ku, Kyoto-shi, Kyoto-fu', officialUrl:'https://www.japan.travel/en/spot/1152/',
    story:'The Golden Pavilion is best read from the garden path as it appears across Kyoko-chi Pond. Continue through the mossy garden and teahouse grounds; the reflected view changes with light, weather, and season.',
    access:'From Kyoto Station, take Kyoto City Bus 205 to Kinkakuji-michi, then walk to the temple entrance. Check current admission details before setting out.',
    points:['Golden Pavilion','Kyoko-chi Pond','Rokuon-ji garden']
  },
  'Osaka Aquarium Kaiyukan': {
    address:'1-1-10 Kaigandori, Minato-ku, Osaka-shi, Osaka-fu', officialUrl:'https://www.japan.travel/en/spot/1113/',
    story:'The visitor route spirals around the central Pacific tank, with whale sharks as the signature sight. Look for the Arctic seals and penguins as well, then continue to Tempozan Market Place or the giant Ferris wheel for a full bay-side outing.',
    access:'Take the Chuo Subway Line to Osakako Station; the aquarium is about a five-minute walk. A short ferry also connects Universal City Port with the Tempozan area.',
    points:['Pacific Ocean tank','Arctic zone','Tempozan Market Place','Tempozan Giant Ferris Wheel']
  },
  'Fukuoka Tower': {
    address:'2-3-3 Momochihama, Sawara-ku, Fukuoka-shi, Fukuoka-ken', officialUrl:'https://www.japan.travel/en/spot/2256/',
    story:'The mirrored seaside tower has three observation decks, with the highest looking across Fukuoka and Hakata Bay. Pair the view with a walk through Momochi Seaside Park and time your visit for the evening illuminations.',
    access:'Buses 306 from Hakata Station and 302 from Tenjin stop at Fukuoka Tower. Nishijin Subway Station is about a 20-minute walk away.',
    points:['Fukuoka Tower observation decks','Momochi Seaside Park','Fukuoka City Museum']
  },
  'Kumamoto Castle': {
    address:'1-1 Honmaru, Chuo-ku, Kumamoto-shi, Kumamoto-ken', officialUrl:'https://www.japan.travel/en/spot/638/',
    story:'Start at the reconstructed main keep, then follow the visitor route along the immense stone ramparts and restored Honmaru Goten Palace. Restoration work continues after the 2016 earthquakes, so check the current open areas before visiting.',
    access:'From JR Kumamoto Station, take the tram to Kumamotojo-mae; the ride takes about 17 minutes, followed by a walk. The central location also makes a walk from downtown straightforward.',
    points:['Castle main keep','Honmaru Goten Palace','Ninomaru Park','Sakura-no-baba Josaien']
  }
};

let placeDialogRequest = 0;
let placeDialogTrigger = null;

function placeMapSearch(queryText) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryText)}`;
}
function externalAnchor(label, url, className='') {
  const link=document.createElement('a'); link.textContent=label; link.href=url; link.target='_blank'; link.rel='noopener noreferrer';
  if(className) link.className=className;
  return link;
}
function googleSearchUrl(queryText) { return `https://www.google.com/search?q=${encodeURIComponent(queryText)}`; }
function placeStory(place, spotlight) {
  if(LOCAL_FIND_DETAILS[place.name]?.story) return LOCAL_FIND_DETAILS[place.name].story;
  if(spotlight) return spotlight.story;
  const notes=[];
  if(place.tags.includes('Nature')) notes.push('Choose one marked trail or viewpoint as your anchor, and check local weather and seasonal access before setting out.');
  if(place.tags.includes('Culture')) notes.push('Give the main site time: notice its defining architecture, garden, or local tradition, and check entry hours and visitor guidance before arrival.');
  if(place.tags.includes('Islands')) notes.push('Confirm ferry or flight times and leave a weather buffer for the return journey.');
  if(place.tags.includes('Food')) notes.push('Explore the surrounding neighborhood on foot and check opening days or reservations for the places you want to try.');
  if(place.tags.includes('Slow travel')) notes.push('Keep the day open enough for local transport, changing conditions, and an unplanned stop.');
  return notes.slice(0,3).join(' ');
}
function renderPlacePoints(place, spotlight) {
  const list=document.querySelector('#place-dialog-points');
  const localDetail=LOCAL_FIND_DETAILS[place.name];
  const points=spotlight?.points?.length ? spotlight.points : localDetail ? [localDetail.spot] : [place.name, `Nearby sights around ${place.name}`];
  list.replaceChildren(...points.map(point=>{const li=document.createElement('li');const link=externalAnchor('',placeMapSearch(localDetail?.query || `${point}, ${place.place}`));const pin=document.createElementNS('http://www.w3.org/2000/svg','svg');pin.setAttribute('viewBox','0 0 20 20');pin.setAttribute('aria-hidden','true');pin.innerHTML='<path d="M10 18s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="8" r="2" fill="currentColor"/>';const label=document.createElement('span');label.textContent=point;link.append(pin,label);li.append(link);return li;}));
  const address=spotlight?.address || localDetail?.query || `${place.name}, ${place.place}`;
  document.querySelector('#place-dialog-address-label').textContent=spotlight?.address ? 'VISITOR ADDRESS' : 'EXACT MAP PIN';
  const addressLink=document.querySelector('#place-dialog-address');
  addressLink.textContent=address; addressLink.href=placeMapSearch(address);
}
function renderPlaceRoutes(place) {
  const destination=LOCAL_FIND_DETAILS[place.name]?.query || `${place.name}, ${place.place}`;
  const directions=mode=>`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=${mode}`;
  const routes=[
    ['By car','Open a driving route',directions('driving')],
    ['By train / transit','Open public-transit directions',directions('transit')],
    ['By bus','Search current bus access',googleSearchUrl(`${place.name} ${place.place} bus access`)],
    ['By air','Search flights to the area',`https://www.google.com/travel/flights?q=${encodeURIComponent(`flights to ${place.place}`)}`]
  ];
  document.querySelector('#place-dialog-routes').replaceChildren(...routes.map(([title,detail,url])=>{const link=externalAnchor('',url,'place-route');const strong=document.createElement('strong');strong.textContent=title;const span=document.createElement('span');span.textContent=detail;link.append(strong,span);return link;}));
}
function showPlace(place, index) {
  placeDialogTrigger=document.activeElement;
  ++placeDialogRequest;
  const spotlight=PLACE_SPOTLIGHTS[place.name];
  const image=document.querySelector('#place-dialog-image');
  const visual=image.closest('.place-dialog-visual');
  const photo=verifiedPlacePhoto(place);
  const photoUrl=photo?.url || '';
  visual.classList.toggle('is-illustrated',!photoUrl);
  visual.dataset.art=place.illustration||'place';
  visual.dataset.title=place.name;
  image.hidden=!photoUrl;
  if(photoUrl) { applyPhotoVerificationAttributes(image,photo); image.src=photoUrl; }
  else { image.removeAttribute('src'); for(const key of ['photoVerified','photoSource','photoCredit','photoLicense','photoAlt']) delete image.dataset[key]; }
  image.alt=photo?.alt || '';
  image.onerror=()=>{image.hidden=true;visual.classList.add('is-illustrated');photoCredit.hidden=true;};
  const photoCredit=document.querySelector('#place-dialog-photo-credit');
  photoCredit.hidden=!photoUrl;
  if(photo){photoCredit.href=photo.source;photoCredit.textContent=`Photo: ${photo.credit} · ${photo.license}`;}
  else {photoCredit.removeAttribute('href');photoCredit.textContent='';}
  document.querySelector('#place-dialog-number').textContent=String(index+1).padStart(2,'0');
  document.querySelector('#place-dialog-region').textContent=`${place.region} / JAPAN FIELD GUIDE`;
  document.querySelector('#place-dialog-title').textContent=placeDisplayName(place.name);
  document.querySelector('#place-dialog-area').textContent=place.place;
  document.querySelector('#place-dialog-description').textContent=place.description;
  const fieldGuide=document.querySelector('#place-dialog-field-guide');
  const guideUrl=window.GuideLinks?.destinationUrl(place.name);
  const guideStatus=window.GuideLinks?.guideStatusFor(place.name)||place.guide_status||'provisional';
  fieldGuide.href=guideUrl||'#';
  fieldGuide.hidden=!guideUrl;
  document.querySelector('#place-dialog-field-guide-label').textContent=guideStatus==='complete'?'Open full field guide':'Field notes — in progress';
  const guideBadge=document.querySelector('#place-dialog-guide-badge');guideBadge.textContent='PROVISIONAL';guideBadge.hidden=guideStatus==='complete';
  fieldGuide.setAttribute('aria-label',guideStatus==='complete'?`Open the full field guide for ${place.name}`:`${place.name}: provisional field notes, guide research in progress`);
  document.querySelector('#place-dialog-story').textContent=placeStory(place,spotlight);
  const localDetail=LOCAL_FIND_DETAILS[place.name];
  placeDialog.classList.toggle('has-local-story',Boolean(localDetail));
  const localGuide=document.querySelector('#place-dialog-local-guide');
  localGuide.hidden=!localDetail;
  if(localDetail){
    document.querySelector('#place-dialog-local-spot').textContent=localDetail.spot;
    const source=document.querySelector('#place-dialog-local-source');
    source.href=localDetail.source;
    const reviews=document.querySelector('#place-dialog-local-reviews');
    reviews.href=placeMapSearch(localDetail.query);
    reviews.setAttribute('aria-label',`Read current visitor reviews for ${localDetail.spot}`);
  }
  const localTip=document.querySelector('#place-dialog-local-tip');
  localTip.hidden=!LOCAL_FIND_NAMES.has(place.name);
  if(!localTip.hidden) document.querySelector('#place-dialog-local-tip-copy').textContent=place.tags.includes('Nature')
    ? 'Keep the day simple with self-guided walks and time outdoors. Check local access rules, transport costs, and any seasonal fees before setting out.'
    : 'Focus on wandering the historic streets and public spaces. Check admission prices for museums, monuments, or optional experiences before you go.';
  const tags=document.querySelector('#place-dialog-tags');
  tags.replaceChildren(...place.tags.map(tag=>{const pill=document.createElement('span');pill.textContent=tag;return pill;}));
  renderPlacePoints(place,spotlight);
  renderPlaceRoutes(place);
  document.querySelector('#place-dialog-access-note').textContent=spotlight?.access || 'Route links open current map directions and transport searches for this exact place. Check seasonal schedules and local visitor notices before travelling.';
  renderPlaceLocalGuide(place, spotlight);
  const photoQuery=`${place.name} ${place.place}`;
  document.querySelector('#place-dialog-photo-search').href=`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(photoQuery)}`;
  document.querySelector('#place-dialog-youtube').href=`https://www.youtube.com/results?search_query=${encodeURIComponent(`${place.name} ${place.place} travel walk`)}`;
  const official=document.querySelector('#place-dialog-official');
  official.href=spotlight?.officialUrl || googleSearchUrl(`site:japan.travel/en/ ${place.name} ${place.place}`);
  document.querySelector('#place-dialog-save').onclick=()=>toggleSavedPlace(place);
  updatePlaceDialogSave(place);
  placeDialog.showModal();
  window.PlaceRouteUI?.mountDialog(place.name);
  document.querySelector('#place-dialog-gallery-status').textContent='';
  document.querySelector('#place-dialog-gallery').replaceChildren();
  document.querySelector('#place-dialog-gallery').closest('.place-detail-section').hidden=true;
}
function renderPlaceLocalGuide(place, spotlight) {
  const localDetail=LOCAL_FIND_DETAILS[place.name];
  const destination=localDetail?.query || `${place.name}, ${place.place}`;
  const listingUrl=placeMapSearch(destination);
  const contactNote=document.querySelector('#place-dialog-contact-note');
  const contactLinks=document.querySelector('#place-dialog-contact-links');
  if(spotlight?.phone){
    contactNote.textContent='Call the published visitor contact for questions about access, hours, or facilities.';
    const call=document.createElement('a');call.className='place-info-link';call.href=`tel:${spotlight.phone.replace(/[^+\d]/g,'')}`;call.textContent=`Call ${spotlight.phone}`;
    contactLinks.replaceChildren(call,externalAnchor('Check the official map listing',listingUrl,'place-info-link'));
  }else{
    contactNote.textContent='Open the place listing to see its published phone number and tap Call when the venue provides one. Natural sites may be managed by a local visitor center instead.';
    contactLinks.replaceChildren(externalAnchor('View phone and contact details',listingUrl,'place-info-link'));
  }

  const locality=(place.place.split(/[·•]/)[0]||place.place).trim();
  document.querySelector('#place-dialog-stay-note').textContent=`Use ${locality} as your starting search area. Compare travel time back to the place, the last return connection, and seasonal availability before booking.`;
  const lodgingQuery=encodeURIComponent(`hotels and inns near ${destination}`);
  const traditionalQuery=encodeURIComponent(`ryokan and guesthouses near ${destination}`);
  document.querySelector('#place-dialog-stay-links').replaceChildren(
    externalAnchor(`Find hotels and inns near ${locality}`,`https://www.google.com/maps/search/?api=1&query=${lodgingQuery}`,'place-info-link'),
    externalAnchor(`Explore ryokan and guesthouses near ${locality}`,`https://www.google.com/maps/search/?api=1&query=${traditionalQuery}`,'place-info-link')
  );

  const reviewsQuery=encodeURIComponent(destination);
  document.querySelector('#place-dialog-review-links').replaceChildren(
    externalAnchor('Read recent Google Maps reviews',listingUrl,'place-info-link'),
    externalAnchor('Search TripAdvisor traveler reviews',`https://www.tripadvisor.com/Search?q=${reviewsQuery}`,'place-info-link')
  );
}
document.querySelector('#place-dialog-close').addEventListener('click',()=>placeDialog.close());
placeDialog.addEventListener('close',()=>{
  document.querySelector('#place-dialog-route-details')?._cleanup?.();
  placeDialogRequest+=1;
  document.querySelector('#place-dialog-gallery-status').textContent='';
  document.querySelector('#place-dialog-gallery').replaceChildren();
  if(placeDialogTrigger?.isConnected)placeDialogTrigger.focus();
});

function renderDestinations(announceCompletion = false) {
  const normalized = query.trim().toLocaleLowerCase();
  const places = DESTINATIONS.filter(place => {
    const inRegion = activeRegion === 'All places' || place.region === activeRegion;
    const inSaved = !savedOnly || saved.has(place.name);
    const searchable = `${place.name} ${place.place} ${place.region} Japan ${place.description} ${(place.tags || []).join(' ')}`.toLocaleLowerCase();
    const inMood = activeMood === 'All moods' || place.tags.includes(activeMood);
    const inMonth = !monthSearchEnabled || getPlacesForMonth(Number(monthSelect.value)).has(place.name);
    const inLocalFinds = !localFindsOnly || LOCAL_FIND_NAMES.has(place.name);
    const matchesQuery = !normalized || normalized.split(/\s+/).every(term => searchable.includes(term));
    // Saved is independent of browse filters. Keep those filters intact so
    // leaving Saved restores the previous browse view.
    return savedOnly ? inSaved : inRegion && inMood && inMonth && inLocalFinds && matchesQuery;
  });
  count.textContent = `${String(places.length).padStart(2, '0')} ${places.length === 1 ? 'PLACE' : 'PLACES'}`;
  document.querySelector('#show-more').hidden = places.length <= visibleLimit;
  if (announceCompletion) {
    const status=document.querySelector('#search-completion');
    status.hidden=false;
    status.textContent='Searching the field guide…';
    clearTimeout(searchAnnouncementTimer);
    const total=places.length;
    const shown=Math.min(visibleLimit,total);
    searchAnnouncementTimer=setTimeout(()=>{
      status.textContent=total
        ? `Search complete — ${total} ${total===1?'place':'places'} found. Showing ${shown}. Scroll down to browse your matches.`
        : 'Search complete — no places matched. Try another term or clear a filter.';
    },350);
  }
  if (!places.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = savedOnly && !saved.size ? 'Your shortlist is waiting. Save a place with its heart to start one.' : localFindsOnly ? 'No local finds match these combined filters. Clear a filter or browse all places.' : monthSearchEnabled ? `No places match ${MONTHS[Number(monthSelect.value)]} and your other filters. Try clearing the month filter or broadening your search.` : 'No places match that search here. Try another region or a broader word.';
    grid.replaceChildren(empty);
    return;
  }
  grid.replaceChildren(...places.slice(0, visibleLimit).map((place, index) => {
    const card = document.createElement('article');
    card.className = 'destination-card';
    const imageWrap = document.createElement('div');
    imageWrap.className = 'card-image-wrap';
    imageWrap.dataset.art=place.illustration||'place';
    imageWrap.dataset.title=place.name;
    const image = document.createElement('img');
    image.className = 'card-image';
    const photo=verifiedPlacePhoto(place);
    image.alt = photo?.alt || '';
    image.loading = index < 3 ? 'eager' : 'lazy';
    image.decoding = 'async';
    if(photo){
      applyPhotoVerificationAttributes(image,photo);
      image.src = photo.url;
      image.addEventListener('error', () => { image.hidden = true; photoLink.classList.add('is-photo-removed'); imageWrap.classList.add('illustrated-place'); imageWrap.querySelector('.card-photo-credit')?.remove(); }, {once:true});
    }else{
      image.hidden=true;imageWrap.classList.add('image-fallback','illustrated-place');
    }
    const guideUrl=window.GuideLinks?.destinationUrl(place.name);
    const photoLink = document.createElement('a');
    photoLink.className = 'card-photo';
    photoLink.href = guideUrl || '#';
    photoLink.setAttribute('aria-label', `Open the place guide page for ${place.name}`);
    if(!guideUrl)photoLink.addEventListener('click',event=>event.preventDefault());
    photoLink.append(image);
    const region = document.createElement('span'); region.className = 'card-region'; region.textContent = place.region;
    const number = document.createElement('span'); number.className = 'card-index'; number.textContent = String(index + 1).padStart(2, '0');
    const saveButton = document.createElement('button');
    saveButton.className = 'card-save'; saveButton.type = 'button';
    saveButton.setAttribute('aria-label', `${saved.has(place.name) ? 'Remove' : 'Save'} ${place.name}`);
    saveButton.setAttribute('aria-pressed', String(saved.has(place.name)));
    saveButton.textContent = saved.has(place.name) ? '♥' : '♡';
    saveButton.addEventListener('click', () => toggleSavedPlace(place));
    if(photo){const credit=document.createElement('a');credit.className='card-photo-credit';credit.href=photo.source;credit.target='_blank';credit.rel='noopener noreferrer';credit.textContent=`PHOTO · ${photo.credit} · ${photo.license}`;credit.setAttribute('aria-label',`Photo credit and license for ${place.name}`);imageWrap.append(photoLink,credit,region,number,saveButton);}
    else imageWrap.append(photoLink, region, number, saveButton);
    const copy = document.createElement('div'); copy.className = 'card-copy';
    const contextBadges = document.createElement('div'); contextBadges.className = 'destination-context-badges';
    if (monthSearchEnabled && getPlacesForMonth(Number(monthSelect.value)).has(place.name)) { const badge=document.createElement('span'); badge.textContent=`SEASONAL · ${MONTHS[Number(monthSelect.value)]}`; contextBadges.append(badge); }
    if (LOCAL_FIND_NAMES.has(place.name)) { const badge=document.createElement('span'); badge.textContent='LOCAL FIND'; contextBadges.append(badge); }
    const guideStatus=window.GuideLinks?.guideStatusFor(place.name)||place.guide_status||'provisional';
    if(guideStatus!=='complete'){const badge=document.createElement('span');badge.className='guide-status-badge';badge.textContent='PROVISIONAL';contextBadges.append(badge);}
    if (contextBadges.childElementCount) copy.append(contextBadges);
    const location = document.createElement('span'); location.className = 'card-place'; location.textContent = place.region;
    const row = document.createElement('div'); row.className = 'card-title-row';
    const title = document.createElement('h3'); title.className = 'card-title'; title.textContent = placeDisplayName(place.name);
    const link = document.createElement('button'); link.className = 'card-arrow'; link.type = 'button'; link.setAttribute('aria-label', `Open ${place.name} story`); link.title = `Open ${place.name} story`; link.textContent = '↗'; link.addEventListener('click', () => showPlace(place, DESTINATIONS.indexOf(place)));
    row.append(title, link);
    const area = document.createElement('p'); area.className = 'card-area'; area.textContent = place.place;
    const description = document.createElement('p'); description.className = 'card-description'; description.textContent = place.description;
    const tags = document.createElement('div'); tags.className = 'card-tags';
    place.tags.forEach(tag => { const pill = document.createElement('span'); pill.textContent = tag; tags.append(pill); });
    const details = document.createElement('button'); details.className = 'card-details'; details.type = 'button'; details.textContent = 'View place story'; details.setAttribute('aria-label', `View ${place.name} place story`);
    details.addEventListener('click', () => showPlace(place, DESTINATIONS.indexOf(place)));
    const fieldGuide=document.createElement('a');fieldGuide.className='card-details';fieldGuide.href=guideUrl||'#';fieldGuide.hidden=!guideUrl;
    if(guideStatus==='complete')fieldGuide.textContent='Open full field guide';
    else{fieldGuide.textContent='Field notes — in progress · provisional';fieldGuide.setAttribute('aria-label',`${place.name}: provisional field notes, guide research in progress`);}
    const cardActions=document.createElement('div');cardActions.className='card-actions';
    cardActions.append(details,document.createTextNode(' '),fieldGuide);
    copy.append(location, row, area, description, tags, cardActions);
    card.append(imageWrap, copy);
    return card;
  }));
}

function updateSavedUI() {
  savedCount.textContent = String(saved.size);
  savedToggle.setAttribute('aria-pressed', String(savedOnly));
  savedToggle.classList.toggle('is-active', savedOnly);
  savedNote.hidden = !savedOnly;
}

function updateLocalFindsUI() {
  const button=document.querySelector('#local-finds-toggle');
  button.setAttribute('aria-pressed',String(localFindsOnly));
  button.firstChild.textContent=localFindsOnly?'Local Finds · active ':'Local Finds ';
  document.querySelector('#local-finds-count').textContent=`${LOCAL_FIND_NAMES.size} PLACES`;
  document.querySelector('#local-finds-clear').hidden=!localFindsOnly;
  document.querySelector('#local-finds-description').textContent=localFindsOnly
    ? 'The guide is showing quieter, cost-conscious stops. Combine with search, month, region, and experience filters; prices and transport costs vary.'
    : 'Quieter walks, small-town streets, and open-air stops for a lighter-cost day. These are curated under-the-radar finds, not guaranteed secrets; transport and entry costs vary.';
}
document.querySelector('#local-finds-toggle').addEventListener('click',()=>{
  if(localFindsOnly){localFindsManual=false;search.value=search.value.replace(/\b(local|locals|quiet|quieter|hidden|secret|cheap|affordable)\b/ig,' ').replace(/\s+/g,' ').trim();}
  else localFindsManual=true;
  syncUnifiedSearch();
  document.querySelector('#destination-grid').scrollIntoView({behavior:'smooth',block:'start'});
});
document.querySelector('#local-finds-clear').addEventListener('click',()=>{
  localFindsManual=false;search.value=search.value.replace(/\b(local|locals|quiet|quieter|hidden|secret|cheap|affordable)\b/ig,' ').replace(/\s+/g,' ').trim();syncUnifiedSearch();
});

function syncUnifiedSearch() {
  const raw = search.value.toLocaleLowerCase();
  const monthIndex = MONTHS.findIndex(month => new RegExp(`\\b${month.toLocaleLowerCase()}\\b`).test(raw));
  const localIntent = /\b(local|locals|quiet|quieter|hidden|secret|cheap|affordable)\b/.test(raw);
  monthSearchEnabled = monthIndex >= 0 || monthSearchManual;
  localFindsOnly = localIntent || localFindsManual;
  if (monthIndex >= 0) monthSelect.value = String(monthIndex);
  let terms = raw;
  if (monthIndex >= 0) terms = terms.replace(new RegExp(`\\b${MONTHS[monthIndex].toLocaleLowerCase()}\\b`, 'g'), ' ');
  terms = terms.replace(/\b(local|locals|quiet|quieter|hidden|secret|cheap|affordable|find|finds|place|places|spot|spots|in|during|for|visit|visiting|seasonal|season|trip|travel|near|around|best|things|to|do|what|where|should|can|go|see|the|and|of|at|only|a|an|is|are|with)\b/g, ' ');
  query = terms.replace(/\s+/g, ' ').trim();
  updateMonthSearchUI();
  updateLocalFindsUI();
  renderMonthGuide();
  renderDestinations(true);
}
search.addEventListener('input', syncUnifiedSearch);
document.querySelector('#show-more').addEventListener('click', () => { visibleLimit += 12; renderDestinations(); });
savedToggle.addEventListener('click', () => { savedOnly = !savedOnly; updateSavedUI(); renderDestinations(); });
document.querySelector('#share-guide').addEventListener('click', async event => {
  const button=event.currentTarget, status=document.querySelector('#share-status');
  const url=new URL(window.location.href);
  url.searchParams.set('month',monthSelect.value);url.searchParams.set('days',tripLengthSelect.value);
  url.searchParams.set('region',journeyRegionSelect.value);url.searchParams.set('style',journeyStyleSelect.value);
  if(activeRegion!=='All places')url.hash='region='+encodeURIComponent(activeRegion);
  let copied=false;
  try { if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url.href);copied=true;} } catch {}
  if(!copied){
    const field=document.createElement('textarea');field.value=url.href;field.setAttribute('readonly','');field.style.position='fixed';field.style.opacity='0';document.body.append(field);field.select();
    try { copied=document.execCommand('copy'); } catch {} field.remove();
  }
  if(copied){
    button.innerHTML='Link copied <span aria-hidden="true">&#10003;</span>';status.textContent='Trip link copied with your selected month, length, region and travel style.';
    window.clearTimeout(button._shareReset);button._shareReset=window.setTimeout(()=>{button.innerHTML='Share this guide <span aria-hidden="true">&#8599;</span>';},2200);
  }else if(navigator.share){
    try { await navigator.share({title:'My Japan, my way',text:'A season-shaped Japan shortlist, made for this trip.',url:url.href});status.textContent='Your trip link has been shared.'; }
    catch(error){if(error.name!=='AbortError')status.textContent='Copy is unavailable in this browser. The selected trip details are ready in the page URL.';}
  }else{status.textContent='Copy is unavailable in this browser. The selected trip details are ready in the page URL.';}
});
document.addEventListener('keydown', event => {
  const target = event.target;
  const typing = target instanceof Element && (target.matches('input, textarea, select') || target.isContentEditable || target.closest('[contenteditable="true"]'));
  if (event.key === '/' && !typing) { event.preventDefault(); search.focus(); }
  if (event.key === 'Escape' && document.activeElement === search) { search.value = ''; syncUnifiedSearch(); search.blur(); }
});

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_GUIDE = [
  {summary:'Find clear winter skies in the south, snow-country quiet in the north, and a warm soak between the two.',note:'Pack for very different temperatures between Hokkaido and Okinawa.',places:[['Ginzan after dark','Lantern-lit snow-country nights'],['Otaru by lamplight','A wintry canal and old port streets'],['Kerama blue','Mild island days in the far south']]},
  {summary:'Winter is still in full color: drift ice and snow festivals up north, early blossoms and island light down south.',note:'Hokkaido is deeply wintry; Okinawa is much milder. Check local conditions before booking outdoor activities.',places:[['Shiretoko’s wild edge','Winter wilderness and drift-ice season'],['Ginzan after dark','Snowy onsen atmosphere'],['Naha, island time','Ryukyu culture in a gentler winter']]},
  {summary:'Spring begins in the south and moves north. Catch the first warmth, gardens, and the season’s early color.',note:'Blossom dates shift each year and progress northward; use the latest regional forecast if sakura is your priority.',places:[['Naha, island time','A warm-weather start to spring'],['Kyoto at first light','Shrine paths before the busy season'],['Tokyo, in layers','Parks, neighborhoods, and city spring']]},
  {summary:'A classic month for blossoms, garden walks, and long evenings outdoors, with color arriving at different times across Japan.',note:'Peak blossoms vary by region and year. Popular routes fill quickly around the spring holiday period.',places:[['Kyoto at first light','Temple lanes and spring gardens'],['Tokyo, in layers','City parks and neighborhood walks'],['Miyajima tide lines','Island scenery and a memorable shoreline']]},
  {summary:'Fresh green landscapes and comfortable days make this a lovely month to explore beyond the big-city route.',note:'Japan’s Golden Week holiday falls in late April and early May; reserve transport and stays early or travel outside the busiest dates.',places:[['Kanazawa, unhurried','Garden paths and historic lanes'],['Matsushima Bay','Island-dotted coastal views'],['Yakushima, ancient green','Mossy forest trails in the subtropical south']]},
  {summary:'A quieter, greener interlude for gardens, forest walks, and places that feel especially alive after rain.',note:'The rainy season affects much of Japan in June, though timing differs by region; Hokkaido is generally less affected.',places:[['Yakushima, ancient green','Rain-fed cedar forests'],['Kyoto at first light','Lush shrine paths and gardens'],['The blue of Biei','Hokkaido’s green interior before high summer']]},
  {summary:'High summer opens the mountains and northern flower fields. Head north or uphill for cooler air and wide horizons.',note:'Furano’s lavender is usually a July highlight; mountain weather can change quickly. Check official trail and climbing openings.',places:[['Furano in bloom','Lavender fields in their summer window'],['Daisetsuzan high country','Alpine scenery in Hokkaido'],['Fuji, from the water','Lakeside views beneath the mountain']]},
  {summary:'Festival nights, alpine escapes, and brilliant island water define the high summer mood.',note:'Expect heat and humidity in many cities; allow breaks, hydration, and flexible plans during very hot days.',places:[['Kerama blue','Clear-water island days'],['Daisetsuzan high country','Cooler trails and open mountain views'],['Miyajima tide lines','An island escape with changing tides']]},
  {summary:'Summer lingers in the south while the northern highlands begin to turn toward fall. A month for flexible plans.',note:'Heat and typhoon risk can continue; check forecasts and transport advisories close to your travel dates.',places:[['Nikko in the cedars','Forest air and mountain scenery'],['Shiretoko’s wild edge','Remote northern landscapes'],['Yakushima, ancient green','A lush island for unhurried nature trips']]},
  {summary:'Crisp walking weather arrives, with early autumn color in the north and high country and harvest flavors nationwide.',note:'Foliage appears first in colder northern and higher-altitude areas; central and southern cities usually change later.',places:[['Nikko in the cedars','Mountain forests entering autumn'],['Shiretoko’s wild edge','Northern wilderness in fall'],['Fuji, from the water','Clearer days around the Fuji Five Lakes']]},
  {summary:'Autumn color moves into gardens, temple paths, and city parks, while the air turns crisp and clear.',note:'Peak foliage moves from north to south and changes year to year. Popular Kyoto sights are busiest around peak color.',places:[['Kyoto at first light','Historic paths and autumn gardens'],['Kanazawa, unhurried','Garden and teahouse-lane season'],['Nikko in the cedars','Mountain shrines among fall color']]},
  {summary:'Choose your winter: northern snow scenes, cozy onsen towns, or a gentler island escape in the far south.',note:'The north can be snowy and cold while Okinawa stays relatively mild; plan clothing and transfers by region.',places:[['Ginzan after dark','A classic winter onsen atmosphere'],['Hakodate from above','Harbor lights on a cold clear night'],['Kerama blue','A slower, mild-weather island break']]}
];
const MONTH_EXTRA_PLACES = [
  [['Sapporo, snow and neon','Winter lights and northern city life'],['Lake Mashu, mirror of the sky','A crisp, clear caldera-lake viewpoint'],['Noboribetsu\u2019s volcanic valley','Steaming volcanic terrain and hot springs'],['Tokyo Disney Resort','A full day in immersive theme-park worlds'],['Tokyo Tower','A glowing landmark for long winter evenings'],['Beppu, steam rising','Warm baths and volcanic steam'],['Osaka, after hours','Neon-lit food streets and late-night energy'],['Kumamoto Castle','A landmark castle visit in the mild south'],['Fukuoka Tower','Seaside city views in the winter light']] ,
  [['Sapporo, snow and neon','Snow-season city energy and winter food'],['Lake Mashu, mirror of the sky','A dramatic frozen-season northern view'],['Noboribetsu\u2019s volcanic valley','Hot-spring country in the deep winter'],['Otaru by lamplight','Canal lights and old port streets'],['Tokyo Tower','A clear-night skyline viewpoint'],['Kinkaku-ji, the Golden Pavilion','A celebrated temple framed by winter gardens'],['Osaka Aquarium Kaiyukan','A weather-proof day among Pacific marine life'],['Beppu, steam rising','A warm southern onsen escape'],['Kumamoto Castle','A historic landmark in the milder south']],
  [['Shuri, Ryukyu memory','Island heritage and early spring warmth'],['Ishigaki\u2019s southern shore','A subtropical coast as spring begins'],['Kinkaku-ji, the Golden Pavilion','Kyoto garden paths and golden architecture'],['Tokyo Skytree','A sweeping view over the capital'],['Ghibli Park','Storybook worlds among the spring greenery'],['Super Nintendo World','Interactive game worlds at Universal Studios Japan'],['Osaka Aquarium Kaiyukan','A deep-blue indoor ocean journey'],['Himeji, the white heron','A landmark castle and elegant grounds'],['Hirosaki in blossom','Northern Japan begins to welcome spring']],
  [['Hirosaki in blossom','A northern castle town framed by spring flowers'],['Nara, between trees','Deer, temple grounds, and fresh green paths'],['Kiyomizu-dera above Kyoto','A hillside temple terrace over the spring city'],['Himeji, the white heron','Castle walls and gardens in spring'],['Tokyo Disney Resort','A full day of rides and storybook worlds'],['Kinkaku-ji, the Golden Pavilion','A classic Kyoto garden and temple visit'],['Osaka Castle Park','Moats, lawns, and springtime city walks'],['Matsushima Bay','Pine islands and a refreshing coastal day'],['Ghibli Park','A playful spring day among film-inspired worlds']],
  [['Kamikochi, the mountain valley','Alpine trails open beneath the Northern Alps'],['Tateyama Kurobe Alpine Route','High mountain scenery as the route opens'],['Nikko in the cedars','Fresh green mountain wetlands and boardwalks'],['Matsumoto beneath the Alps','A striking castle town with mountain backdrops'],['Fuji-Q Highland','Coasters with Mount Fuji on the horizon'],['Ghibli Park','A relaxed day in leafy film-inspired settings'],['Tokyo Skytree','A high-up panorama over the capital'],['Himeji, the white heron','A landmark castle before summer heat'],['Ritsurin Garden, Takamatsu','Refined garden paths in fresh spring green']],
  [['Oirase stream walk','Waterfalls and forest paths at their greenest'],['Kamikochi, the mountain valley','Cooler air and dramatic alpine views'],['Ritsurin Garden, Takamatsu','Pine gardens and calm paths after rain'],['Shinjuku Gyoen in every season','A leafy pause in the heart of Tokyo'],['Kinkaku-ji, the Golden Pavilion','A classic temple reflected in its pond'],['Osaka Aquarium Kaiyukan','A cool indoor escape into ocean habitats'],['Koyasan after dusk','Mountain temple lodging and lantern-lit lanes'],['Lake Biwa\u2019s eastern shore','Lakeside routes and quiet waterside towns'],['Ghibli Park','Shaded paths and imaginative worlds']],
  [['Lake Toya, volcanic calm','Lakeside views beneath summer skies'],['Oshino Hakkai and Fuji views','Clear spring ponds beneath Mount Fuji'],['Fuji-Q Highland','Big rides with close-up Fuji views'],['Tokyo Disney Resort','A full day of summer entertainment'],['Super Nintendo World','Interactive rides and game-inspired details'],['Ghibli Park','An imaginative day among shaded park paths'],['Takachiho Gorge by boat','A cool river journey between volcanic cliffs'],['Iya Valley vine bridges','Mountain air and remote green valleys'],['Osaka Aquarium Kaiyukan','A cool break among giant marine habitats']],
  [['Naha, island time','Ryukyu culture and a slower island pace'],['Takachiho Gorge by boat','A shaded gorge and clear river escape'],['Iya Valley vine bridges','A cooler mountain retreat in Shikoku'],['Fukuoka Tower','Coastal views and a breezy waterfront'],['Osaka Aquarium Kaiyukan','A refreshing indoor day for all ages'],['Tokyo Disney Resort','A full day of immersive attractions'],['Fuji-Q Highland','Thrilling rides beneath Mount Fuji'],['Himeji, the white heron','A castle visit before autumn begins'],['Super Nintendo World','A colorful family day inside Universal Studios Japan']],
  [['Lake Mashu, mirror of the sky','Northern highlands begin to turn toward autumn'],['Daisetsuzan high country','Early fall color across Hokkaido peaks'],['Kumamoto Castle','A major Kyushu landmark in milder weather'],['Fukuoka Tower','Hakata Bay views in the soft fall light'],['Kiso Valley post towns','Historic walking routes through mountain villages'],['Tokyo Tower','Clearer city views as the air cools'],['Kamikochi, the mountain valley','Alpine colors and crisp trail weather'],['Fuji-Q Highland','A lively day out with seasonal Fuji views'],['Lake Toya, volcanic calm','A quieter lakeside break in Hokkaido']],
  [['Matsushima Bay','Golden grasses and cool mountain air'],['Yamadera, a mountain of steps','Autumn color along a dramatic temple approach'],['Kiso Valley post towns','A walk through historic mountain villages'],['Kinkaku-ji, the Golden Pavilion','A famous Kyoto scene framed by fall colors'],['Kumamoto Castle','A memorable castle visit in comfortable weather'],['Tokyo Skytree','Clear autumn panoramas over the city'],['Koyasan after dusk','A peaceful temple stay among autumn trees'],['Tottori Sand Dunes at sunset','A glowing coastal landscape at day?s end'],['Himeji, the white heron','Castle gardens and mild autumn walks']],
  [['Kiyomizu-dera above Kyoto','Temple terraces and vivid autumn gardens'],['Osaka Castle Park','A landmark surrounded by fall color'],['Koyasan after dusk','Lantern-lit temple lanes in cool weather'],['Ghibli Park','A leafy escape as the season turns'],['Tokyo Tower','A city landmark against clear autumn skies'],['Kumamoto Castle','A southern castle trip in crisp weather'],['Fukuoka Tower','Sunset views above Hakata Bay'],['Himeji, the white heron','A classic castle framed by autumn gardens'],['Osaka Aquarium Kaiyukan','A comfortable all-weather city attraction']],
  [['Otaru by lamplight','A glowing canal and old port streets'],['Sapporo, snow and neon','Winter city lights and northern cuisine'],['Beppu, steam rising','Hot springs and volcanic steam'],['Naha, island time','A mild-weather change of pace in the south'],['Tokyo Disney Resort','A full day of immersive seasonal entertainment'],['Super Nintendo World','A colorful indoor-outdoor attraction day'],['Osaka Aquarium Kaiyukan','A warm indoor ocean adventure'],['Kumamoto Castle','A major historic sight in southern Japan'],['Tokyo Tower','A bright city landmark after dark']]
];
const monthSelect = document.querySelector('#travel-month');
const tripLengthSelect = document.querySelector('#trip-length');
const journeyRegionSelect = document.querySelector('#journey-region');
const journeyStyleSelect = document.querySelector('#journey-style');
monthSelect.replaceChildren(...MONTHS.map((month, index) => { const option = document.createElement('option'); option.value = String(index); option.textContent = month; return option; }));
const sharedPlan = new URLSearchParams(window.location.search);
document.querySelector('#month-planner').open = sharedPlan.has('month');
const requestedMonth = Number(sharedPlan.get('month'));
monthSelect.value = sharedPlan.has('month') && requestedMonth >= 0 && requestedMonth < 12 ? String(requestedMonth) : String(new Date().getMonth());
if (['short','week','long'].includes(sharedPlan.get('days'))) tripLengthSelect.value = sharedPlan.get('days');
if ([...journeyRegionSelect.options].some(option => option.value === sharedPlan.get('region'))) journeyRegionSelect.value = sharedPlan.get('region');
if ([...journeyStyleSelect.options].some(option => option.value === sharedPlan.get('style'))) journeyStyleSelect.value = sharedPlan.get('style');
function getPlacesForMonth(monthIndex) {
  return new Set((window.JapanSeasonalEligibility?.picksForMonth(DESTINATIONS,monthIndex+1)||[]).map(({place})=>place.name));
}
function updateMonthSearchUI() {
  const monthName = MONTHS[Number(monthSelect.value)];
  const toggle = document.querySelector('#month-filter-toggle');
  document.querySelector('#month-filter-name').textContent = monthName;
  toggle.setAttribute('aria-pressed', String(monthSearchEnabled));
  document.querySelector('#month-filter-prefix').textContent = monthSearchEnabled ? 'Showing' : 'Include';
  document.querySelector('#month-filter-suffix').textContent = 'seasonal places';
  document.querySelector('#month-filter-clear').hidden = !monthSearchEnabled;
  document.querySelector('#month-filter-description').textContent = monthSearchEnabled ? `The destination search is showing ${monthName} seasonal picks. Search words, region, mood, and saved filters still apply.` : 'Choose a travel month above, then include its seasonal places in the full destination search.';
  const help=document.querySelector('#search-intent-help');
  const active=[monthSearchEnabled?`${monthName} seasonal picks`:null,localFindsOnly?'Local Finds':null].filter(Boolean);
  help.textContent=active.length?`Unified results filtered by ${active.join(' + ')}. Add a place, region, or experience to narrow further.`:'One search for places, regions, experiences, Local Finds, and months. Open Plan by month for seasonal ideas.';
}
document.querySelector('#month-filter-toggle').addEventListener('click', () => { if(monthSearchEnabled){monthSearchManual=false;search.value=search.value.replace(new RegExp(`\\b${MONTHS[Number(monthSelect.value)]}\\b`,'ig'),' ').replace(/\s+/g,' ').trim();}else monthSearchManual=true; visibleLimit=12; syncUnifiedSearch(); });
document.querySelector('#month-filter-clear').addEventListener('click', () => { monthSearchManual=false; if (search.value) { search.value = search.value.replace(new RegExp(`\\b${MONTHS[Number(monthSelect.value)]}\\b`, 'ig'), '').trim(); } visibleLimit = 12; syncUnifiedSearch(); });
function renderMonthGuide() {
  const monthIndex = Number(monthSelect.value);
  const guide = MONTH_GUIDE[monthIndex];
  updateMonthSearchUI();
  if (monthSearchEnabled) { visibleLimit = 12; renderDestinations(); }
  document.querySelector('#month-name-heading').textContent = MONTHS[monthIndex];
  document.querySelector('#month-summary').textContent = guide.summary;
  document.querySelector('#month-timing-note').textContent = journeyStyleSelect.value === 'local'
    ? `${guide.note} Local Finds are a year-round editorial shortlist, not a seasonal guarantee; check current access and weather.`
    : guide.note;
  const durationNotes = {
    short:'For 3–5 days, choose one compact region and enjoy it at an unhurried pace.',
    week:'For 6–9 days, pair two nearby bases and leave room for a day trip.',
    long:'For 10–14 days, combine two or three connected regions; allow time for longer transfers.'
  };
  document.querySelector('#trip-length-guidance').textContent = durationNotes[tripLengthSelect.value];
  const recommendationLimit = {short:9, week:18, long:30}[tripLengthSelect.value];
  const uniquePicks = (window.JapanSeasonalEligibility?.picksForMonth(DESTINATIONS,monthIndex+1)||[]).map(({place,reason})=>[place.name,reason]);
  let tailoredPicks = journeyStyleSelect.value === 'local'
    ? uniquePicks.filter(([name]) => LOCAL_FIND_NAMES.has(name))
    : uniquePicks;
  if (journeyRegionSelect.value !== 'all') tailoredPicks = tailoredPicks.filter(([name]) => DESTINATIONS.find(place => place.name === name)?.region === journeyRegionSelect.value);
  if (journeyStyleSelect.value !== 'balanced' && journeyStyleSelect.value !== 'local') {
    const matchesStyle = name => DESTINATIONS.find(place => place.name === name)?.tags?.includes(journeyStyleSelect.value) ? 1 : 0;
    tailoredPicks.sort((a,b) => matchesStyle(b[0]) - matchesStyle(a[0]));
  }
  tailoredPicks = tailoredPicks.slice(0, recommendationLimit);
  const routePicks = tailoredPicks.map(([name, reason]) => ({ place: DESTINATIONS.find(item => item.name === name), reason })).filter(item => item.place);
  const cards = tailoredPicks.map(([name, reason]) => {
    const place = DESTINATIONS.find(item => item.name === name);
    if (!place) return null;
    const card = document.createElement('article'); card.className = 'month-pick';
    let image;
    const photo=verifiedPlacePhoto(place);
    const imageUrl=photo?.url || '';
    if(imageUrl){
      image=document.createElement('img');
      applyPhotoVerificationAttributes(image,photo);
      image.src=imageUrl;
      image.alt=photo.alt;
      image.loading='lazy';
      image.decoding='async';
      image.addEventListener('error',()=>{
        image.hidden=true;
        card.classList.add('month-pick-photo-unavailable');
        photoCredit?.remove();
      });
    }else{
      image=document.createElement('span');
      image.className='month-pick-art';
      image.dataset.art=place.illustration||'place';
      image.dataset.title=place.name;
      image.setAttribute('aria-hidden','true');
    }
    const copy = document.createElement('span'); copy.className = 'month-pick-copy';
    const region = document.createElement('span'); region.className = 'month-pick-region'; region.textContent = place.place;
    const title = document.createElement('span'); title.className = 'month-pick-title'; title.textContent = placeDisplayName(place.name);
    const detail = document.createElement('span'); detail.className = 'month-pick-reason'; detail.textContent = reason;
    const photoCredit=photo?document.createElement('a'):null;
    if(photoCredit){photoCredit.className='month-pick-credit';photoCredit.href=photo.source;photoCredit.target='_blank';photoCredit.rel='noopener noreferrer';photoCredit.textContent=`PHOTO / ${photo.credit} / ${photo.license}`;}
    const action=document.createElement('button');action.type='button';action.className='month-pick-action';action.textContent='VIEW PLACE';action.setAttribute('aria-label',`View ${place.name}: ${reason}`);action.addEventListener('click',()=>showPlace(place,DESTINATIONS.indexOf(place)));
    copy.append(region,title,detail);
    if(photoCredit)copy.append(photoCredit);
    copy.append(action); card.append(image,copy);
    return card;
  }).filter(Boolean);
  const styleLabel = journeyStyleSelect.value === 'local' ? 'LOCAL FINDS' : journeyStyleSelect.value === 'balanced' ? 'SEASONAL PLACES' : `${journeyStyleSelect.value.toUpperCase()}-LED PLACES`;
  const regionLabel = journeyRegionSelect.value === 'all' ? 'ALL JAPAN' : journeyRegionSelect.value.toUpperCase();
  document.querySelector('#month-results-count').textContent = `${cards.length} ${styleLabel} · ${MONTHS[monthIndex].toUpperCase()} · ${regionLabel}`;
  const results = document.querySelector('#month-recommendations');
  if (!cards.length) {
    const empty = document.createElement('p'); empty.className = 'journey-empty';
    empty.textContent = `No places have a month-specific reason verified for ${MONTHS[monthIndex]} in ${journeyRegionSelect.value}. The atlas is withholding general seasonal suggestions until a month-specific rationale is recorded.`;
    results.replaceChildren(empty);
  } else results.replaceChildren(...cards);
  renderMonthRoute(routePicks, monthIndex);
}
function renderMonthRoute(picks, monthIndex) {
  const section = document.querySelector('#month-route-plan');
  if (!section || section.dataset.requested !== 'true') return;
  if (!picks.length) {
    const empty=document.createElement('p');empty.className='journey-empty';
    empty.textContent=`No month-specific picks are verified for ${MONTHS[monthIndex]} yet. General seasonal inspiration is not being presented as a month-specific plan.`;
    section.replaceChildren(empty);section.hidden=false;return;
  }
  const heading = document.createElement('div'); heading.className = 'month-route-heading';
  const copy = document.createElement('div');
  const kicker = document.createElement('p'); kicker.className = 'month-route-kicker'; kicker.textContent = 'SEASONAL INSPIRATION - NOT A DAY PLAN';
  const title = document.createElement('h4'); title.textContent = `${picks.length} ${picks.length === 1 ? 'place' : 'places'} to explore in ${MONTHS[monthIndex]}`;
  const intro = document.createElement('p'); intro.className = 'month-route-intro'; intro.textContent = 'These places match your season and interests. Each is shown individually; regional proximity does not confirm a practical same-day itinerary. Check access, opening times and transport before combining stops.';
  copy.append(kicker, title, intro); heading.append(copy);
  const grid = document.createElement('div'); grid.className = 'month-route-stops';
  picks.forEach(item => {
    const place = item.place;
    const card = document.createElement('article'); card.className = 'month-route-stop';
    const photo = document.createElement('div'); photo.className = 'month-route-stop-photo';
    const verified=verifiedPlacePhoto(place);
    if (verified) { const img = document.createElement('img'); applyPhotoVerificationAttributes(img,verified); img.src = verified.url; img.alt = verified.alt; img.loading = 'lazy'; img.addEventListener('error',()=>photo.remove(),{once:true}); const credit=document.createElement('a');credit.href=verified.source;credit.target='_blank';credit.rel='noopener noreferrer';credit.textContent=`Photo: ${verified.credit} ? ${verified.license}`;photo.append(img,credit); }
    else photo.remove();
    const meta = document.createElement('p'); meta.className = 'month-route-stop-meta'; meta.textContent = `${place.region} | ${place.place}`;
    const name = document.createElement('h5'); name.textContent = placeDisplayName(place.name);
    const season = document.createElement('p'); season.className = 'month-route-season'; season.textContent = `WHY ${MONTHS[monthIndex].toUpperCase()}: ${item.reason}`;
    const story = document.createElement('p'); story.className = 'month-route-story'; story.textContent = `${place.description} ${placeStory(place, PLACE_SPOTLIGHTS[place.name])}`.trim();
    const actions = document.createElement('div'); actions.className = 'month-place-actions';
    const map = document.createElement('a'); map.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${place.place}, Japan`)}`; map.target = '_blank'; map.rel = 'noopener noreferrer'; map.textContent = 'Find this place on Google Maps';
    const detail = document.createElement('button'); detail.type = 'button'; detail.className = 'month-route-detail-button'; detail.textContent = 'Read place story'; detail.addEventListener('click', () => showPlace(place, DESTINATIONS.indexOf(place)));
    actions.append(map, detail); card.append(photo, meta, name, season, story, actions); grid.append(card);
  });
  const note = document.createElement('p'); note.className = 'month-route-caveat'; note.textContent = 'Map links open individual place searches, not a combined route. Only the five Tokyo outing guides contain sourced reference estimates; nationwide seasonal picks are inspiration without implied time or budget.';
  section.hidden = false;
  section.replaceChildren(heading, grid, note);
}
document.querySelector('#build-month-route')?.addEventListener('click', () => {
  const section = document.querySelector('#month-route-plan');
  section.dataset.requested = 'true';
  renderMonthGuide();
  if (section.hidden) return;
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.querySelector('#build-month-route').textContent = 'Update my route ↗';
  document.querySelector('#build-month-route').setAttribute('aria-expanded', 'true');
});
monthSelect.addEventListener('change', () => {
  monthSearchManual = true;
  search.value = search.value.replace(/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b/ig, ' ').replace(/\s+/g, ' ').trim();
  syncUnifiedSearch();
});
tripLengthSelect.addEventListener('change', renderMonthGuide);
journeyRegionSelect.addEventListener('change', renderMonthGuide);
journeyStyleSelect.addEventListener('change', renderMonthGuide);
renderMonthGuide();

renderFilters();
updateLocalFindsUI();
renderDestinations();
updateSavedUI();
document.querySelectorAll('[data-map-region]').forEach(link => {
  const selectRegion = () => {
    activeRegion = link.dataset.mapRegion;
    renderFilters(); renderRegionSpotlight(activeRegion); renderDestinations();
  };
  link.addEventListener('click', event => {
    if (link.tagName.toLowerCase() !== 'a') event.preventDefault();
    selectRegion();
  });
});
const initialRegion = decodeURIComponent(window.location.hash.replace(/^#region=/, ''));
if (REGIONS.includes(initialRegion)) { activeRegion = initialRegion; renderFilters(); renderRegionSpotlight(activeRegion); renderDestinations(); }
else renderRegionSpotlight(activeRegion);
placeDialog.addEventListener('click', event => { if (event.target === placeDialog) placeDialog.close(); });

const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
menuToggle.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!expanded));
  menuToggle.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  mobileNav.hidden = expanded;
});
mobileNav.addEventListener('click', event => {
  if (event.target.closest('a')) {
    mobileNav.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
  }
});
