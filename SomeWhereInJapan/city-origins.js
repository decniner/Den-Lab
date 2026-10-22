(function attachCityOrigins(root){
'use strict';
const CITY_ORIGINS=Object.freeze([
{id:'sapporo',city:'Sapporo',station:'Sapporo Station',region:'Hokkaido'},
{id:'sendai',city:'Sendai',station:'Sendai Station',region:'Tohoku'},
{id:'tokyo',city:'Tokyo',station:'Tokyo Station',region:'Kanto'},
{id:'nagoya',city:'Nagoya',station:'Nagoya Station',region:'Chubu'},
{id:'kyoto',city:'Kyoto',station:'Kyoto Station',region:'Kansai'},
{id:'osaka',city:'Osaka',station:'Osaka Station',region:'Kansai'},
{id:'hiroshima',city:'Hiroshima',station:'Hiroshima Station',region:'Chugoku'},
{id:'takamatsu',city:'Takamatsu',station:'Takamatsu Station',region:'Shikoku'},
{id:'fukuoka',city:'Fukuoka',station:'Hakata Station',region:'Kyushu'},
{id:'naha',city:'Naha',station:'Naha Bus Terminal',region:'Okinawa'}
]);
const AIRPORT_ORIGINS=Object.freeze([
{id:'new-chitose-airport',city:'Sapporo',label:'New Chitose Airport Station · Sapporo',station:'JR New Chitose Airport Station',region:'Hokkaido',planId:'sapporo'},
{id:'sendai-airport',city:'Sendai',label:'Sendai Airport Station · Sendai',station:'Sendai Airport Station',region:'Tohoku',planId:'sendai'},
{id:'haneda-terminal-3',city:'Tokyo',label:'Haneda Airport · Terminal 3',station:'Haneda Airport Terminal 3 Station',region:'Kanto',planId:'tokyo'},
{id:'haneda-terminal-1-2',city:'Tokyo',label:'Haneda Airport · Terminals 1–2',station:'Haneda Airport Terminal 1・2 Station',region:'Kanto',planId:'tokyo'},
{id:'narita-terminal-1',city:'Tokyo',label:'Narita Airport · Terminal 1',station:'Narita Airport Station (Terminal 1)',region:'Kanto',planId:'tokyo'},
{id:'narita-terminal-2-3',city:'Tokyo',label:'Narita Airport · Terminals 2–3',station:'Airport Terminal 2 Station (Narita)',region:'Kanto',planId:'tokyo'},
{id:'chubu-centrair',city:'Nagoya',label:'Central Japan International Airport Station · Nagoya',station:'Central Japan International Airport Station',region:'Chubu',planId:'nagoya'},
{id:'kansai-airport',city:'Osaka',label:'Kansai Airport Station · Osaka',station:'Kansai Airport Station',region:'Kansai',planId:'osaka'},
{id:'hiroshima-airport',city:'Hiroshima',label:'Hiroshima Airport Bus Terminal',station:'Hiroshima Airport Bus Terminal',region:'Chugoku',planId:'hiroshima'},
{id:'fukuoka-airport',city:'Fukuoka',label:'Fukuoka Airport Station',station:'Fukuoka Airport Station',region:'Kyushu',planId:'fukuoka'},
{id:'naha-airport',city:'Naha',label:'Naha Airport Station',station:'Naha Airport Station',region:'Okinawa',planId:'naha'}
]);
const ALL_ORIGINS=Object.freeze([...CITY_ORIGINS,...AIRPORT_ORIGINS]);
const CITY_DAY_PLANS=Object.freeze({
tokyo:{title:'Tokyo: station streets, old Asakusa & Ueno',intro:'Begin at Tokyo Station and the Imperial Palace edge, then cross to Asakusa for the old-city streets and finish among Ueno’s museums, park paths and market lanes. This city-centre sequence follows GO TOKYO’s first-visit route logic; check opening days and current access before setting out.',pace:'One full day · Tokyo Station, central gardens and an east-side finish',source:{label:'GO TOKYO · Best of Tokyo in three days',url:'https://www.gotokyo.org/en/story/walks-and-tours/best-of-tokyo/index.html'},stops:[
{name:'Tokyo Station & Marunouchi',area:'Marunouchi, Chiyoda, Tokyo',timing:'Start · morning',duration:'30–45 min',story:'Start with the red-brick station façade, then step into Marunouchi’s broad avenues. It is a useful orientation point: old rail architecture, modern Tokyo and the palace district meet within a short walk.'},
{name:'Imperial Palace East Gardens',area:'Chiyoda, Tokyo',timing:'Late morning · garden walk',duration:'60–90 min',story:'The former Edo Castle grounds make the city’s scale suddenly quiet. The East Gardens have scheduled closure days and occasional access changes, so check the Imperial Household Agency’s visitor notice before planning this stop.'},
{name:'Asakusa & Senso-ji',area:'Asakusa, Taito, Tokyo',timing:'Afternoon · old Tokyo',duration:'90–120 min',story:'Walk from Kaminarimon through Nakamise toward Senso-ji, then give yourself time to turn into the smaller lanes beyond the main approach. The side streets reveal a neighbourhood as well as a landmark.'},
{name:'Ueno Park & Ameyoko',area:'Ueno, Taito, Tokyo',timing:'Late afternoon · park and market',duration:'60–90 min',story:'Choose a museum or a slow loop through the park before finishing around Ameyoko’s lively market lanes. Museum schedules differ, and many close on a weekly day; check the specific venue if you want to go inside.'}
]},
sapporo:{title:'A first day in Sapporo',intro:'Follow the city from its wooden civic landmark to the food lanes and broad green spine of Odori. The central stops are walkable; keep the final museum visit flexible.',pace:'One full day · central streets on foot, with a short ride for the final stop',source:{label:'Visit Sapporo · iconic sights walking tour',url:'https://visit.sapporo.travel/itineraries/02/'},stops:[
{name:'Sapporo Clock Tower',area:'Chuo, Sapporo',timing:'Start · morning',duration:'30–45 min',story:'Begin with the small wooden building that preserves the story of Sapporo’s early years. Its scale feels especially striking against the modern office blocks around it.'},
{name:'Nijo Market',area:'Chuo, Sapporo',timing:'Late morning · food stop',duration:'45–75 min',story:'Take time to browse the seafood stalls and choose a relaxed lunch. Morning is the most useful window for market browsing; individual stalls set their own hours.'},
{name:'Sapporo TV Tower & Odori Park',area:'Odori, Sapporo',timing:'Early afternoon · open-air pause',duration:'60–90 min',story:'The tower gives the city a clear north–south line; at its feet, Odori Park opens that same axis into a long urban garden. Choose the observatory or a slow park walk.'},
{name:'Tanukikoji Shopping Street',area:'Minami 2–3 jo, Sapporo',timing:'Afternoon · covered stroll',duration:'45–75 min',story:'A covered arcade makes a good weather-proof change of pace, with small shops, cafés and everyday Sapporo life along the way.'},
{name:'Sapporo Beer Museum',area:'Higashi, Sapporo',timing:'Late afternoon · check last entry',duration:'60–90 min',story:'End with the story of Hokkaido’s brewing history and the red-brick industrial buildings. Check the museum and restaurant calendars before crossing town.'}
]},
sendai:{title:'Sendai: a day with the Date legacy',intro:'Move from the quiet memorial woods to the hilltop castle site, then return to the tree-lined streets of central Sendai. Use the city loop bus or live transit directions for the hill sections.',pace:'One full day · city bus and walking, with uphill sections at the historic sites',source:{label:'Discover Sendai · official visitor guide',url:'https://discoversendai.travel/'},stops:[
{name:'Zuihoden Mausoleum',area:'Aoba, Sendai',timing:'Start · morning',duration:'60–90 min',story:'The richly decorated mausoleum of Date Masamune sits among cedar trees. The uphill approach and steps reward an unhurried visit; check access before setting out.'},
{name:'Sendai Castle Ruins · Aoba Castle',area:'Kawauchi, Aoba, Sendai',timing:'Late morning · hilltop views',duration:'45–75 min',story:'The castle buildings are gone, but the stonework and elevated outlook make the site legible as a place chosen to command the city and its river plain.'},
{name:'Jozenji-dori Avenue',area:'Aoba, Sendai',timing:'Afternoon · city walk',duration:'30–50 min',story:'Return to the city’s green centre beneath the zelkova canopy. The avenue changes with the season and often becomes a setting for public art and festivals.'},
{name:'Sendai Asaichi Market',area:'Chuo, Aoba, Sendai',timing:'Late afternoon · market hours vary',duration:'30–60 min',story:'A compact market near the station is an easy final stop for local produce and a small taste of the city. Many stalls close earlier than the evening restaurant streets.'}
]},
nagoya:{title:'Nagoya: castle, street food & shrine forest',intro:'A north-to-south day that trades between samurai history, the lively Osu lanes and the quiet grounds of Atsuta Shrine. Confirm each site’s calendar before you choose the order.',pace:'One full day · subway and walking between distinct city districts',source:{label:'Explore Nagoya · one-day itinerary',url:'https://www.explore-nagoya.info/plan-your-trip/suggested-itineraries/1-day/'},stops:[
{name:'Nagoya Castle & Hommaru Palace',area:'Naka, Nagoya',timing:'Start · morning',duration:'90–120 min',story:'Give the palace interiors and castle grounds their own time. The main keep’s interior access can change during restoration work, so check the official castle notice before visiting.'},
{name:'Oasis 21 & Hisaya-odori Park',area:'Sakae, Nagoya',timing:'Midday · pause between districts',duration:'45–75 min',story:'A modern glass-and-water landmark opens onto the park boulevard. It makes a good reset before heading south and gives the day a distinctly contemporary Nagoya chapter.'},
{name:'Osu Kannon & Osu Shopping District',area:'Osu, Naka, Nagoya',timing:'Afternoon · lunch and wandering',duration:'90–120 min',story:'Temple grounds, old shopping arcades, independent shops and street food sit close together here. Leave room to follow a side street rather than trying to cover every lane.'},
{name:'Atsuta Jingu',area:'Atsuta, Nagoya',timing:'Late afternoon · quiet finish',duration:'45–75 min',story:'The broad shrine grounds feel a world away from the arcades. Walk respectfully, follow posted photography guidance and check the shrine’s visitor information for current access.'}
]},
kyoto:{title:'Kyoto: first light through Higashiyama',intro:'Start early on the eastern hills, follow the old lanes downhill, then finish among the food stalls and lantern-lit streets of central Kyoto. Crowds and bus conditions vary; check current visitor guidance.',pace:'One full day · early start, substantial walking, public transport between districts',source:{label:'Kyoto Travel · Gion & Kiyomizu area guide',url:'https://kyoto.travel/en/areas/gion-kiyomizu/'},stops:[
{name:'Fushimi Inari Taisha',area:'Fushimi, Kyoto',timing:'Start · early morning',duration:'60–120 min',story:'Walk through the first vermilion gates while the paths are quieter. The shrine grounds extend far up the mountain; choose a turnaround point that fits your day.'},
{name:'Kiyomizu-dera',area:'Higashiyama, Kyoto',timing:'Late morning · hillside temple',duration:'60–90 min',story:'The wooden stage looks over Kyoto, while the temple approach reveals the slope and scale of the old eastern district. Check the temple’s current hours and entry guidance.'},
{name:'Sannenzaka & Ninenzaka',area:'Higashiyama, Kyoto',timing:'Midday · old-lane walk',duration:'60–90 min',story:'The stone-paved lanes make the geography of Higashiyama part of the visit. Move slowly, give residents room and avoid blocking shopfronts for photos.'},
{name:'Nishiki Market',area:'Nakagyo, Kyoto',timing:'Afternoon · food and small shops',duration:'45–75 min',story:'Kyoto’s narrow market street is best explored at an easy pace. It is a working shopping street as well as a visitor stop; follow posted etiquette and respect individual stall rules.'},
{name:'Gion & Shirakawa',area:'Higashiyama, Kyoto',timing:'Late afternoon · evening walk',duration:'45–75 min',story:'Finish beside the canal and traditional streets as the light softens. This is a residential and working district: never follow, photograph or obstruct geiko or maiko.'}
]},
osaka:{title:'Osaka: castle walls to Dotonbori lights',intro:'A history-to-nightfall route: begin at the castle grounds, pause for the city’s food culture, then let the evening unfold around Namba’s canals and lanes.',pace:'One full day · subway between districts, then an evening walk',source:{label:'Japan National Tourism Organization · Kansai model route',url:'https://www.japan.travel/en/in/walks-and-tours/in-kansai/'},stops:[
{name:'Osaka Castle Park',area:'Chuo, Osaka',timing:'Start · morning',duration:'90–150 min',story:'Approach through the broad park and take in the stone walls before deciding whether to enter the museum inside the main tower. Allow extra time for the grounds.'},
{name:'Kuromon Ichiba Market',area:'Nippombashi, Chuo, Osaka',timing:'Midday · market lunch',duration:'60–90 min',story:'Browse the covered market for a casual lunch and a look at Osaka’s food-first character. Stalls have individual schedules; a morning or early afternoon visit gives more choice.'},
{name:'Shinsekai & Tsutenkaku',area:'Ebisuhigashi, Naniwa, Osaka',timing:'Afternoon · retro streets',duration:'60–90 min',story:'The sign-filled streets around Tsutenkaku have a different rhythm from the castle district. Pick a few blocks and leave time for a snack rather than rushing through.'},
{name:'Dotonbori & Hozenji Yokocho',area:'Chuo, Osaka',timing:'Evening · lights and dinner',duration:'90–120 min',story:'Follow the canal for the famous city lights, then step into the quieter stone lane by Hozenji. The contrast between spectacle and stillness is the point of the finish.'}
]},
hiroshima:{title:'Hiroshima: remembrance, gardens & the city today',intro:'A thoughtful route through the Peace Memorial Park before shifting to the castle grounds and the lively central arcade. Leave time for the museum and approach the memorial sites with care.',pace:'One full day · streetcar and walking; allow quiet time at the memorials',source:{label:'Hiroshima official visitor guide · Peace Park access',url:'https://dive-hiroshima.com/en/information/faq-004/'},stops:[
{name:'Hiroshima Peace Memorial Park',area:'Nakajima-cho, Naka, Hiroshima',timing:'Start · morning',duration:'45–75 min',story:'Begin outdoors with the river, memorials and landscape of the park. Keep voices low and allow visitors who are there to remember space and privacy.'},
{name:'Atomic Bomb Dome',area:'Otemachi, Naka, Hiroshima',timing:'Late morning · riverside',duration:'20–40 min',story:'View the preserved structure from outside the surrounding barriers. The site is a place of remembrance; follow posted access restrictions and avoid treating it as a casual backdrop.'},
{name:'Hiroshima Peace Memorial Museum',area:'Nakajima-cho, Naka, Hiroshima',timing:'Midday · allow reflection',duration:'90–150 min',story:'The museum’s exhibits are emotionally demanding. Take the visit at your own pace and check the current ticketing and opening information before arrival.'},
{name:'Hiroshima Castle & grounds',area:'Motomachi, Naka, Hiroshima',timing:'Afternoon · history and greenery',duration:'60–90 min',story:'The reconstructed keep and moat offer a different chapter of the city’s history. Confirm current museum hours and any access changes before making this the final stop.'},
{name:'Hondori Shopping Arcade',area:'Naka, Hiroshima',timing:'Late afternoon · meal nearby',duration:'45–75 min',story:'End in the covered centre with a meal and a return to the pace of everyday Hiroshima. It is an easy point from which to catch a streetcar back toward the station.'}
]},
takamatsu:{title:'Takamatsu: a garden morning and a harbour afternoon',intro:'Keep this day inside the compact city: a slow garden circuit, a castle moat by the port, and a final look across the Seto Inland Sea.',pace:'One full day · walking and local rail or bus between the garden and harbour',source:{label:'Experience Takamatsu · standard city course',url:'https://www.art-takamatsu.com/en/course/course_train.html'},stops:[
{name:'Ritsurin Garden',area:'Ritsurincho, Takamatsu',timing:'Start · morning',duration:'90–150 min',story:'Paths loop around ponds, islands and borrowed views of the hills. Enter early if you want the garden’s quieter light; check seasonal opening hours and gate access.'},
{name:'Sanuki udon lunch',area:'Takamatsu city centre',timing:'Midday · local food',duration:'45–75 min',story:'Make lunch part of the plan with the region’s famous wheat noodles. Many specialist shops keep short hours or sell out, so check the day’s opening before choosing a stop.'},
{name:'Tamamo Park · Takamatsu Castle site',area:'Gyokocho, Takamatsu',timing:'Afternoon · harbour history',duration:'45–75 min',story:'The former castle’s moat opens directly toward the harbour. Its waterside setting makes the site feel distinct from inland castle towns; check the park’s current opening information.'},
{name:'Kitahama Alley',area:'Kitahama, Takamatsu',timing:'Late afternoon · café and sea air',duration:'45–75 min',story:'A cluster of renovated port warehouses now holds small shops and cafés. It is a gentle final stop before returning to the station or extending the evening by the water.'}
]},
fukuoka:{title:'Fukuoka: old Hakata, green space & yatai after dark',intro:'Begin in the compact temple streets near Hakata, cross the city for a slower afternoon around the castle moat, then return for a yatai dinner if the weather and stalls cooperate.',pace:'One full day · subway and walking, with flexible evening food stops',source:{label:'Fukuoka City Official Tourist Guide · one-day walking course',url:'https://www.crossroadfukuoka.jp/en/itineraries/ohoripark'},stops:[
{name:'Kushida Shrine',area:'Kamikawabata, Hakata, Fukuoka',timing:'Start · morning',duration:'30–50 min',story:'A living shrine at the heart of Hakata, closely tied to the city’s festival life. Visit quietly and check whether festival preparations affect access.'},
{name:'Hakata Old Town · Tochoji Temple',area:'Gion, Hakata, Fukuoka',timing:'Late morning · temple lanes',duration:'60–90 min',story:'A short walk links temples and historic streets that recall Hakata’s long trading history. Confirm individual temple rules and visiting hours before entering.'},
{name:'Fukuoka Castle Ruins & Maizuru Park',area:'Jonai, Chuo, Fukuoka',timing:'Afternoon · open-air history',duration:'60–90 min',story:'Stone walls and the old moat spread across a broad city park. The remains are easy to explore at your own pace, with open views across the green space.'},
{name:'Ohori Park',area:'Ohorikoen, Chuo, Fukuoka',timing:'Late afternoon · lakeside pause',duration:'60–90 min',story:'The loop around the water is a calm counterpoint to Hakata’s busy streets. Take the path slowly and leave time for the Japanese garden if it is open.'},
{name:'Tenjin yatai area',area:'Tenjin, Chuo, Fukuoka',timing:'Evening · weather dependent',duration:'60–120 min',story:'If stalls are operating, finish with a meal at a yatai. Each stall is independent and may close for weather or a day off; bring a flexible dinner plan.'}
]},
naha:{title:'Naha: Ryukyu heritage to the night market streets',intro:'Start on the hill at Shuri, then descend toward Tsuboya’s pottery lanes and the city’s covered markets. Keep the last stop flexible for the day’s market hours and street activity.',pace:'One full day · Yui Rail, walking and gentle hills; check current Shuri access',source:{label:'Naha Navi · access to main visitor attractions',url:'https://www.naha-navi.or.jp/en/sitepage/access/'},stops:[
{name:'Shurijo Castle Park',area:'Shuri, Naha',timing:'Start · morning',duration:'90–150 min',story:'Follow the gates and ramparts through the former Ryukyu royal precinct. Restoration and visitor routes continue to evolve; check the official park update for the areas open on your date.'},
{name:'Tsuboya Yachimun Street',area:'Tsuboya, Naha',timing:'Midday · pottery quarter',duration:'45–75 min',story:'Stone-paved lanes, kilns and small galleries tell the story of Okinawan pottery. Browse respectfully; many workshops are working spaces with their own opening hours.'},
{name:'Makishi Public Market',area:'Matsuo, Naha',timing:'Afternoon · food and market',duration:'60–90 min',story:'Explore the market floors and the surrounding arcade for Okinawan ingredients and everyday food culture. Check current floor access and vendor hours before planning a meal here.'},
{name:'Kokusai-dori & Heiwa-dori',area:'Naha city centre',timing:'Late afternoon · evening stroll',duration:'60–90 min',story:'Finish among the central shopping streets and covered lanes. The neighbourhood is liveliest later in the day; Sundays may bring pedestrian-only activity on parts of the main street.'}
]}
});
function nearbyPlaces(places,originId){const origin=ALL_ORIGINS.find(item=>item.id===originId);return origin?(places||[]).filter(place=>place.region===origin.region):[];}
function itineraryDays(stops,availability='one',regionalPlaces=[],originCity=''){
 const places=Array.isArray(stops)?stops:[];
 if(availability==='half')return[{title:'A focused half-day',stops:places.slice(0,2)}];
 const requested=availability==='two'?2:availability==='one'?1:Number.parseInt(availability,10);
 const dayCount=Number.isFinite(requested)?Math.max(1,Math.min(30,requested)):1;
 if(dayCount===1)return[{title:'One full day · city highlights',stops:places}];
 const normalize=value=>String(value||'').toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
 const coreNames=places.map(stop=>normalize(stop.name));
 const sameAttraction=(a,b)=>{const left=new Set(a.split(' ').filter(token=>token.length>2));const right=new Set(b.split(' ').filter(token=>token.length>2));const smaller=left.size<=right.size?left:right;const larger=smaller===left?right:left;return smaller.size>0&&[...smaller].filter(token=>larger.has(token)).length/smaller.size>=0.75;};
 const candidates=(Array.isArray(regionalPlaces)?regionalPlaces:[]).filter(place=>{const name=normalize(place.name);return name&&!coreNames.some(core=>sameAttraction(core,name));});
 const regionNames=new Set(['hokkaido','tohoku','kanto','chubu','kansai','chugoku','shikoku','kyushu','okinawa']);
 const prefectureNames=new Set(['hokkaido','aomori','iwate','miyagi','akita','yamagata','fukushima','ibaraki','tochigi','gunma','saitama','chiba','tokyo','kanagawa','niigata','toyama','ishikawa','fukui','yamanashi','nagano','gifu','shizuoka','aichi','mie','shiga','kyoto','osaka','hyogo','nara','wakayama','tottori','shimane','okayama','hiroshima','yamaguchi','tokushima','kagawa','ehime','kochi','fukuoka','saga','nagasaki','kumamoto','oita','miyazaki','kagoshima','okinawa']);
 const grouped=new Map();
 for(const place of candidates){
  const parts=String(place.place||'').split(/[·,]/).map(part=>part.trim()).filter(Boolean);
  if(parts.length<2)continue;
  const last=parts[parts.length-1];
  let locality=last;
  if(regionNames.has(normalize(last))){
   if(parts.length>=3)locality=parts[parts.length-2];
   else if(normalize(parts[0])===normalize(originCity))locality=parts[0];
   else if(!prefectureNames.has(normalize(parts[0])))locality=parts[0];
   else continue;
  }
  const key=normalize(last)===normalize(originCity)?last:locality;
  if(!key)continue;
  if(!grouped.has(key))grouped.set(key,[]);
  grouped.get(key).push({name:place.name,area:place.place,timing:'Suggested visit · check current access',duration:'60–90 min · planning estimate',story:place.description||`Explore ${place.name} and confirm current visitor information before setting out.`,photo:place.photo||null,image:place.image||'',alt:place.alt||`${place.name} in ${place.place}`});
 }
 const clusters=[];
 for(const [name,group] of grouped){
  if(group.length<2)continue;
  for(let index=0;index<group.length;){
   const remaining=group.length-index;
   const count=remaining===4?2:Math.min(3,remaining);
   clusters.push({area:name,stops:group.slice(index,index+count)});
   index+=count;
  }
 }
 const days=[{title:'City center · full-day highlights',stops:places}];
 for(const cluster of clusters){if(days.length>=dayCount)break;days.push({title:`${cluster.area} · neighborhood day`,stops:cluster.stops});}
 while(days.length<dayCount)days.push({title:'Flexible day · choose your own pace',stops:[]});
 return days;
}
function directionsUrl(origin,destination,mode='transit',from=null){const url=new URL('https://www.google.com/maps/dir/');url.searchParams.set('api','1');url.searchParams.set('origin',`${from||origin.station}, Japan`);url.searchParams.set('destination',`${destination}, Japan`);url.searchParams.set('travelmode',mode==='car'?'driving':'transit');return url.href;}
function dayPlanDirectionsUrl(origin,stops,mode='transit'){const url=new URL('https://www.google.com/maps/dir/');const places=Array.isArray(stops)?stops:[];const query=stop=>`${stop.name}, ${stop.area}, Japan`;url.searchParams.set('api','1');url.searchParams.set('origin',`${origin.station}, Japan`);url.searchParams.set('destination',places.length?query(places[places.length-1]):`${origin.station}, Japan`);if(places.length>1)url.searchParams.set('waypoints',places.slice(0,-1).map(query).join('|'));url.searchParams.set('travelmode',mode==='car'?'driving':'transit');return url.href;}
const api=Object.freeze({CITY_ORIGINS,AIRPORT_ORIGINS,ALL_ORIGINS,CITY_DAY_PLANS,nearbyPlaces,itineraryDays,directionsUrl,dayPlanDirectionsUrl});if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.CityOrigins=api;
})(typeof globalThis!=='undefined'?globalThis:this);
