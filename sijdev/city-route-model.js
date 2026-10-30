'use strict';

const VALID_MODES = new Set(['walking','transit','driving','ferry','cable-car']);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function sourceMap(route) {
  return new Map((route.sources || []).map(source => [source.id, source]));
}

function validDate(value) {
  if (typeof value !== 'string' || !DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10) === value;
}

function validateCityRoute(route, origins = [], manifest = {records:[]}, routeGuides = {records:[]}) {
  const issues = [];
  if (!route || typeof route !== 'object') return [{code:'invalid-route',message:'Route must be an object'}];
  const sources = sourceMap(route);
  const sourceRefsValid = ids => Array.isArray(ids) && ids.length > 0 && ids.every(id => sources.has(id));
  const city = origins.find(origin => origin.id === route.cityId);
  if (!city) issues.push({code:'unsupported-city',message:`Unsupported city id: ${route.cityId || 'missing'}`});
  if (!route.origin?.id || !route.origin?.name) issues.push({code:'missing-origin',message:'Route needs a named station origin'});
  validateCoordinate(route.origin, 'origin', issues, sourceRefsValid);
  if (!['unresearched','in-progress','partially-verified','verified'].includes(route.researchStatus)) issues.push({code:'invalid-research-status',message:'Route research status is invalid'});
  for (const source of route.sources || []) {
    if (!source.id || !source.url || !validDate(source.checkedOn)) issues.push({code:'invalid-source',sourceId:source.id || null,message:'Route sources need an id, URL, and real checkedOn date'});
  }
  if (!Array.isArray(route.stops) || route.stops.length < 2) issues.push({code:'missing-stops',message:'A full-day city route needs at least two ordered stops'});
  const stopIds = new Set();
  for (const [index, stop] of (route.stops || []).entries()) {
    if (!stop.id || stopIds.has(stop.id)) issues.push({code:'invalid-stop-id',stopId:stop.id || null,message:'Stops need unique stable ids'});
    stopIds.add(stop.id);
    if (stop.order !== index + 1) issues.push({code:'invalid-stop-order',stopId:stop.id || null,message:'Stop order must be sequential and one-based'});
    validateCoordinate(stop, stop.id || `stop-${index+1}`, issues, sourceRefsValid);
    validateDuration(stop.visitDuration, stop.id || `stop-${index+1}`, 'visit-duration', issues, sourceRefsValid, route.researchStatus === 'verified');
    if (stop.guideRef) {
      const indexData = stop.guideRef.type === 'destination' ? manifest?.records || [] : stop.guideRef.type === 'route-guide' ? routeGuides?.records || [] : [];
      if (!['destination','route-guide'].includes(stop.guideRef.type) || !indexData.some(item => item.id === stop.guideRef.id || item.canonicalId === stop.guideRef.id)) {
        issues.push({code:'guide-ref-missing',stopId:stop.id,message:`Guide reference does not resolve: ${stop.guideRef.id}`});
      }
    }
  }
  const legs = Array.isArray(route.legs) ? route.legs : [];
  const originId = route.origin?.id;
  if (legs.length < (route.stops?.length || 0) + 1) issues.push({code:'missing-return-leg',message:'Route needs an arrival leg, each connecting leg, and an explicit return to origin'});
  if (legs.length && legs[0].fromId !== originId) issues.push({code:'invalid-first-leg',message:'First leg must start at the named origin'});
  if (legs.length && legs[legs.length-1].toId !== originId) issues.push({code:'missing-return-leg',message:'Last leg must return to the named origin'});
  for (const [index, leg] of legs.entries()) {
    if (!leg.id || !leg.fromId || !leg.toId || !VALID_MODES.has(leg.mode)) issues.push({code:'invalid-leg',legId:leg.id || null,message:'Leg needs ids, endpoints, and a supported travel mode'});
    validateDuration(leg.duration, leg.id || `leg-${index+1}`, 'duration', issues, sourceRefsValid, route.researchStatus === 'verified');
    if (leg.geometry?.status === 'verified' && !sourceRefsValid(leg.geometry.sourceIds)) issues.push({code:'geometry-source-missing',legId:leg.id,message:'Verified leg geometry needs source ids'});
  }
  for (const allowance of route.allowances || []) {
    if (!allowance.id || !['meal','buffer','rest'].includes(allowance.type)) issues.push({code:'invalid-allowance',allowanceId:allowance.id || null,message:'Time allowances need an id and a supported type'});
    validateDuration(allowance.duration, allowance.id || 'allowance', 'duration', issues, sourceRefsValid, route.researchStatus === 'verified');
  }
  for (const [key, variant] of Object.entries(route.variants || {})) {
    if (key === 'half-day' && (variant.independentResearch !== true || variant.researchStatus !== 'verified' || !sourceRefsValid(variant.sourceIds))) {
      issues.push({code:'variant-not-independently-researched',variant:key,message:'Half-day routes need their own verified research and sources'});
    }
    if (!Array.isArray(variant.stopIds) || variant.stopIds.some(id => !stopIds.has(id))) issues.push({code:'invalid-variant-stops',variant:key,message:'Route variants may refer only to known stops'});
  }
  return issues;
}

