(() => {
  const places = window.DESTINATIONS || [];
  const regions = window.PHILIPPINES_REGIONS || [];
  const moods = window.PHILIPPINES_MOODS || [];
  const grid = document.querySelector('#destination-grid');
  const search = document.querySelector('#place-search');
  const regionFilters = document.querySelector('#region-filters');
  const moodFilters = document.querySelector('#mood-filters');
  const resultCount = document.querySelector('#result-count');
  const spotlight = {name:document.querySelector('#region-spotlight-name'),count:document.querySelector('#region-spotlight-count'),copy:document.querySelector('#region-spotlight-copy'),picks:document.querySelector('#region-spotlight-picks')};
  let activeRegion = 'All places', activeMood = 'All moods', limit = 12;
  document.querySelectorAll('[data-place-count]').forEach(el => el.textContent = String(places.length));
  function render() {
    const terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const shown = places.filter(place => (activeRegion === 'All places' || place.region === activeRegion) && (activeMood === 'All moods' || place.tags.includes(activeMood)) && terms.every(term => `${place.name} ${place.place} ${place.region} ${place.description} ${place.tags.join(' ')}`.toLowerCase().includes(term)));
    resultCount.textContent = `${shown.length} ${shown.length === 1 ? 'place' : 'places'}`;
    grid.replaceChildren(...shown.slice(0,limit).map((place,index) => {
      const card=document.createElement('article');card.className='destination-card';
      const image=document.createElement('div');image.className='card-image-wrap';image.style.backgroundImage=`linear-gradient(0deg,rgba(7,14,12,.3),transparent 42%),url(https://images.unsplash.com/${place.image}?auto=format&fit=crop&w=1100&q=82)`;image.style.backgroundSize='cover';image.style.backgroundPosition='center';
      const region=document.createElement('span');region.className='card-region';region.textContent=place.region;
      const num=document.createElement('span');num.className='card-index';num.textContent=String(index+1).padStart(2,'0');image.append(region,num);
      const copy=document.createElement('div');copy.className='card-copy';
      const location=document.createElement('p');location.className='card-place';location.textContent=place.place;
      const title=document.createElement('h3');title.className='card-title';title.textContent=place.name;
      const desc=document.createElement('p');desc.className='card-description';desc.textContent=place.description;
      const actions=document.createElement('div');actions.className='card-actions';
      const link=document.createElement('a');link.className='card-details';link.href=place.official;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Official visitor information ↗';
      const save=document.createElement('button');save.className='card-details';save.type='button';save.textContent='Add to journey +';save.addEventListener('click',()=>addPlace(place));
      actions.append(link,save);copy.append(location,title,desc,actions);card.append(image,copy);return card;
    }));
    document.querySelector('#show-more').hidden = shown.length <= limit;
    document.querySelectorAll('[data-map-region]').forEach(el=>el.classList.toggle('is-current',el.dataset.mapRegion===activeRegion));
  }
  function updateSpotlight(region) {
    activeRegion=region;
    const items=region==='All places'?places:places.filter(place=>place.region===region);
    spotlight.name.textContent=region==='All places'?'Choose an island group':region;
    spotlight.count.textContent=region==='All places'?'Your starting point':`${items.length} places in this island group`;
    spotlight.copy.textContent=region==='All places'?'Three broad regions, thousands of distinct islands. Pick a marker or choose a place to start.':items[0]?.description||'Browse places in this island group.';
    spotlight.picks.replaceChildren(...items.slice(0,3).map(place=>{const button=document.createElement('button');button.className='region-pick';button.type='button';button.innerHTML='<span></span><b></b>';button.querySelector('span').textContent=place.place;button.querySelector('b').textContent=place.name;button.addEventListener('click',()=>{search.value=place.name;document.querySelector('#destinations').scrollIntoView({behavior:'smooth'});render();});return button;}));
    renderFilters();render();
  }
  function renderFilters() {
    regionFilters.replaceChildren(...regions.map(region=>{const button=document.createElement('button');button.className='filter-button';button.type='button';button.textContent=region;button.setAttribute('aria-pressed',String(region===activeRegion));button.addEventListener('click',()=>updateSpotlight(region));return button;}));
    moodFilters.replaceChildren(...moods.map(mood=>{const button=document.createElement('button');button.className='mood-button';button.type='button';button.textContent=mood;button.setAttribute('aria-pressed',String(mood===activeMood));button.addEventListener('click',()=>{activeMood=mood;renderFilters();render();});return button;}));
  }
  document.querySelectorAll('[data-map-region]').forEach(el=>el.addEventListener('click',event=>{if(el.tagName==='A')event.preventDefault();updateSpotlight(el.dataset.mapRegion);document.querySelector('#destinations').scrollIntoView({behavior:'smooth'});}));
  search.addEventListener('input',()=>{limit=12;render();});
  document.querySelector('#show-more').addEventListener('click',()=>{limit+=12;render();});
  let journey=[];
  function addPlace(place){if(!journey.some(item=>item.name===place.name))journey.push(place);const status=document.querySelector('#itinerary-preset-status');status.textContent=`${place.name} added to your draft (${journey.length} ${journey.length===1?'stop':'stops'}).`;document.querySelector('#itinerary').scrollIntoView({behavior:'smooth'});}
  document.querySelectorAll('[data-itinerary-preset]').forEach(button=>button.addEventListener('click',()=>{const region=button.dataset.itineraryPreset==='north'?'Luzon':button.dataset.itineraryPreset==='islands'?'Visayas':button.dataset.itineraryPreset==='south'?'Mindanao':'All places';document.querySelector('#itinerary-days').value=button.dataset.itineraryPreset==='north'?5:button.dataset.itineraryPreset==='south'?6:button.dataset.itineraryPreset==='slow'?8:7;document.querySelectorAll('[data-itinerary-preset]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));document.querySelectorAll('#itinerary-regions input').forEach(input=>input.checked=input.value===region);document.querySelector('#itinerary-preset-status').textContent=`${button.querySelector('strong').textContent} selected. Add places below or make a draft.`;}));
  const regionRoot=document.querySelector('#itinerary-regions'), interestRoot=document.querySelector('#itinerary-interests');
  [...regions.slice(1)].forEach(value=>{const label=document.createElement('label');label.className='itinerary-chip';const input=document.createElement('input');input.type='checkbox';input.name='regions';input.value=value;const span=document.createElement('span');span.textContent=value;label.append(input,span);regionRoot.append(label);});
  ['Culture','Nature','Food','Islands','Slow travel'].forEach(value=>{const label=document.createElement('label');label.className='itinerary-chip';const input=document.createElement('input');input.type='checkbox';input.name='interests';input.value=value;const span=document.createElement('span');span.textContent=value;label.append(input,span);interestRoot.append(label);});
  document.querySelector('#itinerary-start-date').value=new Date().toLocaleDateString('en-CA');
  document.querySelector('#itinerary-form').addEventListener('submit',event=>{event.preventDefault();const form=event.currentTarget;const days=Number(form.elements.days.value);const selectedRegions=[...regionRoot.querySelectorAll('input:checked')].map(el=>el.value);const interests=[...interestRoot.querySelectorAll('input:checked')].map(el=>el.value);const pools=selectedRegions.length?selectedRegions.map(region=>places.filter(place=>place.region===region)): [places];const seen=new Set(journey.map(place=>place.name));const sequence=[...journey,...pools.flat().filter(place=>!seen.has(place.name)&&(!interests.length||place.tags.some(tag=>interests.includes(tag))))];const output=document.querySelector('#itinerary-days-output');output.hidden=false;output.replaceChildren();for(let index=0;index<days;index++){const day=sequence[index%Math.max(1,sequence.length)];const article=document.createElement('article');article.className='itinerary-day';const heading=document.createElement('h3');heading.textContent=`Day ${index+1}`;article.append(heading);if(day){const title=document.createElement('p');title.textContent=day.name;const area=document.createElement('p');area.textContent=day.place;const label=document.createElement('label');label.className='itinerary-day-edit';label.textContent='Change this day ';const select=document.createElement('select');select.setAttribute('aria-label',`Choose a place for day ${index+1}`);sequence.forEach(place=>{const option=document.createElement('option');option.value=place.name;option.textContent=`${place.name} · ${place.region}`;option.selected=place.name===day.name;select.append(option);});select.addEventListener('change',()=>{const choice=sequence.find(place=>place.name===select.value);title.textContent=choice.name;area.textContent=choice.place;});label.append(select);const note=document.createElement('p');note.textContent='Suggested stop. Confirm transport, time and access locally.';article.append(title,area,label,note);}else{const title=document.createElement('p');title.textContent='Choose a place from the field guide';article.append(title);}output.append(article);}document.querySelector('#itinerary-result-tools').hidden=false;document.querySelector('#itinerary-status').textContent=`A ${days}-day first draft is ready. Edit it by adding places from the field guide.`;});
  document.querySelector('#itinerary-save').addEventListener('click',()=>{localStorage.setItem('siphdev-draft',JSON.stringify({date:document.querySelector('#itinerary-start-date').value,days:document.querySelector('#itinerary-days').value,places:journey.map(item=>item.name)}));document.querySelector('#itinerary-status').textContent='Draft saved on this device.';});
  document.querySelector('#itinerary-share').addEventListener('click',async()=>{const url=new URL(location.href);url.hash='itinerary';try{await navigator.clipboard.writeText(url.href);document.querySelector('#itinerary-status').textContent='Page link copied. Your trip details are not included yet.';}catch{document.querySelector('#itinerary-status').textContent='Copy the page link from your browser to share this guide.';}});
  document.querySelector('#itinerary-print').addEventListener('click',()=>window.print());
  document.querySelector('#itinerary-clear').addEventListener('click',()=>{journey=[];document.querySelector('#itinerary-days-output').hidden=true;document.querySelector('#itinerary-result-tools').hidden=true;});
  document.querySelector('.menu-toggle').addEventListener('click',event=>{const button=event.currentTarget;const menu=document.querySelector('#mobile-nav');menu.hidden=!menu.hidden;button.setAttribute('aria-expanded',String(!menu.hidden));button.setAttribute('aria-label',menu.hidden?'Open navigation':'Close navigation');});
  document.querySelector('#mobile-nav').addEventListener('click',event=>{if(event.target.closest('a')){document.querySelector('#mobile-nav').hidden=true;document.querySelector('.menu-toggle').setAttribute('aria-expanded','false');}});
  renderFilters();updateSpotlight('All places');
})();
