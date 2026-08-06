(function () {
  'use strict';

  function init(root) {
    var track = root.querySelector('[data-bf-about-track]');
    var prev = root.querySelector('[data-bf-about-prev]');
    var next = root.querySelector('[data-bf-about-next]');
    var progress = root.querySelector('[data-bf-about-progress]');
    if (!track) return;

    function updateProgress() {
      if (!progress) return;
      var max = track.scrollWidth - track.clientWidth;
      var pct = max <= 0 ? 100 : Math.min(100, Math.max(8, (track.scrollLeft / max) * 100));
      progress.style.width = pct + '%';
    }

    function step(dir) {
      var card = track.querySelector('.bf-about__card');
      var gap = 14;
      var amount = card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
      track.scrollBy({ left: dir * amount, behavior: 'smooth' });
    }

    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
    track.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }

  function boot() {
    document.querySelectorAll('[data-bf-about]').forEach(init);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  document.addEventListener('shopify:section:load', function (event) {
    var section = event.target.querySelector('[data-bf-about]');
    if (section) init(section);
  });
})();
