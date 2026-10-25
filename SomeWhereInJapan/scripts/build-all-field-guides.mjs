import fs from 'node:fs';
import path from 'node:path';
import routeHelpers from '../google-maps-routes.js';
import guidePolicy from '../tools/static-guide-policy.cjs';
import mojibake from '../tools/mojibake.cjs';

const { buildWalkingRouteUrl, buildStationToPlaceUrl } = routeHelpers;
const { cleanRenderedGuide } = guidePolicy;
const { decodeMojibake } = mojibake;

const siteRoot = path.resolve('SomeWhereInJapan');
const placesRoot = path.join(siteRoot, 'places');
const readJson = relative => JSON.parse(fs.readFileSync(path.join(siteRoot, relative), 'utf8'));
const writeJson = (relative, value) => fs.writeFileSync(path.join(siteRoot, relative), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
const identities = readJson('data/destination-identities.json').records;
const locations = readJson('data/destination-map-locations.json').records;
const photos = readJson('data/photo-audit.json').rows;
const routeData = readJson('data/place-routes.json');
const photoByName = new Map(photos.map(row => [row.place, row]));
const identityById = new Map(identities.map(row => [row.id, row]));
const existingRoutes = new Map(routeData.routes.map(route => [route.placeId, route]));
const latestGuide = fs.readFileSync(path.join(placesRoot, 'koko-en-garden/index.html'), 'utf8');
const style = latestGuide.match(/<style>([\s\S]*?)<\/style>/)?.[1] || '';
const photoResearchPath = path.join(siteRoot, 'data/commons-photo-research.json');
let photoResearch = [];
if (fs.existsSync(photoResearchPath)) {
  try { const parsed = JSON.parse(fs.readFileSync(photoResearchPath, 'utf8').replace(/^\uFEFF/, '')); photoResearch = Array.isArray(parsed) ? parsed : parsed.records || []; } catch {}
}
const researchById = new Map(photoResearch.filter(photo => photo.status === 'matched').map(photo => [photo.placeId, photo]));

function cleanMojibake(value='') { return decodeMojibake(String(value)); }

function decode(value='') {
  return cleanMojibake(String(value).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' '));
}
function text(html='') { return decode(String(html).replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ')).trim(); }
function esc(value='') { return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function attr(html, selector) {
  const match = html.match(selector);
  return match ? decode(match[1]) : '';
}
function allMatches(html, regex) { return [...html.matchAll(regex)]; }
function sectionFor(html, heading) {
  const sections = allMatches(html, /<section\b[^>]*>([\s\S]*?)<\/section>/gi).map(match => match[1]);
  return sections.find(section => new RegExp(`<h[2-4][^>]*>[^<]*${heading}[^<]*<\/h[2-4]>`,'i').test(section)) || '';
}
function routeFor(record, location, description) {
  const prior = existingRoutes.get(record.id);
  if (prior) return prior;
  const precision = location?.precision || 'area';
  const locator = location?.locator || `${record.name} · ${record.region}`;
  const coords = location ? { latitude: location.latitude, longitude: location.longitude, precision: precision === 'destination' ? 'Destination-level map point' : precision === 'nearby' ? 'Nearby reference point; confirm the attraction entrance' : 'Approximate area reference; not confirmed as the attraction entrance', sourceIds: ['destination-map-location'] } : null;
  const stop = { id:`${record.id}-place`, order:1, name:record.name, area:locator, address:`${record.name}, ${locator}, Japan`, story:description || `Use this map to locate ${record.name}; confirm the exact entrance with current visitor information.`, ...(coords ? {coordinates:coords} : {}), visitDuration:{status:'unknown'}, youtubeUrl:`https://www.youtube.com/results?search_query=${encodeURIComponent(`${record.name} Japan visitor guide`)}` };
  const route = { id:`${record.id}-place-map`, placeId:record.id, cityId:'destination', title:`${record.name}: location map`, introduction:precision==='destination'?`Map reference for ${record.name}. Open Google Maps for live directions from your current starting point.`:`Approximate location reference for ${record.name}. Confirm the exact entrance with the attraction before travelling.`, researchStatus:'place-locator', locatorPrecision:precision, locatorLabel:locator, stops:[stop], legs:[], sources:location?.sourceUrl?[{id:'destination-map-location',label:'OpenStreetMap location record',url:location.sourceUrl,checkedOn:location.checkedOn||'2026-10-23',supports:['destination or area map reference']}]:[] };
  return route;
}
function mapFor(record, location, route) {
  const old = routeData.maps[record.id];
  if (old) return old;
  if (!location) return null;
  const longitude=location.longitude, latitude=location.latitude;
  const stop=route.stops[0];
  return {type:'FeatureCollection',metadata:{geometryStatus:'place-locator',bounds:[longitude-0.002,latitude-0.002,longitude+0.002,latitude+0.002],attribution:'Map data © OpenStreetMap contributors',license:'ODbL-1.0',sourceUrl:'https://www.openstreetmap.org/copyright'},features:[{type:'Feature',id:stop.id,geometry:{type:'Point',coordinates:[longitude,latitude]},properties:{id:stop.id,routeStopId:stop.id,name:stop.name,role:'stop',order:1}}]};
}
function walkingRouteAction(route) {
  const url = buildWalkingRouteUrl(route) || (route?.origin && route?.stops?.[0]
    ? buildStationToPlaceUrl(route.origin, route.stops[0], { firstLegMode: route.legs?.[0]?.mode })
    : null);
  if (!url) return '';
  return `<a class="jg-btn jg-light walking-google-route" href="${esc(url)}" target="_blank" rel="noopener" aria-label="Walking route on Google Maps">Walking route on Google Maps <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M6 14 14 6M7 6h7v7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></a>`;
}

function addWalkingRouteAction(html, route) {
  const action = walkingRouteAction(route);
  const existingAction = /<a\b(?=[^>]*\bclass="[^"]*\bwalking-google-route\b")[^>]*>[\s\S]*?<\/a>/i;
  if (!action) return html.replace(existingAction, '');
  if (existingAction.test(html)) return html.replace(existingAction, action);
  if (/Walking route on Google Maps/.test(html)) return html;
  return html.replace(/(<section\b(?=[^>]*\bid="route")[^>]*>[\s\S]*?<h2\b[^>]*>[\s\S]*?<\/h2>)/i, `$1${action}`);
}

function placeGuidePresentation(html, { placeName = '', placeId = '' } = {}) {
  if (!placeName) return html;
  const details = [];
  let gallery = '';
  const existingGallery = html.match(/<div class="jg-photo-gallery"[^>]*>[\s\S]*?<\/div>/i)?.[0] || '';
  const researchedGallery = researchById.get(placeId)?.gallery || [];
  const images = researchedGallery.filter(photo => photo?.imageUrl && photo?.sourcePage && photo?.photographer && photo?.license && photo?.alt);
  if (images.length) {
    gallery = `<div class="jg-photo-gallery" aria-label="Verified photos of ${esc(placeName)}">${images.map(photo => `<figure><img data-photo-verified="true" data-photo-source="${esc(photo.sourcePage)}" data-photo-credit="${esc(photo.photographer)}" data-photo-license="${esc(photo.license)}" data-photo-alt="${esc(photo.alt)}" src="${esc(photo.imageUrl)}" alt="${esc(photo.alt)}" loading="lazy" decoding="async"><figcaption>${esc(photo.photographer)} · ${esc(photo.license)} · <a href="${esc(photo.sourcePage)}" target="_blank" rel="noopener noreferrer">Photo source</a></figcaption></figure>`).join('')}</div>`;
  } else if (existingGallery) {
    gallery = existingGallery;
  }

  const routeMatch = html.match(/<section\b(?=[^>]*\bid="route")[^>]*>[\s\S]*?<\/section>/i);
  const routeSection = routeMatch?.[0] || '';
  if (routeSection) html = html.replace(routeSection, '');
  if (existingGallery) html = html.replace(existingGallery, '');

  const sectionRe = /<section\b(?=[^>]*\bclass="[^"]*\bjg-section\b")[^>]*>[\s\S]*?<\/section>/gi;
  html = html.replace(sectionRe, section => {
    if (/\bid="route"/i.test(section)) return section;
    details.push(section);
    return '';
  });

  html = html.replace(/<p class="jg-lede">\s*(?:WHY THIS PLACE|A CLOSER LOOK)\s*<\/p>/i, '');
  const nameQuery = encodeURIComponent(`${placeName} Japan`);
  const photoLink = `<p class="jg-photo-link"><a class="jg-btn jg-light" href="https://www.google.com/maps/search/?api=1&query=${nameQuery}" target="_blank" rel="noopener noreferrer">See more visitor photos on Google Maps ↗</a></p>`;
  const moreDetails = details.length
    ? `<details class="jg-more-details" id="more-details"><summary>More details</summary><div class="jg-more-details-content">${details.join('')}</div></details>`
    : '';

  const featured = [gallery, photoLink, routeSection, moreDetails].filter(Boolean).join('');
  if (featured) {
    const lede = /<p class="jg-lede">[\s\S]*?<\/p>/i;
    if (lede.test(html)) html = html.replace(lede, match => `${match}${featured}`);
    else html = html.replace(/<header\b(?=[^>]*\bclass="[^"]*\bjg-hero\b")[^>]*>[\s\S]*?<\/header>/i, match => `${match}${featured}`);
  }

  html = html.replace(/(<a\b[^>]*href="#arrival"[^>]*>)[\s\S]*?(<\/a>)/i, '$1More details ↓$2').replace('href="#arrival"', 'href="#more-details"');
  const presentationCss = `
.jg-hero figure{border-radius:12px;overflow:hidden}.jg-more-details{margin:2rem 0;border:1px solid rgba(23,33,31,.2);background:#fffdf8}.jg-more-details>summary{list-style:none;cursor:pointer;min-height:56px;padding:1rem 1.2rem;display:flex;align-items:center;justify-content:space-between;font-weight:750;color:#164f43}.jg-more-details>summary::-webkit-details-marker{display:none}.jg-more-details>summary::after{content:"+";font-size:1.5rem;line-height:1}.jg-more-details[open]>summary::after{content:"−"}.jg-more-details-content{padding:0 1.2rem 1.2rem}.jg-photo-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:1.5rem 0}.jg-photo-gallery figure{margin:0;min-height:240px;position:relative;overflow:hidden;border-radius:10px;background:#e5e0d4}.jg-photo-gallery img{width:100%;height:100%;min-height:240px;max-height:360px;object-fit:cover;display:block}.jg-photo-gallery figcaption{position:absolute;inset:auto 0 0;padding:2rem .8rem .7rem;background:linear-gradient(transparent,rgba(0,0,0,.78));color:white;font-size:.75rem}.jg-photo-gallery figcaption a{color:white}.jg-photo-link{margin:.4rem 0 1.5rem}.jg-lede{max-width:54ch;font-size:clamp(1.05rem,1.8vw,1.3rem);line-height:1.55}.jg-section h2{margin-bottom:.4em}@media(max-width:760px){.jg-photo-gallery{grid-template-columns:1fr 1fr;gap:8px}.jg-photo-gallery figure,.jg-photo-gallery img{min-height:180px}.jg-more-details-content{padding:0 .8rem .8rem}}
`;
  if (/<style>[\s\S]*?<\/style>/i.test(html)) html = html.replace(/<\/style>/i, `${presentationCss}</style>`);
  return html;
}

function versionExisting(html, { placeName = '', placeId = '', route = null, placePage = false } = {}) {
  html = placePage ? cleanRenderedGuide(html, { version: 'v1.9', placeName }) : decodeMojibake(html);
  if (placePage) { html = addWalkingRouteAction(html, route); html = placeGuidePresentation(html, { placeName, placeId }); }
  if (!/google-maps-routes\.js/.test(html)) {
    html = html.replace(/<script\b[^>]*src="((?:\.\.\/)*)city-route-ui\.js[^\"]*"[^>]*><\/script>/i, (_match, prefix = '') => `<script src="${prefix}google-maps-routes.js?v=20261024-3" defer></script>${_match}`);
  }
  html = html.replace(/(class="(?:site-version|guide-version)")>v\d+\.\d+/g,'$1>v1.9');
  for (const cls of ['jg-top','ng-top','kg-top','fg-top']) {
    const re = new RegExp(`(<nav\\b(?=[^>]*\\bclass="[^"]*\\b${cls}\\b[^"]*")[^>]*>)([\\s\\S]*?)(<\\/nav>)`,'i');
    html = html.replace(re, (_whole, open, body, close) => {
      if (/guide-version/.test(body)) return `${open}${body.replace(/v\d+\.\d+/,'v1.9')}${close}`;
      return `${open}${body.replace('</a>','</a><small class="guide-version">v1.9</small>')}${close}`;
    });
  }
  return html.replace(/styles\.css\?v=[^"'\s>]+/g,'styles.css?v=20261024-8').replace(/google-maps-routes\.js(?:\?v=[^"'\s>]+)?/g,'google-maps-routes.js?v=20261024-3').replace(/city-route-ui\.js\?v=[^"'\s>]+/g,'city-route-ui.js?v=20261024-6').replace(/place-route-ui\.js\?v=[^"'\s>]+/g,'place-route-ui.js?v=20261024-11');
}
function render(record, sourceHtml, imageRow, location, route) {
  const placeName=record.name;
  const title=text(sourceHtml.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || placeName) || placeName;
  const desc=attr(sourceHtml,/\<meta\s+name="description"\s+content="([^"]*)"/i) || `${placeName} in ${record.region}, Japan.`;
  const lede=text(sourceHtml.match(/<p class="(?:ng-lede|jg-lede)">([\s\S]*?)<\/p>/i)?.[1] || '');
  const why=sectionFor(sourceHtml,'WHY THIS PLACE|WHAT MAKES|WHY VISIT');
  const whyParagraphs=allMatches(why,/<p\b[^>]*>([\s\S]*?)<\/p>/gi).map(m=>text(m[1])).filter(Boolean);
  const story=whyParagraphs.find(value=>!/(open the map|destination marker|location map|no connecting route)/i.test(value)) || lede || desc;
  const pointItems=allMatches(why,/<li\b[^>]*>([\s\S]*?)<\/li>/gi).map(m=>text(m[1])).filter(v=>v.length>24).slice(0,5);
  const arrival=sectionFor(sourceHtml,'GETTING THERE|CHOOSE HOW TO ARRIVE');
  const arrivalText=allMatches(arrival,/<p\b[^>]*>([\s\S]*?)<\/p>/gi).map(m=>text(m[1])).filter(Boolean).find(v=>v.length>35) || `Use the destination map to compare public transport and driving options from your starting point. Check current schedules and the last return service before you set out.`;
  const tel=sourceHtml.match(/href="tel:([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
  const phone=tel ? {href:decode(tel[1]),label:text(tel[2])} : null;
  const facts=allMatches(sourceHtml,/<div class="ng-fact"[^>]*>([\s\S]*?)<\/div>/gi).map(m=>m[1]);
  const stayFact=facts.find(f=>/WHERE TO STAY/i.test(f));
  const stayText=stayFact?text(stayFact.replace(/<strong>[\s\S]*?<\/strong>/i,'')):`Base yourself in ${location?.locator || record.region} for the easiest access to the destination. Compare current accommodation and transport links before booking.`;
  const seasonFact=facts.find(f=>/WEATHER|SEASON/i.test(f));
  const seasonText=seasonFact?text(seasonFact.replace(/<strong>[\s\S]*?<\/strong>/i,'')):'Check local weather and seasonal access conditions close to your travel date.';
  const oldImg=sourceHtml.match(/<figure[^>]*>[\s\S]*?<img\b[^>]*src="([^"]+)"[^>]*>[\s\S]*?<figcaption>([\s\S]*?)<\/figcaption>[\s\S]*?<\/figure>/i);
  const researched=researchById.get(record.id);
  const photoUrl=researched?.imageUrl || (imageRow?.verdict==='CORRECT' ? imageRow.currentImageUrl : '');
  const photoAlt=researched?.alt || (imageRow?.verdict==='CORRECT' ? imageRow.altText : '');
  const photoCredit=researched ? `${researched.photographer} · ${researched.license}` : imageRow?.verdict==='CORRECT' ? `${imageRow.photographer} · ${imageRow.license}` : text(oldImg?.[2] || '');
  const photoSource=researched?.sourcePage || imageRow?.sourcePage || decode(oldImg?.[2]?.match(/href="([^"]+)"/i)?.[1] || '');
  const isVerifiedPhoto=Boolean(photoUrl && photoAlt && photoCredit && photoSource);
  const gallery=(researched?.gallery||[]).slice(0,3);
  const locationLabel=location?.locator || `${record.region} · Japan`;
  const mapPrecision=location?.precision==='destination'?'Named destination':location?.precision==='nearby'?'Nearby map reference':'Approximate area reference';
  const directLinks=allMatches(sourceHtml,/<a\b[^>]*href="(https?:[^"#]+)"[^>]*>([\s\S]*?)<\/a>/gi).map(m=>({url:decode(m[1]),label:text(m[2])})).filter(x=>x.label&&!/(google\.com|youtube\.com|openstreetmap\.org|wikimedia\.org|unsplash\.com|creativecommons\.org)/i.test(x.url)).slice(0,4);
  const bullets=pointItems.length?pointItems.map(item=>`<li>${esc(item)}</li>`).join(''):`<li>${esc(story)}</li><li>Check current opening and seasonal access details before travelling.</li><li>Use the map to confirm the route from your starting point and allow time to explore at a comfortable pace.</li>`;
  const sourceLine=photoSource?`<a href="${esc(photoSource)}" target="_blank" rel="noopener noreferrer">View image source</a>`:'';
  const creditLine=isVerifiedPhoto?`${esc(photoCredit)} · ${sourceLine}`:'';
  const sourceLinks=directLinks.map(link=>`<li><a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">${esc(link.label || 'Visitor information')} ↗</a></li>`).join('');
  const routeId=route.id;
  const transitUrl=`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${placeName}, ${locationLabel}, Japan`)}&travelmode=transit`;
  const carUrl=`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${placeName}, ${locationLabel}, Japan`)}&travelmode=driving`;
  const stayUrl=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`places to stay near ${locationLabel}, Japan`)}`;
  const videoUrl=`https://www.youtube.com/results?search_query=${encodeURIComponent(`${placeName} Japan travel guide`)}`;
  const routeAction=walkingRouteAction(route);
  const heroFigure=isVerifiedPhoto?`<figure><img data-photo-verified="true" data-photo-source="${esc(photoSource)}" data-photo-credit="${esc(researched?.photographer || imageRow?.photographer)}" data-photo-license="${esc(researched?.license || imageRow?.license)}" data-photo-alt="${esc(photoAlt)}" src="${esc(photoUrl)}" alt="${esc(photoAlt)}" loading="eager" decoding="async"><figcaption>Photo: ${esc(photoCredit)} / ${sourceLine}</figcaption></figure>`:'';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#111a19"><title>${esc(title)} | Japan Field Guide</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="https://decniner.github.io/Den-Lab/SomeWhereInJapan/places/${record.id}/"><link rel="stylesheet" href="../../vendor/maplibre-gl/maplibre-gl.css?v=20261023-3"><link rel="stylesheet" href="../../styles.css?v=20261024-5"><script src="../../vendor/maplibre-gl/maplibre-gl.js?v=20261023-3" defer></script><script src="../../city-route-map.js?v=20261023-11" defer></script><script src="../../google-maps-routes.js?v=20261024-1" defer></script><script src="../../city-route-ui.js?v=20261024-4" defer></script><script src="../../place-route-ui.js?v=20261024-2" defer></script><style>${style}</style></head><body><main class="japan-guide"><nav class="jg-top"><a href="../../index.html">← Somewhere in Japan <small class="guide-version">v1.2</small></a><span class="jg-kicker">${esc(locationLabel)} · Japan field guide</span></nav><header class="jg-hero"><div><p class="jg-kicker">A PLACE-LED FIELD GUIDE</p><h1>${esc(title)}</h1><p class="jg-area">${esc(mapPrecision)} · ${esc(record.type || 'Place')}</p><p class="jg-deck">${esc(desc)}</p><a class="jg-btn" href="#route">See the place map ↓</a><a class="jg-btn jg-light" href="#arrival">Plan your arrival</a></div>${heroFigure}</header><p class="jg-lede">${esc(story)}</p><section class="jg-section" id="story"><p class="jg-kicker">A CLOSER LOOK</p><h2>Why this place stays with you</h2><p>${esc(lede && lede!==story ? lede : story)}</p><ul>${bullets}</ul>${gallery.length?`<div class="jg-photo-gallery" aria-label="More photographs of ${esc(title)}">${gallery.map(photo=>`<figure><img src="${esc(photo.imageUrl)}" alt="${esc(photo.alt||title)}" loading="lazy" decoding="async"><figcaption>${esc(photo.photographer)} · ${esc(photo.license)} · <a href="${esc(photo.sourcePage)}" target="_blank" rel="noopener noreferrer">Source</a></figcaption></figure>`).join('')}</div>`:''}</section><section class="jg-section" id="route"><p class="jg-kicker">${route.stops.length>1?'THE ROUTE · NUMBERED STOPS':'THE PLACE · MAP REFERENCE'}</p><h2>${esc(title)} · ${route.stops.length>1?'visit order':'location map'}</h2>${routeAction}<p>${esc(route.introduction || `Use the map to locate ${title} and open Google Maps for live directions.`)}</p><p class="jg-note"><strong>Map precision:</strong> ${esc(mapPrecision)}. ${route.stops.length>1?'Dashed connectors show visit order only; open the linked Google Maps route for navigation.':'This map marks one destination point; it does not imply a multi-stop route.'}</p><div data-place-route-guide data-route-kind="location" data-route-id="${esc(routeId)}" aria-label="Interactive map for ${esc(title)}"></div><p class="jg-small">Open the stop links for directions and visitor video searches. Confirm exact entrances and current access with the listed sources.</p></section><section class="jg-section jg-grid" id="arrival"><div><p class="jg-kicker">GETTING THERE</p><h2>Choose how to arrive</h2><p>${esc(arrivalText)}</p><a class="jg-btn jg-light" href="${transitUrl}" target="_blank" rel="noopener noreferrer">Train and public transport ↗</a><a class="jg-btn jg-light" href="${carUrl}" target="_blank" rel="noopener noreferrer">By car ↗</a><a class="jg-btn jg-light" href="${videoUrl}" target="_blank" rel="noopener noreferrer">Watch visitor videos ↗</a>${sourceLinks?`<p>Visitor information</p><ul>${sourceLinks}</ul>`:''}</div><aside><div class="jg-fact"><strong>SEASON & CONDITIONS</strong>${esc(seasonText)}</div><div class="jg-fact"><strong>CONTACT THE VISITOR SITE</strong>${phone?`${esc(phone.label)}<br><a href="tel:${esc(phone.href)}">Call ${esc(phone.label)}</a>`:`Use the destination listing for current visitor contact details.<br><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${placeName} ${locationLabel} Japan`)}" target="_blank" rel="noopener noreferrer">Open destination contact listing ↗</a>`}</div><div class="jg-fact"><strong>WHERE TO STAY</strong><p>${esc(stayText)}</p><a href="${stayUrl}" target="_blank" rel="noopener noreferrer">Find places to stay nearby ↗</a></div><div class="jg-fact"><strong>LOCAL NOTES</strong>Check the return journey, weather and any seasonal restrictions before setting out. Respect local communities and site guidance.</div></aside></section><section class="jg-section"><p class="jg-kicker">FIELD NOTES</p><h2>Make the visit your own</h2><p>${esc(story)}</p><ul><li>Check official access and opening information for your travel date.</li><li>Use Google Maps for live transport and road conditions from your actual starting point.</li><li>For longer routes, open individual stop directions in visit order.</li></ul><p class="jg-small">${creditLine}</p></section><footer class="jg-footer">Somewhere in Japan · A place-led field guide. Confirm current access, weather, schedules and fares before travel.<p><a href="../../index.html">Return to Explore Japan · v1.2</a></p></footer></main></body></html>`;
}

let rebuilt=0, retained=0, locatorMaps=0, missingMap=0;
for (const record of identities) {
  const file=path.join(placesRoot,record.id,'index.html');
  if (!fs.existsSync(file)) continue;
  let html=fs.readFileSync(file,'utf8');
  const alreadyPremium=html.includes('class="jg-hero"') || html.includes('class="kg-hero"') || html.includes('class="fg-hero"');
  if (alreadyPremium) {
    fs.writeFileSync(file,versionExisting(html,{placeName:record.name,placeId:record.id,route:existingRoutes.get(record.id),placePage:true}),'utf8'); retained++;
  } else {
    const location=locations[record.id] || null;
    const imageRow=photoByName.get(record.name) || null;
    const route=routeFor(record,location,attr(html,/\<meta\s+name="description"\s+content="([^"]*)"/i));
    const map=mapFor(record,location,route);
    if (!existingRoutes.has(record.id)) {
      routeData.routes.push(route);
      if (map) { routeData.maps[record.id]=map; locatorMaps++; } else missingMap++;
    }
    fs.writeFileSync(file,versionExisting(render(record,html,imageRow,location,route),{placeName:record.name,placeId:record.id,route,placePage:true}),'utf8'); rebuilt++;
  }
}
routeData.routes.sort((a,b)=>a.placeId.localeCompare(b.placeId));
writeJson('data/place-routes.json',JSON.parse(cleanMojibake(JSON.stringify(routeData))));
const homePath=path.join(siteRoot,'index.html');
fs.writeFileSync(homePath,versionExisting(fs.readFileSync(homePath,'utf8')),'utf8');
console.log(JSON.stringify({catalogue:identities.length,rebuilt,retained,locatorMaps,missingMap,totalRoutes:routeData.routes.length,totalMapCollections:Object.keys(routeData.maps).length},null,2));
