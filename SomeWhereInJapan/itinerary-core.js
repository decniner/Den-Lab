(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.JapanItineraryCore = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const PACE_LIMITS = Object.freeze({ relaxed: 2, balanced: 3, active: 4 });
  const MONTHS = Object.freeze(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']);
  const REGIONS = new Set(['Hokkaido','Tohoku','Kanto','Chubu','Kansai','Chugoku','Shikoku','Kyushu','Okinawa','Japan']);
  const PREFECTURES = new Set(['Hokkaido','Aomori','Iwate','Miyagi','Akita','Yamagata','Fukushima','Ibaraki','Tochigi','Gunma','Saitama','Chiba','Kanagawa','Niigata','Toyama','Ishikawa','Fukui','Yamanashi','Nagano','Gifu','Shizuoka','Aichi','Mie','Shiga','Hyogo','Nara','Wakayama','Tottori','Shimane','Okayama','Hiroshima','Yamaguchi','Tokushima','Kagawa','Ehime','Kochi','Fukuoka','Saga','Nagasaki','Kumamoto','Oita','Miyazaki','Kagoshima']);
  const AREA_ROUTE_ORDER = Object.freeze({
    Hokkaido:['Sapporo','Otaru','Shakotan','Niseko','Toyako','Noboribetsu','Hakodate','Furano','Biei','Asahikawa','Daisetsuzan','Kushiro','Teshikaga','Abashiri','Shiretoko','Shari','Wakkanai'],
    Okinawa:['Naha','Chatan','Nago','Motobu','Nakijin','Kunigami','Itoman','Nanjo','Ishigaki','Miyako'],
    Kanto:['Tokyo','Maihama','Yokohama','Kamakura','Fujisawa','Futtsu','Hakone','Kawagoe','Nikko','Utsunomiya'],
    Kansai:['Kyoto','Osaka','Nara','Kobe','Kinosaki','Wakayama','Ise'],
    Kyushu:['Fukuoka','Yanagawa','Nagasaki','Kumamoto','Aso','Beppu','Yufuin','Kagoshima','Yakushima']
  });
  const placeKey = place => String(place?.id || place?.slug || place?.name || '');

  function localityKey(place) {
    const raw = String(place?.place || '').trim();
    if (!raw) return String(place?.name || 'Unspecified area');
    const tokens = raw.split(/[·,]/).map(value => value.trim()).filter(Boolean);
    const local = tokens.filter(value => !REGIONS.has(value) && !PREFECTURES.has(value));
    // Tokyo, Osaka and Kyoto are both prefectures and city names; keep them as
    // useful city clusters when they appear as the final location component.
    const final = tokens.at(-1);
    if (['Tokyo','Osaka','Kyoto'].includes(final)) return final;
    return local.at(-1) || final || raw;
  }

  function eventMatchesDate(place, date) {
    const windows = place.eventDates || place.eventWindows;
    if (!Array.isArray(windows) || !windows.length) return true;
    const key = dateKey(date);
      return windows.some(window => /^\d{4}-\d{2}-\d{2}$/.test(String(window?.start || '')) && /^\d{4}-\d{2}-\d{2}$/.test(String(window?.end || '')) && window.start <= key && key <= window.end);
  }

  function areaRouteRank(region, locality) {
    const route = AREA_ROUTE_ORDER[region];
    if (!route) return -1;
    const name = String(locality || '').toLowerCase();
    return route.findIndex(candidate => name === candidate.toLowerCase() || name.includes(candidate.toLowerCase()));
  }

  function isFullDayPlace(place) {
    if (place?.fullDay === true) return true;
    const description = `${place?.name || ''} ${place?.description || ''}`;
    return /\bfull[- ]day\b|\btakes several hours to explore\b/i.test(description);
  }

  function inferOriginRegion(origin) {
    const value = String(origin || '').toLowerCase();
    const aliases = [
      ['Hokkaido',/hokkaido|sapporo|otaru|hakodate|asahikawa/],
      ['Tohoku',/tohoku|aomori|morioka|sendai|akita|yamagata|fukushima/],
      ['Kanto',/kanto|tokyo|haneda|narita|yokohama|kamakura|nikko|kawagoe/],
      ['Chubu',/chubu|nagoya|kanazawa|matsumoto|shizuoka|fuji/],
      ['Kansai',/kansai|kyoto|osaka|kobe|nara|itami/],
      ['Chugoku',/chugoku|hiroshima|okayama|tottori|shimane/],
      ['Shikoku',/shikoku|takamatsu|matsuyama|kochi/],
      ['Kyushu',/kyushu|fukuoka|nagasaki|kumamoto|kagoshima/],
      ['Okinawa',/okinawa|naha|ishigaki|miyako/]
    ];
    return aliases.find(([,pattern])=>pattern.test(value))?.[0] || '';
  }

  function parseDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]) ? date : null;
  }

  function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function scorePlace(place, month, interests, savedIds) {
    let score = 0;
    const months = Array.isArray(place.months) ? place.months : [];
    const seasonal = months.includes(month);
    if (seasonal) score += 8;
    if (place.monthReasons && typeof place.monthReasons[month] === 'string') score += 2;
    const tags = Array.isArray(place.tags) ? place.tags : [];
    score += interests.filter(tag => tags.includes(tag)).length * 3;
    if (savedIds.has(placeKey(place)) || savedIds.has(String(place.name || ''))) score += 5;
    return { score, seasonal };
  }

  const LOCATION_CLUSTER_RADIUS_KM = 8;

  function mapPoint(place) {
    const point = place?.mapLocation;
    if (!point) return null;
    const latitude = Number(point.latitude), longitude = Number(point.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
    return { latitude, longitude };
  }

  function normalizeLocationLabel(value) {
    return String(value || '').normalize('NFKD').toLowerCase()
      .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function originMapPoint(origin, destinations) {
    const label = normalizeLocationLabel(origin);
    if (!label) return null;
    const aliases = [label, label.replace(/\s+(station|airport|terminal)(\s+.*)?$/, '').trim()].filter(Boolean);
    const matches = destinations.filter(place => {
      const fields = [place.name, place.place, place.mapLocation?.locator];
      const parts = fields.flatMap(value => String(value || '').split(/[·,|]/).map(normalizeLocationLabel));
      return aliases.some(alias => parts.includes(alias) || fields.some(value => normalizeLocationLabel(value) === alias));
    });
    const points = matches.map(mapPoint).filter(Boolean);
    if (!points.length) return null;
    return {
      latitude: points.reduce((sum, point) => sum + point.latitude, 0) / points.length,
      longitude: points.reduce((sum, point) => sum + point.longitude, 0) / points.length
    };
  }

  function distanceKm(a, b) {
    if (!a || !b) return Infinity;
    const radians = value => value * Math.PI / 180;
    const lat1 = radians(a.latitude), lat2 = radians(b.latitude);
    const dLat = lat2 - lat1, dLon = radians(b.longitude - a.longitude);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
  }

  function clusterCandidates(scored) {
    const pending = [...scored], clusters = [];
    while (pending.some(item => mapPoint(item.place))) {
      const seedIndex = pending.findIndex(item => mapPoint(item.place));
      const seed = pending[seedIndex], center = mapPoint(seed.place), members = [];
      for (let index = pending.length - 1; index >= 0; index--) {
        const point = mapPoint(pending[index].place);
        if (point && distanceKm(center, point) <= LOCATION_CLUSTER_RADIUS_KM) members.unshift(...pending.splice(index, 1));
      }
      clusters.push({ key: placeKey(seed.place), locality: seed.locality, center, items: members });
    }
    const fallback = new Map();
    pending.forEach(item => { if (!fallback.has(item.locality)) fallback.set(item.locality, []); fallback.get(item.locality).push(item); });
    fallback.forEach((items, locality) => clusters.push({ key: 'area:' + locality, locality, center: null, items }));
    return clusters;
  }

  function shortestStopOrder(places, startPoint = null) {
    if (places.length < 2 || places.some(place => !mapPoint(place))) return places;
    let best = null, bestDistance = Infinity;
    const visit = (remaining, path, distance) => {
      if (!remaining.length) { if (distance < bestDistance) { bestDistance = distance; best = path; } return; }
      for (let index = 0; index < remaining.length; index++) {
        const place = remaining[index], point = mapPoint(place);
        const from = path.length ? mapPoint(path[path.length - 1]) : startPoint;
        const nextDistance = distance + (from ? distanceKm(from, point) : 0);
        if (nextDistance >= bestDistance) continue;
        visit([...remaining.slice(0, index), ...remaining.slice(index + 1)], [...path, place], nextDistance);
      }
    };
    visit(places, [], 0);
    return best || places;
  }

  function buildItinerary({ destinations = [], startDate, days = 0, regions = [], interests = [], pace = 'balanced', savedIds = [], origin = '' } = {}) {
    const firstDate = parseDate(startDate);
    const count = Math.max(0, Math.min(31, Math.floor(Number(days) || 0)));
    const safePlaces = Array.isArray(destinations) ? destinations.filter(place => place && place.name && place.region) : [];
    const safeRegions = Array.isArray(regions) ? regions.filter(Boolean) : [];
    const safeInterests = Array.isArray(interests) ? interests.filter(Boolean) : [];
    const saved = new Set(Array.isArray(savedIds) ? savedIds.map(String) : []);
    const notes = [];
    if (!firstDate || !count) return { days: [], notes: ['Choose a valid start date and trip length to build a draft.'] };
    if (!safePlaces.length) return { days: [], notes: ['No destination records are available right now. You can still browse the guide and try again later.'] };

    const limit = PACE_LIMITS[pace] || PACE_LIMITS.balanced;
    const used = new Set();
    const resultDays = [];
    let regionPlan = [...safeRegions];
    if (!regionPlan.length) {
      const availableRegions = [...new Set(safePlaces.map(place => place.region))];
      const firstMonth = firstDate.getMonth() + 1;
      const lastTripDate = new Date(firstDate.getFullYear(),firstDate.getMonth(),firstDate.getDate()+count-1);
      const firstTripKey = dateKey(firstDate);
      const lastTripKey = dateKey(lastTripDate);
      const ranked = availableRegions.map((region, originalIndex) => {
        const matches = safePlaces.filter(place => place.region === region).map(place => ({place,...scorePlace(place,firstMonth,safeInterests,saved)})).sort((a,b)=>b.score-a.score);
        const top = matches.slice(0, 8);
        const seasonalCount = matches.filter(item=>item.seasonal).length;
        const eventCount = matches.filter(item => {
          const windows = item.place.eventDates || item.place.eventWindows;
          return Array.isArray(windows) && windows.some(window => window?.start <= lastTripKey && window?.end >= firstTripKey);
        }).length;
        const average = top.length ? top.reduce((sum,item)=>sum+item.score,0)/top.length : 0;
        return {region,originalIndex,quality:average+Math.log1p(matches.length)*0.35+seasonalCount*0.15+eventCount*5};
      }).sort((a,b)=>b.quality-a.quality||a.originalIndex-b.originalIndex);
      // A short trip plan should stay based in one region by default. Visitors
      // can deliberately choose more regions; otherwise a national sampler
      // creates unrealistic jumps between islands and distant cities.
      const regionCount = Math.min(ranked.length, 1);
      regionPlan = ranked.slice(0,regionCount).map(item=>item.region);
      if (regionPlan.length) notes.push(`No region was selected, so this draft focuses on ${regionPlan[0]}. Choose more than one region to include a transfer day between regions.`);
    }

    const originRegion = inferOriginRegion(origin);
    const originPoint = originMapPoint(origin, safePlaces);
    const initialTransfer = Boolean(originRegion && regionPlan[0] && originRegion !== regionPlan[0]);
    const maxRegions = Math.max(1, Math.floor((count - (initialTransfer ? 1 : 0) + 1) / 2));
    if (regionPlan.length > maxRegions) {
      const omitted = regionPlan.slice(maxRegions);
      regionPlan = regionPlan.slice(0,maxRegions);
      notes.push(`This trip is too short to cover every selected region with a connection day. The draft includes ${regionPlan.join(', ')} and leaves out ${omitted.join(', ')}.`);
    }
    const transferDays = Math.max(0, regionPlan.length - 1) + (initialTransfer ? 1 : 0);
    const sightseeingDays = Math.max(0, count - transferDays);
    const daysPerRegion = Math.floor(sightseeingDays / Math.max(1, regionPlan.length));
    let extraSightseeingDays = sightseeingDays % Math.max(1, regionPlan.length);
    const regionSchedule = [];
    if (initialTransfer) regionSchedule.push({region:regionPlan[0],transferFrom:String(origin),initial:true});
    regionPlan.forEach((region,index) => {
      const stayLength = daysPerRegion + (extraSightseeingDays-- > 0 ? 1 : 0);
      for (let day = 0; day < stayLength; day++) regionSchedule.push({region});
      if (index < regionPlan.length - 1) regionSchedule.push({region:regionPlan[index + 1],transferFrom:region});
    });

    let sawSeasonMatch = false;
    let hadUnseasonedDay = false;
    const activeLocalityByRegion = new Map();
    for (let offset = 0; offset < count; offset++) {
      const date = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate() + offset);
      const month = date.getMonth() + 1;
      const scheduledDay = regionSchedule[offset] || {region:regionPlan[0] || ''};
      let region = scheduledDay.region || '';
      if (scheduledDay.transferFrom) {
        resultDays.push({date:dateKey(date),month:MONTHS[month-1],region,places:[],note:`Travel day: connect from ${scheduledDay.transferFrom} to ${region}. No sightseeing stops are scheduled. Confirm transport, weather, and arrival timing before booking.`});
        continue;
      }
      const remaining = safePlaces.filter(place => !used.has(placeKey(place)) && (!safeRegions.length || safeRegions.includes(place.region)) && eventMatchesDate(place,date));
      let pool = remaining.filter(place => !region || place.region === region);
      if (!pool.length) {
        resultDays.push({ date: dateKey(date), month: MONTHS[month - 1], region: region || '', places: [], note: 'No more unused places match the selected regions. Add destinations or adjust the region choices.' });
        continue;
      }

      const scored = pool.map(place => ({ place, locality: localityKey(place), ...scorePlace(place, month, safeInterests, saved) }))
        .sort((a, b) => b.score - a.score || String(a.place.name).localeCompare(String(b.place.name)));
      const clusters = clusterCandidates(scored);
      const activeCluster = activeLocalityByRegion.get(region);
      const previousStops = resultDays.slice().reverse().find(day => day.region === region && day.places?.length)?.places || [];
      const previousPoint = mapPoint(previousStops.at(-1)) || (originRegion === region ? originPoint : null);
      const cluster = clusters.sort((a, b) => {
        if (activeCluster && a.key === activeCluster.key) return -1;
        if (activeCluster && b.key === activeCluster.key) return 1;
        if (previousPoint && a.center && b.center) return distanceKm(previousPoint, a.center) - distanceKm(previousPoint, b.center);
        const aRank = areaRouteRank(region, a.locality), bRank = areaRouteRank(region, b.locality);
        if (aRank >= 0 && bRank >= 0 && aRank !== bRank) return aRank - bRank;
        const aSeasonal = a.items.filter(item => item.seasonal), bSeasonal = b.items.filter(item => item.seasonal);
        const aBest = (aSeasonal.length ? aSeasonal : a.items)[0], bBest = (bSeasonal.length ? bSeasonal : b.items)[0];
        return bBest.score - aBest.score || b.items.length - a.items.length || a.locality.localeCompare(b.locality);
      })[0];
      const locality = cluster.locality, localCandidates = cluster.items;
      const seasonalCandidates = localCandidates.filter(item => item.seasonal);
      if (seasonalCandidates.length) sawSeasonMatch = true; else hadUnseasonedDay = true;
      const candidates = seasonalCandidates.length ? seasonalCandidates : localCandidates;
      activeLocalityByRegion.set(region, cluster);
      const fullDayStop = candidates.find(item => isFullDayPlace(item.place));
      const chosen = fullDayStop ? [fullDayStop.place] : candidates.slice(0, limit).map(item => item.place);
      const selected = shortestStopOrder(chosen, previousPoint);
      selected.forEach(place => used.add(placeKey(place)));
      region = selected[0]?.region || region;
      const priorDay = resultDays.at(-1);
      const priorLocality = priorDay?.locality || '';
      resultDays.push({
        date: dateKey(date), month: MONTHS[month - 1], region, locality,
        places: selected,
        transitionNote: priorDay?.locality && priorDay.region === region && priorLocality !== locality
          ? `Area change from ${priorLocality} to ${locality}. Check the local connection and allow enough time to travel.`
          : '',
        seasonalNote: selected.find(place => place.monthReasons?.[month])?.monthReasons?.[month] || selected.find(place => typeof place.seasonReason === 'string' && Array.isArray(place.months) && place.months.includes(month))?.seasonReason || ''
      });
    }
    if (!sawSeasonMatch) notes.push('The catalog has no month-specific research for these dates and regions. Suggestions are based on your interests and place descriptions; check seasonal conditions before booking.');
    else if (hadUnseasonedDay) notes.push('Some selected places have no month-specific note in the catalog. Treat those as general ideas and check seasonal conditions before booking.');
    const itineraryRegions = new Set(resultDays.map(day => day.region).filter(Boolean));
    if (itineraryRegions.size > 1) notes.push('This draft moves between regions. It does not calculate inter-city travel time, fares, or the best transport order; check each connection before booking.');
    const hasUnscheduledEvents = safePlaces.some(place => {
      const windows = place.eventDates || place.eventWindows;
      return Array.isArray(windows) && windows.length && !resultDays.some(day => windows.some(window => window?.start <= day.date && day.date <= window?.end));
    });
    if (hasUnscheduledEvents) notes.push('Some date-specific events were left out because their confirmed event dates do not overlap your trip dates. Check the official event calendar for other years.');
    if (safePlaces.some(place => mapPoint(place))) notes.push('Each day stays within about 8 km of a mapped point; stop order minimizes straight-line distance. Map points may mark a wider area, and live routes can differ.');
    notes.push('Suggested stop order only. Travel times, opening days, event schedules, and access can change; confirm them with linked official sources where available and live directions.');
    return { days: resultDays, notes };
  }

  function moveStop(plan, id, fromDay, toDay, index) {
    const days = Array.isArray(plan?.days) ? plan.days.map(day => ({ ...day, places: [...(day.places || [])] })) : [];
    if (!days[fromDay] || !days[toDay]) return { ...plan, days };
    const position = days[fromDay].places.findIndex(place => placeKey(place) === String(id));
    if (position < 0) return { ...plan, days };
    const [place] = days[fromDay].places.splice(position, 1);
    const destinationIndex = Math.max(0, Math.min(days[toDay].places.length, Number.isInteger(index) ? index : days[toDay].places.length));
    days[toDay].places.splice(destinationIndex, 0, place);
    if (!days[toDay].region) days[toDay].region = place.region || '';
    return { ...plan, days };
  }

  function removeStop(plan, dayIndex, id) {
    const days = Array.isArray(plan?.days) ? plan.days.map(day => ({ ...day, places: (day.places || []).filter(place => placeKey(place) !== String(id)) })) : [];
    return { ...plan, days };
  }

  return Object.freeze({ buildItinerary, moveStop, removeStop, placeKey, PACE_LIMITS });
});
