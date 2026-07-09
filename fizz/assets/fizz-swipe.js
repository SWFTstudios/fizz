(function () {
  var IGNORE_SELECTOR =
    "button, a, input, textarea, select, label, [data-fizz-exp-qty], [data-fizz-exp-add], [data-fizz-exp-minus], [data-fizz-exp-plus]";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function shouldIgnoreTarget(el) {
    return !!(el && el.closest(IGNORE_SELECTOR));
  }

  function axisLocked(deltaX, deltaY) {
    return Math.abs(deltaX) > Math.abs(deltaY) + 8;
  }

  function snapDuration(velocityX) {
    if (reducedMotion.matches) return 0;
    var speed = Math.min(Math.abs(velocityX), 2);
    return Math.max(180, Math.min(400, 400 - speed * 110));
  }

  function setTrackTransform(track, index, dragPx, animate) {
    var duration = animate === false || animate === 0 ? 0 : animate || 0;
    track.style.transition = duration ? "transform " + duration + "ms ease-out" : "none";
    var pct = -index * 100;
    var px = dragPx || 0;
    if (px) {
      track.style.transform = "translate3d(calc(" + pct + "% + " + px + "px), 0, 0)";
    } else {
      track.style.transform = "translate3d(" + pct + "%, 0, 0)";
    }
  }

  function attachDiscrete(options) {
    var viewport = options.viewport;
    var track = options.track;
    var getIndex = options.getIndex;
    var setIndex = options.setIndex;
    var slideCount = options.slideCount;
    var onStart = options.onStart;
    var onEnd = options.onEnd;

    if (!viewport || !track || slideCount < 2) return;

    viewport.classList.add("fizz-swipe-viewport");

    var pointerId = null;
    var startX = 0;
    var startY = 0;
    var gestureStartTime = 0;
    var dragPx = 0;
    var locked = false;
    var dragging = false;

    function updateTransform(animate) {
      setTrackTransform(track, getIndex(), dragPx, animate);
    }

    function finishDrag(velocityX) {
      var width = viewport.offsetWidth || 1;
      var threshold = width * 0.2;
      var index = getIndex();
      var next = index;

      if (dragPx < -threshold || velocityX < -0.35) next = index + 1;
      else if (dragPx > threshold || velocityX > 0.35) next = index - 1;

      dragPx = 0;
      dragging = false;
      viewport.classList.remove("is-grabbing");
      track.classList.remove("is-dragging");

      var duration = snapDuration(velocityX);
      if (next !== index) {
        setIndex(next);
      }
      updateTransform(duration);
      if (onEnd) onEnd();
    }

    viewport.addEventListener("pointerdown", function (event) {
      if (event.button !== undefined && event.button !== 0) return;
      if (shouldIgnoreTarget(event.target)) return;

      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      gestureStartTime = performance.now();
      dragPx = 0;
      locked = false;
      dragging = false;

      try {
        viewport.setPointerCapture(pointerId);
      } catch (_) {}
    });

    viewport.addEventListener("pointermove", function (event) {
      if (pointerId === null || event.pointerId !== pointerId) return;

      var deltaX = event.clientX - startX;
      var deltaY = event.clientY - startY;

      if (!locked) {
        if (!axisLocked(deltaX, deltaY)) return;
        locked = true;
        dragging = true;
        viewport.classList.add("is-grabbing");
        track.classList.add("is-dragging");
        if (onStart) onStart();
      }

      event.preventDefault();
      dragPx = deltaX;
      updateTransform(false);
    });

    function endPointer(event) {
      if (pointerId === null || event.pointerId !== pointerId) return;

      var velocityX = 0;
      if (dragging && locked) {
        velocityX = dragPx / Math.max(performance.now() - gestureStartTime, 1);
      }

      try {
        viewport.releasePointerCapture(pointerId);
      } catch (_) {}

      pointerId = null;

      if (dragging && locked) {
        finishDrag(velocityX);
      }
    }

    viewport.addEventListener("pointerup", endPointer);
    viewport.addEventListener("pointercancel", endPointer);

    updateTransform(false);
  }

  function attachContinuous(options) {
    var viewport = options.viewport;
    var onDrag = options.onDrag;
    var onRelease = options.onRelease;
    var ignoreTarget = options.shouldIgnoreTarget || function (el) {
      return !!(el && el.closest("button, input, textarea, select"));
    };

    if (!viewport || !onDrag) return;

    viewport.classList.add("fizz-swipe-viewport");

    var pointerId = null;
    var startX = 0;
    var startY = 0;
    var lastX = 0;
    var gestureStartTime = 0;
    var totalDrag = 0;
    var locked = false;
    var dragging = false;
    var didDrag = false;

    viewport.addEventListener("pointerdown", function (event) {
      if (event.button !== undefined && event.button !== 0) return;
      if (ignoreTarget(event.target)) return;

      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      lastX = event.clientX;
      gestureStartTime = performance.now();
      totalDrag = 0;
      locked = false;
      dragging = false;
      didDrag = false;

      try {
        viewport.setPointerCapture(pointerId);
      } catch (_) {}
    });

    viewport.addEventListener("pointermove", function (event) {
      if (pointerId === null || event.pointerId !== pointerId) return;

      var deltaX = event.clientX - startX;
      var deltaY = event.clientY - startY;

      if (!locked) {
        if (!axisLocked(deltaX, deltaY)) return;
        locked = true;
        dragging = true;
        viewport.classList.add("is-grabbing");
        lastX = event.clientX;
        return;
      }

      if (!dragging) return;

      event.preventDefault();
      didDrag = true;
      var stepX = event.clientX - lastX;
      totalDrag += stepX;
      lastX = event.clientX;
      onDrag(stepX);
    });

    function endPointer(event) {
      if (pointerId === null || event.pointerId !== pointerId) return;

      var velocityX = 0;
      if (dragging && locked) {
        velocityX = totalDrag / Math.max(performance.now() - gestureStartTime, 1);
      }

      try {
        viewport.releasePointerCapture(pointerId);
      } catch (_) {}

      pointerId = null;
      viewport.classList.remove("is-grabbing");

      if (dragging && onRelease) {
        onRelease(velocityX);
      }
      dragging = false;
      locked = false;
    }

    viewport.addEventListener("pointerup", endPointer);
    viewport.addEventListener("pointercancel", endPointer);

    viewport.addEventListener(
      "click",
      function (event) {
        if (!didDrag) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        didDrag = false;
      },
      true
    );
  }

  window.FizzSwipe = {
    attachDiscrete: attachDiscrete,
    attachContinuous: attachContinuous,
    setTrackTransform: setTrackTransform,
  };
})();
