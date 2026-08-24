(function () {
  'use strict';

  var instances = new WeakMap();
  var EDGE = 4;
  var END_RESET_MS = 500;

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function getGap(track) {
    var styles = window.getComputedStyle(track);
    return parseFloat(styles.rowGap || styles.columnGap || styles.gap) || 14;
  }

  function destroy(root) {
    var record = instances.get(root);
    if (!record) return;
    if (record.clearEndReset) record.clearEndReset();
    if (record.onScroll) {
      record.track.removeEventListener('scroll', record.onScroll);
    }
    if (record.onResize) {
      window.removeEventListener('resize', record.onResize);
    }
    if (record.btnHandlers) {
      record.btnHandlers.forEach(function (item) {
        item.el.removeEventListener('click', item.fn);
      });
    }
    instances.delete(root);
  }

  function bindButtons(root, step) {
    var handlers = [];
    root.querySelectorAll('[data-bf-about-prev]').forEach(function (btn) {
      var fn = function () { step(-1); };
      btn.addEventListener('click', fn);
      handlers.push({ el: btn, fn: fn });
    });
    root.querySelectorAll('[data-bf-about-next]').forEach(function (btn) {
      var fn = function () { step(1); };
      btn.addEventListener('click', fn);
      handlers.push({ el: btn, fn: fn });
    });
    return handlers;
  }

  /** Vertically center side arrows on the card track (section is position: relative). */
  function placeSideButtons(root, track) {
    var btns = root.querySelectorAll('.bf-about__side-btn');
    if (!btns.length || !track) return;
    if (window.matchMedia('(max-width: 899px)').matches) return;
    if (root.classList.contains('bf-about--vertical')) return;

    var rootRect = root.getBoundingClientRect();
    var trackRect = track.getBoundingClientRect();
    var mid = trackRect.top + trackRect.height / 2 - rootRect.top;
    Array.prototype.forEach.call(btns, function (btn) {
      btn.style.top = mid + 'px';
    });
  }

  function updateSideVisibility(root, track) {
    var prevBtns = root.querySelectorAll('.bf-about__side-btn--prev');
    var nextBtns = root.querySelectorAll('.bf-about__side-btn--next');
    if (!prevBtns.length && !nextBtns.length) return;

    var max = track.scrollWidth - track.clientWidth;
    var atStart = max <= EDGE || track.scrollLeft <= EDGE;
    var atEnd = max <= EDGE || track.scrollLeft >= max - EDGE;

    Array.prototype.forEach.call(prevBtns, function (btn) {
      btn.classList.toggle('is-hidden', atStart);
      btn.setAttribute('aria-hidden', atStart ? 'true' : 'false');
      btn.tabIndex = atStart ? -1 : 0;
    });
    Array.prototype.forEach.call(nextBtns, function (btn) {
      btn.classList.toggle('is-hidden', atEnd);
      btn.setAttribute('aria-hidden', atEnd ? 'true' : 'false');
      btn.tabIndex = atEnd ? -1 : 0;
    });
  }

  function init(root) {
    if (!root || instances.has(root)) return;

    var track = root.querySelector('[data-bf-about-track]');
    var progress = root.querySelector('[data-bf-about-progress]');
    if (!track) return;

    var vertical = root.getAttribute('data-bf-about-layout') === 'vertical';
    var resetTimer = null;

    function clearEndReset() {
      if (resetTimer) {
        window.clearTimeout(resetTimer);
        resetTimer = null;
      }
    }

    function isAtEnd() {
      var max = track.scrollWidth - track.clientWidth;
      return max <= EDGE || track.scrollLeft >= max - EDGE;
    }

    function scrollToStart() {
      var behavior = prefersReducedMotion() ? 'auto' : 'smooth';
      track.scrollTo({ left: 0, behavior: behavior });
    }

    function scheduleEndReset() {
      clearEndReset();
      resetTimer = window.setTimeout(function () {
        resetTimer = null;
        if (isAtEnd()) scrollToStart();
      }, END_RESET_MS);
    }

    function updateProgress() {
      if (!progress) return;
      var max = vertical
        ? track.scrollHeight - track.clientHeight
        : track.scrollWidth - track.clientWidth;
      var pos = vertical ? track.scrollTop : track.scrollLeft;
      var pct = max <= 0 ? 100 : Math.min(100, Math.max(8, (pos / max) * 100));
      progress.style.width = pct + '%';
    }

    function onScroll() {
      updateProgress();
      if (vertical) return;
      updateSideVisibility(root, track);
      if (isAtEnd()) scheduleEndReset();
      else clearEndReset();
    }

    function step(dir) {
      var card = track.querySelector('.bf-about__card');
      var gap = getGap(track);
      var behavior = prefersReducedMotion() ? 'auto' : 'smooth';
      if (vertical) {
        var amountY = card ? card.getBoundingClientRect().height + gap : track.clientHeight * 0.8;
        track.scrollBy({ top: dir * amountY, behavior: behavior });
        return;
      }
      if (dir > 0 && isAtEnd()) {
        clearEndReset();
        scrollToStart();
        return;
      }
      var amount = card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
      track.scrollBy({ left: dir * amount, behavior: behavior });
    }

    function onResize() {
      onScroll();
      placeSideButtons(root, track);
    }

    var btnHandlers = bindButtons(root, step);
    track.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    onScroll();
    placeSideButtons(root, track);
    window.requestAnimationFrame(function () {
      placeSideButtons(root, track);
      if (!vertical) updateSideVisibility(root, track);
    });

    instances.set(root, {
      track: track,
      onScroll: onScroll,
      onResize: onResize,
      btnHandlers: btnHandlers,
      clearEndReset: clearEndReset,
    });
  }

  function boot() {
    document.querySelectorAll('[data-bf-about]').forEach(init);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  document.addEventListener('shopify:section:load', function (event) {
    var section = event.target.querySelector('[data-bf-about]');
    if (!section) return;
    destroy(section);
    init(section);
  });

  document.addEventListener('shopify:section:unload', function (event) {
    var section = event.target.querySelector('[data-bf-about]');
    if (section) destroy(section);
  });
})();
