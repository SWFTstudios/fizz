/**
 * NF Water Wave — multi-harmonic crest (Snaxx-style tile + CSS -50% loop).
 * Crest heights vary like real water; path is periodic over half SVG width.
 */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  /** Integer-cycle harmonics over tileWidth so y(0) === y(tileWidth). */
  function waveY(x, tileWidth, crestBase, a1, a2, a3) {
    var t = (2 * Math.PI * x) / tileWidth;
    return crestBase + a1 * Math.sin(t) + a2 * Math.sin(2 * t) + a3 * Math.sin(5 * t);
  }

  function clamp(y, minY, maxY) {
    if (y < minY) return minY;
    if (y > maxY) return maxY;
    return y;
  }

  /**
   * Sample multi-harmonic crest every half-period; cubic through mid-sample
   * so bows vary in height. totalWidth must be 2 * tileWidth for seamless -50%.
   */
  function buildCrestPath(period, tileWidth, totalWidth, bottomY, crestBase, a1, a2, a3) {
    var half = period / 2;
    var minY = 2;
    var maxY = bottomY - 4;
    var points = [];
    var x;
    for (x = 0; x <= totalWidth + 0.001; x += half) {
      points.push(x);
    }

    var y0 = clamp(waveY(points[0], tileWidth, crestBase, a1, a2, a3), minY, maxY);
    var d = 'M' + points[0] + ',' + y0;
    var i;
    for (i = 1; i < points.length; i++) {
      var x0 = points[i - 1];
      var x1 = points[i];
      var mid = (x0 + x1) / 2;
      var y1 = clamp(waveY(x1, tileWidth, crestBase, a1, a2, a3), minY, maxY);
      var cy = clamp(waveY(mid, tileWidth, crestBase, a1, a2, a3), minY, maxY);
      d += ' C' + mid + ',' + cy + ' ' + mid + ',' + cy + ' ' + x1 + ',' + y1;
    }

    var lastX = points[points.length - 1];
    d += ' L' + lastX + ',' + bottomY + ' L0,' + bottomY + ' Z';
    return d;
  }

  function render(root) {
    var svg = root.querySelector('[data-nf-water-wave-svg]');
    if (!svg) return;

    var period = parseFloat(root.getAttribute('data-nf-wave-period') || '60') || 60;
    var tiles = parseInt(root.getAttribute('data-nf-wave-tiles') || '6', 10) || 6;
    var tileWidth = period * tiles;
    var vbWidth = tileWidth * 2;
    var vbHeight = 48;
    var crestBase = 20;
    // Wide amp range → shallow ripples to taller swells (still within viewBox)
    var a1 = 9.5;
    var a2 = 5.2;
    var a3 = 3.1;
    var bottomY = vbHeight;

    var d = buildCrestPath(period, tileWidth, vbWidth, bottomY, crestBase, a1, a2, a3);

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
