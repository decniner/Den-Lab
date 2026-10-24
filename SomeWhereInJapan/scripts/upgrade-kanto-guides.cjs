'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const write = (file, value) => fs.writeFileSync(path.join(root, file), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
const today = '2026-10-24';

const detailsFile = 'data/destination-guide-details.json';
const detailsData = read(detailsFile);
const records = detailsData.records;

const kamakuraStory = "Kamakura, temple to tide is a day shaped by changing scale: the broad approach to Tsurugaoka Hachimangu Shrine gives way to lanes of small shops, then the Enoden carries you toward the coast and the open-air presence of the Great Buddha of Kamakura. At Kotoku-in, the bronze Daibutsu has stood outdoors since the hall that once covered it was destroyed; the surviving foundation stones help make the statue's setting feel less like a monument and more like a place with a long memory. A short walk away, Hasedera Temple turns the visit upward through gardens to a lookout over the town and the sea. Give the central shrine precinct the quiet of the morning, then use the railway rather than a long road transfer to reach Hase. Hydrangeas make June especially popular, while Hasedera's outlook and temple grounds change with the season. For this central-to-western route, allow about 5 to 7 hours as a planning estimate, including rail transfers, breaks and time inside the sites.";

const hakoneStory = "Hakone through the mist is best understood as a journey across the mountain, not a cluster of nearby stops. Start at the Hakone Open-Air Museum, where sculpture sits in a landscape of hills and gardens, then climb from Gora by cable car and ropeway toward Owakudani. The volcanic valley makes the earth itself the spectacle: steam rises from the ground, and the view opens toward the surrounding caldera. Continue down to Togendai, where the sightseeing cruise crosses Lake Ashi to Motohakone; from the port, a walk leads to Hakone Shrine beneath cedar trees and to the lakeside torii. The sequence follows Hakone's linked transport rather than trying to drive between every viewpoint. June to mid-July brings hydrangeas along the mountain railway and cable-car route, while clear days offer the best chance of seeing Mount Fuji. Ropeway, cruise and road operations can change with weather, so check service notices before setting out. Allow roughly 7 to 9 hours as a guide estimate; admission is separate at museums and some attractions, and the full circuit rewards an early start.";

const tokyoStory = "Tokyo, in layers rewards travelers who treat the capital as a series of neighborhoods instead of a checklist. Begin in Asakusa, where the Kaminarimon lantern, Nakamise's shopfronts and the temple precinct create a walkable introduction to older Tokyo. Ride west and the city changes scale: Harajuku's busy streets meet the wooded approach to Meiji Jingu, then the broad crossing at Shibuya gathers the movement of the modern city into one memorable pause. Tokyo Station and Marunouchi offer another contrast, with the red-brick station facade opening toward wide avenues and the Imperial Palace grounds. Each district works as its own half-day; combining two nearby areas makes a satisfying day, while trying to cross the city repeatedly turns the journey into station transfers. Spring brings blossoms and comfortable outdoor walks; June is humid and rainy, so keep an indoor museum or aquarium in reserve. For two connected districts, plan about 6 to 8 hours, then add time for exhibitions, observation decks or meals. Admission varies by attraction, and most landmarks have separate opening schedules.";

