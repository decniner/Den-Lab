'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const DESTINATION_SCRIPT = /^(?:destinations|destination-[a-z0-9-]+)\.js$/i;

function loadRawDestinations(siteDir) {
  const indexPath = path.join(siteDir, 'index.html');
  const html = fs.readFileSync(indexPath, 'utf8');
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
    .map(match => match[1].split(/[?#]/, 1)[0])
    .filter(src => DESTINATION_SCRIPT.test(path.basename(src)));
  if (!scripts.length) throw new Error(`No destination data scripts found in ${indexPath}`);

  const scope = { console, URL, URLSearchParams };
  scope.window = scope;
  vm.createContext(scope);
  for (const src of scripts) {
    const scriptPath = path.resolve(siteDir, src);
    if (!scriptPath.startsWith(path.resolve(siteDir) + path.sep)) {
      throw new Error(`Destination script escapes site directory: ${src}`);
    }
    vm.runInContext(fs.readFileSync(scriptPath, 'utf8'), scope, { filename: src, timeout: 5000 });
  }
  if (!Array.isArray(scope.DESTINATIONS)) throw new Error('Destination scripts did not create window.DESTINATIONS');
  return JSON.parse(JSON.stringify(scope.DESTINATIONS));
}

function validateInventory(inventory) {
  const issues = [];
  const records = Array.isArray(inventory) ? inventory : inventory?.records;
  if (!Array.isArray(records)) return [{ code: 'invalid-records', message: 'Inventory records must be an array' }];
  const seen = new Set();
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    if (!record || typeof record !== 'object') {
      issues.push({ code: 'invalid-record', index, message: 'Inventory record must be an object' });
      continue;
    }
    if (typeof record.id !== 'string' || !record.id.trim()) {
      issues.push({ code: 'missing-id', index, message: 'Inventory record requires a stable id' });
    } else if (seen.has(record.id)) {
      issues.push({ code: 'duplicate-id', id: record.id, index, message: `Duplicate inventory id: ${record.id}` });
    } else seen.add(record.id);
    if (record.coordinates !== undefined) {
      const { latitude, longitude } = record.coordinates || {};
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
          !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        issues.push({ code: 'invalid-coordinates', id: record.id ?? null, index, message: 'Coordinates must contain valid latitude and longitude values' });
      }
    }
  }
  return issues;
}

module.exports = { loadRawDestinations, validateInventory };
