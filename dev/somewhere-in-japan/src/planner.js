const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

export function validateTrip(input = {}) {
  const errors = [];
  const start = parseDate(input.startDate);
  const end = parseDate(input.endDate);

  if (!start) errors.push('Choose a valid start date.');
  if (!end) errors.push('Choose a valid end date.');
  if (start && end && end < start) errors.push('The end date must be after the start date.');
  if (!String(input.origin ?? '').trim()) errors.push('Enter a starting point.');

  return { valid: errors.length === 0, errors };
}

export function getRecordStatus(record = {}, asOf = new Date()) {
  if (record.status === 'sample') return { label: 'Sample planning data', kind: 'sample' };
  if (record.status === 'estimated') return { label: 'Planning estimate', kind: 'estimated' };
  if (record.status === 'stale') return { label: 'Source is stale', kind: 'stale' };
  if (record.status === 'verified' && parseDate(record.checkedAt)) {
    const today = asOf instanceof Date ? asOf : parseDate(asOf);
    if (!today) return { label: 'Unverified', kind: 'unknown' };
    const ageDays = (Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - parseDate(record.checkedAt).getTime()) / 86400000;
    if (ageDays < 0 || ageDays > 90) return { label: 'Source is stale', kind: 'stale' };
    return { label: `Source checked ${record.checkedAt}`, kind: 'verified' };
  }
  return { label: 'Unverified', kind: 'unknown' };
}

