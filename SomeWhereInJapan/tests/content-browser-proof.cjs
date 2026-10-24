'use strict';

const fs = require('node:fs');
const base = (process.env.SITE_URL || 'http://127.0.0.1:8011').replace(/\/$/, '');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const target = await (await fetch('http://127.0.0.1:9223/json/new?about:blank', { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let sequence = 0;
  const pending = new Map();
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
  };
  const call = (method, params = {}) => new Promise(resolve => {
    const id = ++sequence;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const response = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (response.result.exceptionDetails) throw new Error(JSON.stringify(response.result.exceptionDetails));
    return response.result.result.value;
  };
  const navigate = async url => {
    await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 1000, deviceScaleFactor: 1, mobile: false });
    await call('Page.navigate', { url });
    await wait(1300);
    await evaluate('document.fonts.ready.then(()=>true)');
  };
  await call('Page.enable');
  await call('Runtime.enable');
  await navigate(`${base}/index.html#destinations`);
  await evaluate("(()=>{const s=document.querySelector('#place-search');s.value='Nikko in the cedars';s.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('.destination-card .card-details')?.click()})()");
  await wait(250);
  const dialog = await evaluate("(()=>({open:document.querySelector('#place-dialog')?.open,story:document.querySelector('#place-dialog-story')?.textContent,points:[...document.querySelectorAll('#place-dialog-points li')].map(x=>x.textContent)}))()");
  if (!dialog.open || dialog.story.trim().split(/\s+/).length < 120 || dialog.points.length < 5) throw new Error('Nikko dialog did not render the detailed story and named highlights');
  await navigate(`${base}/places/nikko-in-the-cedars/`);
  const page = await evaluate("(()=>({title:document.querySelector('h1')?.textContent,story:document.querySelector('.jg-lede')?.textContent,season:[...document.querySelectorAll('.jg-fact')].find(x=>x.textContent.includes('SEASON & CONDITIONS'))?.textContent,source:[...document.querySelectorAll('a')].find(x=>x.href.includes('/plan-your-trip/faqs/'))?.href,version:document.querySelector('.guide-version')?.textContent,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth}))()");
  if (!page.story || page.story.trim().split(/\s+/).length < 120 || !page.story.includes('Kanmangafuchi Abyss')) throw new Error('Nikko guide did not render its researched story');
  if (!page.season?.includes('late October to mid-November') || !page.source || page.overflow > 1) throw new Error('Nikko seasonal facts, source link, or page width check failed');
  let screenshot = null;
  if (process.env.SCREENSHOT_PATH) {
    const response = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(process.env.SCREENSHOT_PATH, Buffer.from(response.result.data, 'base64'));
    screenshot = process.env.SCREENSHOT_PATH;
  }
  console.log(JSON.stringify({ dialog: { open: dialog.open, words: dialog.story.trim().split(/\s+/).length, highlights: dialog.points.length }, page: { title: page.title, words: page.story.trim().split(/\s+/).length, season: page.season, source: page.source, version: page.version, overflow: page.overflow }, screenshot }));
  ws.close();
}

main().catch(error => { console.error(error); process.exitCode = 1; });
