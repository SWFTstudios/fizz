(function () {
  var debounceTimer;

  function getSiteHeader() {
    return document.querySelector('[data-fizz-site-header]');
  }

  function closeCart() {
    document.dispatchEvent(new CustomEvent('fizz:cart-close'));
  }

  function initSearchDrawer() {
    var siteHeader = getSiteHeader();
    if (!siteHeader) return;

    var searchDrawer = siteHeader.querySelector('[data-fizz-search-drawer]');
    var backdrop = siteHeader.querySelector('[data-fizz-nav-backdrop]');
    var openers = siteHeader.querySelectorAll('[data-fizz-search-toggle]');
    var closers = siteHeader.querySelectorAll('[data-fizz-search-close]');
    var input = searchDrawer && searchDrawer.querySelector('[data-fizz-search-input]');
    var results = searchDrawer && searchDrawer.querySelector('[data-fizz-search-results]');
    var lastOpener = null;
    if (!searchDrawer || !input || !results) return;

    var predictiveUrl = searchDrawer.dataset.predictiveSearchUrl || '/search/suggest';
    var sectionId = searchDrawer.dataset.searchSectionId || 'fizz-predictive-search';

    function closeSearch() {
      if (!siteHeader.classList.contains('is-search-open')) return;
      var focusWasInside = searchDrawer.contains(document.activeElement);
      siteHeader.classList.remove('is-search-open');
      searchDrawer.hidden = true;
      searchDrawer.setAttribute('aria-hidden', 'true');
      if (backdrop && !siteHeader.classList.contains('is-cart-open')) {
        backdrop.hidden = true;
        document.body.classList.remove('fizz-nav-locked');
      }
      openers.forEach(function (btn) {
        btn.setAttribute('aria-expanded', 'false');
      });
      if (window.FizzNav && window.FizzNav.syncBodyLock) window.FizzNav.syncBodyLock();
      if (focusWasInside && lastOpener) lastOpener.focus();
    }

    function setSearchOpen(open) {
      if (open) {
        closeCart();
        document.dispatchEvent(new CustomEvent('fizz:nav-close'));
      }
      siteHeader.classList.toggle('is-search-open', open);
      searchDrawer.hidden = !open;
      searchDrawer.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (backdrop) backdrop.hidden = !open;
      document.body.classList.toggle('fizz-nav-locked', open);
      openers.forEach(function (btn) {
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      if (open) {
        window.requestAnimationFrame(function () {
          input.focus();
        });
      }
    }

    function showStatus(text) {
      results.innerHTML = '<p class="fizz-search-status">' + text + '</p>';
    }

    function fetchResults(term) {
      if (!term || term.length < 2) {
        results.innerHTML = '';
        return;
      }

      showStatus('Searching…');

      var url =
        predictiveUrl +
        '?q=' +
        encodeURIComponent(term) +
        '&section_id=' +
        encodeURIComponent(sectionId) +
        '&resources[type]=product,page,article&resources[limit]=6&resources[limit_scope]=each';

      fetch(url, { headers: { Accept: 'text/html' } })
        .then(function (res) {
          if (!res.ok) throw new Error('Search failed');
          return res.text();
        })
        .then(function (html) {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var inner = doc.querySelector('[data-fizz-predictive-results]');
          results.innerHTML = inner ? inner.innerHTML : '<p class="fizz-search-status">No results found.</p>';
        })
        .catch(function () {
          showStatus('Search unavailable. Press Go for full results.');
        });
    }

    openers.forEach(function (btn) {
      btn.addEventListener('click', function () {
        lastOpener = btn;
        var isOpen = siteHeader.classList.contains('is-search-open');
        setSearchOpen(!isOpen);
      });
    });

    closers.forEach(function (btn) {
      btn.addEventListener('click', closeSearch);
    });

    document.addEventListener('fizz:search-close', closeSearch);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && siteHeader.classList.contains('is-search-open')) closeSearch();
    });

    searchDrawer.addEventListener('keydown', function (e) {
      if (window.FizzNav && window.FizzNav.trapFocus) {
        window.FizzNav.trapFocus(e, searchDrawer);
      }
    });

    input.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        fetchResults(input.value.trim());
      }, 250);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearchDrawer);
  } else {
    initSearchDrawer();
  }
})();