const sources = {
  kamakura: [
    { id: 'kamakura-access', organization: 'Kamakura City Tourist Association', title: 'Official access guide to Kamakura', url: 'https://visit.trip-kamakura.com/access/', checkedOn: today, evidenceNotes: 'Lists rail access from Tokyo Station, Haneda Airport and Narita Airport; recommends public transportation because roads by popular visitor areas are congested.' },
    { id: 'kamakura-model-route', organization: 'Kamakura City Tourist Association', title: 'Kamakura English tourist map and model routes', url: 'https://visit.trip-kamakura.com/wp/wp-content/uploads/2025/01/touristmap_english_2024.pdf', checkedOn: today, evidenceNotes: 'Maps central and western Kamakura sights and Enoden connections; source map information is dated June 2023.' },
    { id: 'kamakura-daibutsu', organization: 'Kamakura City Tourist Association', title: 'Daibutsu (Great Buddha) of Kamakura', url: 'https://visit.trip-kamakura.com/japanheritage/english/japanheritage-en/21487.html', checkedOn: today, evidenceNotes: 'Supports the statue history, address, access from Hase Station, admission and hours.' },
    { id: 'kamakura-hasedera', organization: 'Kamakura City Tourist Association', title: 'Hasedera Temple', url: 'https://visit.trip-kamakura.com/things-to-do/hasedera-temple/', checkedOn: today, evidenceNotes: 'Supports the eleven-faced Kannon, gardens, sea-view lookout, address, fees, hours, access and seasonal flowers.' },
    { id: 'kamakura-tsurugaoka', organization: 'Kamakura City Tourist Association', title: 'Tsurugaoka Hachimangu Shrine', url: 'https://visit.trip-kamakura.com/things-to-do/tsurugaoka-hachimangu/', checkedOn: today, evidenceNotes: 'Supports the shrine history, station access, phone, hours and seasonal flower report.' },
    { id: 'kamakura-meigetsuin', organization: 'Kamakura City Tourist Association', title: 'Meigetsuin Temple', url: 'https://visit.trip-kamakura.com/things-to-do/meigetsuin-temple/', checkedOn: today, evidenceNotes: 'Supports the June hydrangea association and seasonal garden opening information.' },
    { id: 'kamakura-tourist-info', organization: 'Kamakura City Tourist Association', title: 'Kamakura City Tourist Information Center', url: 'https://visit.trip-kamakura.com/services/kamakura-city-tourist-information-center/', checkedOn: today, evidenceNotes: 'Supports visitor-information phone, address and opening hours.' },
    { id: 'kamakura-photo', organization: 'Wikimedia Commons', title: 'Great Buddha.jpg', url: 'https://commons.wikimedia.org/wiki/File:Great_Buddha.jpg', checkedOn: today, evidenceNotes: 'Photograph of the Great Buddha of Kamakura by P. Hughes; CC BY-SA 4.0.' },
    { id: 'kamakura-station-osm', organization: 'OpenStreetMap', title: 'Kamakura Station map feature', url: 'https://www.openstreetmap.org/way/101918460', checkedOn: today, evidenceNotes: 'Station map point used as the route origin.' },
    { id: 'kamakura-tsurugaoka-osm', organization: 'OpenStreetMap', title: 'Tsurugaoka Hachimangu map feature', url: 'https://www.openstreetmap.org/way/34550401', checkedOn: today, evidenceNotes: 'Shrine map point used for the route stop.' },
    { id: 'kamakura-daibutsu-osm', organization: 'OpenStreetMap', title: 'Great Buddha map feature', url: 'https://www.openstreetmap.org/node/260752586', checkedOn: today, evidenceNotes: 'Great Buddha map point used for the route stop.' }
  ],
  hakone: [
    { id: 'hakone-one-day', organization: 'Odakyu Hakone', title: 'Your First Hakone Trip: a one-day plan with must-see spots', url: 'https://www.hakonenavi.jp/international/en/course/244', checkedOn: today, evidenceNotes: 'Supports the Hakone-Yumoto, Open-Air Museum, Owakudani, Lake Ashi cruise, Motohakone and shrine sequence; states that Romancecar requires a separate limited-express surcharge.' },
    { id: 'hakone-access', organization: 'Odakyu Hakone', title: 'Directions to Hakone from Tokyo, airports and Yokohama', url: 'https://www.hakonenavi.jp/international/en/access/tokyo', checkedOn: today, evidenceNotes: 'Official arrival information for Shinjuku, Tokyo Station, Haneda and Narita.' },
    { id: 'hakone-around', organization: 'Odakyu Hakone', title: 'Getting around Hakone', url: 'https://www.hakonenavi.jp/international/en/around', checkedOn: today, evidenceNotes: 'Explains the Hakone Tozan train, cable car, ropeway and sightseeing cruise connections.' },
    { id: 'hakone-station-yumoto', organization: 'Odakyu Hakone', title: 'Hakone-Yumoto Station guide', url: 'https://www.hakonenavi.jp/international/en/station/yumoto', checkedOn: today, evidenceNotes: 'Supports rail and bus access, visitor information, station address and station map point.' },
    { id: 'hakone-station-owakudani', organization: 'Odakyu Hakone', title: 'Owakudani Station guide', url: 'https://www.hakonenavi.jp/international/en/station/owakudani', checkedOn: today, evidenceNotes: 'Supports the ropeway station, station facilities and address.' },
    { id: 'hakone-station-togendai', organization: 'Odakyu Hakone', title: 'Togendai Station and Port guide', url: 'https://www.hakonenavi.jp/international/en/station/togendai', checkedOn: today, evidenceNotes: 'Supports ropeway, cruise, bus connections, address and station map point.' },
    { id: 'hakone-motohakone', organization: 'Odakyu Hakone', title: 'Motohakone-ko station guide', url: 'https://www.hakonenavi.jp/international/en/station/motohakone', checkedOn: today, evidenceNotes: 'Supports cruise and bus service from the port and its address.' },
    { id: 'hakone-hydrangea', organization: 'Hakone Town Tourism Association', title: 'How to enjoy Hakone hydrangeas', url: 'https://www.hakone.or.jp/8201', checkedOn: today, evidenceNotes: 'Supports hydrangea seasonality across different elevations and rail access.' },
    { id: 'hakone-shrine', organization: 'Hakone Town Tourism Association', title: 'Hakone Shrine', url: 'https://www.hakone.or.jp/554', checkedOn: today, evidenceNotes: 'Supports shrine history, address, phone, access, parking and visitor information.' },
    { id: 'hakone-contact', organization: 'Hakone Town Tourism Association', title: 'Hakone visitor help center', url: 'https://www.hakone.or.jp/777', checkedOn: today, evidenceNotes: 'Supports the visitor information contact number 0460-85-5700.' },
    { id: 'hakone-open-air-museum', organization: 'Hakone Town Tourism Association', title: 'The Hakone Open-Air Museum', url: 'https://www.hakone.or.jp/534', checkedOn: today, evidenceNotes: 'Supports the museum admission and access by train, bus or car.' },
    { id: 'hakone-photo', organization: 'Wikimedia Commons', title: 'Lake Ashi & Mt Fuji & Hakone Shrine.jpg', url: 'https://commons.wikimedia.org/wiki/File:Lake_Ashi_%26_Mt_Fuji_%26_Hakone_Shrine.jpg', checkedOn: today, evidenceNotes: 'Photograph by Charlie Fong; CC BY-SA 4.0.' }
  ],
  tokyo: [
    { id: 'tokyo-asakusa', organization: 'Tokyo Convention & Visitors Bureau', title: 'A guide to Asakusa', url: 'https://www.gotokyo.org/en/destinations/eastern-tokyo/asakusa/index.html', checkedOn: today, evidenceNotes: 'Supports Asakusa points of interest and access from Tokyo, Shinjuku and both airports.' },
    { id: 'tokyo-shibuya', organization: 'Tokyo Convention & Visitors Bureau', title: 'A guide to Shibuya', url: 'https://www.gotokyo.org/en/destinations/western-tokyo/shibuya/index.html', checkedOn: today, evidenceNotes: 'Supports Shibuya attractions and access by rail from Shinjuku, Tokyo Station and both airports.' },
    { id: 'tokyo-shinjuku', organization: 'Tokyo Convention & Visitors Bureau', title: 'A guide to Shinjuku', url: 'https://www.gotokyo.org/en/destinations/western-tokyo/shinjuku/index.html', checkedOn: today, evidenceNotes: 'Supports Shinjuku transport connections and district details.' },
    { id: 'tokyo-arrival', organization: 'Tokyo Convention & Visitors Bureau', title: 'Getting to Tokyo', url: 'https://www.gotokyo.org/en/plan/getting-to-tokyo/', checkedOn: today, evidenceNotes: 'Supports arrival by plane, shinkansen and express buses, plus Tokyo public transit.' },
    { id: 'tokyo-airport', organization: 'Tokyo Convention & Visitors Bureau', title: 'Airport and cruise terminal access', url: 'https://www.gotokyo.org/en/plan/airport-access/index.html', checkedOn: today, evidenceNotes: 'Supports rail, bus and taxi options from Narita and Haneda.' },
    { id: 'tokyo-weather', organization: 'Tokyo Convention & Visitors Bureau', title: 'Weather and geography in Tokyo', url: 'https://www.gotokyo.org/en/plan/weather/index.html', checkedOn: today, evidenceNotes: 'Supports seasonal planning: spring conditions and humid, rainy June to mid-July.' },
    { id: 'tokyo-best-three-days', organization: 'Tokyo Convention & Visitors Bureau', title: 'How to see the best of Tokyo in three days', url: 'https://www.gotokyo.org/en/story/walks-and-tours/best-of-tokyo/index.html', checkedOn: today, evidenceNotes: 'Supports grouping nearby districts rather than crossing the city repeatedly.' },
    { id: 'tokyo-photo', organization: 'Wikimedia Commons', title: 'Shibuya Crossing in Tokyo.jpg', url: 'https://commons.wikimedia.org/wiki/File:Shibuya_Crossing_in_Tokyo.jpg', checkedOn: today, evidenceNotes: 'Photograph by Christophe95; CC BY-SA 4.0.' }
  ]
};

