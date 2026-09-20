/* GAMEHUB — главная страница: каталог, поиск, категории, окно скачивания с таймером */
(function () {
  'use strict';

  var GH = window.GameHub;
  var el = GH.el;
  function $(s, r) { return (r || document).querySelector(s); }
  function $all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  var VIEWS = ['games', 'apps', 'about'];
  var COUNTDOWN = 10;
  var state = { view: 'games', q: '', cat: 'all' };

  var hero = $('#hero'), catalog = $('#catalog'), about = $('#about');
  var grid = $('#grid'), chips = $('#chips'), empty = $('#empty');
  var searchInput = $('#searchInput'), searchClear = $('#searchClear');
  var sectionTitle = $('#sectionTitle'), sectionCount = $('#sectionCount');
  var guestBanner = $('#guestBanner'), adBottom = $('#adBottom');
  var modal = $('#modal'), modalBody = $('#modalBody');

  var timerId = null, closeTimerId = null, lastFocus = null, searchDebounce = null;

  /* ---------- Данные ---------- */
  function itemsForView() {
    var type = state.view === 'apps' ? 'app' : 'game';
    return GH.getCatalog().filter(function (g) { return g.type === type; });
  }

  function filtered() {
    var q = state.q.trim().toLowerCase();
    return itemsForView().filter(function (g) {
      if (state.cat !== 'all' && g.category !== state.cat) return false;
      if (!q) return true;
      return (g.title + ' ' + g.description + ' ' + g.category + ' ' + g.platform).toLowerCase().indexOf(q) !== -1;
    });
  }

  /* ---------- Отрисовка ---------- */
  function renderChips() {
    var cats = [];
    itemsForView().forEach(function (g) { if (g.category && cats.indexOf(g.category) === -1) cats.push(g.category); });
    if (state.cat !== 'all' && cats.indexOf(state.cat) === -1) state.cat = 'all';
    chips.textContent = '';
    ['all'].concat(cats).forEach(function (c) {
      chips.appendChild(el('button', {
        class: 'chip' + (state.cat === c ? ' active' : ''), type: 'button',
        'aria-pressed': state.cat === c ? 'true' : 'false',
        text: c === 'all' ? 'Все' : c,
        onclick: function () { state.cat = c; renderChips(); renderGrid(); }
      }));
    });
    chips.hidden = cats.length === 0;
  }

  function metaItem(iconName, text) {
    return el('li', {}, [GH.iconEl(iconName, 16), el('span', { text: text })]);
  }

  function card(g) {
    var img = el('img', { alt: '', loading: 'lazy', decoding: 'async' });
    GH.attachCover(img, g);

    var cover = el('button', {
      class: 'card-cover', type: 'button', 'aria-label': 'Открыть карточку: ' + g.title,
      onclick: function () { openDetails(g.id); }
    }, [
      img,
      el('span', { class: 'badge' }, [GH.iconEl(GH.platformIcon(g.platform), 14), el('span', { text: g.platform })])
    ]);

    var body = el('div', { class: 'card-body' }, [
      g.category ? el('span', { class: 'card-cat', text: g.category }) : null,
      el('h3', { class: 'card-title' }, [
        el('button', { type: 'button', text: g.title, onclick: function () { openDetails(g.id); } })
      ]),
      el('p', { class: 'card-desc', text: g.description }),
      el('ul', { class: 'meta' }, [
        metaItem('box', g.size || '—'),
        metaItem('tag', g.version ? 'v' + g.version : '—'),
        metaItem(GH.platformIcon(g.platform), g.platform || '—')
      ]),
      el('button', {
        class: 'btn btn-download btn-block', type: 'button',
        onclick: function () { openDownload(g.id); }
      }, [GH.iconEl('download', 18), el('span', { text: 'СКАЧАТЬ' })])
    ]);

    return el('article', { class: 'card' }, [cover, body]);
  }

  function renderGrid() {
    var list = filtered();
    var ads = GH.getAds();
    var inlineOn = ads.code.trim() && ads.slots.inline && !state.q.trim();

    grid.textContent = '';
    var frag = document.createDocumentFragment();
    list.forEach(function (g, i) {
      frag.appendChild(card(g));
      if (inlineOn && (i + 1) % 6 === 0 && i + 1 < list.length) {
        var slot = el('div', { class: 'ad-slot ad-inline', 'data-label': 'Реклама' });
        GH.renderAd(slot, ads.code);
        frag.appendChild(slot);
      }
    });
    grid.appendChild(frag);
    grid.classList.remove('swap');
    void grid.offsetWidth;
    grid.classList.add('swap');

    empty.hidden = list.length > 0;
    grid.hidden = list.length === 0;

    var total = itemsForView().length;
    var word = state.view === 'apps'
      ? GH.plural(list.length, 'приложение', 'приложения', 'приложений')
      : GH.plural(list.length, 'игра', 'игры', 'игр');
    sectionCount.textContent = list.length === total ? total + ' ' + word : list.length + ' из ' + total;
  }

  function renderBottomAd() {
    var ads = GH.getAds();
    if (ads.code.trim() && ads.slots.bottom) {
      adBottom.hidden = false;
      GH.renderAd(adBottom, ads.code);
    } else {
      adBottom.hidden = true;
      adBottom.textContent = '';
    }
  }

  function renderView() {
    var isAbout = state.view === 'about';
    hero.hidden = isAbout;
    catalog.hidden = isAbout;
    about.hidden = !isAbout;
    $all('[data-view]').forEach(function (a) {
      var on = a.getAttribute('data-view') === state.view;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (!isAbout) {
      sectionTitle.textContent = state.view === 'apps' ? 'Приложения' : 'Игры';
      renderChips();
      renderGrid();
    }
    document.title = (isAbout ? 'О сайте' : state.view === 'apps' ? 'Приложения' : 'Игры') + ' — GAMEHUB';
  }

  function updateGuestBanner() {
    guestBanner.hidden = !!GH.getSession() || GH.isGuest();
  }

  /* ---------- Модальное окно ---------- */
  function openModal(node) {
    if (closeTimerId) { clearTimeout(closeTimerId); closeTimerId = null; }
    if (modal.hidden) lastFocus = document.activeElement;
    modalBody.textContent = '';
    modalBody.appendChild(node);
    modal.hidden = false;
    document.body.classList.add('no-scroll');
    requestAnimationFrame(function () { modal.classList.add('open'); });
    $('#modalClose').focus();
  }

  function closeModal() {
    stopTimer();
    modal.classList.remove('open');
    document.body.classList.remove('no-scroll');
    if (closeTimerId) clearTimeout(closeTimerId);
    closeTimerId = setTimeout(function () {
      modal.hidden = true;
      modalBody.textContent = '';
      closeTimerId = null;
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) { /* ignore */ } }
    }, 220);
  }

  function stopTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  /* ---------- Карточка игры ---------- */
  function openDetails(id) {
    var g = GH.getGame(id);
    if (!g) return;
    var img = el('img', { alt: 'Обложка: ' + g.title });
    GH.attachCover(img, g);
    var dl = GH.getDownloads()[g.id] || 0;

    function row(label, value) {
      return el('div', { class: 'kv' }, [el('dt', { text: label }), el('dd', { text: value || '—' })]);
    }

    var node = el('div', { class: 'details' }, [
      el('div', { class: 'details-cover' }, [img]),
      el('div', { class: 'details-body' }, [
        g.category ? el('span', { class: 'card-cat', text: g.category }) : null,
        el('h2', { class: 'modal-title', id: 'modalTitleAnchor', text: g.title }),
        el('p', { class: 'details-desc', text: g.description }),
        el('dl', { class: 'kvs' }, [
          row('Размер', g.size), row('Версия', g.version ? 'v' + g.version : ''),
          row('Платформа', g.platform), row('Скачиваний', String(dl))
        ]),
        el('button', {
          class: 'btn btn-download btn-block btn-lg', type: 'button',
          onclick: function () { openDownload(g.id); }
        }, [GH.iconEl('download', 20), el('span', { text: 'СКАЧАТЬ' })])
      ])
    ]);
    openModal(node);
  }

  /* ---------- Окно скачивания с таймером (JavaScript) ---------- */
  function openDownload(id) {
    var g = GH.getGame(id);
    if (!g) return;
    stopTimer();

    var CIRC = 2 * Math.PI * 52;
    var remaining = COUNTDOWN;
    var counted = false;
    var kind = g.type === 'app' ? 'ПРИЛОЖЕНИЕ' : 'ИГРУ';

    var numEl = el('span', { class: 'ring-num', 'aria-live': 'polite', text: String(remaining) });
    var ring = el('div', { class: 'ring' });
    ring.innerHTML = '<svg viewBox="0 0 120 120" width="150" height="150" aria-hidden="true">' +
      '<circle cx="60" cy="60" r="52" class="ring-track"></circle>' +
      '<circle cx="60" cy="60" r="52" class="ring-progress"></circle></svg>';
    var progress = ring.querySelector('.ring-progress');
    progress.setAttribute('stroke-dasharray', String(CIRC));
    progress.setAttribute('stroke-dashoffset', '0');
    ring.appendChild(numEl);

    var status = el('p', { class: 'dl-text', text: 'Ваша загрузка будет доступна через:' });
    var action = el('div', { class: 'dl-action' });

    var adBox = null;
    var ads = GH.getAds();
    if (ads.code.trim() && ads.slots.download) {
      adBox = el('div', { class: 'ad-slot ad-download', 'data-label': 'Реклама' });
      GH.renderAd(adBox, ads.code);
    }

    var node = el('div', { class: 'dl' }, [
      el('h2', { class: 'modal-title', id: 'modalTitleAnchor', text: 'Подготовка загрузки' }),
      el('p', { class: 'dl-name', text: g.title + (g.version ? ' · v' + g.version : '') + (g.size ? ' · ' + g.size : '') }),
      ring, status, adBox, action
    ]);

    var waitBtn = el('button', { class: 'btn btn-ghost btn-block btn-lg', type: 'button', disabled: true }, [GH.iconEl('clock', 20), el('span', { text: 'Ожидайте…' })]);
    action.appendChild(waitBtn);

    openModal(node);

    function finish() {
      stopTimer();
      ring.classList.add('done');
      numEl.innerHTML = GH.icon('check', 54);
      status.textContent = 'Загрузка готова.';
      action.textContent = '';
      if (!GH.isHttpUrl(g.file)) {
        action.appendChild(el('div', { class: 'form-error' }, [GH.iconEl('alert', 18), el('span', { text: 'Для этого файла не указана рабочая ссылка. Сообщите администратору.' })]));
        return;
      }
      var link = el('a', {
        class: 'btn btn-download btn-block btn-lg pulse', href: g.file.trim(), target: '_blank', rel: 'noopener noreferrer', download: ''
      }, [GH.iconEl('download', 20), el('span', { text: 'СКАЧАТЬ ' + kind })]);
      link.addEventListener('click', function () {
        if (!counted) { counted = true; GH.incDownload(g.id); }
        GH.toast('Загрузка началась. Если этого не произошло, нажмите кнопку ещё раз.', 'success');
      });
      action.appendChild(link);
      link.focus();
    }

    timerId = setInterval(function () {
      remaining -= 1;
      if (remaining <= 0) { progress.setAttribute('stroke-dashoffset', String(CIRC)); finish(); return; }
      numEl.textContent = String(remaining);
      progress.setAttribute('stroke-dashoffset', String(CIRC * (1 - remaining / COUNTDOWN)));
    }, 1000);
  }

  /* ---------- События ---------- */
  function readHash() {
    var h = (location.hash || '').replace('#', '');
    var next = VIEWS.indexOf(h) !== -1 ? h : 'games';
    if (next !== state.view) {
      state.view = next; state.cat = 'all';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    renderView();
  }

  function init() {
    GH.hydrateIcons(document);
    GH.mountHeader();
    $('#year').textContent = String(new Date().getFullYear());

    searchInput.addEventListener('input', function () {
      searchClear.hidden = !searchInput.value;
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(function () { state.q = searchInput.value; renderGrid(); }, 140);
    });
    searchClear.addEventListener('click', function () {
      searchInput.value = ''; searchClear.hidden = true; state.q = ''; renderGrid(); searchInput.focus();
    });
    $('#resetFilters').addEventListener('click', function () {
      searchInput.value = ''; searchClear.hidden = true; state.q = ''; state.cat = 'all'; renderChips(); renderGrid();
    });

    $('#guestBtn').addEventListener('click', function () {
      GH.setGuest(); updateGuestBanner();
      GH.toast('Гостевой режим: регистрация не нужна.', 'success');
      catalog.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    $('#modalClose').addEventListener('click', closeModal);
    $('#modalBackdrop').addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) closeModal();
    });

    document.addEventListener('gh:session', updateGuestBanner);
    window.addEventListener('hashchange', readHash);

    updateGuestBanner();
    renderBottomAd();
    readHash();
  }

  init();
})();
