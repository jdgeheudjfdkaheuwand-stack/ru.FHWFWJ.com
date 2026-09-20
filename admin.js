/* GAMEHUB — админ-панель (демо: хранение в localStorage, без сервера) */
(function () {
  'use strict';

  var GH = window.GameHub;
  var el = GH.el;
  function $(s) { return document.querySelector(s); }
  function $all(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }

  var gate = $('#gate'), panel = $('#panel');
  var setupForm = $('#setupForm'), loginForm = $('#adminLoginForm');
  var logoutBtn = $('#adminLogout');
  var failCount = 0, lockUntil = 0;

  /* ---------- Ошибки ---------- */
  function showErr(id, msg) {
    var box = $(id);
    box.querySelector('.form-error-text').textContent = msg;
    box.hidden = false;
    box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
  }
  function hideErr(id) { $(id).hidden = true; }

  /* ---------- Показать / скрыть пароль ---------- */
  $all('.toggle-pass').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = document.getElementById(btn.getAttribute('data-target'));
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-label', show ? 'Скрыть пароль' : 'Показать пароль');
      btn.querySelector('.ico').innerHTML = GH.icon(show ? 'eyeoff' : 'eye', 18);
    });
  });

  /* ---------- Какой экран показать ---------- */
  function route() {
    var admin = GH.getAdmin();
    var logged = GH.adminLoggedIn();
    gate.hidden = logged;
    panel.hidden = !logged;
    logoutBtn.hidden = !logged;
    setupForm.hidden = !!admin;
    loginForm.hidden = !admin;
    if (logged) { refreshAll(); }
    else { (admin ? $('#adminUser') : $('#setupUser')).focus(); }
  }

  /* ---------- Создание администратора ---------- */
  setupForm.addEventListener('submit', function (e) {
    e.preventDefault();
    hideErr('#setupError');
    if (GH.getAdmin()) { route(); return; }
    var user = $('#setupUser').value.trim();
    var p1 = $('#setupPass').value, p2 = $('#setupPass2').value;
    var err = '';
    if (user.length < 3 || user.length > 24) err = 'Логин должен содержать от 3 до 24 символов.';
    else if (p1.length < 8) err = 'Пароль администратора — минимум 8 символов.';
    else if (p1 !== p2) err = 'Пароли не совпадают.';
    if (err) { showErr('#setupError', err); return; }

    var btn = $('#setupSubmit'); btn.disabled = true;
    var salt = GH.randomSalt();
    GH.hashPassword(p1, salt).then(function (hash) {
      if (!GH.setAdmin({ username: user, salt: salt, hash: hash, created: Date.now() })) throw new Error('storage');
      GH.setAdminSession(true);
      GH.toast('Администратор создан. Вы вошли.', 'success');
      setupForm.reset();
      btn.disabled = false;
      route();
    }).catch(function () {
      btn.disabled = false;
      showErr('#setupError', 'Не удалось сохранить данные. Проверьте, что браузер разрешает хранение (не приватный режим).');
    });
  });

  /* ---------- Вход администратора ---------- */
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    hideErr('#adminLoginError');
    var now = Date.now();
    if (now < lockUntil) {
      showErr('#adminLoginError', 'Слишком много попыток. Подождите ' + Math.ceil((lockUntil - now) / 1000) + ' сек.');
      return;
    }
    var admin = GH.getAdmin();
    var user = $('#adminUser').value.trim(), pass = $('#adminPass').value;
    if (!admin) { route(); return; }
    var btn = $('#adminLoginSubmit'); btn.disabled = true;

    GH.hashPassword(pass, admin.salt).then(function (hash) {
      btn.disabled = false;
      if (user.toLowerCase() === String(admin.username).toLowerCase() && hash === admin.hash) {
        failCount = 0;
        GH.setAdminSession(true);
        loginForm.reset();
        GH.toast('Добро пожаловать в админ-панель.', 'success');
        route();
      } else {
        failCount += 1;
        if (failCount >= 5) { lockUntil = Date.now() + 30000; failCount = 0; }
        showErr('#adminLoginError', 'Неверный логин или пароль.');
      }
    }).catch(function () {
      btn.disabled = false;
      showErr('#adminLoginError', 'Не удалось выполнить вход. Попробуйте ещё раз.');
    });
  });

  logoutBtn.addEventListener('click', function () {
    GH.setAdminSession(false);
    GH.toast('Вы вышли из админ-панели.', 'info');
    route();
  });

  /* ---------- Вкладки ---------- */
  $all('.tab').forEach(function (t) {
    t.addEventListener('click', function () {
      var name = t.getAttribute('data-tab');
      $all('.tab').forEach(function (x) { x.classList.toggle('active', x === t); x.setAttribute('aria-selected', x === t ? 'true' : 'false'); });
      $all('.tab-panel').forEach(function (p) { p.hidden = p.id !== 'tab-' + name; });
    });
  });

  /* ---------- Статистика ---------- */
  function renderStats() {
    var list = GH.getCatalog();
    var games = list.filter(function (g) { return g.type === 'game'; }).length;
    var apps = list.length - games;
    var data = [
      ['gamepad', games, 'Игр в каталоге'],
      ['grid', apps, 'Приложений'],
      ['users', GH.getUsers().length, 'Пользователей'],
      ['download', GH.totalDownloads(), 'Скачиваний']
    ];
    var box = $('#stats');
    box.textContent = '';
    data.forEach(function (d) {
      box.appendChild(el('div', { class: 'stat' }, [
        GH.iconEl(d[0], 22, 'stat-ico'),
        el('div', {}, [el('div', { class: 'stat-num', text: String(d[1]) }), el('div', { class: 'stat-label', text: d[2] })])
      ]));
    });
  }

  /* ---------- Каталог: список ---------- */
  function renderRows() {
    var list = GH.getCatalog();
    var dls = GH.getDownloads();
    var rows = $('#rows');
    rows.textContent = '';
    $('#listCount').textContent = String(list.length);
    if (!list.length) {
      rows.appendChild(el('div', { class: 'rows-empty', text: 'Каталог пуст. Добавьте первую игру в форме выше.' }));
      return;
    }
    list.forEach(function (g) {
      var img = el('img', { alt: '' });
      GH.attachCover(img, g);
      rows.appendChild(el('div', { class: 'row' }, [
        el('div', { class: 'row-thumb' }, [img]),
        el('div', { class: 'row-info' }, [
          el('div', { class: 'row-title' }, [
            el('strong', { text: g.title }),
            el('span', { class: 'pill' + (g.type === 'app' ? ' pill-alt' : ''), text: g.type === 'app' ? 'Приложение' : 'Игра' })
          ]),
          el('div', { class: 'row-meta', text: [g.platform, g.size, g.version ? 'v' + g.version : '', g.category].filter(Boolean).join('  ·  ') }),
          el('div', { class: 'row-link', text: g.file })
        ]),
        el('div', { class: 'row-dl', title: 'Скачиваний' }, [GH.iconEl('download', 16), el('span', { text: String(dls[g.id] || 0) })]),
        el('div', { class: 'row-actions' }, [
          el('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { startEdit(g.id); } }, [GH.iconEl('edit', 16), el('span', { text: 'Изменить' })]),
          el('button', { class: 'btn btn-danger btn-sm', type: 'button', onclick: function () { removeGame(g); } }, [GH.iconEl('trash', 16), el('span', { text: 'Удалить' })])
        ])
      ]));
    });
  }

  function renderCatList() {
    var cats = ['Экшен', 'Гонки', 'Головоломки', 'RPG', 'Стратегия', 'Приключения', 'Симулятор', 'Утилиты'];
    GH.getCatalog().forEach(function (g) { if (g.category && cats.indexOf(g.category) === -1) cats.push(g.category); });
    var dl = $('#catList');
    dl.textContent = '';
    cats.forEach(function (c) { dl.appendChild(el('option', { value: c })); });
  }

  /* ---------- Каталог: форма ---------- */
  var F = {
    id: $('#fId'), title: $('#fTitle'), type: $('#fType'), desc: $('#fDesc'), cover: $('#fCover'),
    size: $('#fSize'), version: $('#fVersion'), platform: $('#fPlatform'), category: $('#fCategory'), file: $('#fFile')
  };

  function resetForm() {
    $('#gameForm').reset();
    F.id.value = '';
    $('#formTitle').textContent = 'Добавить игру';
    $('#gameSubmitText').textContent = 'ДОБАВИТЬ ИГРУ';
    $('#gameCancel').hidden = true;
    hideErr('#gameError');
  }

  function startEdit(id) {
    var g = GH.getGame(id);
    if (!g) return;
    F.id.value = g.id; F.title.value = g.title; F.type.value = g.type; F.desc.value = g.description;
    F.cover.value = g.cover; F.size.value = g.size; F.version.value = g.version;
    F.platform.value = g.platform; F.category.value = g.category; F.file.value = g.file;
    $('#formTitle').textContent = 'Редактирование: ' + g.title;
    $('#gameSubmitText').textContent = 'СОХРАНИТЬ ИЗМЕНЕНИЯ';
    $('#gameCancel').hidden = false;
    hideErr('#gameError');
    $('#formCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    F.title.focus({ preventScroll: true });
  }

  $('#gameCancel').addEventListener('click', resetForm);

  $('#gameForm').addEventListener('submit', function (e) {
    e.preventDefault();
    hideErr('#gameError');
    var data = {
      id: F.id.value, type: F.type.value, title: F.title.value.trim(), description: F.desc.value.trim(),
      cover: F.cover.value.trim(), size: F.size.value.trim(), version: F.version.value.trim(),
      platform: F.platform.value.trim(), category: F.category.value.trim(), file: F.file.value.trim()
    };
    var err = '';
    if (!data.title) err = 'Введите название.';
    else if (!data.description) err = 'Введите описание.';
    else if (!data.size) err = 'Укажите размер файла.';
    else if (!data.version) err = 'Укажите версию.';
    else if (!data.platform) err = 'Укажите платформу.';
    else if (!data.file) err = 'Укажите ссылку на файл.';
    else if (!GH.isHttpUrl(data.file)) err = 'Ссылка на файл должна начинаться с http:// или https://';
    else if (data.cover && !GH.isHttpUrl(data.cover)) err = 'Ссылка на обложку должна начинаться с http:// или https:// (или оставьте поле пустым).';
    if (err) { showErr('#gameError', err); return; }

    var list = GH.getCatalog();
    var editing = !!data.id;
    if (editing) {
      var found = false;
      list = list.map(function (g) {
        if (g.id !== data.id) return g;
        found = true;
        return GH.normalizeGame(data);
      });
      if (!found) { list.unshift(GH.normalizeGame(Object.assign({}, data, { id: GH.uid() }))); }
    } else {
      data.id = GH.uid();
      list.unshift(GH.normalizeGame(data));
    }
    if (!GH.saveCatalog(list)) { showErr('#gameError', 'Не удалось сохранить: хранилище браузера недоступно или переполнено.'); return; }
    GH.toast(editing ? 'Изменения сохранены.' : 'Добавлено в каталог: ' + data.title, 'success');
    resetForm();
    refreshAll();
  });

  function removeGame(g) {
    GH.confirm({ title: 'Удалить «' + g.title + '»?', text: 'Позиция исчезнет из каталога. Это действие нельзя отменить.', okText: 'Удалить', danger: true })
      .then(function (ok) {
        if (!ok) return;
        var list = GH.getCatalog().filter(function (x) { return x.id !== g.id; });
        GH.saveCatalog(list);
        if (F.id.value === g.id) resetForm();
        GH.toast('Удалено: ' + g.title, 'success');
        refreshAll();
      });
  }

  /* ---------- Реклама ---------- */
  function loadAdsForm() {
    var ads = GH.getAds();
    $('#adCode').value = ads.code;
    $('#adInline').checked = ads.slots.inline;
    $('#adBottom').checked = ads.slots.bottom;
    $('#adDownload').checked = ads.slots.download;
  }
  $('#adSave').addEventListener('click', function () {
    var ads = {
      code: $('#adCode').value,
      slots: { inline: $('#adInline').checked, bottom: $('#adBottom').checked, download: $('#adDownload').checked }
    };
    if (GH.saveAds(ads)) GH.toast('Реклама сохранена.', 'success');
    else GH.toast('Не удалось сохранить рекламу.', 'error');
  });
  $('#adPreview').addEventListener('click', function () {
    var box = $('#adPreviewBox');
    var code = $('#adCode').value;
    if (!code.trim()) { box.hidden = true; GH.toast('Сначала вставьте рекламный код.', 'info'); return; }
    box.hidden = false;
    GH.renderAd(box, code);
  });
  $('#adClear').addEventListener('click', function () {
    $('#adCode').value = '';
    $('#adPreviewBox').hidden = true;
    $('#adPreviewBox').textContent = '';
    GH.toast('Поле очищено. Нажмите «Сохранить», чтобы убрать рекламу с сайта.', 'info');
  });

  /* ---------- Публикация ---------- */
  $('#exportBtn').addEventListener('click', function () {
    var blob = new Blob([GH.exportData()], { type: 'text/javascript;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = el('a', { href: url, download: 'data.js' });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    GH.toast('Файл data.js скачан. Замените им js/data.js в репозитории.', 'success');
  });

  $('#copyBtn').addEventListener('click', function () {
    var text = GH.exportData();
    function fallback() {
      var ta = el('textarea', { style: 'position:fixed;opacity:0;top:0;left:0' });
      ta.value = text; document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      GH.toast(ok ? 'Код скопирован.' : 'Не удалось скопировать. Используйте «Скачать data.js».', ok ? 'success' : 'error');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { GH.toast('Код скопирован.', 'success'); }, fallback);
    } else fallback();
  });

  $('#importFile').addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var text = String(reader.result);
        var start = text.indexOf('{'), end = text.lastIndexOf('}');
        if (start === -1 || end === -1) throw new Error('format');
        var obj = JSON.parse(text.slice(start, end + 1));
        if (!obj || !Array.isArray(obj.games)) throw new Error('games');
        var seen = {};
        var games = obj.games.map(function (g) {
          var n = GH.normalizeGame(g);
          if (seen[n.id]) n.id = GH.uid();
          seen[n.id] = 1;
          return n;
        }).filter(function (g) { return g.title; });
        GH.saveCatalog(games);
        if (obj.ads) {
          var s = obj.ads.slots || {};
          GH.saveAds({ code: String(obj.ads.code || ''), slots: { inline: s.inline !== false, bottom: s.bottom !== false, download: s.download !== false } });
        }
        GH.toast('Импортировано позиций: ' + games.length, 'success');
        refreshAll();
      } catch (err) {
        GH.toast('Не удалось прочитать файл. Нужен data.js или .json, созданный этой панелью.', 'error');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  });

  $('#resetBtn').addEventListener('click', function () {
    GH.confirm({ title: 'Сбросить локальные правки?', text: 'Каталог и реклама вернутся к версии из js/data.js. Несохранённые в файл изменения пропадут.', okText: 'Сбросить', danger: true })
      .then(function (ok) {
        if (!ok) return;
        GH.resetLocalData();
        resetForm();
        GH.toast('Локальные правки сброшены.', 'success');
        refreshAll();
      });
  });

  /* ---------- Аккаунт администратора ---------- */
  $('#passForm').addEventListener('submit', function (e) {
    e.preventDefault();
    hideErr('#passError');
    var admin = GH.getAdmin();
    if (!admin) { route(); return; }
    var oldP = $('#pOld').value, n1 = $('#pNew').value, n2 = $('#pNew2').value;
    var err = '';
    if (!oldP) err = 'Введите текущий пароль.';
    else if (n1.length < 8) err = 'Новый пароль — минимум 8 символов.';
    else if (n1 !== n2) err = 'Новые пароли не совпадают.';
    if (err) { showErr('#passError', err); return; }

    GH.hashPassword(oldP, admin.salt).then(function (h) {
      if (h !== admin.hash) { showErr('#passError', 'Текущий пароль указан неверно.'); return; }
      var salt = GH.randomSalt();
      return GH.hashPassword(n1, salt).then(function (nh) {
        admin.salt = salt; admin.hash = nh;
        GH.setAdmin(admin);
        $('#passForm').reset();
        GH.toast('Пароль изменён.', 'success');
      });
    }).catch(function () { showErr('#passError', 'Не удалось сменить пароль.'); });
  });

  $('#deleteAdminBtn').addEventListener('click', function () {
    GH.confirm({ title: 'Удалить доступ администратора?', text: 'Логин и пароль будут удалены из этого браузера. Затем можно создать новые.', okText: 'Удалить доступ', danger: true })
      .then(function (ok) {
        if (!ok) return;
        GH.clearAdmin();
        GH.toast('Доступ администратора удалён.', 'success');
        route();
      });
  });

  /* ---------- Общее обновление ---------- */
  function refreshAll() {
    renderStats();
    renderRows();
    renderCatList();
    loadAdsForm();
  }

  GH.hydrateIcons(document);
  route();
})();
