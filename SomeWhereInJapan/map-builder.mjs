const fs = await import('node:fs');
const source = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson';
const response = await fetch(source);
if (!response.ok) throw new Error(`Natural Earth download failed: ${response.status}`);
const world = await response.json();
const japan = world.features.find(feature => feature.properties.ADMIN === 'Japan');
if (!japan) throw new Error('Japan geometry not found');
const project = ([lon, lat]) => [(lon - 123) * .9, 45.6 - lat];
const area = ring => ring.slice(0, -1).reduce((sum, p, i) => { const q = ring[i + 1]; return sum + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;

function simplify(points, tolerance = .018) {
  if (points.length < 4) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]], toleranceSquared = tolerance * tolerance;
  while (stack.length) {
    const [start, end] = stack.pop(), a = points[start], b = points[end];
    let max = toleranceSquared, index = -1;
    for (let i = start + 1; i < end; i++) {
      const p = points[i], dx = b[0] - a[0], dy = b[1] - a[1], den = dx * dx + dy * dy;
      const t = den ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / den)) : 0;
      const distance = (p[0] - a[0] - t * dx) ** 2 + (p[1] - a[1] - t * dy) ** 2;
      if (distance > max) { max = distance; index = i; }
    }
    if (index >= 0) { keep[index] = 1; stack.push([start, index], [index, end]); }
  }
  return points.filter((_, i) => keep[i]);
}

const polygons = japan.geometry.coordinates
  .filter(poly => poly[0].some(([x, y]) => x > 122 && x < 147 && y > 24 && y < 46) && Math.abs(area(poly[0])) > .001)
  .map(poly => simplify(poly[0].map(project)));
const all = polygons.flat();
const minX = Math.min(...all.map(p => p[0])), maxX = Math.max(...all.map(p => p[0]));
const minY = Math.min(...all.map(p => p[1])), maxY = Math.max(...all.map(p => p[1]));
const scale = 25, offsetX = (660 - (maxX - minX) * scale) / 2 - minX * scale;
const offsetY = (670 - (maxY - minY) * scale) / 2 - minY * scale;
const path = polygons.map(poly => 'M' + poly.map(([x, y]) => `${(offsetX + x * scale).toFixed(1)},${(offsetY + y * scale).toFixed(1)}`).join('L') + 'Z').join('');
const regionPoints = {
  '01': [141.3469, 43.0642], '02': [140.8694, 38.2682], '03': [139.6503, 35.6762],
  '04': [136.6562, 36.5613], '05': [135.7681, 35.0116], '06': [132.4553, 34.3853],
  '07': [132.7657, 33.8392], '08': [130.4017, 33.5902], '09': [127.6809, 26.2124]
};
const markers = Object.entries(regionPoints).map(([n, point]) => {
  const [x, y] = project(point), px = (offsetX + x * scale).toFixed(1), py = (offsetY + y * scale).toFixed(1);
  return `<g class="map-marker" aria-hidden="true"><circle cx="${px}" cy="${py}" r="10"/><text x="${px}" y="${(Number(py) + 2.7).toFixed(1)}">${n}</text></g>`;
}).join('');

const svg = `<!-- Coastline geometry derived from Natural Earth 10m cultural vectors, public domain: https://www.naturalearthdata.com/about/terms-of-use/ -->
<svg class="japan-map" viewBox="0 0 660 670" role="img" aria-labelledby="japan-map-title japan-map-desc" xmlns="http://www.w3.org/2000/svg">
<title id="japan-map-title">Japan, from Hokkaido to Okinawa</title><desc id="japan-map-desc">A true-to-shape map of Japan's main islands with numbered markers for nine travel regions.</desc>
<style>.map-coast path{fill:url(#land);stroke:#f1dcb8;stroke-width:1.1;stroke-opacity:.76;stroke-linejoin:round}.map-marker circle{fill:#17221f;stroke:#f3d9ac;stroke-width:1.4}.map-marker text{font:600 7px Arial,sans-serif;letter-spacing:.2px;text-anchor:middle;fill:#f5e8d1}.island-labels text{font:600 8px Arial,sans-serif;letter-spacing:2px;fill:#29302a;opacity:.72}.map-coordinate path{fill:none;stroke:#d8c4a0;stroke-width:1;opacity:.52}.map-coordinate text{font:7px Arial,sans-serif;letter-spacing:1px;fill:#d8c4a0;opacity:.62}</style>
<defs><linearGradient id="land" x1="0" y1="0" x2=".86" y2="1"><stop stop-color="#dfc394"/><stop offset=".52" stop-color="#bf9866"/><stop offset="1" stop-color="#8e674c"/></linearGradient><filter id="island-shadow" x="-25%" y="-15%" width="150%" height="140%"><feGaussianBlur in="SourceAlpha" stdDeviation="8"/><feOffset dy="10"/><feComponentTransfer><feFuncA type="linear" slope=".4"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter><pattern id="chart-grid" width="82" height="82" patternUnits="userSpaceOnUse"><path d="M82 0H0V82" fill="none" stroke="#d8c4a0" stroke-opacity=".08" stroke-width=".7"/></pattern></defs>
<rect width="660" height="670" fill="url(#chart-grid)"/><g class="map-coast" filter="url(#island-shadow)"><path d="${path}"/></g>${markers}
<g class="island-labels" aria-hidden="true"><text x="464" y="82">HOKKAIDO</text><text x="280" y="315">HONSHU</text><text x="241" y="420">SHIKOKU</text><text x="148" y="468">KYUSHU</text><text x="67" y="576">RYUKYU ISLANDS</text></g>
<g class="map-coordinate" aria-hidden="true"><path d="M28 28h24M28 28v24M632 642h-24M632 642v-24"/><text x="30" y="658">24° N</text><text x="584" y="18">46° N</text></g>
</svg>`;
fs.writeFileSync('japan-map.svg', svg);
console.log(`Wrote ${polygons.length} island outlines from Natural Earth 10m public-domain data.`);
