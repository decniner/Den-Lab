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
  'Tokyo Disney Resort': {
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
    return inRegion && inSaved && inMood && inMonth && inLocalFinds && matchesQuery;
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
    copy.append(location, row, area, description, tags, details, fieldGuide);
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
