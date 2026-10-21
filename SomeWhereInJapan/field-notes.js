(function(){
  'use strict';
  document.querySelectorAll('.route-visual-photo img').forEach(image=>{
    image.addEventListener('error',()=>{
      image.hidden=true;
      image.closest('.route-visual-photo')?.classList.add('is-image-missing');
    },{once:true});
  });
})();

(function () {
  'use strict';
  const guide = document.querySelector('[data-route-guide]');
  if (!guide) return;
  const controls = [...guide.querySelectorAll('[data-stop-select]')];
  const rows = [...guide.querySelectorAll('[data-stop-row]')];
  const live = guide.querySelector('.route-map-live');
  function selectStop(index) {
    const selected = Number(index);
    if (!Number.isInteger(selected) || selected < 0 || selected >= rows.length) return;
    controls.forEach((control) => {
      const active = Number(control.dataset.stopSelect) === selected;
      control.setAttribute('aria-pressed', String(active));
      if (control.classList.contains('route-map-pin')) control.classList.toggle('is-selected', active);
    });
    rows.forEach((row) => {
      const active = Number(row.dataset.stopRow) === selected;
      row.classList.toggle('is-selected', active);
      if (active) row.setAttribute('aria-current', 'step');
      else row.removeAttribute('aria-current');
    });
    const name = rows[selected]?.querySelector('.route-stop-copy strong')?.textContent || `point ${selected + 1}`;
    if (live) live.textContent = `Selected map point ${String(selected + 1).padStart(2, '0')}: ${name}`;
  }
  guide.addEventListener('click', (event) => {
    const button = event.target.closest('[data-stop-select]');
    if (button && guide.contains(button)) selectStop(button.dataset.stopSelect);
  });
})();
