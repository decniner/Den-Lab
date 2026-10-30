(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ItineraryShare = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const REGION_VALUES = new Set(['Hokkaido', 'Tohoku', 'Kanto', 'Chubu', 'Kansai', 'Chugoku', 'Shikoku', 'Kyushu', 'Okinawa', 'Japan']);
  const INTEREST_VALUES = new Set(['Culture', 'Nature', 'Food', 'Islands', 'Slow travel']);
  const PACE_VALUES = new Set(['relaxed', 'balanced', 'active']);
  const MAX_TOKEN_LENGTH = 12000;

  function validDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!match) return false;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]);
  }

  function normalizeConfig(value) {
    if (!value || typeof value !== 'object' || !validDate(value.startDate)) return null;
    const days = Number(value.days);
    if (!Number.isInteger(days) || days < 1 || days > 21 || !PACE_VALUES.has(value.pace)) return null;
    const origin = typeof value.origin === 'string' ? value.origin.trim() : '';
    const endpoint = typeof value.endpoint === 'string' ? value.endpoint.trim() : '';
    if (origin.length > 100 || endpoint.length > 100) return null;
    const regions = value.regions ?? [];
    const interests = value.interests ?? [];
    if (!Array.isArray(regions) || !regions.every(item => REGION_VALUES.has(item))) return null;
    if (!Array.isArray(interests) || !interests.every(item => INTEREST_VALUES.has(item))) return null;
    return {
      startDate: value.startDate,
      days,
      origin,
      endpoint,
      pace: value.pace,
      regions: [...new Set(regions)],
      interests: [...new Set(interests)]
    };
  }

  function stopKey(place) {
    return String(place?.id || place?.slug || place?.name || '').trim();
  }

  function normalizePlan(value, expectedDays) {
    if (!value || typeof value !== 'object' || !Array.isArray(value.days) || value.days.length !== expectedDays) return null;
    const days = [];
    for (const day of value.days) {
      if (!day || !validDate(day.date) || !REGION_VALUES.has(day.region || 'Japan')) return null;
      const places = Array.isArray(day.places) ? day.places : [];
      const suppliedKeys = Array.isArray(day.placeKeys) ? day.placeKeys : null;
      if (places.length > 12 || (suppliedKeys && suppliedKeys.length > 12)) return null;
      const placeKeys = suppliedKeys ? suppliedKeys.map(key => String(key || '').trim()) : places.map(stopKey);
      if (placeKeys.some(key => !key || key.length > 140)) return null;
      const text = key => typeof day[key] === 'string' ? day[key].slice(0, 320) : '';
      days.push({
        date: day.date,
        month: text('month'),
        region: day.region || 'Japan',
        locality: text('locality'),
        note: text('note'),
        transitionNote: text('transitionNote'),
        seasonalNote: text('seasonalNote'),
        placeKeys
      });
    }
    const notes = Array.isArray(value.notes) ? value.notes.filter(note => typeof note === 'string').slice(0, 20).map(note => note.slice(0, 500)) : [];
    return { days, notes };
  }

  function encodeUtf8(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function decodeUtf8(token) {
    if (typeof token !== 'string' || !token || token.length > MAX_TOKEN_LENGTH || !/^[A-Za-z0-9_-]+$/.test(token)) return null;
    try {
      const base64 = token.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - token.length % 4) % 4);
      const binary = atob(base64);
      const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    } catch { return null; }
  }

  function encode({ config, plan } = {}) {
    const safeConfig = normalizeConfig(config);
    if (!safeConfig) return null;
    const safePlan = normalizePlan(plan, safeConfig.days);
    if (!safePlan) return null;
    try {
      const token = encodeUtf8(JSON.stringify({ version: 1, config: safeConfig, plan: safePlan }));
      return token.length <= MAX_TOKEN_LENGTH ? token : null;
    } catch { return null; }
  }

  function decode(token) {
    const text = decodeUtf8(token);
    if (!text) return null;
    try {
      const value = JSON.parse(text);
      if (value?.version !== 1) return null;
      const config = normalizeConfig(value.config);
      if (!config) return null;
      const plan = normalizePlan(value.plan, config.days);
      return plan ? { config, plan } : null;
    } catch { return null; }
  }

  return Object.freeze({ encode, decode });
});
