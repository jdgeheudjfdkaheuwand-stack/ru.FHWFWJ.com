/* GAMEHUB — общие функции: хранилище, SVG-иконки, пользователи, реклама.
   ВАЖНО: всё хранится в localStorage браузера. Это демонстрационная версия
   без сервера — см. README.md, раздел «Безопасность». */
(function (global) {
  'use strict';

  var NS = 'gamehub:';

  /* ---------- SVG-иконки (24×24, линия) ---------- */
  var ICONS = {
    gamepad: '<line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="18" x2="18.01" y1="10" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    userplus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 8 10 8a13.2 13.2 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3.5 8 10 8a9.7 9.7 0 0 0 5.39-1.61"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path d="m2 2 20 20"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    phone: '<rect x="5" y="2" width="14" height="20" rx="3"/><path d="M12 18h.01"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><path d="M7 7h.01"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'
  };

  function icon(name, size) {
    var s = size || 20;
    return '<svg class="svg" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICONS[name] || ICONS.info) + '</svg>';
  }

  function hydrateIcons(root) {
    var nodes = (root || document).querySelectorAll('[data-icon]');
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.firstChild) continue;
      n.innerHTML = icon(n.getAttribute('data-icon'), parseInt(n.getAttribute('data-size'), 10) || 20);
    }
  }

  /* ---------- DOM-помощники ---------- */
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') n.className = v;
        else if (k === 'text') n.textContent = v;
        else if (k === 'html') n.innerHTML = v; /* только доверенный HTML (иконки) */
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') n.addEventListener(k.slice(2), v);
        else n.setAttribute(k, v === true ? '' : v);
      });
    }
    (kids || []).forEach(function (c) {
      if (c === null || c === undefined) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }

  function iconEl(name, size, cls) {
    return el('span', { class: 'ico' + (cls ? ' ' + cls : ''), html: icon(name, size) });
  }

  function esc(s) {
    return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- localStorage ---------- */
  function lsGet(key, fallback) {
    try {
      var raw = global.localStorage.getItem(NS + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function lsSet(key, value) {
    try { global.localStorage.setItem(NS + key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }
  function lsDel(key) {
    try { global.localStorage.removeItem(NS + key); } catch (e) { /* ignore */ }
  }
  function ssGet(key) {
    try { return global.sessionStorage.getItem(NS + key); } catch (e) { return null; }
  }
  function ssSet(key, v) {
    try { if (v === null) global.sessionStorage.removeItem(NS + key); else global.sessionStorage.setItem(NS + key, v); } catch (e) { /* ignore */ }
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function uid() { return 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  /* ---------- Валидация ---------- */
  var USERNAME_RE = /^[A-Za-z0-9_\-\u0400-\u04FF]{3,24}$/;
  var RESERVED = ['admin', 'administrator', 'gamehub', 'админ', 'администратор', 'root'];

  function validateUsername(u) {
    if (!u) return 'Введите username.';
    if (u.length < 3 || u.length > 24) return 'Username должен содержать от 3 до 24 символов.';
    if (!USERNAME_RE.test(u)) return 'В username можно использовать латиницу, кириллицу, цифры, _ и -.';
    if (RESERVED.indexOf(u.toLowerCase()) !== -1) return 'Это имя зарезервировано. Выберите другой username.';
    return '';
  }
  function validatePassword(p) {
    if (!p) return 'Введите пароль.';
    if (p.length < 6) return 'Пароль должен содержать минимум 6 символов.';
    return '';
  }
  function isHttpUrl(u) {
    try {
      var x = new URL(String(u).trim());
      return x.protocol === 'http:' || x.protocol === 'https:';
    } catch (e) { return false; }
  }

  /* ---------- Хэш пароля ---------- */
  function toHex(buf) {
    var a = new Uint8Array(buf), s = '';
    for (var i = 0; i < a.length; i++) s += ('0' + a[i].toString(16)).slice(-2);
    return s;
  }
  function randomSalt() {
    var a = new Uint8Array(16);
    if (global.crypto && global.crypto.getRandomValues) global.crypto.getRandomValues(a);
    else for (var i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256);
    return toHex(a);
  }
  function fallbackHash(str) { /* cyrb53 — только если нет WebCrypto (открыто не по https) */
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (var i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }
  function hashPassword(pw, salt) {
    if (global.crypto && global.crypto.subtle && global.TextEncoder) {
      var enc = new TextEncoder();
      return global.crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits'])
        .then(function (key) {
          return global.crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
        })
        .then(function (bits) { return 'p1:' + toHex(bits); });
    }
    return Promise.resolve('f1:' + fallbackHash(salt + ':' + pw));
  }

  /* ---------- Каталог ---------- */
  var DEFAULT_ADS = { code: '', slots: { inline: true, bottom: true, download: true } };

  function getBase() {
    return global.GAMEHUB_DEFAULTS || { version: 0, games: [], ads: DEFAULT_ADS };
  }

  function normalizeGame(g) {
    return {
      id: String(g.id || uid()),
      type: g.type === 'app' ? 'app' : 'game',
      title: String(g.title || '').slice(0, 80),
      description: String(g.description || '').slice(0, 800),
      cover: String(g.cover || ''),
      size: String(g.size || ''),
      version: String(g.version || ''),
      platform: String(g.platform || ''),
      category: String(g.category || ''),
      file: String(g.file || '')
    };
  }

  function getCatalog() {
    var stored = lsGet('catalog', null);
    var base = getBase();
    if (stored && stored.base === base.version && Array.isArray(stored.games)) return stored.games.map(normalizeGame);
    return clone(base.games || []).map(normalizeGame);
  }
  function saveCatalog(list) {
    return lsSet('catalog', { base: getBase().version, games: list });
  }
  function getGame(id) {
    var l = getCatalog();
    for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i];
    return null;
  }

  function getAds() {
    var stored = lsGet('ads', null);
    var base = getBase();
    var src = (stored && stored.base === base.version && stored.ads) ? stored.ads : (base.ads || DEFAULT_ADS);
    var slots = src.slots || {};
    return {
      code: String(src.code || ''),
      slots: {
        inline: slots.inline !== false,
        bottom: slots.bottom !== false,
        download: slots.download !== false
      }
    };
  }
  function saveAds(ads) {
    return lsSet('ads', { base: getBase().version, ads: ads });
  }
  function resetLocalData() {
    lsDel('catalog'); lsDel('ads');
  }

  /* Рекламный HTML вставляется через createContextualFragment, чтобы скрипты рекламных сетей выполнялись. */
  function renderAd(container, html) {
    container.textContent = '';
    if (!html || !html.trim()) return;
    try {
      var frag = document.createRange().createContextualFragment(html);
      container.appendChild(frag);
    } catch (e) {
      container.textContent = '';
    }
  }

  /* ---------- Скачивания ---------- */
  function getDownloads() { return lsGet('downloads', {}); }
  function incDownload(id) {
    var d = getDownloads();
    d[id] = (d[id] || 0) + 1;
    lsSet('downloads', d);
  }
  function totalDownloads() {
    var d = getDownloads(), t = 0;
    Object.keys(d).forEach(function (k) { t += d[k] || 0; });
    return t;
  }

  /* ---------- Пользователи и сессия ---------- */
  function getUsers() { var u = lsGet('users', []); return Array.isArray(u) ? u : []; }
  function findUser(name) {
    var low = String(name).trim().toLowerCase(), u = getUsers();
    for (var i = 0; i < u.length; i++) if (String(u[i].username).toLowerCase() === low) return u[i];
    return null;
  }
  function addUser(user) {
    var u = getUsers(); u.push(user);
    return lsSet('users', u);
  }
  function getSession() {
    var s = lsGet('session', null);
    if (!s || !s.userId) return null;
    var u = getUsers();
    for (var i = 0; i < u.length; i++) if (u[i].id === s.userId) return { userId: u[i].id, username: u[i].username };
    return null;
  }
  function setSession(user) { lsSet('session', { userId: user.id, username: user.username }); }
  function logout() {
    lsDel('session');
    document.dispatchEvent(new CustomEvent('gh:session'));
  }
  function isGuest() { return lsGet('guest', false) === true; }
  function setGuest() { lsSet('guest', true); }

  /* ---------- Админ ---------- */
  function getAdmin() { return lsGet('admin', null); }
  function setAdmin(a) { return lsSet('admin', a); }
  function clearAdmin() { lsDel('admin'); ssSet('admin-session', null); }
  function adminLoggedIn() { return ssGet('admin-session') === '1' && !!getAdmin(); }
  function setAdminSession(on) { ssSet('admin-session', on ? '1' : null); }

  /* ---------- Обложки ---------- */
  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function generatedCover(g) {
    var seed = hashStr(String(g.title || g.id || 'x'));
    var h1 = seed % 360, h2 = (h1 + 40 + (seed >> 5) % 90) % 360;
    var initial = esc((String(g.title || '?').trim().charAt(0) || '?').toUpperCase());
    var svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 400'>" +
      "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(" + h1 + ",68%,40%)'/><stop offset='1' stop-color='hsl(" + h2 + ",72%,18%)'/></linearGradient></defs>" +
      "<rect width='640' height='400' fill='url(#g)'/>" +
      "<circle cx='" + (90 + seed % 200) + "' cy='" + (60 + seed % 120) + "' r='150' fill='rgba(255,255,255,.07)'/>" +
      "<circle cx='" + (420 + seed % 160) + "' cy='" + (260 + seed % 100) + "' r='110' fill='rgba(0,0,0,.18)'/>" +
      "<path d='M0 330 L160 250 L280 310 L430 210 L640 320 L640 400 L0 400Z' fill='rgba(0,0,0,.28)'/>" +
      "<text x='50%' y='62%' text-anchor='middle' font-family='Arial Black,Arial,sans-serif' font-weight='900' font-size='210' fill='rgba(255,255,255,.2)'>" + initial + "</text></svg>";
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  function attachCover(img, g) {
    var url = g.cover && isHttpUrl(g.cover) ? g.cover : generatedCover(g);
    img.addEventListener('error', function () { img.src = generatedCover(g); }, { once: true });
    img.src = url;
  }

  function platformIcon(p) {
    return /android|ios|iphone|ipad|phone/i.test(String(p)) ? 'phone' : 'monitor';
  }

  /* ---------- Toast ---------- */
  function toast(msg, type) {
    var box = document.getElementById('toasts');
    if (!box) {
      box = el('div', { id: 'toasts', class: 'toasts', 'aria-live': 'polite' });
      document.body.appendChild(box);
    }
    var t = el('div', { class: 'toast toast-' + (type || 'info') }, [
      iconEl(type === 'error' ? 'alert' : type === 'success' ? 'check' : 'info', 18),
      el('span', { text: msg })
    ]);
    box.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('in'); });
    setTimeout(function () {
      t.classList.remove('in');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 250);
    }, 3600);
  }

  /* ---------- Диалог подтверждения ---------- */
  function confirmDialog(opts) {
    return new Promise(function (resolve) {
      var prev = document.activeElement;
      var okBtn = el('button', { class: 'btn ' + (opts.danger ? 'btn-danger' : 'btn-primary'), type: 'button', text: opts.okText || 'Подтвердить' });
      var noBtn = el('button', { class: 'btn btn-ghost', type: 'button', text: 'Отмена' });
      var overlay = el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' }, [
        el('div', { class: 'modal-backdrop' }),
        el('div', { class: 'modal-dialog modal-sm' }, [
          el('h3', { class: 'modal-title', text: opts.title || 'Подтвердите действие' }),
          el('p', { class: 'modal-text', text: opts.text || '' }),
          el('div', { class: 'modal-actions' }, [noBtn, okBtn])
        ])
      ]);
      function done(v) {
        document.removeEventListener('keydown', onKey);
        overlay.classList.remove('open');
        setTimeout(function () { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 200);
        if (prev && prev.focus) prev.focus();
        resolve(v);
      }
      function onKey(e) { if (e.key === 'Escape') done(false); }
      okBtn.addEventListener('click', function () { done(true); });
      noBtn.addEventListener('click', function () { done(false); });
      overlay.firstChild.addEventListener('click', function () { done(false); });
      document.addEventListener('keydown', onKey);
      document.body.appendChild(overlay);
      requestAnimationFrame(function () { overlay.classList.add('open'); noBtn.focus(); });
    });
  }

  /* ---------- Шапка: кнопки входа/выхода ---------- */
  function mountHeader() {
    var box = document.getElementById('authArea');
    if (!box) return;
    box.textContent = '';
    var s = getSession();
    if (s) {
      box.appendChild(el('span', { class: 'user-chip', title: s.username }, [
        el('span', { class: 'avatar', text: s.username.charAt(0).toUpperCase() }),
        el('span', { class: 'user-name', text: s.username })
      ]));
      box.appendChild(el('button', {
        class: 'btn btn-ghost btn-sm', type: 'button', 'aria-label': 'Выйти', id: 'logoutBtn',
        onclick: function () { logout(); toast('Вы вышли из аккаунта.', 'info'); mountHeader(); }
      }, [iconEl('logout', 18), el('span', { class: 'btn-text', text: 'Выйти' })]));
    } else {
      box.appendChild(el('a', { class: 'btn btn-ghost btn-sm', href: 'auth.html#login' }, [iconEl('login', 18), el('span', { text: 'Войти' })]));
      box.appendChild(el('a', { class: 'btn btn-primary btn-sm', href: 'auth.html#register' }, [iconEl('userplus', 18), el('span', { text: 'Регистрация' })]));
    }
  }

  function logoHtml(href) {
    return '<a class="logo" href="' + (href || 'index.html') + '" aria-label="GAMEHUB — на главную">' +
      '<span class="logo-mark">' + icon('gamepad', 22) + '</span><span class="logo-word">GAMEHUB</span></a>';
  }

  function exportData() {
    var payload = { version: Date.now(), games: getCatalog(), ads: getAds() };
    return '/* GAMEHUB — каталог и реклама. Сгенерировано в админ-панели. Замените этим файлом js/data.js */\n' +
      'window.GAMEHUB_DEFAULTS = ' + JSON.stringify(payload, null, 2) + ';\n';
  }

  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  }

  global.GameHub = {
    icon: icon, iconEl: iconEl, hydrateIcons: hydrateIcons, el: el, esc: esc,
    uid: uid, clone: clone, plural: plural,
    validateUsername: validateUsername, validatePassword: validatePassword, isHttpUrl: isHttpUrl,
    randomSalt: randomSalt, hashPassword: hashPassword,
    getCatalog: getCatalog, saveCatalog: saveCatalog, getGame: getGame, normalizeGame: normalizeGame,
    getAds: getAds, saveAds: saveAds, resetLocalData: resetLocalData, renderAd: renderAd,
    getDownloads: getDownloads, incDownload: incDownload, totalDownloads: totalDownloads,
    getUsers: getUsers, findUser: findUser, addUser: addUser,
    getSession: getSession, setSession: setSession, logout: logout, isGuest: isGuest, setGuest: setGuest,
    getAdmin: getAdmin, setAdmin: setAdmin, clearAdmin: clearAdmin, adminLoggedIn: adminLoggedIn, setAdminSession: setAdminSession,
    generatedCover: generatedCover, attachCover: attachCover, platformIcon: platformIcon,
    toast: toast, confirm: confirmDialog, mountHeader: mountHeader, logoHtml: logoHtml, exportData: exportData
  };

  document.addEventListener('DOMContentLoaded', function () {
    var slots = document.querySelectorAll('[data-logo]');
    for (var i = 0; i < slots.length; i++) slots[i].innerHTML = logoHtml(slots[i].getAttribute('data-logo') || 'index.html');
    hydrateIcons(document);
    mountHeader();
  });
})(window);