function validateCoordinate(point, id, issues, sourceRefsValid) {
  const coordinates = point?.coordinates;
  if (!coordinates || !Number.isFinite(coordinates.latitude) || coordinates.latitude < -90 || coordinates.latitude > 90 || !Number.isFinite(coordinates.longitude) || coordinates.longitude < -180 || coordinates.longitude > 180) {
    issues.push({code:'invalid-coordinates',id,message:'Map positions must contain valid latitude/longitude'});
  }
  if (!sourceRefsValid(coordinates?.sourceIds)) issues.push({code:'coordinate-source-missing',id,message:'Every map position needs a source id'});
}

function validateDuration(value, id, label, issues, sourceRefsValid, required) {
  if (!value || value.status === 'unknown') {
    if (required) issues.push({code:'unknown-duration',componentId:id,message:`Verified routes cannot have an unknown ${label}`});
    return;
  }
  if (value.status !== 'known' || !Number.isFinite(value.minMinutes) || !Number.isFinite(value.maxMinutes) || value.minMinutes < 0 || value.maxMinutes < value.minMinutes) {
    issues.push({code:'invalid-duration',componentId:id,message:`${label} needs a valid known range or explicit unknown status`});
    return;
  }
  if (!sourceRefsValid(value.sourceIds)) issues.push({code:'duration-source-missing',componentId:id,message:`Every ${label} estimate needs a source id`});
}

function validateCityRouteRegistry(routes, origins) {
  const issues = [];
  const ids = (routes || []).map(route => route.cityId);
  const expected = (origins || []).map(origin => origin.id);
  for (const id of expected) if (!ids.includes(id)) issues.push({code:'city-route-missing',cityId:id,message:`No route record for ${id}`});
  for (const id of ids) if (ids.filter(candidate => candidate === id).length > 1) issues.push({code:'duplicate-city-route',cityId:id,message:`Multiple route records for ${id}`});
  for (const id of ids) if (!expected.includes(id)) issues.push({code:'unsupported-city-route',cityId:id,message:`Unknown route city id ${id}`});
  return issues;
}

function summarizeRoute(route) {
  const components = [
    ...(route?.stops || []).map(stop => [stop.id,stop.visitDuration]),
    ...(route?.legs || []).map(leg => [leg.id,leg.duration]),
    ...(route?.allowances || []).map(item => [item.id,item.duration])
  ];
  const unknownComponentIds = components.filter(([,duration]) => duration?.status !== 'known').map(([id]) => id);
  if (unknownComponentIds.length) return {complete:false,minMinutes:null,maxMinutes:null,unknownComponentIds};
  return {complete:true,minMinutes:components.reduce((sum,[,duration])=>sum+duration.minMinutes,0),maxMinutes:components.reduce((sum,[,duration])=>sum+duration.maxMinutes,0),unknownComponentIds:[]};
}

