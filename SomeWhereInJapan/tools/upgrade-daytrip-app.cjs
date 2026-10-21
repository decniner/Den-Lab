'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const appPath = path.join(root, 'daytrip-app.js');
const fragmentPath = path.join(__dirname, 'daytrip-app-route-fragment.js');
let source = fs.readFileSync(appPath, 'utf8');
const coordStart = source.indexOf('  const coordinates = {');
const stateStart = source.indexOf('  const state = core.readSharedPlan', coordStart);
if (coordStart >= 0 && stateStart >= 0) source = source.slice(0, coordStart) + source.slice(stateStart);
source = source.replace(/  const money=.*\r?\n/, "  const money=value=>'\\u00a5'+Number(value).toLocaleString('en-US');\n");
const routeStart = source.indexOf('  let visibleTrip=null;');
const routeCompareStart = source.indexOf('  function drawCompare', routeStart);
if (routeStart >= 0 && routeCompareStart >= 0) {
  source = source.slice(0, routeStart) + fs.readFileSync(fragmentPath, 'utf8') + source.slice(routeCompareStart);
}
const mapStart = source.indexOf('  function pointFor(trip) {');
if (mapStart >= 0) {
  const drawCompareStart = source.indexOf('  function drawCompare() {', mapStart);
  if (drawCompareStart < 0) throw new Error('Could not locate the old schematic map renderer.');
  source = source.slice(0, mapStart) + fs.readFileSync(fragmentPath, 'utf8') + source.slice(drawCompareStart);
}
const routeLine = '  function routeFor(trip){return trip&&trip.modes[state.transport]&&(trip.modes[state.transport].profiles?.[state.time]||trip.modes[state.transport])||null;}\n';
const routeFirst = source.indexOf(routeLine), routeSecond = source.indexOf(routeLine, routeFirst + routeLine.length);
if (routeFirst >= 0 && routeSecond >= 0) source = source.slice(0, routeFirst) + source.slice(routeFirst + routeLine.length);
const mapInit = "    const map=$('#tokyo-route-map');\n";
if (source.includes(mapInit) && !source.includes("const heading=map.parentElement.querySelector('.route-map-heading')")) {
  source = source.replace(mapInit, `${mapInit}    const heading=map.parentElement.querySelector('.route-map-heading');\n    if(heading)heading.innerHTML='<span class="atlas-kicker">ROUTE STOP PLOT</span><span class="route-map-caveat">APPROXIMATE CONNECTORS · NOT WALKING DIRECTIONS</span>';\n`);
}
const compareBlockStart = source.indexOf('  function drawCompare');
const renderStart = source.indexOf('  function draw()', compareBlockStart);
if (compareBlockStart < 0 || renderStart < 0) throw new Error('Could not locate the comparison renderer.');
source = source.slice(0, compareBlockStart) + fs.readFileSync(path.join(__dirname, 'daytrip-app-compare-fragment.js'), 'utf8') + source.slice(renderStart);
source = source.replace('Select one to see its stops and relative direction.', 'Select one to see its route stops and map plot.');
source = source.replace("return `<article><button type=\"button\" data-remove=", "return `<article><button type=\"button\" data-remove=");
fs.writeFileSync(appPath, source, 'utf8');
console.log('Updated planner to share route stops, access links and selectable map points.');
