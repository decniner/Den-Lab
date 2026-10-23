import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('SomeWhereInJapan');
const identities = JSON.parse(fs.readFileSync(path.join(root, 'data/destination-identities.json'), 'utf8')).records;
const routeData = JSON.parse(fs.readFileSync(path.join(root, 'data/place-routes.json'), 'utf8'));
const detailData = JSON.parse(fs.readFileSync(path.join(root, 'data/destination-guide-details.json'), 'utf8')).records;
const routes = new Map(routeData.routes.map(route => [route.placeId, route]));
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let planned = 0;
let versioned = 0;

for (const place of identities) {
  const file = path.join(root, 'places', place.id, 'index.html');
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes('id="planning"')) {
    html = html.replaceAll('v0.5', 'v0.6');
    fs.writeFileSync(file, html, 'utf8');
    versioned++;
    continue;
  }
  const route = routes.get(place.id);
  const details = detailData[place.id] || {};
  if (!route) continue;
  const stops = [...(route.stops || [])].sort((a,b) => (a.order || 0) - (b.order || 0));
  const isMulti = stops.length > 1 && route.legs?.length;
  const routeSummary = isMulti
    ? route.introduction || `Follow the ${stops.length} mapped stops in order. The map connectors indicate sequence; use the linked directions for live navigation.`
    : `This guide currently has a location marker for ${place.name}, not a researched multi-stop route. Use the map and linked visitor sources to choose any additional stop and check the connection before travelling.`;
  const stopMarkup = stops.map((stop, index) => {
    const story = stop.story || (index === 0 ? `Begin at ${stop.name}; confirm the current entrance and visitor access before setting out.` : `Check the visitor information for ${stop.name} before adding it to the day.`);
    const duration = stop.visitDuration?.status === 'known' ? `<small>${esc(stop.visitDuration.minMinutes)} minute suggested visit</small>` : '';
    return `<li><strong>${String(index + 1).padStart(2,'0')} &middot; ${esc(stop.name)}</strong><p>${esc(story)}</p>${duration}</li>`;
  }).join('');
  const sources = [...new Map([...(details.sources || []), ...(route.sources || [])].filter(source => source?.url).map(source => [source.url, source])).values()].slice(0, 6);
  const sourceMarkup = sources.length ? `<h3>Planning references</h3><ul>${sources.map(source => `<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title || source.label || source.organization || 'Visitor information')} &nearr;</a></li>`).join('')}</ul>` : '';
  const primaryPlan = details.visitPlan || routeSummary;
  const extraPlan = details.visitPlan && details.visitPlan !== routeSummary ? `<p>${esc(routeSummary)}</p>` : '';
  const section = `<section class="jg-section" id="planning" aria-labelledby="planning-title" style="border-top:1px solid rgba(23,33,31,.17);padding:1.4rem 0;margin:3rem 0;line-height:1.7"><p class="jg-kicker">PLACE-SPECIFIC PLANNING &middot; ${esc(place.region)}</p><h2 id="planning-title">Plan your visit to ${esc(place.name)}</h2><p>${esc(primaryPlan)}</p>${extraPlan}<h3>${isMulti ? `Mapped order &middot; ${stops.length} stops` : 'What the map supports'}</h3><ol>${stopMarkup}</ol>${sourceMarkup}<p class="jg-note">${isMulti ? 'Route order is based on the linked route sources. Check opening days, seasonal access, and live transport before travelling.' : 'The map is a destination locator. Additional nearby places and transfers have not been verified as a route for this guide.'}</p></section>`;
  const insertion = html.search(/<section\b[^>]*\bid=["']route["']/i);
  if (insertion >= 0) html = html.slice(0, insertion) + section + html.slice(insertion);
  else {
    const footer = html.search(/<footer\b/i);
    if (footer >= 0) html = html.slice(0, footer) + section + html.slice(footer);
    else html = html.replace('</main>', `${section}</main>`);
  }
  html = html.replaceAll('v0.5', 'v0.6');
  fs.writeFileSync(file, html, 'utf8');
  planned++;
  versioned++;
}
const home = path.join(root, 'index.html');
if (fs.existsSync(home)) fs.writeFileSync(home, fs.readFileSync(home, 'utf8').replaceAll('v0.5', 'v0.6'), 'utf8');
console.log(JSON.stringify({catalogue: identities.length, planningAdded: planned, versioned, multiStopRoutes: routeData.routes.filter(route => route.stops?.length > 1).length}, null, 2));
