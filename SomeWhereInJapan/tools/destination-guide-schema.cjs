'use strict';

const TYPE_FIELDS = Object.freeze({
  city: ['areas'],
  neighborhood: ['walkingRoute'],
  attraction: ['highlights'],
  island: ['arrivalOptions'],
  'walking-route': ['routeSections'],
  'hiking-route': ['routeSections', 'terrain'],
  region: ['areas']
});
const VALID_TYPES = new Set(Object.keys(TYPE_FIELDS));

function isRealDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateGuideRecord(record) {
  const issues = [];
  if (!record || typeof record !== 'object') return [{ code: 'invalid-record', message: 'Guide must be an object' }];
  if (!VALID_TYPES.has(record.type)) issues.push({ code: 'invalid-type', message: 'Guide type is not supported' });
  const sourceIds = new Set();
  for (const source of record.sources || []) {
    if (!source?.id || !source?.url) issues.push({ code: 'invalid-source', sourceId: source?.id ?? null, message: 'Source requires an id and URL' });
    else sourceIds.add(source.id);
    if (!isRealDate(source?.checkedOn)) issues.push({ code: 'invalid-checked-on', sourceId: source?.id ?? null, message: 'Source checkedOn must be a real YYYY-MM-DD date' });
  }
  for (const [index, claim] of (record.claims || []).entries()) {
    if (!claim?.text || !Array.isArray(claim.sourceIds) || !claim.sourceIds.length) {
      issues.push({ code: 'claim-source-missing', index, message: 'Material claims need at least one source id' });
      continue;
    }
    for (const id of claim.sourceIds) if (!sourceIds.has(id)) issues.push({ code: 'claim-source-missing', index, sourceId: id, message: `Claim source not found: ${id}` });
  }
  for (const [index, cost] of (record.costs || []).entries()) {
    if (!['known','unknown','not-applicable'].includes(cost?.status)) issues.push({ code: 'invalid-cost-status', index, message: 'Cost requires known, unknown, or not-applicable status' });
    if (cost?.status === 'known' && (!Number.isFinite(cost.amount) || cost.amount < 0 || !cost.currency || !Array.isArray(cost.sourceIds) || !cost.sourceIds.length)) {
      issues.push({ code: 'invalid-known-cost', index, message: 'Known cost requires a non-negative amount, currency, and source ids' });
    }
  }
  for (const mode of ['rail','bus','air','car']) {
    const access = record.accessModes?.[mode];
    if (!access || !['known','unknown','not-applicable'].includes(access.status)) {
      issues.push({ code:'missing-access-mode', mode, message:`${mode} access needs an explicit status` });
    } else if (access.status === 'known' && (!access.detail || !access.sourceIds?.length || access.sourceIds.some(id => !sourceIds.has(id)))) {
      issues.push({ code:'invalid-access-evidence', mode, message:`${mode} access needs sourced details` });
    } else if (access.status !== 'known' && !access.note) {
      issues.push({ code:'missing-access-note', mode, message:`${mode} access status needs an explanation` });
    }
  }
  if (!Array.isArray(record.points) || !record.points.length) issues.push({ code:'missing-visit-points', message:'Add at least one precisely named visit point' });
  for (const [index, point] of (record.points || []).entries()) {
    if (!point?.name || !point?.address || !point?.coordinates || !Number.isFinite(point.coordinates.latitude) || point.coordinates.latitude < -90 || point.coordinates.latitude > 90 || !Number.isFinite(point.coordinates.longitude) || point.coordinates.longitude < -180 || point.coordinates.longitude > 180 || !point.sourceIds?.length || point.sourceIds.some(id => !sourceIds.has(id))) {
      issues.push({ code:'invalid-visit-point', index, message:'Visit points need a named address, sourced coordinates, and a valid range' });
    }
  }
  if (!record.contacts?.some(contact => contact.status === 'unknown' && contact.note || contact.phone && contact.sourceIds?.length && contact.sourceIds.every(id => sourceIds.has(id)))) {
    issues.push({ code:'missing-contact-evidence', message:'Add a sourced phone contact or state that a verified contact is unavailable' });
  }
  if (!Array.isArray(record.stayRecommendations) || !record.stayRecommendations.some(item => item.name && item.area && item.sourceIds?.length && item.sourceIds.every(id => sourceIds.has(id)))) {
    issues.push({ code:'missing-stay-recommendations', message:'Add a sourced place to stay or a sourced accommodation area' });
  }
  const photo = record.photo;
  if (!photo || photo.status !== 'verified' || !photo.url || !photo.source || !photo.license || !photo.sourceIds?.length || photo.sourceIds.some(id => !sourceIds.has(id))) {
    issues.push({ code:'photo-not-verified', message:'A guide needs a verified, attributed destination photo' });
  }
  const location = record.mapLocation;
  if (!location || location.status !== 'verified' || !Number.isFinite(location.latitude) || location.latitude < -90 || location.latitude > 90 || !Number.isFinite(location.longitude) || location.longitude < -180 || location.longitude > 180 || !location.sourceIds?.length || location.sourceIds.some(id => !sourceIds.has(id))) {
    issues.push({ code:'map-location-not-verified', message:'A guide needs a source-checked visitor map position' });
  }
  if (!record.weatherPlan?.alternative || !record.weatherPlan?.sourceIds?.length || record.weatherPlan.sourceIds.some(id => !sourceIds.has(id))) {
    issues.push({ code:'weather-plan-not-verified', message:'Add a sourced weather alternative or postponement note' });
  }
  return issues;
}

function evaluateGuideCompletion(record) {
  const missing = [];
  if (!record || typeof record !== 'object') return { complete: false, missing: ['guide record'] };
  if (!record.id) missing.push('stable id');
  if (!VALID_TYPES.has(record.type)) missing.push('supported destination type');
  for (const field of ['story','visitPlan','access']) if (typeof record[field] !== 'string' || !record[field].trim()) missing.push(field);
  for (const field of TYPE_FIELDS[record.type] || []) {
    const value = record[field];
    if (Array.isArray(value) ? !value.length : typeof value !== 'string' || !value.trim()) missing.push(field);
  }
  if (!Array.isArray(record.sources) || !record.sources.length) missing.push('sources');
  if (!Array.isArray(record.claims) || !record.claims.length) missing.push('sourced material claims');
  for (const field of ['accessModes','points','contacts','stayRecommendations','photo','mapLocation','weatherPlan']) if (!record[field]) missing.push(field);
  const invalid = validateGuideRecord(record);
  for (const issue of invalid) {
    const label = issue.code === 'invalid-checked-on' ? 'valid source checkedOn date' : issue.code === 'claim-source-missing' ? 'claim source links' : issue.code;
    if (!missing.includes(label)) missing.push(label);
  }
  return { complete: missing.length === 0, missing };
}

function knownCostTotal(costs) {
  if (!Array.isArray(costs) || costs.some(cost => cost?.status === 'unknown')) return null;
  const known = costs.filter(cost => cost?.status === 'known');
  if (!known.length || known.some(cost => !Number.isFinite(cost.amount))) return null;
  const currency = known[0].currency;
  if (known.some(cost => cost.currency !== currency)) return null;
  return known.reduce((sum, cost) => sum + cost.amount, 0);
}

module.exports = { TYPE_FIELDS, validateGuideRecord, evaluateGuideCompletion, knownCostTotal };
