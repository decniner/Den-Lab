const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const slugs = ['kawagoe', 'sawara', 'mitake', 'narita', 'odawara'];

test('all five stable Tokyo field notes have distinct previews and linked route diagrams', () => {
  const canonicals = [];
  for (const slug of slugs) {
    const html = fs.readFileSync(path.join(root, 'day-trips', slug, 'index.html'), 'utf8');
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    assert.ok(title, `${slug} has a title`);
    assert.ok(canonical?.endsWith(`/day-trips/${slug}/`), `${slug} has its stable canonical URL`);
    assert.match(html, /property="og:title"/, `${slug} has a social title`);
    assert.match(html, /class="route-visual"/, `${slug} has destination-specific visual treatment`);
    assert.match(html, /class="guide-route-map"/, `${slug} explains its schematic route`);
    assert.match(html, /class="guide-decision"/, `${slug} states when to choose or skip the outing`);
    assert.match(html, /class="route-points"[\s\S]*?google\.com\/maps/, `${slug} links its named points to maps`);
    canonicals.push(canonical);
  }
  assert.equal(new Set(canonicals).size, slugs.length);
});
