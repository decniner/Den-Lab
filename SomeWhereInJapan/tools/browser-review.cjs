'use strict';
const fs = require('node:fs');
const path = require('node:path');
const out = path.resolve(__dirname, '..', '..', '..', 'artifacts', 'japan-atlas');
const baseUrl = (process.env.SITE_URL || 'http://localhost:8000').replace(/\/$/, '');
fs.mkdirSync(out, { recursive: true });
async function main() {
  const target = await (await fetch('http://127.0.0.1:9223/json/new?about:blank', { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let seq = 0;
  const pending = new Map();
  const runtimeErrors = [];
  ws.onmessage = event => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id).resolve(msg); pending.delete(msg.id); }
    if (msg.method === 'Runtime.exceptionThrown') runtimeErrors.push(msg.params.exceptionDetails.text);
  };
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params }));
  });
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const navigate = async (url, width, height = 960) => {
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
    await call('Page.navigate', { url }); await pause(1300);
    await call('Runtime.evaluate', { expression: 'document.fonts.ready.then(()=>true)' }); await pause(500);
  };
  const evaluate = async expression => {
    const response = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (response.result.exceptionDetails) throw new Error(JSON.stringify(response.result.exceptionDetails));
    return response.result.result.value;
  };
  const screenshot = async name => {
    const metrics = await evaluate('({width:document.documentElement.clientWidth,height:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth})');
    const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: metrics.width, height: Math.min(metrics.height, 6000), scale: 1 } });
    fs.writeFileSync(path.join(out, name), Buffer.from(shot.result.data, 'base64'));
    const overflow = await evaluate('[...document.querySelectorAll("body,body *")].map(el=>({tag:el.tagName,cls:typeof el.className==="string"?el.className:"svg",id:el.id,left:Math.round(el.getBoundingClientRect().left),right:Math.round(el.getBoundingClientRect().right),width:Math.round(el.getBoundingClientRect().width)})).filter(el=>el.right>document.documentElement.clientWidth+1||el.left< -1).sort((a,b)=>b.right-a.right).slice(0,12)');
    return { ...metrics, overflow };
  };
  const viewportShot = async name => {
    const shot = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(out, name), Buffer.from(shot.result.data, 'base64'));
  };
  await call('Page.enable'); await call('Runtime.enable');
  const report = {};
  for (const width of [390, 768, 1440]) {
    await navigate(`${baseUrl}/day-trips/kawagoe/`, width);
    report[`guide${width}`] = await screenshot(`guide-${width}.png`);
  }
  report.mobileGuides = {};
  for (const slug of ['kawagoe', 'sawara', 'mitake', 'narita', 'odawara']) {
    await navigate(`${baseUrl}/day-trips/${slug}/`, 390);
    report.mobileGuides[slug] = await evaluate("({width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,photoLoaded:document.querySelector('.route-visual-photo img').naturalWidth>0,stopCount:document.querySelectorAll('.route-stop-row').length,shortPlan:!!document.querySelector('.short-route-card')})");
  }
  await navigate(`${baseUrl}/index.html`, 1440, 1000);
  await evaluate("localStorage.removeItem('somewhereJapanTokyoDayTrips')");
  await call('Page.reload'); await pause(1300);
  report.atlasToFinder = await evaluate("(()=>{document.querySelector('#atlas-tab-tokyo').click();return document.querySelector('#atlas-tab-tokyo').getAttribute('aria-selected')==='true'&&!document.querySelector('#atlas-panel-tokyo').hidden})()");
  await navigate(`${baseUrl}/index.html`, 390, 900);
  report.seasonalShortlist390 = await evaluate(`(()=>{const planner=document.querySelector('#month-planner');if(!planner)return {page:location.href,title:document.title,details:[...document.querySelectorAll('details')].length};planner.open=true;const button=document.querySelector('#build-month-route');if(!button)return {plannerOpen:true,buttonMissing:true};button.click();const section=document.querySelector('#month-route-plan');const cards=[...section.querySelectorAll('.month-route-stop')];return {visible:!section.hidden,count:cards.length,inspiration:section.textContent.includes('SEASONAL INSPIRATION'),noDayClaims:!section.textContent.includes('DAY 01'),allLinksArePlaceSearches:cards.every(card=>card.querySelector('.month-place-actions a')?.href.includes('/maps/search/?api=1')),noHorizontalOverflow:document.documentElement.scrollWidth===document.documentElement.clientWidth}})()`);
  await navigate(`${baseUrl}/index.html#destinations`, 1440, 1000);
  report.destinationExpansion = await evaluate(`(async () => {
    const newest=DESTINATIONS.slice(180);
    const photoChecks=await Promise.all(newest.map(place=>new Promise(resolve=>{const img=new Image();const timer=setTimeout(()=>resolve({name:place.name,loaded:false}),12000);img.onload=()=>{clearTimeout(timer);resolve({name:place.name,loaded:img.naturalWidth>0});};img.onerror=()=>{clearTimeout(timer);resolve({name:place.name,loaded:false});};img.src=place.photo.url;})));
    const search=document.querySelector('#place-search');search.value='Cape Soya';search.dispatchEvent(new Event('input',{bubbles:true}));
    const card=document.querySelector('.destination-card');const image=card?.querySelector('.card-image');
    if(image){image.loading='eager';await Promise.race([image.decode().catch(()=>false),new Promise(resolve=>setTimeout(resolve,8000))]);}
    card?.querySelector('.card-details')?.click();
    const hero=document.querySelector('#place-dialog-image');
    if(hero?.src)await Promise.race([hero.decode().catch(()=>false),new Promise(resolve=>setTimeout(resolve,8000))]);
    const credit=document.querySelector('#place-dialog-photo-credit');
    return {catalogueCount:DESTINATIONS.length,matches:document.querySelectorAll('.destination-card').length,title:document.querySelector('#place-dialog-title')?.textContent,cardPhotoLoaded:(image?.naturalWidth||0)>0,storyOpened:document.querySelector('#place-dialog')?.open===true,storyPhotoLoaded:(hero?.naturalWidth||0)>0,hasCommonsCredit:!credit?.hidden&&credit.href.includes('commons.wikimedia.org/wiki/File:'),newPhotosLoaded:photoChecks.filter(photo=>photo.loaded).length,newPhotoCount:photoChecks.length,failedNewPhotos:photoChecks.filter(photo=>!photo.loaded).map(photo=>photo.name)};
  })()`);
  report.planner = await evaluate(`(() => {
    document.querySelector('#place-dialog')?.close();
    const origin=document.querySelector('#city-origin'); origin.value='osaka';origin.dispatchEvent(new Event('change',{bubbles:true}));
    const osakaVisible=!document.querySelector('#city-origin-results').hidden && document.querySelectorAll('.city-origin-card').length>0;
    origin.value='tokyo';origin.dispatchEvent(new Event('change',{bubbles:true}));
    const tokyoTools=document.querySelector('.tokyo-route-tools summary');if(!tokyoTools)return {osakaOriginWorked:osakaVisible,tokyoToolsMissing:true};tokyoTools.click();
    const month=document.querySelector('#daytrip-month');month.value='10';month.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('#daytrip-budget').value='18000';document.querySelector('#daytrip-budget').dispatchEvent(new Event('input',{bubbles:true}));
    const results=document.querySelectorAll('#daytrip-results [data-trip]');const confirmed=document.querySelectorAll('#daytrip-results [data-budget-match="true"]');
    const time=document.querySelector('#daytrip-time');time.value='full';time.dispatchEvent(new Event('change',{bubbles:true}));
    const fullStopCount=document.querySelectorAll('#daytrip-selected-content [data-route-stop-row]').length;
    const compareIds=[...document.querySelectorAll('#daytrip-results [data-compare]')].slice(0,2).map(button=>button.dataset.compare);
    compareIds.forEach(id=>document.querySelector('#daytrip-results [data-compare="'+id+'"]')?.click());
    const compareVisible=!document.querySelector('#daytrip-compare').hidden;
    const pin=document.querySelector('#tokyo-route-map [data-stop-select="2"]');pin?.dispatchEvent(new MouseEvent('click',{bubbles:true}));
    const synchronized=pin?.getAttribute('aria-pressed')==='true'&&document.querySelector('#daytrip-selected-content [data-stop-select="2"]')?.getAttribute('aria-pressed')==='true';
    const q=new URL(location.href);q.searchParams.set('month','not-a-month');q.searchParams.set('origin','fukuoka');history.replaceState({},'',q);
    document.querySelector('#daytrip-save').click();
    const ids=window.TokyoDayTrips.DAY_TRIPS.map(trip=>trip.id);
    const saved=window.TokyoDayTripCore.loadPlan(window.localStorage,ids);
    const state={month:Number(month.value),time:document.querySelector('#daytrip-time').value,transport:document.querySelector('#daytrip-transport').value,budget:Number(document.querySelector('#daytrip-budget').value),interest:document.querySelector('#daytrip-interest').value,compareIds:[...document.querySelectorAll('#daytrip-results [data-compare][aria-pressed="true"]')].map(button=>button.dataset.compare),selectedId:document.querySelector('#daytrip-results [data-trip][aria-pressed="true"]')?.dataset.trip||null};
    const shareUrl=window.TokyoDayTripCore.buildShareUrl(location.href,state);
    const restored=window.TokyoDayTripCore.readSharedPlan(new URL(shareUrl).search,window.TokyoDayTrips.DAY_TRIPS);
    return {osakaOriginWorked:osakaVisible,tokyoGuideCount:results.length,onlyCompleteEstimateMatched:confirmed.length===1&&confirmed[0].dataset.trip==='sawara',unbudgetedGuidesClearlySeparated:document.querySelectorAll('#daytrip-results [data-budget-match="false"]').length>0,fullRouteStopCount:fullStopCount,comparisonWorked:compareVisible,compareIds:state.compareIds,comparePressed:[...document.querySelectorAll('#daytrip-results [data-compare][aria-pressed="true"]')].map(button=>button.dataset.compare),mapItinerarySynchronized:synchronized,saveWorked:saved?.selectedId===state.selectedId,shareRestoresSelectedAndFilters:restored.selectedId===state.selectedId&&restored.month===state.month&&restored.compareIds.join(',')===state.compareIds.join(','),guideHref:document.querySelector('#daytrip-selected-route .daytrip-guide-link')?.getAttribute('href'),bodyScrollWidth:document.documentElement.scrollWidth,invalidMonthFallback:window.TokyoDayTripCore.readSharedPlan('?month=99',window.TokyoDayTrips.DAY_TRIPS).month};
  })()`);
  await navigate(`${baseUrl}/index.html#daytrips`, 1440, 1000);
  report.cityOriginPlans = await evaluate(`(async () => {
    const select=document.querySelector('#city-origin');
    const cities=[...select.options].map(option=>option.value);
    const results=[];
    for(const id of cities){
      select.value=id;select.dispatchEvent(new Event('change',{bubbles:true}));
      const panel=document.querySelector('#city-origin-results');
      const plan=panel.querySelector('.city-origin-plan');
      const firstLeg=panel.querySelector('.city-plan-stops li article>a:last-of-type');
      const route=firstLeg?new URL(firstLeg.href):null;
      const origin=window.CityOrigins.ALL_ORIGINS.find(city=>city.id===id);
      const expectedStops=window.CityOrigins.CITY_DAY_PLANS[origin.planId||id].stops.length;
      const images=[...panel.querySelectorAll('.city-plan-stop-photo img')];
      images.forEach(image=>image.loading='eager');
      await Promise.all(images.map(image=>image.complete?Promise.resolve():new Promise(resolve=>{image.addEventListener('load',resolve,{once:true});image.addEventListener('error',resolve,{once:true});setTimeout(resolve,12000)})));
      const photosLoaded=images.length===expectedStops&&images.every(image=>image.naturalWidth>0);
      const placeStory=panel.querySelector('.city-plan-stop-guide');placeStory.open=true;
      const storyOpens=!!placeStory.querySelector('.city-plan-visit-note');
      const valid=!panel.hidden&&!!plan&&panel.querySelectorAll('.city-plan-stops>li').length===expectedStops&&route?.searchParams.get('origin')===origin.station+', Japan'&&!route?.searchParams.has('waypoints')&&(id==='tokyo'?!!panel.querySelector('.tokyo-route-tools'):!panel.querySelector('.tokyo-route-tools'))&&photosLoaded&&storyOpens;
      const mode=panel.querySelector('#city-plan-mode');mode.value='car';mode.dispatchEvent(new Event('change',{bubbles:true}));
      const driving=new URL(document.querySelector('#city-origin-results .city-plan-actions a').href).searchParams.get('travelmode')==='driving';
      let half=panel.querySelector('#city-plan-half-day');half.checked=true;half.dispatchEvent(new Event('change',{bubbles:true}));
      const halfDayWorks=panel.querySelectorAll('.city-plan-stops>li').length===2&&panel.querySelectorAll('.city-plan-day').length===1;
      half=panel.querySelector('#city-plan-half-day');half.checked=false;half.dispatchEvent(new Event('change',{bubbles:true}));
      const duration=panel.querySelector('#city-plan-availability');duration.value='2';duration.dispatchEvent(new Event('change',{bubbles:true}));
      const twoDayWorks=panel.querySelectorAll('.city-plan-day').length===2&&panel.querySelectorAll('.city-plan-stops>li').length===expectedStops&&panel.querySelectorAll('.city-plan-day .city-plan-actions a:first-child').length===1&&panel.querySelectorAll('.city-plan-day')[1].querySelectorAll('.city-plan-stops').length===0;
      results.push({id,valid,stopCount:expectedStops,photosLoaded,storyOpens,driving,halfDayWorks,twoDayWorks});
    }
    select.value='tokyo';select.dispatchEvent(new Event('change',{bubbles:true}));
    const tokyoTools=document.querySelector('.tokyo-route-tools');
    const tokyoAdvancedWorks=!!tokyoTools&&tokyoTools.querySelector('.daytrip-layout')!==null&&!tokyoTools.open;
    return {origins:cities.length,airportOptions:document.querySelector('#city-origin optgroup[label="Airport stations"]').querySelectorAll('option').length,allPlansWork:results.length===21&&results.every(item=>item.valid&&item.driving&&item.halfDayWorks&&item.twoDayWorks),allPhotosLoad:results.every(item=>item.photosLoaded),allPlaceStoriesOpen:results.every(item=>item.storyOpens),tokyoAdvancedWorks,results};
  })()`);
  if (report.planner.guideHref) {
    await navigate(new URL(report.planner.guideHref, `${baseUrl}/`).href, 1440, 1000);
    report.linkedGuide = await evaluate("({title:document.querySelector('h1')?.textContent.trim(),hasSources:!!document.querySelector('.route-sources'),hasStops:document.querySelectorAll('.route-stop-row').length===5,stylesLoaded:[...document.styleSheets].some(sheet=>sheet.href?.includes('styles.css'))})");
  }
  await navigate(`${baseUrl}/index.html#daytrips`, 390, 900);
  report.planner390 = await screenshot('planner-390.png');
  await navigate(`${baseUrl}/index.html?origin=osaka#daytrips`, 390, 900);
  report.cityOriginPlan390 = await screenshot('city-origin-osaka-390.png');
  report.cityOriginPlanDetails390 = await evaluate("({width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,visible:!document.querySelector('#city-origin-results').hidden,stops:document.querySelectorAll('.city-plan-stops>li').length,mode:document.querySelector('#city-plan-mode')?.value})");
  await navigate(`${baseUrl}/index.html?origin=tokyo#daytrips`, 390, 900);
  report.tokyoCityPlan390 = await evaluate("({width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,visible:!document.querySelector('#city-origin-results').hidden,stops:document.querySelectorAll('.city-plan-stops>li').length,advanced:!!document.querySelector('.tokyo-route-tools'),advancedCollapsed:!document.querySelector('.tokyo-route-tools')?.open})");
  report.sapporoMappedRoute = {};
  for (const width of [390, 768, 1440]) {
    await navigate(`${baseUrl}/index.html?origin=sapporo#daytrips`, width, 1000);
    report.sapporoMappedRoute[width] = await evaluate("(async()=>{const panel=document.querySelector('#city-origin-results'),route=panel.querySelector('.city-route-shared'),map=route?.querySelector('[data-map-canvas]'),stops=[...route?.querySelectorAll('[data-route-stop]')||[]],images=[...route?.querySelectorAll('.city-route-stop-photo img')||[]];images.forEach(img=>img.loading='eager');await Promise.race([Promise.all(images.map(img=>img.decode().catch(()=>false))),new Promise(resolve=>setTimeout(resolve,15000))]);return {visible:!!route,mapVisible:!!map&&!map.hidden,stopCount:stops.length,coordinateGaps:route?.querySelectorAll('.city-route-coordinate-gap').length||0,sourceLinks:route?.querySelectorAll('.city-route-sources a').length||0,creditedPhotos:route?.querySelectorAll('.city-route-stop-photo>a').length||0,loadedPhotos:images.filter(img=>img.naturalWidth>0).length,failedPhotos:images.filter(img=>img.naturalWidth===0).map(img=>img.currentSrc),scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,schematicWarning:route?.textContent.includes('not actual walking or train alignments')||false}})()");
    if(width===390)await screenshot('sapporo-mapped-route-390.png');
  }
  report.touchTargets390 = await evaluate("({plannerMapPin:Math.round(document.querySelector('.tokyo-map-route-hit')?.getBoundingClientRect().width||0),itineraryControl:Math.round(document.querySelector('.route-itinerary-stop-links a')?.getBoundingClientRect().height||0)})");
  await evaluate("document.querySelector('#daytrip-selected-route').scrollIntoView({block:'start',behavior:'instant'})"); await pause(300);
  await viewportShot('planner-route-390.png');
  await navigate(`${baseUrl}/day-trips/kawagoe/`, 1440, 1000);
  report.kawagoeGeographicContext = await evaluate("({streetMap:!!document.querySelector('.route-map-panel .route-street-map-link[href*=openstreetmap]'),attribution:!!document.querySelector('.route-map-panel a[href*=copyright]'),returnLeg:!!document.querySelector('.route-return-leg a'),accessibleStopCount:document.querySelectorAll('.route-stop-row').length})");
  await evaluate("document.querySelector('.route-map-pin[data-stop-select=\\\"2\\\"]').focus({focusVisible:true})");
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter' });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter' });
  report.keyboard = await evaluate("({mapAndItinerarySync:document.querySelector('.route-stop-row[data-stop-row=\\\"2\\\"]')?.getAttribute('aria-current')==='step',focusRemains:document.activeElement===document.querySelector('.route-map-pin[data-stop-select=\\\"2\\\"]'),visibleFocus:getComputedStyle(document.activeElement).outlineStyle!=='none'})");
  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  report.reducedMotion = await evaluate("({enabled:matchMedia('(prefers-reduced-motion: reduce)').matches,transitionDuration:getComputedStyle(document.querySelector('.route-map-pin')).transitionDuration})");
  report.imageLoaded = await evaluate("document.querySelector('.route-visual-photo img').naturalWidth>0");
  await evaluate("document.querySelector('.route-visual-photo img').src='http://127.0.0.1:1/unavailable.jpg'"); await pause(700);
  report.imageFailureFallback = await evaluate("document.querySelector('.route-visual-photo').classList.contains('is-image-missing')");
  await call('Emulation.setEmulatedMedia', { media: 'print' }); await pause(300);
  report.print = await screenshot('guide-print.png');
  await fs.promises.writeFile(path.join(out, 'browser-review.json'), JSON.stringify(report, null, 2));
  report.runtimeErrors = runtimeErrors;
  console.log(JSON.stringify(report, null, 2));
  ws.close();
}
main().catch(error => { console.error(error); process.exit(1); });
