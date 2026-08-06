(function () {
  'use strict';

  function init(root) {
    var track = root.querySelector('[data-bf-social-track]');
    var prev = root.querySelector('[data-bf-social-prev]');
    var next = root.querySelector('[data-bf-social-next]');
    if (!track) return;

    function step(dir) {
      var item = track.querySelector('.bf-social__item');
      var amount = item ? item.getBoundingClientRect().width + 14 : 240;
      track.scrollBy({ left: dir * amount, behavior: 'smooth' });
    }

    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
  }

  function boot() {
    document.querySelectorAll('[data-bf-social]').forEach(init);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
