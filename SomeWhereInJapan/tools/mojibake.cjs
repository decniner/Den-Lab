'use strict';

const cp1252 = new Map([
  ['€', 0x80], ['‚', 0x82], ['ƒ', 0x83], ['„', 0x84], ['…', 0x85], ['†', 0x86], ['‡', 0x87],
  ['ˆ', 0x88], ['‰', 0x89], ['Š', 0x8a], ['‹', 0x8b], ['Œ', 0x8c], ['Ž', 0x8e], ['‘', 0x91],
  ['’', 0x92], ['“', 0x93], ['”', 0x94], ['•', 0x95], ['–', 0x96], ['—', 0x97], ['˜', 0x98],
  ['™', 0x99], ['š', 0x9a], ['›', 0x9b], ['œ', 0x9c], ['ž', 0x9e], ['Ÿ', 0x9f]
]);

function decodeOnce(value) {
  const bytes = [];
  for (const char of value) {
    const code = char.codePointAt(0);
    if (code <= 0xff) bytes.push(code);
    else if (cp1252.has(char)) bytes.push(cp1252.get(char));
    else return null;
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bytes));
  } catch {
    return null;
  }
}

function mojibakeScore(value) {
  return (value.match(/(?:Ã|Â|â[\u0080-\u00ff]|Å[\u0080-\u00ff]|\\uFFFD)/g) || []).length;
}

function decodeMojibake(value = '') {
  let result = String(value);
  // Repair common CP1252 display corruption at text-run level. The old
  // whole-string decoder skipped HTML containing one valid non-Latin glyph.
  const displayRepairs = [
    ['\u00e2\u2020\u201c', '\u2193'], ['\u00e2\u2020\u2019', '\u2192'], ['\u00e2\u2020\u2014', '\u2197'],
    ['\u00e2\u20ac\u2018', '\u2018'], ['\u00e2\u20ac\u2019', '\u2019'], ['\u00e2\u20ac\u2122', '\u2019'], ['\u00e2\u20ac\u201c', '\u2013'],
    ['\u00e2\u20ac\u009d', '\u201d'], ['\u00e2\u20ac\u201d', '\u2014'], ['\u00e2\u20ac\u2013', '\u2013'], ['\u00e2\u20ac\u2014', '\u2014'],
    ['\u00e2\u20ac\u00a2', '\u2022'], ['\u00e2\u20ac\u00a6', '\u2026'], ['\u00c2\u00b7', '\u00b7'],
    ['\u00c3\u2014', '\u00d7'], ['\u00c5\u00ab', '\u016b']
  ];
  for (const [broken, fixed] of displayRepairs) result = result.split(broken).join(fixed);
  for (let pass = 0; pass < 3; pass += 1) {
    const decoded = decodeOnce(result);
    if (!decoded || decoded === result || mojibakeScore(decoded) >= mojibakeScore(result)) break;
    result = decoded;
  }
  return result;
}

module.exports = { decodeMojibake };
