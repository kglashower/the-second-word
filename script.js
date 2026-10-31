/* The Second Word — motion, note popovers, theme toggle. No dependencies. */
(function () {
  'use strict';

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  var toggle = document.getElementById('theme-toggle');
  function systemDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function currentDark() {
    var t = root.getAttribute('data-theme');
    if (t === 'dark') return true;
    if (t === 'light') return false;
    return systemDark();
  }
  function syncToggle() {
    var dark = currentDark();
    toggle.setAttribute('aria-pressed', dark ? 'true' : 'false');
    toggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  toggle.addEventListener('click', function () {
    var next = currentDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncToggle();
  });
  syncToggle();

  /* ---------- The path ----------
     Tiles are laid as they rise into view from below (walking forward) and lifted again
     when they fall out below the viewport (walking backward). Tiles that scroll off the
     top stay laid: the path behind you is still there, it is the path ahead that is
     unbuilt until you reach it. */
  var tiles = Array.prototype.slice.call(document.querySelectorAll('.tile'));

  /* Assign zigzag sides in document order, skipping full-width stones. */
  var side = 0;
  tiles.forEach(function (t) {
    if (t.classList.contains('title-block') || t.classList.contains('card') ||
        t.matches('.notes ol') || t.closest('.bibliography')) return;
    t.classList.add(side % 2 === 0 ? 'step-l' : 'step-r');
    side++;
  });

  if ('IntersectionObserver' in window) {
    var LAY_AHEAD = '0px 0px -12% 0px';   /* a tile is laid once its top clears the bottom 12% */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var t = e.target;
        if (e.isIntersecting) {
          t.classList.remove('is-lifted');
          t.classList.add('is-laid');
        } else if (e.boundingClientRect.top > 0) {
          /* left through the bottom edge: the walker stepped back, lift the stone */
          t.classList.add('is-lifted');
          t.classList.remove('is-laid');
        }
        /* left through the top edge: stays laid */
      });
    }, { threshold: 0, rootMargin: LAY_AHEAD });
    tiles.forEach(function (t) { io.observe(t); });
  } else {
    root.classList.add('no-observer');
  }

  /* Stagger: stones laid in the same frame settle one after another, like footsteps. */
  var pending = [];
  var raf = null;
  (function staggerLaying() {
    var mo = new MutationObserver(function (records) {
      records.forEach(function (r) {
        var t = r.target;
        if (t.classList.contains('is-laid') && !t.dataset.staggered) {
          t.dataset.staggered = '1';
          pending.push(t);
        }
      });
      if (!raf) raf = requestAnimationFrame(function () {
        pending.forEach(function (t, i) { t.style.transitionDelay = (i * 70) + 'ms'; });
        pending = []; raf = null;
        setTimeout(function () {
          tiles.forEach(function (t) { t.style.transitionDelay = ''; delete t.dataset.staggered; });
        }, 900);
      });
    });
    tiles.forEach(function (t) { mo.observe(t, { attributes: true, attributeFilter: ['class'] }); });
  })();

  if (location.hash) {
    var target = document.querySelector(location.hash);
    if (target) {
      var reached = false;
      tiles.forEach(function (t) {
        if (!reached) t.classList.add('is-laid');
        if (t === target || t.contains(target)) reached = true;
      });
    }
  }

  /* ---------- Note popovers ---------- */
  var pop = document.getElementById('popover');
  var markers = Array.prototype.slice.call(document.querySelectorAll('sup.fn a[data-note]'));
  var open = null;
  var BOOKS = ['peterson', 'rolheiser', 'sims', 'barton'];

  function noteFor(n) { return document.getElementById('n' + n); }

  function show(a) {
    var n = a.getAttribute('data-note');
    var li = noteFor(n);
    if (!li) return;
    var text = li.querySelector('.note-text');
    pop.innerHTML = '';
    var num = document.createElement('span');
    num.className = 'num';
    num.textContent = n + '.';
    pop.appendChild(num);
    pop.appendChild(text.cloneNode(true));
    BOOKS.forEach(function (b) { pop.classList.remove(b); });
    var books = (li.getAttribute('data-books') || '').split(' ');
    if (books[0]) pop.classList.add(books[0]);
    pop.hidden = false;
    open = a;
    place(a);
  }
  function place(a) {
    var r = a.getBoundingClientRect();
    var pw = pop.offsetWidth, ph = pop.offsetHeight;
    var pad = 8;
    var left = r.left + window.scrollX + r.width / 2 - pw / 2;
    var minLeft = window.scrollX + pad;
    var maxLeft = window.scrollX + document.documentElement.clientWidth - pw - pad;
    if (left < minLeft) left = minLeft;
    if (left > maxLeft) left = maxLeft;
    var top = r.top + window.scrollY - ph - 10;           /* above the marker */
    if (r.top - ph - 10 < 0) top = r.bottom + window.scrollY + 10; /* below if no room */
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
  }
  function hide() {
    pop.hidden = true;
    open = null;
  }

  var hoverTimer = null;
  markers.forEach(function (a) {
    a.addEventListener('mouseenter', function () {
      clearTimeout(hoverTimer);
      show(a);
    });
    a.addEventListener('mouseleave', function () {
      hoverTimer = setTimeout(function () { if (!pop.matches(':hover')) hide(); }, 120);
    });
    a.addEventListener('focus', function () { show(a); });
    a.addEventListener('blur', function () { hide(); });
    a.addEventListener('click', function (ev) {
      /* Touch: first tap opens, second tap follows the link. Pointer: follow the link. */
      var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      if (coarse && open !== a) {
        ev.preventDefault();
        show(a);
      }
    });
  });
  pop.addEventListener('mouseleave', function () { hide(); });
  document.addEventListener('click', function (ev) {
    if (open && !pop.contains(ev.target) && !ev.target.closest('sup.fn')) hide();
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && open) { var a = open; hide(); a.blur(); }
  });
  window.addEventListener('resize', function () { if (open) place(open); });
  window.addEventListener('scroll', function () { if (open) place(open); }, { passive: true });
})();
