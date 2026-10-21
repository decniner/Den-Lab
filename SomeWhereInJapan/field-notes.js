(function(){
  'use strict';
  document.querySelectorAll('.route-visual-photo img').forEach(image=>{
    image.addEventListener('error',()=>{
      image.hidden=true;
      image.closest('.route-visual-photo')?.classList.add('is-image-missing');
    },{once:true});
  });
})();
