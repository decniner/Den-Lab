(function(){
  'use strict';
  const tabs=[...document.querySelectorAll('[data-atlas-tab]')];
  const panels=[...document.querySelectorAll('[data-atlas-panel]')];
  if(!tabs.length||!panels.length)return;
  const target=document.querySelector('#atlas');
  function activate(view,options={}){
    tabs.forEach(tab=>{
      const selected=tab.dataset.atlasTab===view;
      tab.setAttribute('aria-selected',String(selected));
      tab.tabIndex=selected?0:-1;
    });
    panels.forEach(panel=>{panel.hidden=panel.dataset.atlasPanel!==view;});
    if(options.focus)tabs.find(tab=>tab.dataset.atlasTab===view)?.focus();
    if(options.history){
      const url=new URL(location.href);url.hash=view==='tokyo'?'daytrips':'atlas';
      history.pushState({atlasView:view},'',url);
    }
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>activate(tab.dataset.atlasTab,{history:true}));
    tab.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:tabs.length-1))%tabs.length;
      activate(tabs[next].dataset.atlasTab,{focus:true,history:true});
    });
  });
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href="#atlas"],a[href="#daytrips"]');
    if(!link)return;
    event.preventDefault();
    const view=link.getAttribute('href')==='#daytrips'?'tokyo':'japan';
    activate(view,{history:true});
    target?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
    if(link.closest('.mobile-nav')){
      const menu=document.querySelector('#mobile-nav'),button=document.querySelector('.menu-toggle');
      menu.hidden=true;button?.setAttribute('aria-expanded','false');button?.setAttribute('aria-label','Open navigation');
    }
  });
  window.addEventListener('popstate',()=>activate(location.hash==='#daytrips'?'tokyo':'japan'));
  const shared=new URLSearchParams(location.search);
  activate(location.hash==='#daytrips'||shared.has('selected')||shared.has('trip')?'tokyo':'japan');
})();
