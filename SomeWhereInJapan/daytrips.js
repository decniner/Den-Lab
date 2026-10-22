(function (root) {
  'use strict';
  const checkedOn = '2026-10-22';
  const src = {
    kawagoe: ['https://koedo.or.jp/access/', 'https://www.tobu.co.jp/campaign/use-pasmo/', 'https://www.koedo.or.jp/en/route/%E5%9F%8E%E4%B8%8B%E7%94%BA%E3%83%BB%E5%B7%9D%E8%B6%8A-%E6%AD%B4%E5%8F%B2%E3%82%81%E3%81%90%E3%82%8A%E3%82%B3%E3%83%BC%E3%82%B9/', 'https://koedo.or.jp/en/spot_007/', 'https://koedo.or.jp/wp-content/uploads/KAWAGOE-Sightseeing-Map-Eng.pdf'],
    sawara: ['https://www.kantetsu.co.jp/highwaybus/hokota-tokyo', 'https://www.city.katori.lg.jp/sightseeing/multilingual/en/en-season/en-sawara/en-s_midokoro/Float_Museum.html', 'https://www.city.katori.lg.jp/sightseeing/museum/en/guide.html', 'https://www.city.katori.lg.jp/sightseeing/multilingual/en/en-machinami.html', 'https://www.city.katori.lg.jp/sightseeing/multilingual/en/en-taiken.html'],
    mitake: ['https://www.mitaketozan.co.jp/timetable.html', 'https://www.mitaketozan.co.jp/ti_modelcourse.html', 'https://www.nisitokyobus.co.jp/rosen/noriba/mitake.html', 'https://www.nisitokyobus.co.jp/rosen/pocket.html', 'https://www.city.ome.tokyo.jp/uploaded/attachment/47177.pdf'],
    narita: ['https://www.naritasan.or.jp/access/', 'https://www.naritasan.or.jp/tour/map/', 'https://www.naritasan.or.jp/tour/other/', 'https://www.naritasan.or.jp/contact/'],
    odawara: ['https://odawaracastle.com/info/', 'https://odawaracastle.com/access/', 'https://www.city.odawara.kanagawa.jp/kanko/service/tetudo.html']
  };
  const season = (months, text) => Object.fromEntries(months.map((m) => [m, text]));
  const profile = (hMin, hMax, tMin, tMax, cMin, cMax, arrival, stops, sources, breakdown = {}, completeBudget = false, timeBudget = null) => {
    const costBreakdown = completeBudget ? breakdown : null;
    const costYen = completeBudget ? {
      min: Object.values(costBreakdown).reduce((sum, part) => sum + part.min, 0),
      max: Object.values(costBreakdown).reduce((sum, part) => sum + part.max, 0)
    } : null;
    return {
      roundTripHours: { min: hMin, max: hMax }, totalHours: timeBudget ? {
        min: Object.values(timeBudget).reduce((sum, part) => sum + part.min, 0),
        max: Object.values(timeBudget).reduce((sum, part) => sum + part.max, 0)
      } : { min: tMin, max: tMax }, timeBudget, costYen, costBreakdown,
      estimateStatus: completeBudget ? 'complete' : 'incomplete',
      estimateNote: completeBudget ? 'Tokyo Station origin; direct Tokyo-Sawara coach return, listed museum combination ticket and meal allowance. Duration is a planning range, not a date-specific timetable.' : 'Cost and detailed duration components are incomplete: one or more required transport legs, local transfers, admissions or activity-time components has not been verified.',
      arrival, stops, sources
    };
  };
  const publicOnly = (half, full) => ({ public: { profiles: Object.assign({}, half ? { half } : {}, full ? { full } : {}) } });
  const DAY_TRIPS = [
    {
      id: 'kawagoe', slug: 'kawagoe', name: 'Kawagoe', subtitle: 'A castle town that kept its old street plan', region: 'Saitama · Kanto', months: [1,2,3,4,5,6,9,10,11,12], interests: ['culture','food'],
      seasonFit: season([1,2,3,4,5,6,9,10,11,12], 'The historic center is walkable year-round; spring and autumn are usually more comfortable for a long street-to-street stroll.'),
      effort: 'Easy, mostly level city walking; expect several kilometres on mixed pavement.', tradeoff: 'The old streets can feel busy on weekends and holidays; arrive early for a calmer first hour.',
      arrival: 'Kawagoe Station (Tobu Tojo Line) or Hon-Kawagoe Station (Seibu Shinjuku Line).', checkedOn,
      image: { url: 'https://commons.wikimedia.org/wiki/Special:FilePath/TokiNoKane_Kawagoe_2013Feb.JPG?width=1400', credit: 'Kentagon / Wikimedia Commons', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:TokiNoKane_Kawagoe_2013Feb.JPG' },
      modes: publicOnly(
        profile(1.5,2.1,4.5,6,2480,3480,'Kawagoe Station; walk about 20 minutes to the historic center.',['Kurazukuri Street','Toki no Kane bell tower','Kashiya Yokocho'],src.kawagoe,{transport:{min:980,max:980},admissions:{min:0,max:0},meal:{min:1500,max:2500}}),
        profile(1.5,2.1,6.5,8,2480,3480,'Kawagoe Station; walk to the historic center and Honmaru Goten.',['Kawagoe Castle Honmaru Goten','Kurazukuri Street','Toki no Kane','Kashiya Yokocho'],src.kawagoe,{transport:{min:980,max:980},admissions:{min:0,max:0},meal:{min:1500,max:2500}})
      ), sources: src.kawagoe
    },
    {
      id:'sawara', slug:'sawara', name:'Sawara', subtitle:'Canal-side merchant streets on the old Tone waterway', region:'Chiba · Kanto', months:[3,4,5,6,7,9,10,11], interests:['culture','food'],
      seasonFit:season([3,4,5,6,7,9,10,11],'The historic district works in most seasons; July and October festival periods bring extra atmosphere and heavier crowds.'), effort:'Easy town walking, with uneven historic paving in places.',tradeoff:'Direct highway buses are limited each day. Reserve around the published return departure; missing it can disrupt the return plan.',arrival:'Sawara (Suigo Sawara) highway-bus stop or JR Sawara Station.',checkedOn,
      image:{url:'',credit:'Editorial typography fallback',license:'No external image asset used'},
      modes:publicOnly(null,profile(2.6,3.4,8,10.5,6100,7100,'Sawara (Suigo Sawara) bus stop; the historic center is a short walk away.',['Ono River and Chukei Bridge','Sawara Machiya-kan','Suigo Sawara Float Museum','Inoh Tadataka Museum and former residence'],src.sawara,{transport:{min:3800,max:3800},admissions:{min:800,max:800},meal:{min:1500,max:2500}},true,{'Travel (coach and transfers)':{min:2.6,max:3.4},walking:{min:1,max:1.5},visiting:{min:3,max:3.6},meal:{min:1,max:1},buffer:{min:0.4,max:1}})),sources:src.sawara
    },
    {
      id:'mitake',slug:'mitake',name:'Mount Mitake',subtitle:'A shrine village above the forested Ome valley',region:'Tokyo · Kanto',months:[4,5,6,7,8,9,10,11],interests:['nature','culture'],
      seasonFit:season([4,5,6,7,8,9,10,11],'The mountain is seasonal: check cable-car and bus service before departure, and avoid exposed trails in storms, ice, or extreme heat.'),effort:'Moderate to strenuous if continuing to Rock Garden; steep, unpaved sections and stairs. Wear grippy shoes and carry water.',tradeoff:'The final trail is weather-sensitive and requires more walking than the cable-car ride suggests.',arrival:'Mitake Station, then Nishi Tokyo Bus to Cable-shita and the Takimoto cable-car station.',checkedOn,
      image:{url:'',credit:'Editorial typography fallback',license:'No external image asset used'},
      modes:publicOnly(null,profile(4.3,5.2,8,11,6040,7040,'Takimoto cable-car station, reached by bus from JR Mitake Station.',['Takimoto cable-car station','Mitake Shrine approach','Musashi Mitake Shrine','Rock Garden (optional long trail)'],src.mitake,{transport:{min:4540,max:4540},admissions:{min:0,max:0},meal:{min:1500,max:2500}})),sources:src.mitake
    },
    {
      id:'narita',slug:'narita',name:'Naritasan & Narita Omotesando',subtitle:'A temple approach made for wandering and a proper lunch',region:'Chiba · Kanto',months:[1,2,3,4,5,6,7,8,9,10,11,12],interests:['culture','food'],
      seasonFit:season([1,2,3,4,5,6,7,8,9,10,11,12],'Open year-round; New Year draws especially large worshipper crowds. Summer afternoons can be hot on the approach street.'),effort:'Easy to moderate; Omotesando is gently sloped and the temple grounds include stairs.',tradeoff:'The temple is free to enter, but some halls and museums have separate hours or admission; check the official calendar.',arrival:'JR Narita Station or Keisei Narita Station; follow Omotesando for about 10 minutes to the temple.',checkedOn,
      image:{url:'',credit:'Editorial typography fallback',license:'No external image asset used'},
      modes:publicOnly(
        profile(2.3,3,5,6,3960,4960,'JR or Keisei Narita Station.',['Narita Omotesando','Naritasan Shinshoji Main Hall','Naritasan Park'],src.narita,{transport:{min:2460,max:2460},admissions:{min:0,max:0},meal:{min:1500,max:2500}}),
        profile(2.3,3,7,9,4760,5760,'JR or Keisei Narita Station.',['Narita Omotesando','Naritasan Shinshoji','Naritasan Park','Naritasan Calligraphy Museum'],src.narita,{transport:{min:2460,max:2460},admissions:{min:800,max:800},meal:{min:1500,max:2500}})
      ),sources:src.narita
    },
    {
      id:'odawara',slug:'odawara',name:'Odawara Castle & old town',subtitle:'A samurai-era stronghold with the sea close by',region:'Kanagawa · Kanto',months:[1,2,3,4,5,6,7,8,9,10,11,12],interests:['culture','food'],
      seasonFit:season([1,2,3,4,5,6,7,8,9,10,11,12],'The castle grounds are open all year; spring blossom season is popular, while summer brings heat and sun exposure.'),effort:'Easy town walk with some stairs inside the castle tower; step-free access to the keep is limited.',tradeoff:'Weekend roads and parking can be congested; the official castle recommends arriving by public transport.',arrival:'Odawara Station; the castle entrance is about a 10-minute walk.',checkedOn,
      image:{url:'https://commons.wikimedia.org/wiki/Special:FilePath/Odawara_Castle.jpg?width=1400',credit:'ZAC / Wikimedia Commons',license:'CC BY 2.0',source:'https://commons.wikimedia.org/wiki/File:Odawara_Castle.jpg'},
      modes:publicOnly(
        profile(2.6,3.2,5.5,6,5480,6480,'Odawara Station; walk around 10 minutes to the castle.',['Odawara Station','Umadashi Gate and castle moat','Odawara Castle keep','Castle town shopping streets'],src.odawara,{transport:{min:2980,max:2980},admissions:{min:1000,max:1000},meal:{min:1500,max:2500}}),
        profile(2.6,3.2,7,9,5480,6480,'Odawara Station; walk around 10 minutes to the castle.',['Odawara Station','Umadashi Gate and castle moat','Castle keep and Samurai Museum','Odawara Castle Park','Castle town shopping streets'],src.odawara,{transport:{min:2980,max:2980},admissions:{min:1000,max:1000},meal:{min:1500,max:2500}})
      ),sources:src.odawara
    }
  ];
  const image = (file, author, license, source) => ({ url: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1600`, credit: `${author} / Wikimedia Commons`, license, source });
  const route = (stops, rainPlan) => ({ stops, rainPlan });
  const stop = (name, address, lat, lon, walk, duration, story, mapsQuery = name + ', Japan') => ({ name, address, lat, lon, walk, duration, story, maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`, walkMap: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsQuery)}&travelmode=walking` });
  const routeGuides = {
    kawagoe: route([
      stop('Kawagoe Station · west exit', '2-22 Wakitahoncho, Kawagoe, Saitama', 35.9075, 139.4826, 'Begin here · loop bus stop 2 is at the west exit', '15–25 min transfer toward the castle', 'The station is the practical gateway; choose the loop bus or plan a long, level walk. The city tourism map identifies the loop route and its historic stops.'),
      stop('Kawagoe Castle Honmaru Goten', '2-13-1 Kuruwa-machi, Kawagoe, Saitama 350-0053', 35.9226, 139.4909, 'From station: loop bus, then short walk', '45–60 min', 'This surviving palace building gives the day its human scale: rooms and corridors, rather than a reconstructed skyline, show how a castle household was arranged.', 'Kawagoe Castle Honmaru Goten, 2-13-1 Kuruwa-machi, Kawagoe'),
      stop('Kurazukuri old town · Ichibangai', 'Saiwaicho, Kawagoe, Saitama', 35.9232, 139.4829, 'From Honmaru Goten: about 20 min on foot; bus is an option', '60–90 min', 'The thick-walled merchant storehouses made trade and protection part of the street architecture. Look above the shopfronts: the rooflines and fire-resistant walls are the point of this walk.', 'Kawagoe Kurazukuri Street, Saiwaicho'),
      stop('Toki no Kane · Bell of Time', '15-7 Saiwaicho, Kawagoe, Saitama', 35.9235, 139.4833, 'A short walk within the old town', '15–25 min', 'The tower has announced the hour here since the early Edo period. Its bell still rings four times daily; pause long enough to hear a working town landmark, not just photograph it.', 'Toki no Kane bell tower, Kawagoe'),
      stop('Kashiya Yokocho · Penny Candy Lane', 'Motomachi, Kawagoe, Saitama', 35.9251, 139.4818, 'About 5–8 min from the bell tower', '30–45 min', 'A compact lane of traditional sweets and rice crackers makes a natural final stop. Shops are independent, so opening times vary.', 'Kashiya Yokocho, Kawagoe')
    ], 'Rain or a tiring day: keep Honmaru Goten, then use the loop bus to the old-town area; prioritize the covered Kawagoe Festival Museum if it is open, and shorten the open-air street loop. Check each museum’s own calendar.'),
    sawara: route([
      stop('Sawara Station · south exit', 'I-1940, Sawara, Katori, Chiba', 35.8946, 140.4941, 'Bus stop is at the south exit; the historic district is about 10–15 min on foot', '10–15 min', 'The highway bus reaches the south side of the station area. Confirm the current direction and return time before leaving Tokyo: the direct service runs only a small number of trips each day.', 'Sawara Station south exit, Katori, Chiba'),
      stop('Ono River · Chukei Bridge', 'Sawara I, Katori, Chiba', 35.8896, 140.4932, 'Follow the station-to-old-town streets', '45–60 min', 'Water once carried goods between this merchant town and Edo. The preserved riverfront makes that commercial history legible in the bridges, quays and shop fronts.', 'Chukei Bridge, Sawara'),
      stop('Sawara historic district · riverside streets', 'Sawara I, Katori, Chiba', 35.8897, 140.4924, 'Continue along the river; historic paving can be uneven', '45–75 min', 'This is a living preservation district. Read the facades from the street and leave doorways and private thresholds clear.', 'Sawara historic district Ono River, Katori'),
      stop('Suigo Sawara Float Museum', 'I-3368 Sawara, Katori, Chiba', 35.8894, 140.4967, 'Around 8–12 min from Chukei Bridge', '45–60 min', 'Two festival floats are exhibited inside the Yasaka Shrine precinct. A panoramic festival film before the galleries connects the carved details to the scale and sound of the procession.', 'Suigo Sawara Float Museum, Katori'),
      stop('Inoh Tadataka Museum & former residence', 'I-1722-1 Sawara, Katori, Chiba', 35.8895, 140.4912, 'Walk back toward the canal; allow 5–10 min between sites', '45–60 min', 'Tadataka began surveying Japan in his mid-fifties. The museum and preserved home make the town’s connection to the first modern national maps tangible.', 'Inoh Tadataka Museum, Katori')
    ], 'Rain: concentrate on the Float Museum and Inoh Tadataka Museum / former residence. They are separate venues with different calendars; Inoh Museum hours are 09:00–16:30 and it closes most Mondays. Leave a generous buffer for the preselected return bus.'),
    mitake: route([
      stop('JR Mitake Station · bus stop 1', 'Mitake, Ome, Tokyo', 35.8014, 139.1839, 'Board Nishi Tokyo Bus Mitake-bound stop 1 for Cable-shita', '10 min bus · confirm day-of timetable', 'The bus stop is outside the station; the operator lists the Cable-shita service at stand 1. Match the bus arrival to the cable-car timetable before setting off.', 'JR Mitake Station bus stop 1, Ome'),
      stop('Takimoto Station · cable-car base', 'Mitake, Ome, Tokyo', 35.7827, 139.1504, 'From Cable-shita stop: short uphill walk', '6 min cable car; allow 20–30 min with queue', 'The cable car climbs from the valley to the mountain village in about six minutes. Weather and operating changes can alter the day; check the operator before departure.', 'Takimoto Station Mitake Cable Car'),
      stop('Mitakesan Station & Mitake-daira', 'Mitake, Ome, Tokyo', 35.7813, 139.1488, 'Cable-car arrival; lookout is adjacent', '15–25 min', 'Pause at the upper station before choosing the shrine walk or longer trail. This is the useful decision point for weather, energy and return timing.', 'Mitakesan Station, Ome'),
      stop('Musashi Mitake Shrine · approach and steps', '176 Mitakesan, Ome, Tokyo', 35.7828, 139.1452, 'About 30 min each way from upper station; final shrine approach has roughly 330 steps', '60–90 min return from station', 'The shrine village includes old pilgrimage lodgings and a long stone stair. The walk itself is part of the visit; it is not a step-free mountain attraction.', 'Musashi Mitake Shrine, 176 Mitakesan, Ome'),
      stop('Rock Garden · optional trail', 'Mitakesan, Ome, Tokyo', 35.7898, 139.1396, 'Continue from the shrine; rough, unpaved mountain trail', '3–4 h circuit; add only with daylight and suitable conditions', 'The operator describes a 1.5 km streamside section between Nanayo Falls and Ayahiro Falls. Mud, roots and stairs make this an optional hiking day, not an easy extension.', 'Mitake Rock Garden Ayahiro Falls, Ome')
    ], 'Rain, ice, heat alert or limited mobility: skip Rock Garden. Choose the short shrine-and-lookout outing only if the cable car and bus are running safely; otherwise visit the Gyokudo Art Museum near JR Mitake Station (check its Monday closure) or reschedule.'),
    narita: route([
      stop('JR Narita Station · east exit', 'Hanazaki-cho, Narita, Chiba', 35.7774, 140.3138, 'Follow the signed Omotesando approach', '10 min walk to temple gate', 'JR and Keisei stations sit close to the old approach. Use the one that matches your return train; do not confuse city Narita with the airport station.', 'JR Narita Station, Chiba'),
      stop('Narita Omotesando', 'Nakamachi, Narita, Chiba', 35.7796, 140.3159, 'Walk north along the sloping approach street', '30–60 min at a relaxed pace', 'This is a town street as much as a temple approach: small shops, food and eel restaurants line the descent toward the temple. Shop opening hours vary.', 'Narita Omotesando, Chiba'),
      stop('Naritasan Shinsho-ji · Main Hall', '1 Narita, Narita, Chiba 286-0023', 35.7868, 140.3182, 'Continue from the gate into the temple precinct', '45–75 min', 'The layered precinct rewards a slower visit: pass the gate, look back at the approach, then give the main hall time before climbing further into the grounds.', 'Naritasan Shinsho-ji Main Hall, 1 Narita'),
      stop('Three-storied Pagoda & temple halls', '1 Narita, Narita, Chiba', 35.7855, 140.3184, 'Short internal walk from the main hall', '20–35 min', 'The richly painted pagoda is one of the precinct’s visual anchors. Follow the official precinct map to understand how the halls relate rather than treating them as isolated photo stops.', 'Three storied pagoda Naritasan Shinsho-ji'),
      stop('Naritasan Park · waterfall and garden', '1 Narita, Narita, Chiba', 35.7844, 140.3198, 'Continue behind the halls; paths include slopes and stairs', '30–60 min', 'The temple’s large park changes with the seasons, with ponds, paths and Yuhino Falls. In rain, avoid slippery steps and keep to the paved precinct.', 'Naritasan Park, 1 Narita')
    ], 'Rain: use the covered temple halls and shorten the park loop; surfaces and stairs can be slippery. Call the temple office for access questions. The Shodo Museum is a separate, paid venue with its own weekday closure and exhibition calendar.'),
    odawara: route([
      stop('Odawara Station · east exit', '1-1 Sakaecho, Odawara, Kanagawa', 35.2564, 139.1551, 'Follow Ohoribata-dori toward the castle', '10 min walk to the main approach', 'Several rail lines meet here. The conventional Tokaido Line is the lower-cost reference; the Shinkansen is faster at a higher fare. Choose before comparing the day estimate.', 'Odawara Station east exit'),
      stop('Ohoribata-dori & Umadashi Gate', 'Jonai, Odawara, Kanagawa', 35.2519, 139.1536, 'Follow the official approach route from the station', '15–25 min', 'Enter through the formal approach: moat, bridge and gates reveal the defensive sequence before the keep appears. The castle identifies this as the regular entry route.', 'Umadashi Gate Odawara Castle'),
      stop('Odawara Castle keep', '6-1 Jonai, Odawara, Kanagawa', 35.2508, 139.1535, 'Continue through the park toward the main keep', '60–90 min', 'Inside, the museum uses armor, maps and documents to tell the region’s history; the upper floor opens toward Sagami Bay on clear days. The keep ticket also admits the Samurai Museum.', 'Odawara Castle keep, 6-1 Jonai'),
      stop('Tokiwagi Gate Samurai Museum', 'Castle park, Jonai, Odawara', 35.2515, 139.1537, 'Short walk inside the castle park', '25–40 min', 'Pair the exhibits with the gate outside: the shared castle ticket lets visitors connect objects and armor to the defensive architecture they just crossed.', 'Tokiwagi Gate Samurai Museum, Odawara'),
      stop('Castle park & return toward station', 'Jonai, Odawara, Kanagawa', 35.2523, 139.1542, 'Return by the signed park exits toward Ohoribata-dori', '30–60 min', 'Leave time to walk the moat and historic approach back toward the station. The official site notes that weekend roads are congested and the park has no general parking lot.', 'Odawara Castle Park, Kanagawa')
    ], 'Rain: shorten the moat and park loop, then spend more time in the keep and Samurai Museum if open. Castle tower access involves stairs and has limits for step-free visitors; check accessibility with the operator before committing.' )
  };
  const shortPlans = {
    kawagoe: { duration: '4.5–6 hours from Tokyo Station', route: 'Take the local bus or walk from Kawagoe Station, then focus on Kurazukuri Street, Toki no Kane and Kashiya Yokocho.', omitted: 'Leave Honmaru Goten for a longer day; check its calendar before making it the anchor of a separate visit.' },
    sawara: { duration: 'A compressed visit is not a reliable half-day from Tokyo', route: 'The direct coach runs only a few times a day and the round trip itself takes about 2.6–3.4 hours. If the published times allow, choose the canal and one museum.', omitted: 'Do not try to fit both museums, a boat ride and the old town into a short window. Fix the return coach first; if its schedule leaves too little time, choose another outing.' },
    mitake: { duration: 'About 6–8 hours from Tokyo Station, before the Rock Garden', route: 'Use the train, bus and cable car, then visit Mitake-daira and Musashi Mitake Shrine.', omitted: 'Skip the Rock Garden circuit: it adds several hours on steep, unpaved trails and is a separate hiking commitment.' },
    narita: { duration: '5–6 hours from Tokyo Station', route: 'Walk Omotesando to the Main Hall and pagoda, then return to the station.', omitted: 'Leave the longer park loop and separate paid museums for another visit; keep time for the sloping approach and your chosen return train.' },
    odawara: { duration: '5.5–6 hours from Tokyo Station', route: 'Walk the formal approach, visit the castle keep and Samurai Museum, then return to Odawara Station.', omitted: 'Skip the longer castle-town loop. The keep and Samurai Museum share the castle ticket; check current hours and access before travelling.' }
  };
  Object.entries(shortPlans).forEach(([slug, plan]) => { routeGuides[slug].shortPlan = plan; });
  routeGuides.kawagoe.shortStopIndices = [0, 2, 3, 4];
  routeGuides.narita.shortStopIndices = [0, 1, 2, 3];
  routeGuides.odawara.shortStopIndices = [0, 1, 2, 3];
  DAY_TRIPS.forEach((trip) => {
    trip.guide = routeGuides[trip.slug];
    trip.image = {
      kawagoe: image('Kurazukuri Street in Little Edo.jpg', 'Dandy1022', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Kurazukuri_Street_in_Little_Edo.jpg'),
      sawara: image('Sawara onogawa 20100504.jpg', 'Tamaki', 'Public domain (PD-self)', 'https://commons.wikimedia.org/wiki/File:Sawara_onogawa_20100504.jpg'),
      mitake: image('Mitake-san shrine.jpg', 'Christian Bauer', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Mitake-san_shrine.jpg'),
      narita: image('Naritasan-pagoda.jpg', 'Paul Currie', 'CC0', 'https://commons.wikimedia.org/wiki/File:Naritasan-pagoda.jpg'),
      odawara: image('Odawara Castle.jpg', 'ZAC', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Odawara_Castle.jpg')
    }[trip.slug];
    const append = (profile, time) => {
      if (!profile) return;
      const routeIndices = time === 'half' && trip.guide.shortStopIndices
        ? trip.guide.shortStopIndices
        : trip.guide.stops.map((_entry, index) => index);
      profile.stops = routeIndices.map((index) => ({ ...trip.guide.stops[index] }));
      profile.rainPlan = trip.guide.rainPlan;
    };
    Object.values(trip.modes).forEach((mode) => Object.entries(mode.profiles).forEach(([time, record]) => append(record, time)));
  });
  const api = Object.freeze({ DAY_TRIPS });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.TokyoDayTrips = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
