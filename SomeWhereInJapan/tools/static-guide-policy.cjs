'use strict';

const { decodeMojibake } = require('./mojibake.cjs');

function stripMarkup(value) {
  return decodeMojibake(String(value || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim());
}

function isFilenameAlt(value) {
  return /(?:\b\w+[_ ]\d{2,}\b|\.(?:jpe?g|png|webp)\b)/i.test(value);
}

function cleanRenderedGuide(input, { version = 'v1.2', placeName = '' } = {}) {
  let html = decodeMojibake(input);
  const title = placeName || stripMarkup(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]) || 'this destination';

  html = html.replace(/<p\b[^>]*>[^<]*(?:Illustrative photo; its match to this exact place has not been confirmed|Illustrative|UNVERIFIED|location not verified|has not been confirmed)[\s\S]*?<\/p>/gi, '');
  html = html.replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, figure => {
    const image = figure.match(/<img\b[^>]*>/i)?.[0];
    if (!image) return figure;
    const verified = /data-photo-verified="true"/i.test(image) &&
      /data-photo-source="https?:/i.test(image) &&
      /data-photo-credit="[^"]+"/i.test(image) &&
      /data-photo-license="[^"]+"/i.test(image);
    if (!verified) return '';
    return figure.replace(/<img\b[^>]*>/i, tag => {
      const alt = tag.match(/\salt="([^"]*)"/i)?.[1] || '';
      if (!isFilenameAlt(alt)) return tag;
      const accessibleAlt = `View of ${title}`;
      return tag.replace(/\salt="[^"]*"/i, ` alt="${accessibleAlt.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`)
        .replace(/\bdata-photo-alt="[^"]*"/i, `data-photo-alt="${accessibleAlt.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`);
    });
  });

  if (title.toLowerCase() !== 'furano in bloom') {
    html = html.replace(/(<a\b[^>]*href="https?:\/\/www\.(?:youtube\.com|google\.com)[^"]*"[^>]*>)([\s\S]*?)(<\/a>)/gi, (whole, open, label, close) => {
      if (!/furano/i.test(stripMarkup(label))) return whole;
      const safeLabel = stripMarkup(label).replace(/\s+in\s+Furano\b/ig, '').replace(/Furano/ig, title);
      return `${open}${safeLabel}${close}`;
    });
  }

  html = html.replace(/\bv(?:0\.\d+|1\.\d+)\b/g, version);
  return html;
}

module.exports = { cleanRenderedGuide, isFilenameAlt };
