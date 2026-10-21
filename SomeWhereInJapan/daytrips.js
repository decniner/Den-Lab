(function (root) {
  'use strict';
  const checkedOn = '2026-10-22';
  const src = {
    kawagoe: ['https://koedo.or.jp/access/', 'https://www.tobu.co.jp/campaign/use-pasmo/', 'https://www.koedo.or.jp/en/route/%E5%9F%8E%E4%B8%8B%E7%94%BA%E3%83%BB%E5%B7%9D%E8%B6%8A-%E6%AD%B4%E5%8F%B2%E3%82%81%E3%81%90%E3%82%8A%E3%82%B3%E3%83%BC%E3%82%B9/'],
    sawara: ['https://www.kantetsu.co.jp/highwaybus/hokota-tokyo', 'https://www.city.katori.lg.jp/sightseeing/multilingual/en/en-season/en-sawara/en-s_midokoro/Float_Museum.html', 'https://www.city.katori.lg.jp/sightseeing/museum/en/guide.html'],
    mitake: ['https://www.mitaketozan.co.jp/timetable.html', 'https://www.mitaketozan.co.jp/ti_modelcourse.html', 'https://www.nisitokyobus.co.jp/wp/wp-content/uploads/2026/03/20260401_hiking_Okutama.pdf'],
    narita: ['https://www.naritasan.or.jp/access/', 'https://www.naritasan.or.jp/tour/map/', 'https://www.naritasan.or.jp/tour/other/'],
    odawara: ['https://odawaracastle.com/info/', 'https://odawaracastle.com/access/', 'https://www.city.odawara.kanagawa.jp/kanko/service/tetudo.html']
  };
  const season = (months, text) => Object.fromEntries(months.map((m) => [m, text]));
  const profile = (hMin, hMax, tMin, tMax, cMin, cMax, arrival, stops, sources, breakdown = {}) => ({
    roundTripHours: { min: hMin, max: hMax }, totalHours: { min: tMin, max: tMax }, costYen: { min: cMin, max: cMax },
    costBreakdown: {
      transport: breakdown.transport || { min: cMin - 1500, max: cMax - 1500 },
      admissions: breakdown.admissions || { min: 0, max: 0 },
      meal: breakdown.meal || { min: 1500, max: 2500 }
    },
    arrival, stops, sources
  });
  const publicOnly = (half, full) => ({ public: { profiles: Object.assign({}, half ? { half } : {}, full ? { full } : {}) } });
  const DAY_TRIPS = [
    {
      id: 'kawagoe', slug: 'kawagoe', name: 'Kawagoe', subtitle: 'A castle town that kept its old street plan', region: 'Saitama · Kanto', months: [1,2,3,4,5,6,9,10,11,12], interests: ['culture','food'],
      seasonFit: season([1,2,3,4,5,6,9,10,11,12], 'The historic center is walkable year-round; spring and autumn are usually more comfortable for a long street-to-street stroll.'),
      effort: 'Easy, mostly level city walking; expect several kilometres on mixed pavement.', tradeoff: 'The old streets can feel busy on weekends and holidays; arrive early for a calmer first hour.',
      arrival: 'Kawagoe Station (Tobu Tojo Line) or Hon-Kawagoe Station (Seibu Shinjuku Line).', checkedOn,
      image: { url: 'https://commons.wikimedia.org/wiki/Special:FilePath/TokiNoKane_Kawagoe_2013Feb.JPG?width=1400', credit: 'Kentagon / Wikimedia Commons', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:TokiNoKane_Kawagoe_2013Feb.JPG' },
      modes: publicOnly(
        profile(1.5,2.1,4.5,6,2880,3880,'Kawagoe Station; walk about 20 minutes to the historic center.',['Kurazukuri Street','Toki no Kane bell tower','Kashiya Yokocho'],src.kawagoe,{transport:{min:1380,max:1380},admissions:{min:0,max:0},meal:{min:1500,max:2500}}),
        profile(1.5,2.1,6.5,8,2880,3880,'Kawagoe Station; walk to the historic center and Honmaru Goten.',['Kawagoe Castle Honmaru Goten','Kurazukuri Street','Toki no Kane','Kashiya Yokocho'],src.kawagoe,{transport:{min:1380,max:1380},admissions:{min:0,max:0},meal:{min:1500,max:2500}})
      ), sources: src.kawagoe
    },
    {
      id:'sawara', slug:'sawara', name:'Sawara', subtitle:'Canal-side merchant streets on the old Tone waterway', region:'Chiba · Kanto', months:[3,4,5,6,7,9,10,11], interests:['culture','food'],
      seasonFit:season([3,4,5,6,7,9,10,11],'The historic district works in most seasons; July and October festival periods bring extra atmosphere and heavier crowds.'), effort:'Easy town walking, with uneven historic paving in places.',tradeoff:'Direct highway buses are limited each day. Reserve around the published return departure; missing it can disrupt the return plan.',arrival:'Sawara (Suigo Sawara) highway-bus stop or JR Sawara Station.',checkedOn,
      image:{url:'',credit:'Editorial typography fallback',license:'No external image asset used'},
      modes:publicOnly(null,profile(2.6,3.4,8,10.5,6100,7100,'Sawara (Suigo Sawara) bus stop; the historic center is a short walk away.',['Ono River and Chukei Bridge','Sawara Machiya-kan','Suigo Sawara Float Museum','Inoh Tadataka Museum and former residence'],src.sawara,{transport:{min:3800,max:3800},admissions:{min:800,max:800},meal:{min:1500,max:2500}})),sources:src.sawara
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
  const api = Object.freeze({ DAY_TRIPS });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.TokyoDayTrips = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