function verifiedCityCount(routes, origins, manifest, routeGuides) {
  const valid = new Set();
  for (const route of routes || []) {
    if (route.researchStatus === 'verified' && validateCityRoute(route,origins,manifest,routeGuides).length === 0) valid.add(route.cityId);
  }
  return valid.size;
}

function readCityRouteState(url, registry) {
  const params = url instanceof URL ? url.searchParams : new URL(url, 'https://local.invalid').searchParams;
  const origins = registry?.origins || [];
  const originId = origins.some(origin => origin.id === params.get('origin')) ? params.get('origin') : origins[0]?.id || null;
  const routes = (registry?.routes || []).filter(route => route.cityId === originId);
  const requested = routes.find(route => route.id === params.get('route'));
  const route = requested || routes.find(item => item.default) || routes[0] || null;
  const stopId = route?.stops?.some(stop => stop.id === params.get('stop')) ? params.get('stop') : route?.stops?.[0]?.id || null;
  const variants = Object.keys(route?.variants || {});
  const variant = variants.includes(params.get('variant')) ? params.get('variant') : variants[0] || null;
  const mode = ['walking','transit','driving'].includes(params.get('mode')) ? params.get('mode') : 'transit';
  return {originId,routeId:route?.id || null,variant,mode,stopId};
}

function buildLegDirectionsUrl(origin, from, to, mode = 'transit') {
  const travelMode = mode === 'driving' ? 'driving' : mode === 'walking' ? 'walking' : 'transit';
  const query = new URLSearchParams({api:'1',origin:from.address || from.name,destination:to.address || to.name,travelmode:travelMode});
  return `https://www.google.com/maps/dir/?${query.toString()}`;
}

function buildCityPlanPreview(origin, plan, mode = 'transit') {
  if (!origin || !plan || !Array.isArray(plan.stops) || plan.stops.length < 2) return null;
  const slug = value => String(value).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const routeMode = mode === 'driving' || mode === 'car' ? 'driving' : mode === 'walking' ? 'walking' : 'transit';
  const originPoint = { id: `${origin.id}-origin`, name: origin.station || `${origin.city} Station`, address: `${origin.station || origin.city}, Japan`, returnPoint: true };
  const stops = plan.stops.map((stop, index) => {
    const match = String(stop.duration || '').match(/(\d+)\s*[–-]\s*(\d+)\s*min/i);
    return {
      id: `${origin.id}-${slug(stop.name)}`, order: index + 1, name: stop.name,
      area: stop.area || origin.city, story: stop.story || '', address: `${stop.name}, ${stop.area || origin.city}, Japan`,
      visitDuration: match ? { status: 'known', minMinutes: Number(match[1]), maxMinutes: Number(match[2]), planningEstimate: true } : { status: 'unknown' }
    };
  });
  const points = [originPoint, ...stops, originPoint];
  const legs = points.slice(1).map((to, index) => ({
    id: `${origin.id}-leg-${index + 1}`, fromId: points[index].id, toId: to.id, mode: routeMode,
    duration: { status: 'unknown' }
  }));
  return {
    id: `${origin.id}-city-plan-preview`, cityId: origin.id, title: plan.title,
    introduction: plan.intro, researchStatus: 'in-progress', previewOnly: true,
    origin: originPoint, stops, legs, sources: [], variants: {}
  };
}

function applyCityRouteMode(route, mode = 'transit') {
  if (!route || route.transportMode !== 'selectable') return route;
  const selectedMode = mode === 'car' || mode === 'driving' ? 'driving' : 'transit';
  return {...route, legs:(route.legs || []).map(leg => ({...leg, mode:selectedMode}))};
}

const api = {validateCityRoute,validateCityRouteRegistry,summarizeRoute,readCityRouteState,buildLegDirectionsUrl,buildCityPlanPreview,applyCityRouteMode,verifiedCityCount};
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.CityRouteModel = api;
