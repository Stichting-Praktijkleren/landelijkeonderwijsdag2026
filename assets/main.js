/* Landelijke Onderwijsdag 2026 - interactions */
(function () {
  'use strict';

  /* Sticky header shrink */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile nav */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  var backdrop = document.querySelector('.nav-backdrop');
  function closeNav() {
    if (!nav) return;
    nav.classList.remove('open');
    if (backdrop) backdrop.classList.remove('show');
    document.body.classList.remove('nav-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }
  function openNav() {
    nav.classList.add('open');
    if (backdrop) backdrop.classList.add('show');
    document.body.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      if (nav.classList.contains('open')) { closeNav(); } else { openNav(); }
    });
    var navLinks = nav.querySelectorAll('a');
    for (var n = 0; n < navLinks.length; n++) {
      navLinks[n].addEventListener('click', closeNav);
    }
  }
  if (backdrop) backdrop.addEventListener('click', closeNav);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  /* Reveal on scroll (position-based; robust against fast flings) */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var ticking = false;
  function checkReveal() {
    ticking = false;
    var trigger = window.innerHeight * 0.92;
    for (var i = revealEls.length - 1; i >= 0; i--) {
      var el = revealEls[i];
      if (el.getBoundingClientRect().top < trigger) {
        el.classList.add('in');
        revealEls.splice(i, 1);
      }
    }
  }
  function onScrollReveal() {
    if (!ticking) { ticking = true; requestAnimationFrame(checkReveal); }
  }
  window.addEventListener('scroll', onScrollReveal, { passive: true });
  window.addEventListener('resize', onScrollReveal, { passive: true });
  window.addEventListener('load', checkReveal);
  checkReveal();
  setTimeout(function () {
    for (var i = 0; i < revealEls.length; i++) { revealEls[i].classList.add('in'); }
  }, 2500);

  /* Gallery lightbox */
  var lb = document.querySelector('.lightbox');
  if (lb) {
    var lbImg = lb.querySelector('img');
    var figs = document.querySelectorAll('[data-lightbox]');
    for (var g = 0; g < figs.length; g++) {
      figs[g].addEventListener('click', function () {
        var img = this.querySelector('img');
        if (!img) return;
        lbImg.src = img.currentSrc || img.src;
        lbImg.alt = img.alt || '';
        lb.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    }
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('close')) {
        lb.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { lb.classList.remove('open'); document.body.style.overflow = ''; }
    });
  }

  /* Countdown */
  var cd = document.querySelector('[data-countdown]');
  if (cd) {
    var target = new Date('2026-11-24T09:00:00+01:00').getTime();
    var elD = cd.querySelector('[data-d]');
    var elH = cd.querySelector('[data-h]');
    var elM = cd.querySelector('[data-m]');
    var elS = cd.querySelector('[data-s]');
    function pad(v) { return (v < 10 ? '0' : '') + v; }
    function tick() {
      var diff = target - Date.now();
      if (diff < 0) diff = 0;
      var days = Math.floor(diff / 86400000);
      var hrs = Math.floor((diff % 86400000) / 3600000);
      var mins = Math.floor((diff % 3600000) / 60000);
      var secs = Math.floor((diff % 60000) / 1000);
      if (elD) elD.textContent = days;
      if (elH) elH.textContent = pad(hrs);
      if (elM) elM.textContent = pad(mins);
      if (elS) elS.textContent = pad(secs);
    }
    tick();
    setInterval(tick, 1000);
  }

  /* Klapt elke ronde open die na een filter-/tabklik zichtbaar is, zodat je
     nooit op een filter klikt en niets ziet omdat de ronde dichtstaat. */
  function openVisibleRondePanels() {
    Array.prototype.slice.call(document.querySelectorAll('[data-ronde-panel]')).forEach(function (panel) {
      if (panel.style.display !== 'none') panel.open = true;
    });
  }

  /* Session filters (type) */
  var sessionFilters = Array.prototype.slice.call(document.querySelectorAll('[data-session-filter]'));
  var sessionCards = Array.prototype.slice.call(document.querySelectorAll('[data-session-type]'));
  if (sessionFilters.length && sessionCards.length) {
    sessionFilters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        sessionFilters.forEach(function (b) { b.classList.remove('is-active'); });
        this.classList.add('is-active');
        var type = this.getAttribute('data-session-filter');
        sessionCards.forEach(function (card) {
          var show = type === 'alle' || card.getAttribute('data-session-type') === type;
          card.style.display = show ? '' : 'none';
        });
        openVisibleRondePanels();
      });
    });
  }

  /* Ronde tabs (werkt onafhankelijk naast het type-filter hierboven) */
  var rondeTabs = Array.prototype.slice.call(document.querySelectorAll('[data-ronde-filter]'));
  var rondePanels = Array.prototype.slice.call(document.querySelectorAll('[data-ronde-panel]'));
  if (rondeTabs.length && rondePanels.length) {
    rondeTabs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        rondeTabs.forEach(function (b) { b.classList.remove('is-active'); });
        this.classList.add('is-active');
        var ronde = this.getAttribute('data-ronde-filter');
        rondePanels.forEach(function (panel) {
          var show = ronde === 'alle' || panel.getAttribute('data-ronde-panel') === ronde;
          panel.style.display = show ? '' : 'none';
        });
        openVisibleRondePanels();
      });
    });
  }

  /* Sessiekaarten: automatisch dichtklappen als je "Lees meer" open laat
     staan en wegscrolt (10s nadat hij helemaal buiten beeld is) */
  var sessionDetailsEls = Array.prototype.slice.call(document.querySelectorAll('.session-card__more'));
  if (sessionDetailsEls.length && 'IntersectionObserver' in window) {
    var autoCloseTimers = new Map();
    var detailsObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var el = entry.target;
        if (entry.isIntersecting) {
          var pending = autoCloseTimers.get(el);
          if (pending) { clearTimeout(pending); autoCloseTimers.delete(el); }
        } else if (el.open && !autoCloseTimers.has(el)) {
          autoCloseTimers.set(el, setTimeout(function () {
            el.open = false;
            autoCloseTimers.delete(el);
          }, 10000));
        }
      });
    }, { threshold: 0 });
    sessionDetailsEls.forEach(function (el) {
      detailsObserver.observe(el);
      el.addEventListener('toggle', function () {
        if (!el.open) {
          var pending = autoCloseTimers.get(el);
          if (pending) { clearTimeout(pending); autoCloseTimers.delete(el); }
        }
      });
    });
  }

  /* Favorieten: opgeslagen in localStorage (per browser/apparaat, geen account nodig).
     Werkt op elke pagina: het hartje-icoon + paneel worden hier aangemaakt, de losse
     sterretjes op sessiekaarten bestaan alleen op de programma-pagina zelf. */
  var FAV_KEY = 'lod2026-favorieten';
  function getFavorites() {
    try {
      var raw = localStorage.getItem(FAV_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function setFavorites(list) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch (e) { /* privénavigatie o.i.d. */ }
  }
  function isFavorited(nr, favs) {
    return favs.some(function (f) { return f.nr === nr; });
  }
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  var favToggleBtn = document.createElement('button');
  favToggleBtn.type = 'button';
  favToggleBtn.className = 'fav-toggle';
  favToggleBtn.setAttribute('aria-label', 'Mijn favoriete sessies');
  favToggleBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 17.3l-6.2 3.8 1.6-7-5.4-4.7 7.1-.6L12 2l2.9 6.8 7.1.6-5.4 4.7 1.6 7z"/></svg><span class="fav-toggle__count" hidden>0</span>';
  var headerBar = document.querySelector('.site-header .bar');
  var navToggleEl = document.querySelector('.nav-toggle');
  if (headerBar) {
    if (navToggleEl) headerBar.insertBefore(favToggleBtn, navToggleEl);
    else headerBar.appendChild(favToggleBtn);
  }
  var favCountEl = favToggleBtn.querySelector('.fav-toggle__count');
  function refreshFavCount() {
    var n = getFavorites().length;
    favCountEl.textContent = n;
    favCountEl.hidden = n === 0;
  }
  refreshFavCount();

  var favOverlay = document.createElement('div');
  favOverlay.className = 'fav-panel-overlay';
  favOverlay.innerHTML =
    '<div class="fav-panel" role="dialog" aria-modal="true" aria-label="Mijn favoriete sessies">' +
      '<div class="fav-panel__head"><h2>Mijn favorieten</h2>' +
      '<button type="button" class="fav-panel__close" aria-label="Sluiten"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>' +
      '<div class="fav-panel__body"></div>' +
    '</div>';
  document.body.appendChild(favOverlay);
  var favPanelBody = favOverlay.querySelector('.fav-panel__body');

  function favoriteLine(f) {
    return 'Nr. ' + f.nr + ' - ' + f.titel + ' (' + f.type + ', Ronde ' + f.ronde + ', ' + f.tijd + ')';
  }
  function favoritesAsText(favs) {
    return favs.map(favoriteLine).join('\r\n');
  }

  function renderFavPanel() {
    var favs = getFavorites();
    if (!favs.length) {
      favPanelBody.innerHTML = '<p class="fav-panel__empty">Nog geen favorieten. Blader door het programma en klik op het sterretje bij een sessie die je interessant vindt.</p>';
      return;
    }
    var itemsHtml = favs.map(function (f) {
      return '<li class="fav-panel__item">' +
        '<div class="fav-panel__item-main"><b>' + escapeHtml(f.titel) + '</b>' +
        '<div class="fav-panel__item-meta">' + escapeHtml(f.type) + ' &middot; Nr. ' + escapeHtml(f.nr) +
        ' &middot; Ronde ' + escapeHtml(f.ronde) + ' (' + escapeHtml(f.tijd) + ')</div></div>' +
        '<button type="button" class="fav-panel__remove" data-remove-nr="' + escapeHtml(f.nr) + '" aria-label="Verwijder uit favorieten">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
        '</li>';
    }).join('');
    favPanelBody.innerHTML =
      '<ul class="fav-panel__list">' + itemsHtml + '</ul>' +
      '<p class="fav-panel__hint">Kopieer de lijst om ze te plakken in een mail of Word-document, of stuur ze meteen per e-mail naar jezelf.</p>' +
      '<div class="fav-panel__actions">' +
        '<button type="button" class="btn btn--ghost" id="fav-copy-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Kopieer lijst</button>' +
        '<button type="button" class="btn btn--ghost" id="fav-mail-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>Verstuur per e-mail</button>' +
        '<button type="button" class="btn btn--ghost" id="fav-clear-btn">Alles wissen</button>' +
      '</div>';
  }

  function openFavPanel() {
    renderFavPanel();
    favOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeFavPanel() {
    favOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  favToggleBtn.addEventListener('click', openFavPanel);
  favOverlay.addEventListener('click', function (e) {
    if (e.target === favOverlay || e.target.closest('.fav-panel__close')) closeFavPanel();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && favOverlay.classList.contains('open')) closeFavPanel();
  });

  var favButtons = Array.prototype.slice.call(document.querySelectorAll('.session-card__fav'));
  function syncFavButtons() {
    var favs = getFavorites();
    favButtons.forEach(function (btn) {
      var active = isFavorited(btn.getAttribute('data-fav-nr'), favs);
      btn.classList.toggle('is-fav', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  favPanelBody.addEventListener('click', function (e) {
    var removeBtn = e.target.closest('[data-remove-nr]');
    if (removeBtn) {
      setFavorites(getFavorites().filter(function (f) { return f.nr !== removeBtn.getAttribute('data-remove-nr'); }));
      renderFavPanel();
      refreshFavCount();
      syncFavButtons();
      return;
    }
    var copyBtn = e.target.closest('#fav-copy-btn');
    if (copyBtn) {
      var text = favoritesAsText(getFavorites());
      var restoreLabel = copyBtn.innerHTML;
      var flash = function (ok) {
        copyBtn.textContent = ok ? 'Gekopieerd!' : 'Kopiëren mislukt, probeer te selecteren';
        setTimeout(function () { copyBtn.innerHTML = restoreLabel; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { flash(true); }, function () { flash(false); });
      } else {
        var tmp = document.createElement('textarea');
        tmp.value = text;
        tmp.style.position = 'fixed';
        tmp.style.opacity = '0';
        document.body.appendChild(tmp);
        tmp.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        document.body.removeChild(tmp);
        flash(ok);
      }
      return;
    }
    var mailBtn = e.target.closest('#fav-mail-btn');
    if (mailBtn) {
      var favsForMail = getFavorites();
      var subject = 'Mijn favoriete sessies - Landelijke Onderwijsdag 2026';
      var body = favoritesAsText(favsForMail) + '\r\n\r\nOverzicht via het programma op landelijkeonderwijsdag.nl';
      window.location.href = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      return;
    }
    if (e.target.closest('#fav-clear-btn')) {
      setFavorites([]);
      renderFavPanel();
      refreshFavCount();
      syncFavButtons();
    }
  });

  if (favButtons.length) {
    syncFavButtons();
    favButtons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var nr = btn.getAttribute('data-fav-nr');
        var favs = getFavorites();
        if (isFavorited(nr, favs)) {
          favs = favs.filter(function (f) { return f.nr !== nr; });
        } else {
          favs.push({
            nr: nr,
            titel: btn.getAttribute('data-fav-titel'),
            type: btn.getAttribute('data-fav-type'),
            ronde: btn.getAttribute('data-fav-ronde'),
            tijd: btn.getAttribute('data-fav-tijd')
          });
        }
        setFavorites(favs);
        syncFavButtons();
        refreshFavCount();
      });
    });
  }

  /* Sliders op de homepage (sprekers en foto's) */
  document.querySelectorAll('.speaker-slider, .foto-slider').forEach(function (root) {
    var track = root.querySelector('.speaker-slider__track, .foto-slider__track');
    if (!track) return;
    var prevBtn = root.querySelector('.speaker-slider__nav--prev');
    var nextBtn = root.querySelector('.speaker-slider__nav--next');
    var scrollByCard = function (dir) {
      var item = track.firstElementChild;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 16;
      var step = item ? item.getBoundingClientRect().width + gap : 260;
      track.scrollBy({ left: dir * step, behavior: 'smooth' });
    };
    if (prevBtn) prevBtn.addEventListener('click', function () { scrollByCard(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { scrollByCard(1); });

    /* Foto-slider schuift rustig vanzelf door; stopt bij aanwijzen, aanraken of toetsenbordgebruik */
    if (root.classList.contains('foto-slider') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var paused = false;
      ['mouseenter', 'focusin', 'touchstart'].forEach(function (ev) { root.addEventListener(ev, function () { paused = true; }, { passive: true }); });
      ['mouseleave', 'focusout'].forEach(function (ev) { root.addEventListener(ev, function () { paused = false; }); });
      setInterval(function () {
        if (paused || document.hidden) return;
        if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) track.scrollTo({ left: 0, behavior: 'smooth' });
        else scrollByCard(1);
      }, 4500);
    }
  });

  /* Terug naar boven */
  var backToTop = document.createElement('button');
  backToTop.type = 'button';
  backToTop.className = 'back-to-top';
  backToTop.setAttribute('aria-label', 'Terug naar boven');
  backToTop.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(backToTop);
  function onScrollTopBtn() {
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    var halfway = scrollable * 0.5;
    backToTop.classList.toggle('show', scrollable > 0 && window.scrollY > halfway);
  }
  window.addEventListener('scroll', onScrollTopBtn, { passive: true });
  window.addEventListener('resize', onScrollTopBtn, { passive: true });
  window.addEventListener('load', onScrollTopBtn);
  onScrollTopBtn();
  backToTop.addEventListener('click', function () {
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* Year in footer */
  var years = document.querySelectorAll('[data-year]');
  for (var yy = 0; yy < years.length; yy++) {
    years[yy].textContent = new Date().getFullYear();
  }
})();
