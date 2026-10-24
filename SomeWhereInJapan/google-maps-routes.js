(function (root) {
  'use strict';

  function addressOf(point, fallbackArea = '') {
    if (!point) return '';
    const address = String(point.address || '').trim().replace(/[·•]/g, ',').replace(/\s*,\s*/g, ', ');
    if (address) return address;
    const name = String(point.name || '').trim();
    const area = String(point.area || fallbackArea || '').replace(/[·•]/g, ',').replace(/\s*,\s*/g, ', ').trim();
    return [name, area, 'Japan'].filter(Boolean).join(', ');
  }

  function mapsUrl({ origin, destination, waypoints = [], mode = 'walking' }) {
    if (!origin || !destination) return null;
    const params = [
      `api=1`,
      `origin=${encodeURIComponent(origin)}`,
      `destination=${encodeURIComponent(destination)}`,
      `travelmode=${encodeURIComponent(mode)}`
    ];
    if (waypoints.length) params.push(`waypoints=${encodeURIComponent(waypoints.join('|'))}`);
    return `https://www.google.com/maps/dir/?${params.join('&')}`;
  }

  function buildWalkingRouteUrl(route) {
    if (!route?.origin?.returnPoint || !route.origin?.name || !Array.isArray(route.stops) || !route.stops.length) return null;
    if (!Array.isArray(route.legs) || route.legs.length < route.stops.length) return null;
    const fullyWalking = route.legs.every(leg => leg.mode === 'walking');
    if (!fullyWalking && route.walkingRouteVerified !== true) return null;
    const stops = [...route.stops].sort((a, b) => a.order - b.order);
    if (stops.some(stop => !stop.name || !(stop.address || stop.coordinates))) return null;
    const locality = route.cityId && route.cityId !== 'destination' ? route.cityId : 'Japan';
    const origin = addressOf(route.origin, locality);
    const destination = origin;
    const waypoints = stops.map(stop => stop.area
      ? addressOf({ name: stop.name, area: stop.area }, locality)
      : addressOf(stop, locality));
    return mapsUrl({ origin, destination, waypoints });
  }

  function buildStationToPlaceUrl(originPoint, destinationPoint, { firstLegMode = 'walking' } = {}) {
    if (!originPoint || !destinationPoint || firstLegMode !== 'walking') return null;
    if (!/station|bus stop|tram stop/i.test(originPoint.name || '')) return null;
    const origin = addressOf(originPoint);
    const destination = addressOf(destinationPoint);
    if (!origin || !destination || origin.toLocaleLowerCase() === destination.toLocaleLowerCase()) return null;
    return mapsUrl({ origin, destination });
  }

  function buildTransitRouteUrl(originPoint, destinationPoint) {
    if (!originPoint || !destinationPoint) return null;
    const origin = addressOf(originPoint);
    const destination = addressOf(destinationPoint);
    if (!origin || !destination || origin.toLocaleLowerCase() === destination.toLocaleLowerCase()) return null;
    return mapsUrl({ origin, destination, mode: 'transit' });
  }

  const api = Object.freeze({ addressOf, buildWalkingRouteUrl, buildStationToPlaceUrl, buildTransitRouteUrl });
  root.GoogleMapsRoutes = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
