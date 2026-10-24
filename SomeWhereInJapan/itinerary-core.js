(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.JapanItineraryCore = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const PACE_LIMITS = Object.freeze({ relaxed: 2, balanced: 3, active: 4 });
  const MONTHS = Object.freeze(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']);
  const placeKey = place => String(place?.id || place?.slug || place?.name || '');

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

  function buildItinerary({ destinations = [], startDate, days = 0, regions = [], interests = [], pace = 'balanced', savedIds = [] } = {}) {
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
      const ranked = availableRegions.map((region, originalIndex) => {
        const matches = safePlaces.filter(place => place.region === region).map(place => ({place,...scorePlace(place,firstMonth,safeInterests,saved)})).sort((a,b)=>b.score-a.score);
        const top = matches.slice(0, 8);
        const seasonalCount = matches.filter(item=>item.seasonal).length;
        const average = top.length ? top.reduce((sum,item)=>sum+item.score,0)/top.length : 0;
        return {region,originalIndex,quality:average+Math.log1p(matches.length)*0.35+seasonalCount*0.15};
      }).sort((a,b)=>b.quality-a.quality||a.originalIndex-b.originalIndex);
      const regionCount = Math.min(ranked.length, 4, Math.max(1, Math.ceil(count/4)));
      regionPlan = ranked.slice(0,regionCount).map(item=>item.region);
    }

    let sawSeasonMatch = false;
    let hadUnseasonedDay = false;
    for (let offset = 0; offset < count; offset++) {
      const date = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate() + offset);
      const month = date.getMonth() + 1;
      const assignedIndex = Math.min(regionPlan.length - 1, Math.floor(offset * regionPlan.length / count));
      let region = regionPlan[assignedIndex] || '';
      const remaining = safePlaces.filter(place => !used.has(placeKey(place)) && (!safeRegions.length || safeRegions.includes(place.region)));
      let pool = remaining.filter(place => !region || place.region === region);
      if (!pool.length) {
        for (let step = 1; step < regionPlan.length; step++) {
          const candidateRegion = regionPlan[(assignedIndex + step) % regionPlan.length];
          const candidatePool = remaining.filter(place => place.region === candidateRegion);
          if (candidatePool.length) { region = candidateRegion; pool = candidatePool; break; }
        }
      }
      if (!pool.length && !safeRegions.length) pool = remaining;
      if (!pool.length) {
        resultDays.push({ date: dateKey(date), month: MONTHS[month - 1], region: region || '', places: [], note: 'No more unused places match the selected regions. Add destinations or adjust the region choices.' });
        continue;
      }

      const scored = pool.map(place => ({ place, ...scorePlace(place, month, safeInterests, saved) }))
        .sort((a, b) => b.score - a.score || String(a.place.name).localeCompare(String(b.place.name)));
      const seasonalCandidates = scored.filter(item => item.seasonal);
      if (seasonalCandidates.length) sawSeasonMatch = true;
      else hadUnseasonedDay = true;
      const candidates = seasonalCandidates.length ? seasonalCandidates : scored;
      const selected = candidates.slice(0, limit).map(item => item.place);
      selected.forEach(place => used.add(placeKey(place)));
      region = selected[0]?.region || region;
      resultDays.push({
        date: dateKey(date), month: MONTHS[month - 1], region,
        places: selected,
        seasonalNote: selected.find(place => place.monthReasons?.[month])?.monthReasons?.[month] || selected.find(place => typeof place.seasonReason === 'string' && Array.isArray(place.months) && place.months.includes(month))?.seasonReason || ''
      });
    }
    if (!sawSeasonMatch) notes.push('The catalog has no month-specific research for these dates and regions. Suggestions are based on your interests and place descriptions; check seasonal conditions before booking.');
    else if (hadUnseasonedDay) notes.push('Some selected places have no month-specific note in the catalog. Treat those as general ideas and check seasonal conditions before booking.');
    const itineraryRegions = new Set(resultDays.map(day => day.region).filter(Boolean));
    if (itineraryRegions.size > 1) notes.push('This draft moves between regions. It does not calculate inter-city travel time, fares, or the best transport order; check each connection before booking.');
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
