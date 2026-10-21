(function attachDayTripCore(root) {
  'use strict';

  const STORAGE_KEY = 'somewhereJapanTokyoDayTrips';
  const INTERESTS = new Set(['balanced', 'culture', 'nature', 'food']);
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const DEFAULTS = Object.freeze({
    month: new Date().getMonth() + 1,
    time: 'full',
    transport: 'public',
    budget: 15000,
    interest: 'balanced',
    compareIds: []
  });

  function uniqueKnownIds(ids, validIds) {
    const allowed = new Set(validIds || []);
    const known = (Array.isArray(ids) ? ids : [])
      .filter((id) => typeof id === 'string' && allowed.has(id));
    return [...new Set(known)].slice(0, 3);
  }

  function sanitizeState(value, validIds) {
    const source = value && typeof value === 'object' ? value : {};
    const month = Number(source.month);
    const budget = Number(source.budget);
    return {
      month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : DEFAULTS.month,
      time: source.time === 'half' || source.time === 'full' ? source.time : DEFAULTS.time,
      transport: source.transport === 'car' || source.transport === 'public' ? source.transport : DEFAULTS.transport,
      budget: Number.isFinite(budget) && budget >= 0 ? Math.min(Math.round(budget), 100000) : DEFAULTS.budget,
      interest: INTERESTS.has(source.interest) ? source.interest : DEFAULTS.interest,
      compareIds: uniqueKnownIds(source.compareIds, validIds || []),
      selectedId: typeof source.selectedId === 'string' && (validIds || []).includes(source.selectedId) ? source.selectedId : null
    };
  }

  function modeFor(trip, transport) {
    return trip && trip.modes && trip.modes[transport] ? trip.modes[transport] : null;
  }

  function routeFor(trip, transport, time) {
    const mode = modeFor(trip, transport);
    if (!mode) return null;
    return mode.profiles ? mode.profiles[time] || null : mode;
  }

  function fitsTime(route, time) {
    const maxHours = Number(route && route.totalHours && route.totalHours.max);
    if (!Number.isFinite(maxHours)) return false;
    if (time === 'half') return maxHours <= 6;
    if (time === 'full') return maxHours > 6 && maxHours <= 12;
    return false;
  }

  function filterTrips(trips, criteria) {
    const state = sanitizeState(criteria);
    const found = (Array.isArray(trips) ? trips : []).filter((trip) => {
      if (!trip || !Array.isArray(trip.months) || !trip.months.includes(state.month)) return false;
      const route = routeFor(trip, state.transport, state.time);
      const maxCost = Number(route && route.costYen && route.costYen.max);
      return Boolean(route) && fitsTime(route, state.time) && Number.isFinite(maxCost) && maxCost <= state.budget;
    });

    found.sort((a, b) => {
      const aMatches = state.interest !== 'balanced' && Array.isArray(a.interests) && a.interests.includes(state.interest) ? 1 : 0;
      const bMatches = state.interest !== 'balanced' && Array.isArray(b.interests) && b.interests.includes(state.interest) ? 1 : 0;
      if (aMatches !== bMatches) return bMatches - aMatches;
      const aHours = Number(routeFor(a, state.transport, state.time).totalHours.max);
      const bHours = Number(routeFor(b, state.transport, state.time).totalHours.max);
      if (aHours !== bHours) return aHours - bHours;
      return String(a.slug || a.id).localeCompare(String(b.slug || b.id));
    });
    return found.slice(0, 3);
  }

  function createNoMatchMessage(trips, criteria) {
    const state = sanitizeState(criteria);
    const allTrips = Array.isArray(trips) ? trips : [];
    const sameMonth = allTrips.filter((trip) => Array.isArray(trip.months) && trip.months.includes(state.month));
    const sameMode = sameMonth.filter((trip) => modeFor(trip, state.transport));

    if (!sameMode.length) {
      const alternateMode = state.transport === 'public' ? 'car' : 'public';
      if (sameMonth.some((trip) => routeFor(trip, alternateMode))) {
        return `No researched ${state.transport === 'public' ? 'public-transport' : 'car'} route is listed for this month. Try ${state.transport === 'public' ? 'car' : 'public transport'} or choose another month.`;
      }
      const availableMonths = allTrips.flatMap((trip) => trip.months || []);
      const nearest = [...new Set(availableMonths)].sort((a, b) => {
        const distance = (month) => Math.min(Math.abs(month - state.month), 12 - Math.abs(month - state.month));
        return distance(a) - distance(b);
      })[0];
      return nearest ? `No pilot route is listed for ${MONTH_NAMES[state.month - 1]}. Try ${MONTH_NAMES[nearest - 1]} or browse all five guides below.` : 'No routes are available for these choices. Browse all five guides below.';
    }

    const windowTrips = sameMode.filter((trip) => {
      const route = routeFor(trip, state.transport, state.time);
      return route && fitsTime(route, state.time);
    });
    if (!windowTrips.length && state.time === 'half') {
      const fullDayTrips = sameMode.filter((trip) => {
        const route = routeFor(trip, state.transport, 'full');
        return route && fitsTime(route, 'full');
      });
      if (fullDayTrips.length) {
        const minimumBudget = Math.min(...fullDayTrips.map((trip) => Number(routeFor(trip, state.transport, 'full').costYen.max)));
        return `No half-day route fits. Try a full day${minimumBudget > state.budget ? ` and set the budget to at least ¥${minimumBudget.toLocaleString('en-US')}` : ''}.`;
      }
    }

    if (!windowTrips.length) return 'No listed route fits this time window. Try another month or browse all five guides below.';
    const minimumBudget = Math.min(...windowTrips.map((trip) => Number(routeFor(trip, state.transport, state.time).costYen.max)));
    if (Number.isFinite(minimumBudget)) {
      return `No route fits the budget. Set it to at least ¥${minimumBudget.toLocaleString('en-US')} or choose another month.`;
    }
    return 'No listed route fits. Try a longer outing, another month, or a higher budget.';
  }

  function readSharedPlan(search, trips) {
    const params = new URLSearchParams(typeof search === 'string' ? search : '');
    const tripIds = params.getAll('trip');
    const validIds = (Array.isArray(trips) ? trips : []).map((trip) => String(trip.id || trip.slug || ''));
    const rawBudget = params.get('budget');
    return sanitizeState({
      month: params.get('month'),
      time: params.get('time'),
      transport: params.get('transport'),
      budget: rawBudget === null ? NaN : Number(rawBudget),
      interest: params.get('interest'),
      compareIds: tripIds,
      selectedId: params.get('selected')
    }, validIds);
  }

  function buildShareUrl(baseUrl, state) {
    const url = new URL(baseUrl);
    const safe = sanitizeState(state, [...(state && state.compareIds || []), state && state.selectedId].filter(Boolean));
    url.searchParams.set('month', String(safe.month));
    url.searchParams.set('time', safe.time);
    url.searchParams.set('transport', safe.transport);
    url.searchParams.set('budget', String(safe.budget));
    url.searchParams.set('interest', safe.interest);
    if (safe.selectedId) url.searchParams.set('selected', safe.selectedId);
    else url.searchParams.delete('selected');
    url.searchParams.delete('trip');
    safe.compareIds.forEach((id) => url.searchParams.append('trip', id));
    return url.toString();
  }

  function savePlan(storage, state) {
    try {
      const safe = sanitizeState(state, [...(state && state.compareIds || []), state && state.selectedId].filter(Boolean));
      storage.setItem(STORAGE_KEY, JSON.stringify(safe));
      return true;
    } catch (_error) {
      return false;
    }
  }

  function loadPlan(storage, validIds) {
    try {
      const serialized = storage.getItem(STORAGE_KEY);
      if (!serialized) return null;
      return sanitizeState(JSON.parse(serialized), validIds);
    } catch (_error) {
      return null;
    }
  }

  const api = Object.freeze({
    STORAGE_KEY,
    DEFAULTS,
    filterTrips,
    createNoMatchMessage,
    readSharedPlan,
    buildShareUrl,
    savePlan,
    loadPlan
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.TokyoDayTripCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