export function validateData(data = {}) {
  const errors = [];
  const places = Array.isArray(data.places) ? data.places : [];
  const routes = Array.isArray(data.routes) ? data.routes : [];
  const events = Array.isArray(data.events) ? data.events : [];
  const localities = Array.isArray(data.localities) ? data.localities : [];
  const seenPlaceIds = new Set();
  const knownLocalities = new Set(localities.map((locality) => locality?.id).filter(Boolean));
  const allowedStatuses = new Set(['sample', 'verified', 'estimated', 'stale', 'unverified']);

  for (const [index, place] of places.entries()) {
    const label = `Place ${index + 1}`;
    if (!place?.id || !place?.name || !place?.localityId) {
      errors.push(`${label} needs an id, name, and locality.`);
    }
    if (place?.id && seenPlaceIds.has(place.id)) errors.push(`Duplicate place id: ${place.id}.`);
    if (place?.id) seenPlaceIds.add(place.id);
    if (place?.status && !allowedStatuses.has(place.status)) errors.push(`${label} has an unknown data status.`);
    if (knownLocalities.size && place?.localityId && !knownLocalities.has(place.localityId)) errors.push(`${label} references an unknown locality.`);
    if (!Number.isFinite(place?.durationHours) || place.durationHours <= 0 || place.durationHours > 12) {
      errors.push(`${label} has an invalid visit duration.`);
    }
    if (place?.status !== 'sample' && (!isHttpUrl(place?.sourceUrl) || !parseDate(place?.checkedAt))) {
      errors.push(`${label} needs a source URL and checked date.`);
    }
  }

  const seenRouteIds = new Set();
  for (const [index, route] of routes.entries()) {
    if (!route?.id || seenRouteIds.has(route.id)) errors.push(`Route ${index + 1} has a missing or duplicate id.`);
    if (route?.id) seenRouteIds.add(route.id);
    if (!Array.isArray(route?.localityIds) || route.localityIds.length < 1) errors.push(`Route ${index + 1} needs locality ids.`);
    if (knownLocalities.size && (route?.localityIds || []).some((id) => !knownLocalities.has(id))) errors.push(`Route ${route.id || index + 1} references an unknown locality.`);
    if (route?.status && !allowedStatuses.has(route.status)) errors.push(`Route ${route.id || index + 1} has an unknown data status.`);
    for (const transfer of route?.transfers || []) {
      if (!route.localityIds?.includes(transfer.from) || !route.localityIds?.includes(transfer.to) || !Number.isInteger(transfer.days) || transfer.days < 0 || transfer.days > 2 || !transfer.guidance) {
        errors.push(`Route ${route.id || index + 1} has incomplete transfer guidance.`);
      }
    }
    if (route?.transferDays !== undefined && (!Number.isInteger(route.transferDays) || route.transferDays < 0 || route.transferDays > 2)) {
      errors.push(`Route ${index + 1} has an invalid transfer-day estimate.`);
    }
  }

  const localityIds = new Set();
  for (const [index, locality] of localities.entries()) {
    if (!locality?.id || localityIds.has(locality.id)) errors.push(`Locality ${index + 1} has a missing or duplicate id.`);
    if (locality?.id) localityIds.add(locality.id);
  }

  const seenEventIds = new Set();
  for (const [index, event] of events.entries()) {
    const start = parseDate(event?.startDate);
    const end = parseDate(event?.endDate);
    if (!event?.id || seenEventIds.has(event.id)) errors.push(`Event ${index + 1} has a missing or duplicate id.`);
    if (event?.id) seenEventIds.add(event.id);
    if (!event?.name || !start || !end || end < start) errors.push(`Event ${event?.name || index + 1} has an invalid event date range.`);
    if (event?.status && !allowedStatuses.has(event.status)) errors.push(`Event ${event.name || index + 1} has an unknown data status.`);
    if (event?.placeId && !seenPlaceIds.has(event.placeId) && !places.some((place) => place.id === event.placeId)) errors.push(`Event ${event.name || index + 1} references an unknown place.`);
    if (knownLocalities.size && event?.localityId && !knownLocalities.has(event.localityId)) errors.push(`Event ${event.name || index + 1} references an unknown locality.`);
    if (event?.status !== 'sample' && (!isHttpUrl(event?.sourceUrl) || !parseDate(event?.checkedAt))) {
      errors.push(`Event ${event?.name || index + 1} needs a source URL and checked date.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function buildItinerary(input = {}, data = {}) {
  const validation = validateTrip(input);
  if (!validation.valid) return { days: [], warnings: validation.errors.map((message) => ({ severity: 'error', message })) };

  const route = (data.routes || []).find((candidate) => (input.selectedRegions || []).includes(candidate.regionId))
    || (data.routes || []).find((candidate) => candidate.id === input.routeId);
  if (!route) return { days: [], warnings: [{ severity: 'error', message: 'Choose a sample route to build this draft.' }] };

  const localityById = new Map((data.localities || []).map((locality) => [locality.id, locality]));
  const eventPlaceIds = new Set((data.events || []).map((event) => event.placeId).filter(Boolean));
  const selectedBases = new Set(input.preferredBases || []);
  const routeLocalities = selectedBases.size ? route.localityIds.filter((id) => selectedBases.has(id)) : route.localityIds;
  const places = (data.places || []).filter((place) => routeLocalities.includes(place.localityId) && !eventPlaceIds.has(place.id));
  const start = parseDate(input.startDate);
  const end = parseDate(input.endDate);
  const capacity = input.pace === 'relaxed' ? 2 : input.pace === 'active' ? 4 : 3;
  const days = [];
  const warnings = [{ severity: 'notice', message: 'This is a sample planning draft. Transfer times, timetables, fares, weather, and opening hours are not live-verified.' }];
  for (const event of (data.events || [])) {
    if (event.endDate < input.startDate || event.startDate > input.endDate) {
      warnings.push({ severity: 'notice', message: `${event.name} is an event outside this trip’s dates and was not scheduled.` });
    }
  }
  let cursor = new Date(start);
  const dayCount = Math.round((end - start) / 86400000) + 1;
  for (let index = 0; index < dayCount; index += 1) {
    const date = new Date(cursor);
    const isoDate = date.toISOString().slice(0, 10);
    days.push({ date: isoDate, type: 'sightseeing', localityId: null, base: null, stops: [], transferNotes: [], dataStatus: 'sample' });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const lateArrival = input.arrivalTime && input.arrivalTime >= '15:00';
  const earlyDeparture = input.departureTime && input.departureTime <= '11:00';
  if (lateArrival) {
    days[0].type = 'partial';
    days[0].transferNotes.push('Late arrival: no sightseeing stops scheduled.');
  }
  if (earlyDeparture) {
    days[days.length - 1].type = 'partial';
    days[days.length - 1].transferNotes.push('Early departure: no sightseeing stops scheduled.');
  }

  const originRegion = inferRegion(input.origin, data.localities || []);
  const firstLocality = localityById.get(route.localityIds[0]);
  let dayIndex = 0;
  let pendingLocalTransferNote = '';
  if ((!originRegion || (firstLocality && originRegion !== firstLocality.regionId)) && firstLocality) {
    days[dayIndex].type = 'transfer';
    days[dayIndex].localityId = firstLocality.id;
    days[dayIndex].base = firstLocality.base || firstLocality.name;
    days[dayIndex].transferNotes.push(originRegion
      ? `Travel from ${input.origin.trim()} toward ${firstLocality.name}. This full day is reserved for the long-distance connection; confirm the actual route and schedule.`
      : `The starting point “${input.origin.trim()}” is not recognized. This day is left for travel toward ${firstLocality.name}; confirm the actual route and schedule.`);
    dayIndex += 1;
  } else if (lateArrival) {
    dayIndex += 1;
  }

  const mustSee = new Set(input.mustSee || []);
  const orderedPlaces = [...places].sort((a, b) => Number(mustSee.has(b.id)) - Number(mustSee.has(a.id)) || (a.order ?? 0) - (b.order ?? 0));
  let lastLocalityId = null;
  if (selectedBases.size && routeLocalities.length === 0) warnings.push({ severity: 'warning', message: 'None of the preferred overnight bases match this route. Select one of its listed bases.' });
  for (const localityId of routeLocalities) {
    const locality = localityById.get(localityId);
    if (!locality) {
      warnings.push({ severity: 'warning', message: `Route data is incomplete: locality “${localityId}” is missing.` });
      continue;
    }
    if (lastLocalityId && dayIndex < days.length) {
      const previous = localityById.get(lastLocalityId);
      const transfer = (route.transfers || []).find((segment) => segment.from === lastLocalityId && segment.to === localityId);
      const transferDays = transfer?.days ?? route.transferDays ?? 1;
      const guidance = transfer?.guidance || `Transfer from ${previous.name} to ${locality.name}. This buffer is sample route guidance; verify the actual connection.`;
      if (transferDays === 0) pendingLocalTransferNote = guidance;
      for (let transfer = 0; transfer < transferDays && dayIndex < days.length; transfer += 1) {
        if (days[dayIndex].type === 'partial') {
          warnings.push({ severity: 'warning', message: `The ${previous.name} to ${locality.name} transfer has no full day available before departure; add a trip day or remove a base.` });
          dayIndex += 1;
          continue;
        }
        days[dayIndex].type = 'transfer';
        days[dayIndex].localityId = locality.id;
        days[dayIndex].base = locality.base || locality.name;
        days[dayIndex].transferNotes.push(guidance);
        dayIndex += 1;
      }
    }
    if (dayIndex >= days.length) {
      warnings.push({ severity: 'warning', message: `The selected route needs more than ${days.length} days including transfer buffers. Shorten the route or add trip days.` });
      break;
    }

    const availablePlaces = orderedPlaces.filter((place) => place.localityId === localityId);
    while (availablePlaces.length && dayIndex < days.length) {
      const day = days[dayIndex];
      if (day.type === 'partial') {
        dayIndex += 1;
        continue;
      }
      day.localityId = locality.id;
      day.base = locality.base || locality.name;
      if (pendingLocalTransferNote) {
        day.transferNotes.push(pendingLocalTransferNote);
        pendingLocalTransferNote = '';
      }
      let usedHours = 0;
      while (availablePlaces.length && day.stops.length < capacity) {
        const place = availablePlaces[0];
        if (usedHours + place.durationHours > 8 && day.stops.length > 0) break;
        availablePlaces.shift();
        usedHours += place.durationHours;
        day.stops.push({ ...place, event: null });
      }
      const dayEvents = (data.events || []).filter((event) => event.localityId === localityId);
      for (const event of dayEvents) {
        const matchingDay = days.find((candidate) => candidate.type === 'sightseeing' && candidate.date >= event.startDate && candidate.date <= event.endDate && candidate.localityId === localityId && candidate.stops.length < capacity);
        const eventPlace = (data.places || []).find((place) => place.id === event.placeId);
        if (matchingDay && eventPlace && !matchingDay.stops.some((stop) => stop.id === eventPlace.id)) {
          matchingDay.stops.push({ ...eventPlace, event });
        }
      }
      if (day.stops.some((stop) => stop.status !== 'verified')) day.dataStatus = 'sample';
      dayIndex += 1;
      if (availablePlaces.length) {
        warnings.push({ severity: 'warning', message: `The ${locality.name} sample stops exceed the available day capacity; some places were left out.` });
      }
    }
    lastLocalityId = localityId;
  }

  for (const event of (data.events || [])) {
    const inWindow = event.endDate >= input.startDate && event.startDate <= input.endDate;
    if (inWindow && !days.some((day) => day.stops.some((stop) => stop.event?.id === event.id))) {
      warnings.push({ severity: 'warning', message: `${event.name} falls during the trip window, but this route or its available days do not support scheduling it as confirmed.` });
    }
  }
  if (lastLocalityId && dayIndex < days.length) {
    const finalLocality = localityById.get(lastLocalityId);
    const openDays = days.slice(dayIndex).filter((day) => day.type === 'sightseeing');
    for (const day of days.slice(dayIndex)) {
      if (day.type !== 'sightseeing') continue;
      day.type = 'buffer';
      day.localityId = finalLocality.id;
      day.base = finalLocality.base || finalLocality.name;
      day.transferNotes.push(`Open rest or weather buffer at ${finalLocality.name}. No sample attractions are added to this day.`);
    }
    if (openDays.length) warnings.push({ severity: 'notice', message: `${openDays.length} day${openDays.length === 1 ? '' : 's'} remain open as rest or weather buffers at ${finalLocality.name}; this sample route has no additional stops for them.` });
  }
  if (input.endPoint && input.endPoint.trim()) warnings.push({ severity: 'notice', message: `Final transfer reminder: add a verified connection from ${lastLocalityId ? localityById.get(lastLocalityId)?.name : 'the final base'} to ${input.endPoint.trim()}.` });
  const scheduledPlaceIds = new Set(days.flatMap((day) => day.stops.map((stop) => stop.id)));
  const missedMustSee = (data.places || []).filter((place) => mustSee.has(place.id) && !scheduledPlaceIds.has(place.id));
  if (missedMustSee.length) warnings.push({ severity: 'warning', message: `Must-see places not scheduled: ${missedMustSee.map((place) => place.name).join(', ')}. Add days or change preferred bases.` });
  return { days, warnings };
}

function inferRegion(origin, localities) {
  const normalized = String(origin || '').toLowerCase();
  if (/tokyo|yokohama|haneda|narita|kawagoe/.test(normalized)) return 'kanto';
  if (/sapporo|new chitose|hokkaido/.test(normalized)) return 'hokkaido';
  if (/kyoto|osaka|kansai|kix|nara/.test(normalized)) return 'kansai';
  if (/naha|okinawa|ishigaki/.test(normalized)) return 'okinawa';
  return localities.find((locality) => normalized.includes(locality.name.toLowerCase()))?.regionId || null;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}
