/**
 * NF Water Wave — programmatic sine path (Snaxx-style).
 * Builds a closed fill-below crest, tiles it twice, CSS translates -50%.
 */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  /**
   * Half-period Snaxx-style cubic bows: crest points every `period/2`,
   * alternating control Y so a full wavelength = `period`.
   */
  function buildCrestPath(period, crestY, amp, totalWidth, bottomY) {
    var half = period / 2;
    var points = [];
    var x;
    for (x = 0; x <= totalWidth + 0.001; x += half) {
      points.push(x);
    }

    // Start at left crest, walk right with alternating bows (peak / trough).
    var d = 'M' + points[0] + ',' + crestY;
    var i;
    for (i = 1; i < points.length; i++) {
      var x0 = points[i - 1];
      var x1 = points[i];
      var mid = (x0 + x1) / 2;
      // Odd segments bow down (into fill), even bow up (into previous section)
      var bowY = i % 2 === 1 ? crestY + amp : crestY - amp;
      d += ' C' + mid + ',' + bowY + ' ' + mid + ',' + bowY + ' ' + x1 + ',' + crestY;
    }

    var lastX = points[points.length - 1];
    d +=
      ' L' +
      lastX +
      ',' +
      bottomY +
      ' L0,' +
      bottomY +
      ' Z';
    return d;
  }

  function render(root) {
    var svg = root.querySelector('[data-nf-water-wave-svg]');
    if (!svg) return;

    var period = parseFloat(root.getAttribute('data-nf-wave-period') || '60') || 60;
    var tiles = parseInt(root.getAttribute('data-nf-wave-tiles') || '6', 10) || 6;
    // Two copies of `tiles` wavelengths so -50% translate is seamless
    var wavelengths = tiles * 2;
    var vbWidth = period * wavelengths;
    var vbHeight = 36;
    var crestY = 14;
    var amp = 5.4;
    var bottomY = vbHeight;

    var d = buildCrestPath(period, crestY, amp, vbWidth, bottomY);

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    svg.setAttribute('viewBox', '0 0 ' + vbWidth + ' ' + vbHeight);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    var path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
  }

  function initAll() {
    var nodes = document.querySelectorAll('[data-nf-water-wave]');
    for (var i = 0; i < nodes.length; i++) {
      render(nodes[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', function (event) {
    var root = event.target && event.target.querySelector
      ? event.target.querySelector('[data-nf-water-wave]')
      : null;
    if (root) render(root);
    else if (event.target && event.target.matches && event.target.matches('[data-nf-water-wave]')) {
      render(event.target);
    }
  });
})();
