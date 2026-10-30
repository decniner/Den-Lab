(function () {
  'use strict';

  const tabs = [...document.querySelectorAll('[data-atlas-tab]')];
  const panels = [...document.querySelectorAll('[data-atlas-panel]')];
  if (!tabs.length || !panels.length) return;

  const shell = document.querySelector('.atlas-shell');
  const status = document.querySelector('#atlas-feature-status');
  const statusText = status?.querySelector('span');
  const retryButton = status?.querySelector('button');
  const target = document.querySelector('#atlas');
  let cityLoaded = false;
  let activationId = 0;

  function requestedView(url = new URL(location.href)) {
    const shared = url.searchParams;
    return url.hash === '#daytrips' || shared.has('origin') || shared.has('selected')
      ? 'tokyo'
      : 'japan';
  }

  function setActiveView(view) {
    tabs.forEach(tab => {
      const selected = tab.dataset.atlasTab === view;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    panels.forEach(panel => { panel.hidden = panel.dataset.atlasPanel !== view; });
    if (shell) shell.setAttribute('aria-busy', String(view === 'tokyo' && !cityLoaded));
  }

  function setStatus(message = '', canRetry = false) {
    if (!status) return;
    status.hidden = !message;
    if (statusText) statusText.textContent = message;
    if (retryButton) retryButton.hidden = !canRetry;
  }

  async function activate(view, options = {}) {
    if (!tabs.some(tab => tab.dataset.atlasTab === view)) return;
    const activation = ++activationId;
    setActiveView(view);
    if (options.focus) tabs.find(tab => tab.dataset.atlasTab === view)?.focus();
    if (options.history) {
      const url = new URL(location.href);
      url.hash = view === 'tokyo' ? 'daytrips' : 'atlas';
      history.pushState({ atlasView: view }, '', url);
    }

    if (view === 'tokyo' && !cityLoaded) {
      setStatus('Opening city plans and route maps…');
      try {
        if (!window.SIJFeatureLoader) throw new Error('The feature loader is unavailable.');
        await window.SIJFeatureLoader.loadCityPlanner();
        cityLoaded = true;
      } catch (_error) {
        if (activation === activationId) {
          if (shell) shell.setAttribute('aria-busy', 'false');
          setStatus('City planning tools could not load. Check your connection and try again.', true);
        }
        return;
      }
    }

    if (activation !== activationId) return;
    setStatus();
    if (shell) shell.setAttribute('aria-busy', 'false');
    window.dispatchEvent(new CustomEvent('atlas:viewchange', { detail: { view } }));
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab.dataset.atlasTab, { history: true }));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
      activate(tabs[next].dataset.atlasTab, { focus: true, history: true });
    });
  });

  retryButton?.addEventListener('click', () => activate('tokyo'));

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href="#atlas"],a[href="#daytrips"]');
    if (!link) return;
    event.preventDefault();
    const view = link.getAttribute('href') === '#daytrips' ? 'tokyo' : 'japan';
    activate(view, { history: true });
    target?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    if (link.closest('.mobile-nav')) {
      const menu = document.querySelector('#mobile-nav');
      const button = document.querySelector('.menu-toggle');
      if (menu) menu.hidden = true;
      button?.setAttribute('aria-expanded', 'false');
      button?.setAttribute('aria-label', 'Open navigation');
    }
  });

  window.addEventListener('popstate', () => activate(requestedView()));
  activate(requestedView());
})();