const kamakura = {
  story: kamakuraStory,
  visitPlan: 'Begin at Kamakura Station and walk to Tsurugaoka Hachimangu Shrine. Explore the central streets at an unhurried pace, then use the Enoden or a local bus to reach Hase. Visit the Great Buddha of Kamakura and continue on foot to Hasedera Temple. This is an editorial 5-to-7-hour guide estimate, not a timed operator itinerary; check current services and site hours before travel.',
  seasonality: 'June is hydrangea season at several Kamakura temples; Meigetsuin is widely known for hydrangeas, and Hasedera reports seasonal flowers including hydrangeas in summer. Hasedera extends its closing time from April to June. Expect more visitors at popular flower sites and confirm current notices.',
  access: 'Train: JR Yokosuka Line from Tokyo Station to Kamakura Station takes about 60 minutes; the official guide also lists about 50 minutes from Shinagawa and about 25 minutes from Yokohama. From Haneda, take Keikyu Line to Yokohama, then JR Yokosuka Line to Kamakura; from Narita, use Narita Express to Ofuna and transfer to JR Yokosuka Line. Local movement uses JR, Enoden, buses and taxis. Bus access serves the Great Buddha and Hasedera; Kamakura recommends public transport because roads near major sights are congested. By car, use public parking and expect congestion; the sites have their own restrictions. Kamakura has no airport; continue from Haneda or Narita by rail.',
  highlights: ['Tsurugaoka Hachimangu Shrine', 'Great Buddha of Kamakura', 'Hasedera Temple, Kamakura', 'Kamakura Station', 'Enoden Hase Station'],
  points: [
    { name: 'Tsurugaoka Hachimangu Shrine', description: 'The central shrine precinct is reached in about a 10-minute walk from the east exit of Kamakura Station; the approach and grounds make a strong first stop.' },
    { name: 'Great Buddha of Kamakura', description: 'At Kotoku-in, the National Treasure bronze statue has remained outdoors since its hall was lost; visitors can enter the statue when access is open.' },
    { name: 'Hasedera Temple, Kamakura', description: 'Follow the garden paths to the lookout for a wide view over Kamakura and the sea; allow time for the temple buildings and Kannon Museum.' },
    { name: 'Enoden Hase Station', description: 'Use the Enoden to link central Kamakura with the Hase area and avoid a long road transfer between the route clusters.' },
    { name: 'Kamakura City Tourist Information Center', description: 'Pick up a local map beside the JR ticket office at Kamakura Station East Exit; staff provide English assistance daily.' }
  ],
  sources: sources.kamakura,
  accessModes: {
    rail: { status: 'known', detail: 'JR Yokosuka Line from Tokyo Station is about 60 minutes; JR Yokosuka Line from Shinagawa is about 50 minutes.', sourceIds: ['kamakura-access'] },
    bus: { status: 'known', detail: 'Local buses connect Kamakura Station with Hase and other major sights; check route and stop notices on the official tourist map.', sourceIds: ['kamakura-model-route', 'kamakura-daibutsu'] },
    air: { status: 'known', detail: 'There is no airport in Kamakura. Official access directions connect Haneda via Yokohama and Narita via Ofuna by rail.', sourceIds: ['kamakura-access'] },
    car: { status: 'known', detail: 'Road congestion is common around popular sights; the official visitor guide recommends public transportation. Check parking availability at individual sites.', sourceIds: ['kamakura-access', 'kamakura-hasedera'] }
  },
  contacts: [{ name: 'Kamakura City Tourist Information Center', phone: '+81-467-22-3350', sourceIds: ['kamakura-tourist-info'] }],
  stayRecommendations: [
    { name: 'Kamakura Station and Komachi', area: 'Best for an early start at the central shrine and quick access to JR, Enoden, buses and the visitor information center.', sourceIds: ['kamakura-access', 'kamakura-tourist-info'] },
    { name: 'Hase and Yuigahama', area: 'A calmer coastal base near the Great Buddha, Hasedera and Enoden Hase Station; allow for a return rail journey to central Kamakura.', sourceIds: ['kamakura-hasedera', 'kamakura-model-route'] }
  ],
  costs: [{ status: 'known', component: 'Great Buddha of Kamakura admission', note: 'The official guide lists adult admission at ¥300 and entry inside the statue at an additional ¥50; verify current fees and hours before visiting.', sourceIds: ['kamakura-daibutsu'] }],
  photo: { status: 'verified', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Great_Buddha.jpg?width=1400', alt: 'The Great Buddha of Kamakura, a bronze statue at Kotoku-in', source: 'https://commons.wikimedia.org/wiki/File:Great_Buddha.jpg', credit: 'P. Hughes', license: 'CC BY-SA 4.0', sourceIds: ['kamakura-photo'] },
  mapLocation: { status: 'verified', latitude: 35.3168482, longitude: 139.5357212, sourceIds: ['kamakura-daibutsu-osm'] },
  weatherPlan: { alternative: 'If rain interrupts the coastal walk, slow down at the temple interiors and museum stops; check each attraction opening notice and keep the return train flexible.', sourceIds: ['kamakura-hasedera', 'kamakura-access'] }
};

const hakone = {
  story: hakoneStory,
  visitPlan: 'Start at Hakone-Yumoto and ride the Hakone Tozan train to the Open-Air Museum. Return to Gora, take the cable car and ropeway to Owakudani, then continue by ropeway to Togendai. Cross Lake Ashi by sightseeing cruise to Motohakone-ko and walk to Hakone Shrine. The official one-day course follows this order; this guide allows 7 to 9 hours, including a slower museum visit and connections. Return by bus from Motohakone or extend the stay overnight.',
  seasonality: 'Hydrangeas bloom along the Hakone Tozan rail and cable-car routes from mid-June to mid-July; Hakone Town Tourism Association notes that flowering continues later at higher elevations. Clear weather improves Mount Fuji views, while wind, volcanic conditions and road congestion can interrupt transport. Check Hakone operator notices on the day.',
  access: 'Train: From Shinjuku, the Odakyu Romancecar runs directly to Hakone-Yumoto; its limited-express ticket is separate from the Hakone Freepass. From Tokyo Station, take the Tokaido Shinkansen or JR Tokaido Line to Odawara, then Hakone Tozan Railway to Hakone-Yumoto. Bus: Highway buses connect Shinjuku and airports to Hakone; local Hakone Tozan buses link the lake, shrine and Hakone-Yumoto. Air: Haneda and Narita access is by rail or airport bus onward to Hakone; there is no airport in the area. Car: use the Tomei Expressway via Odawara or Gotemba and local roads, but mountain roads and parking can be slow in busy periods. The Hakone Freepass covers designated transport only; check current inclusions and service status.',
  highlights: ['Hakone Open-Air Museum', 'Owakudani', 'Togendai Station and Port', 'Hakone Shrine', 'Hakone-Yumoto Station'],
  points: [
    { name: 'Hakone Open-Air Museum', description: 'A generous first stop for outdoor sculpture, garden paths and the Picasso Pavilion; the museum is two minutes on foot from Chokoku-no-Mori Station.' },
    { name: 'Owakudani', description: 'Ride the cable car from Gora and connect to the ropeway for the volcanic valley, where steam and sulfurous vents reveal Hakone’s active landscape.' },
    { name: 'Togendai Station and Port', description: 'Transfer from the ropeway to the Lake Ashi sightseeing cruise; the station building also has bus connections and visitor facilities.' },
    { name: 'Hakone Shrine', description: 'Walk from Motohakone Port to the cedar-shaded shrine precinct and lakeside torii; keep time for the steps and the approach.' },
    { name: 'Hakone-Yumoto Station', description: 'The gateway station links Odawara and Shinjuku with the mountain rail, buses, tourist information and luggage services.' }
  ],
  sources: sources.hakone,
  accessModes: {
    rail: { status: 'known', detail: 'Odakyu Romancecar runs direct from Shinjuku to Hakone-Yumoto; the Tokaido Shinkansen and JR Tokaido Line connect Tokyo with Odawara.', sourceIds: ['hakone-access', 'hakone-station-yumoto'] },
    bus: { status: 'known', detail: 'Hakone Tozan and Izu-Hakone buses serve Hakone-Yumoto, Motohakone-ko, Togendai and the lake area; verify live timetables.', sourceIds: ['hakone-station-yumoto', 'hakone-station-togendai', 'hakone-motohakone'] },
    air: { status: 'known', detail: 'Arrive through Haneda or Narita and continue by rail or highway bus; check the official airport routing for the selected date.', sourceIds: ['hakone-access'] },
    car: { status: 'known', detail: 'Hakone is reachable by road from the Odawara and Gotemba directions; mountain traffic and attraction parking can affect the day plan.', sourceIds: ['hakone-open-air-museum', 'hakone-shrine'] }
  },
  contacts: [{ name: 'Hakone Town Tourist Information Center', phone: '+81-460-85-5700', sourceIds: ['hakone-contact'] }],
  stayRecommendations: [
    { name: 'Hakone-Yumoto', area: 'The easiest base for Odakyu and Hakone Tozan connections, baggage services and an early start.', sourceIds: ['hakone-station-yumoto'] },
    { name: 'Gora', area: 'A convenient overnight base for the Open-Air Museum, mountain railway, cable car and onsen stays.', sourceIds: ['hakone-around', 'hakone-one-day'] },
    { name: 'Motohakone', area: 'Stay by Lake Ashi to enjoy the shrine and shoreline without rushing for the last bus.', sourceIds: ['hakone-motohakone', 'hakone-shrine'] }
  ],
  costs: [{ status: 'known', component: 'Attraction admission and rail surcharge', note: 'Museum admission is separate. The Romancecar requires a separate limited-express surcharge; confirm current prices, pass validity and weather-related suspensions.', sourceIds: ['hakone-open-air-museum', 'hakone-one-day', 'hakone-around'] }],
  photo: { status: 'verified', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Lake_Ashi_%26_Mt_Fuji_%26_Hakone_Shrine.jpg?width=1400', alt: 'Lake Ashi, Mount Fuji and Hakone Shrine in the morning light', source: 'https://commons.wikimedia.org/wiki/File:Lake_Ashi_%26_Mt_Fuji_%26_Hakone_Shrine.jpg', credit: 'Charlie Fong', license: 'CC BY-SA 4.0', sourceIds: ['hakone-photo'] },
  mapLocation: { status: 'verified', latitude: 35.20396, longitude: 139.02557, sourceIds: ['hakone-shrine'] },
  weatherPlan: { alternative: 'If ropeway or cruise service is suspended, stay in one accessible area such as Hakone-Yumoto or Gora and substitute an indoor museum; do not assume the full circuit is operating.', sourceIds: ['hakone-around', 'hakone-station-togendai'] }
};

const tokyo = records['tokyo-in-layers'];
Object.assign(tokyo, {
  story: tokyoStory,
  visitPlan: 'For a first full day, pair Asakusa with a nearby eastern-Tokyo stop. On another day, combine Meiji Jingu and Harajuku with Shibuya. Keep the districts separate unless there is a clear reason to cross town; this is a planning pattern rather than a timed route. Allow 6 to 8 hours for two connected districts and check admission or reservation details for museums and observatories.',
  seasonality: 'Spring is a comfortable time for park and shrine approaches. June brings humid, rainy weather; carry rain protection and keep an indoor attraction in reserve. Autumn walking conditions improve later in the season. Weather and event schedules vary by year.',
  access: 'Air: Haneda and Narita both connect to central Tokyo by train, airport bus and taxi; Haneda is closer to the city. Train: Tokyo is served by the shinkansen from other major Japanese cities and by JR, Tokyo Metro, Toei Subway and private railways within the capital. Bus: highway coaches serve Shinjuku and Tokyo Station, with airport buses to major districts. Car: use public transport within the central city when possible; parking and traffic vary by district. For Asakusa, Tokyo Metro Ginza Line, Toei Asakusa Line and Tobu Skytree Line serve Asakusa Station; Shibuya and Shinjuku have many rail operators.',
  highlights: ['Asakusa', 'Tokyo Station and Marunouchi', 'Meiji Jingu and Harajuku', 'Shibuya'],
  points: [
    { name: 'Asakusa', description: 'A traditional east-Tokyo district of temple approaches, shopping lanes, riverside walks and direct subway connections.' },
    { name: 'Tokyo Station and Marunouchi', description: 'The station facade and surrounding central avenues make a compact architecture-and-city-history walk.' },
    { name: 'Meiji Jingu and Harajuku', description: 'Pair the quiet wooded approach to the shrine with Harajuku’s contemporary streets, checking shrine etiquette and event notices.' },
    { name: 'Shibuya', description: 'A rail-connected west-Tokyo district whose crossing, station viewpoints and side streets reward a slower evening visit.' }
  ],
  sources: [...tokyo.sources.filter(source => !['tokyo-spots', 'tokyo-transit'].includes(source.id)), ...sources.tokyo],
  photo: { status: 'verified', url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Shibuya_Crossing_in_Tokyo.jpg?width=1400', alt: 'Shibuya Crossing at night in central Tokyo', source: 'https://commons.wikimedia.org/wiki/File:Shibuya_Crossing_in_Tokyo.jpg', credit: 'Christophe95', license: 'CC BY-SA 4.0', sourceIds: ['tokyo-photo'] },
  weatherPlan: { alternative: 'Keep a museum, aquarium or observation deck as a weather-flexible alternative, and check each attraction’s opening and reservation details.', sourceIds: ['tokyo-weather', 'tokyo-best-three-days'] }
});

Object.assign(records, {
  'kamakura-temple-to-tide': kamakura,
  'hakone-through-the-mist': hakone
});
write(detailsFile, detailsData);

const photosFile = 'data/commons-photo-research.json';
const photosData = read(photosFile);
const newPhotos = [
  { placeId: 'kamakura-temple-to-tide', place: 'Kamakura, temple to tide', query: 'Kamakura Great Buddha', status: 'matched', searchedOn: today, fileTitle: 'File:Great Buddha.jpg', imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Great_Buddha.jpg?width=1400', sourcePage: 'https://commons.wikimedia.org/wiki/File:Great_Buddha.jpg', photographer: 'P. Hughes', license: 'CC BY-SA 4.0', alt: 'The Great Buddha of Kamakura, a bronze statue at Kotoku-in', matchScore: 10 },
  { placeId: 'hakone-through-the-mist', place: 'Hakone through the mist', query: 'Lake Ashi Mount Fuji Hakone Shrine', status: 'matched', searchedOn: today, fileTitle: 'File:Lake Ashi & Mt Fuji & Hakone Shrine.jpg', imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Lake_Ashi_%26_Mt_Fuji_%26_Hakone_Shrine.jpg?width=1400', sourcePage: 'https://commons.wikimedia.org/wiki/File:Lake_Ashi_%26_Mt_Fuji_%26_Hakone_Shrine.jpg', photographer: 'Charlie Fong', license: 'CC BY-SA 4.0', alt: 'Lake Ashi, Mount Fuji and Hakone Shrine in the morning light', matchScore: 10 },
  { placeId: 'tokyo-in-layers', place: 'Tokyo, in layers', query: 'Shibuya Crossing in Tokyo', status: 'matched', searchedOn: today, fileTitle: 'File:Shibuya Crossing in Tokyo.jpg', imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Shibuya_Crossing_in_Tokyo.jpg?width=1400', sourcePage: 'https://commons.wikimedia.org/wiki/File:Shibuya_Crossing_in_Tokyo.jpg', photographer: 'Christophe95', license: 'CC BY-SA 4.0', alt: 'Shibuya Crossing at night in central Tokyo', matchScore: 10 }
];
for (const photo of newPhotos) {
  const index = photosData.records.findIndex(item => item.placeId === photo.placeId);
  if (index < 0) photosData.records.push(photo); else photosData.records[index] = photo;
}
photosData.matchedCount = photosData.records.filter(photo => photo.status === 'matched').length;
write(photosFile, photosData);

const photoAuditFile = 'data/photo-audit.json';
const photoAudit = read(photoAuditFile);
for (const photo of newPhotos) {
  const index = photoAudit.rows.findIndex(item => item.place === photo.place);
  const row = { place: photo.place, currentImageUrl: photo.imageUrl, sourcePage: photo.sourcePage, photographer: photo.photographer, altText: photo.alt, license: photo.license, verdict: 'CORRECT', evidence: `Wikimedia Commons identifies this place-specific photograph, its author and ${photo.license} license.`, action: 'Use with attribution and license link' };
  if (index < 0) photoAudit.rows.push(row); else photoAudit.rows[index] = row;
}
write(photoAuditFile, photoAudit);

const coverageFile = 'data/coverage-manifest.json';
const coverage = read(coverageFile);
for (const id of ['kamakura-temple-to-tide', 'hakone-through-the-mist', 'tokyo-in-layers']) {
  const row = coverage.records.find(item => item.id === id);
  if (row) row.imageStatus = 'verified';
}
write(coverageFile, coverage);

const routeFile = 'data/place-routes.json';
const routeData = read(routeFile);
const kamakuraRoute = {
  id: 'kamakura-central-to-hase-route', placeId: 'kamakura-temple-to-tide', cityId: 'destination', title: 'Kamakura: central shrine to the coastal temples', researchStatus: 'verified',
  introduction: 'Start at Kamakura Station, walk to Tsurugaoka Hachimangu Shrine, then use the Enoden or local bus to reach Hase. Visit the Great Buddha and continue on foot to Hasedera Temple. Map connectors show stop order only; follow the live transit and walking links for navigation.',
  origin: { id: 'kamakura-station', name: 'Kamakura Station', address: 'Kamakura Station, 1-1 Komachi, Kamakura, Kanagawa, Japan', coordinates: { latitude: 35.319, longitude: 139.55069, precision: 'OpenStreetMap station way center', sourceIds: ['kamakura-station-osm'] }, returnPoint: false },
  stops: [
    { id: 'kamakura-tsurugaoka', order: 1, name: 'Tsurugaoka Hachimangu Shrine', area: 'Yukinoshita, Kamakura', address: 'Tsurugaoka Hachimangu Shrine, 2-1-31 Yukinoshita, Kamakura, Japan', story: 'Walk the shrine approach from the east side of Kamakura Station. The shrine moved to its current location under Minamoto no Yoritomo and remains the historic heart of central Kamakura.', coordinates: { latitude: 35.3251836, longitude: 139.5561787, precision: 'OpenStreetMap shrine way center', sourceIds: ['kamakura-tsurugaoka-osm'] }, visitDuration: { status: 'estimated', minMinutes: 45, maxMinutes: 75, basis: 'Guide planning estimate; allow more time for the grounds and seasonal displays.' }, visitorInfo: 'The shrine grounds are open daily; check current museum hours and fees before visiting.', visitorInfoUrl: 'https://visit.trip-kamakura.com/things-to-do/tsurugaoka-hachimangu/', youtubeUrl: 'https://www.youtube.com/results?search_query=Tsurugaoka+Hachimangu+Kamakura' },
    { id: 'kamakura-great-buddha', order: 2, name: 'Great Buddha of Kamakura', area: 'Hase, Kamakura', address: 'Kotoku-in, 4-2-28 Hase, Kamakura, Kanagawa, Japan', story: 'Meet the outdoor bronze Daibutsu at Kotoku-in. The official guide notes that the former hall was destroyed, leaving the statue exposed to the sky; interior access is a separate small fee when available.', coordinates: { latitude: 35.3168482, longitude: 139.5357212, precision: 'OpenStreetMap Great Buddha node', sourceIds: ['kamakura-daibutsu-osm'] }, visitDuration: { status: 'estimated', minMinutes: 25, maxMinutes: 45, basis: 'Guide planning estimate; queues and interior access change the visit length.' }, visitorInfo: 'Adult admission is listed at ¥300; inside the statue is an additional ¥50. Confirm current hours and fees.', visitorInfoUrl: 'https://visit.trip-kamakura.com/japanheritage/english/japanheritage-en/21487.html', youtubeUrl: 'https://www.youtube.com/results?search_query=Great+Buddha+of+Kamakura+Kotoku-in' },
    { id: 'kamakura-hasedera', order: 3, name: 'Hasedera Temple, Kamakura', area: 'Hase, Kamakura', address: 'Hasedera Temple, 3-11-2 Hase, Kamakura, Kanagawa, Japan', story: 'Follow the garden paths to the eleven-faced Kannon and the lookout above Kamakura. The hillside setting makes this a natural, slower finale after the Great Buddha.', coordinates: { latitude: 35.312731522707, longitude: 139.53305267116, precision: 'Official Kamakura guide map point', sourceIds: ['kamakura-hasedera'] }, visitDuration: { status: 'estimated', minMinutes: 60, maxMinutes: 100, basis: 'Guide planning estimate for the gardens, temple buildings and lookout.' }, visitorInfo: 'Adult admission is listed at ¥400; the Kannon Museum has a separate fee. Confirm current hours and seasonal access.', visitorInfoUrl: 'https://visit.trip-kamakura.com/things-to-do/hasedera-temple/', youtubeUrl: 'https://www.youtube.com/results?search_query=Hasedera+Temple+Kamakura+travel' }
  ],
  legs: [
    { id: 'kamakura-station-to-tsurugaoka', order: 1, from: 'Kamakura Station', to: 'Tsurugaoka Hachimangu Shrine', mode: 'walking', story: 'Walk about 10 minutes from the station east exit; the shrine is reached along the central approach.', sourceIds: ['kamakura-tsurugaoka'] },
    { id: 'central-kamakura-to-hase', order: 2, from: 'Tsurugaoka Hachimangu Shrine', to: 'Great Buddha of Kamakura', mode: 'transit', story: 'Return toward Kamakura Station and take Enoden to Hase, or use a local bus toward Daibutsu-mae. Check live service and crowd conditions.', sourceIds: ['kamakura-model-route', 'kamakura-daibutsu'] },
    { id: 'great-buddha-to-hasedera', order: 3, from: 'Great Buddha of Kamakura', to: 'Hasedera Temple, Kamakura', mode: 'walking', story: 'Continue on foot between the two Hase-area sights; follow signed pedestrian routes and allow time for busy streets.', sourceIds: ['kamakura-hasedera', 'kamakura-daibutsu'] }
  ],
  timeEstimate: { label: 'About 5 to 7 hours', basis: 'Editorial day-plan estimate, including transfers, breaks and site visits; actual time varies with queues, crowds and pace.' },
  sources: [
    { id: 'kamakura-access', label: 'VISIT KAMAKURA: access and local transport', url: 'https://visit.trip-kamakura.com/access/', checkedOn: today, supports: ['rail and bus arrival', 'traffic recommendation'] },
    { id: 'kamakura-model-route', label: 'VISIT KAMAKURA: official tourist map', url: 'https://visit.trip-kamakura.com/wp/wp-content/uploads/2025/01/touristmap_english_2024.pdf', checkedOn: today, supports: ['visitor sequence and local transport links'] },
    { id: 'kamakura-tsurugaoka-osm', label: 'OpenStreetMap: Tsurugaoka Hachimangu', url: 'https://www.openstreetmap.org/way/34550401', checkedOn: today, supports: ['map point'] },
    { id: 'kamakura-daibutsu-osm', label: 'OpenStreetMap: Great Buddha', url: 'https://www.openstreetmap.org/node/260752586', checkedOn: today, supports: ['map point'] },
    { id: 'kamakura-hasedera', label: 'VISIT KAMAKURA: Hasedera Temple', url: 'https://visit.trip-kamakura.com/things-to-do/hasedera-temple/', checkedOn: today, supports: ['map point', 'site information'] }
  ]
};

const hakoneRoute = {
  id: 'hakone-mountain-and-lake-circuit', placeId: 'hakone-through-the-mist', cityId: 'destination', title: 'Hakone: mountain rail, volcanic valley and Lake Ashi', researchStatus: 'verified',
  introduction: 'Follow the official first-visit sequence: Open-Air Museum, Owakudani, ropeway to Togendai, sightseeing cruise to Motohakone and Hakone Shrine. The connectors mark visit order only; rail, cable car, ropeway, cruise, bus and walking service must be checked separately on the day.',
  origin: { id: 'hakone-yumoto-station', name: 'Hakone-Yumoto Station', address: 'Hakone-Yumoto Station, 707-1 Yumoto-shiroishishita, Hakone, Kanagawa, Japan', coordinates: { latitude: 35.23276190340037, longitude: 139.1044375304999, precision: 'Official Hakone Navi station map point', sourceIds: ['hakone-station-yumoto'] }, returnPoint: false },
  stops: [
    { id: 'hakone-open-air-museum', order: 1, name: 'Hakone Open-Air Museum', area: 'Ninotaira, Hakone', address: 'Hakone Open-Air Museum, 1121 Ninotaira, Hakone, Kanagawa, Japan', story: 'Begin with outdoor sculpture, the Picasso Pavilion and the mountain garden. The official course connects the museum from Hakone-Yumoto by Hakone Tozan train.', coordinates: { latitude: 35.2444298, longitude: 139.0504232, precision: 'Official Hakone tourism map point', sourceIds: ['hakone-open-air-museum'] }, visitDuration: { status: 'estimated', minMinutes: 90, maxMinutes: 150, basis: 'Guide planning estimate; the outdoor collection and exhibitions can take longer.' }, visitorInfo: 'Adult admission is listed at ¥2,000 at the same-day window; verify current prices and opening notices.', visitorInfoUrl: 'https://www.hakone.or.jp/534', youtubeUrl: 'https://www.youtube.com/results?search_query=Hakone+Open-Air+Museum+guide' },
    { id: 'hakone-owakudani', order: 2, name: 'Owakudani', area: 'Sengokuhara, Hakone', address: 'Owakudani Station, 1251 Sengokuhara, Hakone, Kanagawa, Japan', story: 'Transfer at Gora and Sounzan for the cable car and ropeway to Hakone’s volcanic valley. Use marked paths and follow current volcanic and weather restrictions.', coordinates: { latitude: 35.24544126044922, longitude: 139.0192271718556, precision: 'Official Hakone Navi station map point', sourceIds: ['hakone-station-owakudani'] }, visitDuration: { status: 'estimated', minMinutes: 45, maxMinutes: 75, basis: 'Guide planning estimate; access may be restricted by volcanic or weather conditions.' }, visitorInfo: 'Ropeway and valley access are subject to operating notices; check before travelling.', visitorInfoUrl: 'https://www.hakonenavi.jp/international/en/station/owakudani', youtubeUrl: 'https://www.youtube.com/results?search_query=Owakudani+Hakone+travel+guide' },
    { id: 'hakone-togendai-port', order: 3, name: 'Togendai Station and Port', area: 'Moto-Hakone, Hakone', address: 'Togendai Station and Port, 164 Moto-Hakone, Hakone, Kanagawa, Japan', story: 'Continue on the ropeway to the lake-side terminal, then board the Hakone Sightseeing Cruise toward Motohakone-ko. Check the boat timetable and weather notices.', coordinates: { latitude: 35.2379332, longitude: 138.9938522, precision: 'Official Hakone Navi station map point', sourceIds: ['hakone-station-togendai'] }, visitDuration: { status: 'estimated', minMinutes: 20, maxMinutes: 45, basis: 'Guide planning estimate for transfer and boarding; cruise departure times vary.' }, visitorInfo: 'Togendai connects the ropeway, sightseeing cruise and buses; confirm current timetable.', visitorInfoUrl: 'https://www.hakonenavi.jp/international/en/station/togendai', youtubeUrl: 'https://www.youtube.com/results?search_query=Togendai+Hakone+Lake+Ashi+cruise' },
    { id: 'hakone-shrine', order: 4, name: 'Hakone Shrine', area: 'Motohakone, Hakone', address: 'Hakone Shrine, 80-1 Motohakone, Hakone, Kanagawa, Japan', story: 'From Motohakone-ko, walk to the lakeside shrine and its cedar-lined approach. The torii beside Lake Ashi is popular, so allow time for queues and be considerate of worshippers.', coordinates: { latitude: 35.20396, longitude: 139.02557, precision: 'OpenStreetMap shrine way center', sourceIds: ['hakone-shrine'] }, visitDuration: { status: 'estimated', minMinutes: 45, maxMinutes: 75, basis: 'Guide planning estimate; queues at the lakeside torii can add time.' }, visitorInfo: 'The shrine grounds are open for worship; the treasure hall has separate hours and fees.', visitorInfoUrl: 'https://www.hakone.or.jp/554', youtubeUrl: 'https://www.youtube.com/results?search_query=Hakone+Shrine+Lake+Ashi+travel+guide' }
  ],
  legs: [
    { id: 'yumoto-to-museum', order: 1, from: 'Hakone-Yumoto Station', to: 'Hakone Open-Air Museum', mode: 'transit', story: 'Take the Hakone Tozan train to Chokoku-no-Mori Station and walk about two minutes to the museum.', sourceIds: ['hakone-one-day', 'hakone-open-air-museum'] },
    { id: 'museum-to-owakudani', order: 2, from: 'Hakone Open-Air Museum', to: 'Owakudani', mode: 'transit', story: 'Return to Gora, change to the cable car at Gora and transfer to the ropeway at Sounzan.', sourceIds: ['hakone-one-day', 'hakone-around'] },
    { id: 'owakudani-to-togendai', order: 3, from: 'Owakudani', to: 'Togendai Station and Port', mode: 'transit', story: 'Ride the Hakone Ropeway down to Togendai Station and Port.', sourceIds: ['hakone-one-day', 'hakone-station-togendai'] },
    { id: 'togendai-to-shrine', order: 4, from: 'Togendai Station and Port', to: 'Hakone Shrine', mode: 'transit', story: 'Take the sightseeing cruise across Lake Ashi to Motohakone-ko, then walk to Hakone Shrine.', sourceIds: ['hakone-one-day', 'hakone-motohakone', 'hakone-shrine'] }
  ],
  fullRouteUrl: 'https://www.google.com/maps/dir/?api=1&origin=Hakone-Yumoto+Station%2C+Hakone%2C+Japan&destination=Hakone+Shrine%2C+Motohakone%2C+Hakone%2C+Japan&travelmode=transit&waypoints=Hakone+Open-Air+Museum%7COwakudani%7CTogendai+Station+and+Port',
  timeEstimate: { label: 'About 7 to 9 hours', basis: 'Editorial full-day estimate following the official one-day sequence; queues, transfers, weather and service frequency change the total.' },
  sources: [
    { id: 'hakone-one-day', label: 'Hakone Navi: first-time one-day itinerary', url: 'https://www.hakonenavi.jp/international/en/course/244', checkedOn: today, supports: ['official stop sequence and transport changes'] },
    { id: 'hakone-around', label: 'Hakone Navi: transport guide', url: 'https://www.hakonenavi.jp/international/en/around', checkedOn: today, supports: ['train, cable car, ropeway and cruise connections'] },
    { id: 'hakone-station-owakudani', label: 'Hakone Navi: Owakudani station map', url: 'https://www.hakonenavi.jp/international/en/station/owakudani', checkedOn: today, supports: ['route map point'] },
    { id: 'hakone-station-togendai', label: 'Hakone Navi: Togendai station and port map', url: 'https://www.hakonenavi.jp/international/en/station/togendai', checkedOn: today, supports: ['route map point'] },
    { id: 'hakone-open-air-museum', label: 'Hakone Town Tourism Association: Open-Air Museum', url: 'https://www.hakone.or.jp/534', checkedOn: today, supports: ['museum access and map point'] },
    { id: 'hakone-shrine', label: 'OpenStreetMap: Hakone Shrine', url: 'https://www.openstreetmap.org/way/553740875', checkedOn: today, supports: ['route stop map point'] }
  ]
};

for (const route of [kamakuraRoute, hakoneRoute]) {
  const index = routeData.routes.findIndex(item => item.placeId === route.placeId);
  if (index >= 0) routeData.routes[index] = route; else routeData.routes.push(route);
  const coords = [route.origin.coordinates, ...route.stops.map(stop => stop.coordinates)].map(point => [point.latitude, point.longitude]);
  const features = [];
  let previous = [route.origin.coordinates.latitude, route.origin.coordinates.longitude];
  route.stops.forEach((stop, index) => {
    const current = [stop.coordinates.latitude, stop.coordinates.longitude];
    const leg = route.legs[index];
    features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: [[previous[1], previous[0]], [current[1], current[0]]] }, properties: { routeLegId: leg.id, mode: leg.mode, routeGeometryStatus: 'schematic' } });
    features.push({ type: 'Feature', id: stop.id, geometry: { type: 'Point', coordinates: [current[1], current[0]] }, properties: { id: stop.id, routeStopId: stop.id, order: stop.order, name: stop.name, role: 'stop' } });
    previous = current;
  });
  features.unshift({ type: 'Feature', id: route.origin.id, geometry: { type: 'Point', coordinates: [route.origin.coordinates.longitude, route.origin.coordinates.latitude] }, properties: { id: route.origin.id, routeStopId: route.origin.id, name: route.origin.name, role: 'origin', returnPoint: false, order: null } });
  const lats = coords.map(point => point[0]), lons = coords.map(point => point[1]);
  routeData.maps[route.placeId] = { type: 'FeatureCollection', metadata: { geometryStatus: 'schematic-stop-order', bounds: [Math.min(...lons) - 0.002, Math.min(...lats) - 0.002, Math.max(...lons) + 0.002, Math.max(...lats) + 0.002], attribution: 'Map data © OpenStreetMap contributors', license: 'ODbL-1.0', sourceUrl: 'https://www.openstreetmap.org/copyright' }, features };
}
routeData.routes.sort((a, b) => a.placeId.localeCompare(b.placeId));
write(routeFile, routeData);

const appFile = path.join(root, 'app.js');
let app = fs.readFileSync(appFile, 'utf8');
const insertBefore = "  'Tokyo Disney Resort': {";
const spotlightEntries = `  'Kamakura, temple to tide': {\n    address:'Kamakura Station, Kanagawa, Japan', officialUrl:'https://visit.trip-kamakura.com/access/', phone:'+81-467-22-3350',\n    story:${JSON.stringify(kamakuraStory)}, access:'Take JR to Kamakura Station, then connect by Enoden, local bus and walking for the Hase area. The official guide recommends public transport because roads near popular sights are congested.',\n    points:['Tsurugaoka Hachimangu Shrine','Great Buddha of Kamakura','Hasedera Temple, Kamakura','Kamakura Station','Enoden Hase Station']\n  },\n  'Hakone through the mist': {\n    address:'Hakone-Yumoto Station, Kanagawa, Japan', officialUrl:'https://www.hakonenavi.jp/international/en/course/244', phone:'+81-460-85-5700',\n    story:${JSON.stringify(hakoneStory)}, access:'Follow the Hakone Tozan railway, cable car, ropeway and Lake Ashi cruise; use a local bus for the return to Hakone-Yumoto. Check operator service notices before departure.',\n    points:['Hakone Open-Air Museum','Owakudani','Togendai Station and Port','Hakone Shrine','Hakone-Yumoto Station']\n  },\n  'Tokyo, in layers': {\n    address:'Tokyo Station, Tokyo, Japan', officialUrl:'https://www.gotokyo.org/en/story/walks-and-tours/best-of-tokyo/index.html',\n    story:${JSON.stringify(tokyoStory)}, access:'Narita and Haneda connect to Tokyo by train, bus and taxi. Within the city, use JR, Tokyo Metro, Toei Subway and private rail; choose a district pair before planning transfers.',\n    points:['Asakusa','Tokyo Station and Marunouchi','Meiji Jingu and Harajuku','Shibuya']\n  },\n`;
if (!app.includes("'Kamakura, temple to tide':")) {
  app = app.replace(insertBefore, `${spotlightEntries}${insertBefore}`);
  fs.writeFileSync(appFile, app, 'utf8');
}

const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sourceLink = (label, href) => `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
const imageCredits = {
  'kamakura-temple-to-tide': { url: kamakura.photo.url, source: kamakura.photo.source, credit: 'P. Hughes', license: 'CC-BY-SA-4.0', alt: kamakura.photo.alt },
  'hakone-through-the-mist': { url: hakone.photo.url, source: hakone.photo.source, credit: 'Charlie Fong', license: 'CC-BY-SA-4.0', alt: hakone.photo.alt },
  'tokyo-in-layers': { url: tokyo.photo.url, source: tokyo.photo.source, credit: 'Christophe95', license: 'CC-BY-SA-4.0', alt: tokyo.photo.alt }
};
const guideConfigs = {
  'kamakura-temple-to-tide': { record: kamakura, name: 'Kamakura, temple to tide', desc: 'A source-backed day guide from Tsurugaoka Hachimangu to the Great Buddha and Hasedera, with Enoden, bus and rail access.', route: kamakuraRoute, order: ['Tsurugaoka Hachimangu Shrine', 'Great Buddha of Kamakura', 'Hasedera Temple, Kamakura'] },
  'hakone-through-the-mist': { record: hakone, name: 'Hakone through the mist', desc: 'A full-day Hakone circuit from the Open-Air Museum to Owakudani, across Lake Ashi and up to Hakone Shrine.', route: hakoneRoute, order: ['Hakone Open-Air Museum', 'Owakudani', 'Togendai Station and Port', 'Hakone Shrine'] },
  'tokyo-in-layers': { record: tokyo, name: 'Tokyo, in layers', desc: 'A district-first Tokyo guide with official rail, airport and seasonal planning for Asakusa, central Tokyo, Harajuku and Shibuya.', route: null, order: ['Asakusa', 'Tokyo Station and Marunouchi', 'Meiji Jingu and Harajuku', 'Shibuya'] }
};

for (const [id, config] of Object.entries(guideConfigs)) {
  const file = path.join(root, 'places', id, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  const photo = imageCredits[id];
  const route = config.route;
  html = html.replace(/<meta name="description" content="[^"]*">/i, `<meta name="description" content="${esc(config.desc)}">`);
  html = html.replace(/<p class="jg-lede">[\s\S]*?<\/p>/i, `<p class="jg-lede">${esc(config.record.story)}</p>`);
  html = html.replace(/<header class="jg-hero">([\s\S]*?)<\/header>/i, (_whole, body) => {
    const withoutFigure = body.replace(/<figure[\s\S]*?<\/figure>/i, '');
    const figure = `<figure><img data-photo-verified="true" data-photo-source="${esc(photo.source)}" data-photo-credit="${esc(photo.credit)}" data-photo-license="${esc(photo.license)}" data-photo-alt="${esc(photo.alt)}" src="${esc(photo.url)}" alt="${esc(photo.alt)}" loading="eager" decoding="async"><figcaption>Photo: ${esc(photo.credit)} · ${esc('CC BY-SA 4.0')} · ${sourceLink('source and license', photo.source)}</figcaption></figure>`;
    return `<header class="jg-hero">${withoutFigure}${figure}</header>`;
  });
  const pointList = config.record.points.map(point => `<li><strong>${esc(point.name)}</strong><p>${esc(point.description)}</p><a href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(`${point.name}, Japan`)}" target="_blank" rel="noopener noreferrer">Open this place in Google Maps ↗</a></li>`).join('');
  const routeSequence = config.order.map((name, index) => `<li><span class="jg-step-number">${index + 1}</span><div><strong>${esc(name)}</strong><p>${esc(config.record.points.find(point => point.name === name)?.description || 'A district to explore at your own pace; confirm site details before travel.')}</p></div></li>`).join('');
  const routeSources = config.record.sources.filter(source => !source.id.includes('photo') && !source.id.includes('-osm')).slice(0, 8).map(source => `<li>${sourceLink(source.title, source.url)}</li>`).join('');
  const storySection = `<section class="jg-section" id="story"><p class="jg-kicker">A CLOSER LOOK</p><h2>Why this place stays with you</h2><p>${esc(config.record.story)}</p><h3>Places to linger</h3><ul class="jg-highlight-list">${pointList}</ul><h3>A thoughtful order for the day</h3><ol class="jg-route-sequence">${routeSequence}</ol></section>`;
  html = html.replace(/<section class="jg-section" id="story">[\s\S]*?<\/section>/i, storySection);
  const routeIntro = route ? route.introduction : 'Tokyo is too large for one honest all-city walking route. Use this map as a central-area reference, then build each day around one connected district pair and use live transit directions between neighborhoods.';
  if (route) html = html.replace(/(<section class="jg-section" id="route">[\s\S]*?<h2>)[\s\S]*?(<\/h2>)[\s\S]*?(<div data-place-route-guide)/i, `$1${esc(config.name)} · visit order$2<p>${esc(routeIntro)}</p><p class="jg-note"><strong>Route timing:</strong> ${esc(route.timeEstimate.label)}. ${esc(route.timeEstimate.basis)} Connectors show stop order, not a measured path.</p>$3`);
  const travelInfo = `<section class="jg-section jg-grid" id="arrival"><div><p class="jg-kicker">GETTING THERE</p><h2>Choose the right arrival</h2><p>${esc(config.record.access)}</p><p class="jg-small">${esc(config.record.visitPlan)}</p><h3>Official planning links</h3><ul>${routeSources}</ul><a class="jg-btn jg-light" href="https://www.google.com/maps/dir/?api=1&amp;destination=${encodeURIComponent(`${config.name}, Japan`)}&amp;travelmode=transit" target="_blank" rel="noopener noreferrer">Train and public transport ↗</a><a class="jg-btn jg-light" href="https://www.google.com/maps/dir/?api=1&amp;destination=${encodeURIComponent(`${config.name}, Japan`)}&amp;travelmode=driving" target="_blank" rel="noopener noreferrer">By car ↗</a><a class="jg-btn jg-light" href="https://www.youtube.com/results?search_query=${encodeURIComponent(`${config.name} Japan travel guide`)}" target="_blank" rel="noopener noreferrer">Watch visitor videos ↗</a></div><aside><div class="jg-fact"><strong>SEASON & CONDITIONS</strong>${esc(config.record.seasonality)}</div><div class="jg-fact"><strong>CONTACT FOR LOCAL HELP</strong>${config.record.contacts.map(contact => `${esc(contact.name)}<br><a href="tel:${esc(contact.phone)}">${esc(contact.phone)}</a>`).join('<br>')}</div><div class="jg-fact"><strong>WHERE TO STAY</strong>${config.record.stayRecommendations.map(stay => `<p><b>${esc(stay.name)}</b> — ${esc(stay.area)}</p>`).join('')}</div><div class="jg-fact"><strong>FEES & VISIT TIME</strong>${esc(config.record.costs[0]?.note || config.record.visitPlan)}</div></aside></section>`;
  html = html.replace(/<section class="jg-section jg-grid" id="arrival">[\s\S]*?<\/section>/i, travelInfo);
  html = html.replace(/class="guide-version">v\d+\.\d+/g, 'class="guide-version">v1.7');
  html = html.replace(/Return to Explore Japan · v\d+\.\d+/g, 'Return to Explore Japan · v1.7');
  html = html.replace(/\.jg-footer\{/i, '.jg-highlight-list,.jg-route-sequence{padding-left:1.25rem}.jg-highlight-list li,.jg-route-sequence li{margin:1rem 0}.jg-route-sequence{list-style:none;padding:0}.jg-route-sequence li{display:grid;grid-template-columns:2.25rem 1fr;gap:.8rem;align-items:start}.jg-step-number{display:grid;place-items:center;width:2rem;height:2rem;border-radius:50%;background:#164f43;color:white;font-weight:700}.jg-footer{');
  fs.writeFileSync(file, html, 'utf8');
}

// Publish the same release label across the catalogue and the guide generator.
function bumpVersions(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (!['vendor', 'node_modules', '.git'].includes(entry.name)) bumpVersions(file); continue; }
    if (!/\.(?:html|js|mjs|cjs)$/i.test(entry.name)) continue;
    const original = fs.readFileSync(file, 'utf8');
    const updated = original.replace(/v1\.5/g, 'v1.7');
    if (updated !== original) fs.writeFileSync(file, updated, 'utf8');
  }
}
bumpVersions(root);

console.log(JSON.stringify({ updatedGuides: Object.keys(guideConfigs), routes: [kamakuraRoute.id, hakoneRoute.id], version: 'v1.7' }, null, 2));
