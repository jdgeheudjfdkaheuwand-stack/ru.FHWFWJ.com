/* GAMEHUB — регистрация и вход (демо: данные хранятся в localStorage браузера) */
(function () {
  'use strict';

  var GH = window.GameHub;
  function $(s) { return document.querySelector(s); }

  var loginForm = $('#loginForm'), registerForm = $('#registerForm');
  var tabLogin = $('#tabLogin'), tabRegister = $('#tabRegister');
  var busy = false;

  /* ---------- Вкладки ---------- */
  function showTab(name) {
    var isLogin = name !== 'register';
    loginForm.hidden = !isLogin;
    registerForm.hidden = isLogin;
    tabLogin.setAttribute('aria-selected', isLogin ? 'true' : 'false');
    tabRegister.setAttribute('aria-selected', isLogin ? 'false' : 'true');
    tabLogin.classList.toggle('active', isLogin);
    tabRegister.classList.toggle('active', !isLogin);
    hideError(loginForm); hideError(registerForm);
    document.title = (isLogin ? 'Вход' : 'Регистрация') + ' — GAMEHUB';
  }
  function tabFromHash() { return location.hash === '#register' ? 'register' : 'login'; }

  tabLogin.addEventListener('click', function () { history.replaceState(null, '', '#login'); showTab('login'); });
  tabRegister.addEventListener('click', function () { history.replaceState(null, '', '#register'); showTab('register'); });
  window.addEventListener('hashchange', function () { showTab(tabFromHash()); });

  /* ---------- Ошибки ---------- */
  function showError(form, msg) {
    var box = form.querySelector('.form-error');
    box.querySelector('.form-error-text').textContent = msg;
    box.hidden = false;
    box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
  }
  function hideError(form) { form.querySelector('.form-error').hidden = true; }

  /* ---------- Показать / скрыть пароль ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.toggle-pass'), function (btn) {
    btn.addEventListener('click', function () {
      var input = document.getElementById(btn.getAttribute('data-target'));
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-label', show ? 'Скрыть пароль' : 'Показать пароль');
      btn.querySelector('.ico').innerHTML = GH.icon(show ? 'eyeoff' : 'eye', 18);
      input.focus();
    });
  });

  function setBusy(btn, on) {
    busy = on;
    btn.disabled = on;
    btn.classList.toggle('loading', on);
  }

  /* ---------- Регистрация ---------- */
  registerForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    hideError(registerForm);
    var username = $('#regUser').value.trim();
    var pass = $('#regPass').value;
    var pass2 = $('#regPass2').value;

    var err = GH.validateUsername(username) || GH.validatePassword(pass);
    if (!err && pass !== pass2) err = 'Пароли не совпадают.';
    if (!err && GH.findUser(username)) err = 'Такой username уже занят. Выберите другой.';
    if (err) { showError(registerForm, err); return; }

    var btn = $('#registerSubmit');
    setBusy(btn, true);
    var salt = GH.randomSalt();
    GH.hashPassword(pass, salt).then(function (hash) {
      var user = { id: GH.uid(), username: username, salt: salt, hash: hash, created: Date.now() };
      if (!GH.addUser(user)) throw new Error('storage');
      GH.setSession(user);
      GH.toast('Аккаунт создан. Добро пожаловать, ' + username + '!', 'success');
      setTimeout(function () { location.href = 'index.html#games'; }, 700);
    }).catch(function () {
      setBusy(btn, false);
      showError(registerForm, 'Не удалось сохранить аккаунт. Проверьте, что в браузере разрешено хранение данных (не приватный режим).');
    });
  });

  /* ---------- Вход ---------- */
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    hideError(loginForm);
    var username = $('#loginUser').value.trim();
    var pass = $('#loginPass').value;
    if (!username || !pass) { showError(loginForm, 'Введите username и пароль.'); return; }

    var user = GH.findUser(username);
    if (!user) { showError(loginForm, 'Неверный username или пароль.'); return; }

    var btn = $('#loginSubmit');
    setBusy(btn, true);
    GH.hashPassword(pass, user.salt).then(function (hash) {
      if (hash !== user.hash) {
        setBusy(btn, false);
        showError(loginForm, 'Неверный username или пароль.');
        return;
      }
      GH.setSession(user);
      GH.toast('Вы вошли как ' + user.username + '.', 'success');
      setTimeout(function () { location.href = 'index.html#games'; }, 500);
    }).catch(function () {
      setBusy(btn, false);
      showError(loginForm, 'Не удалось выполнить вход. Попробуйте ещё раз.');
    });
  });

  /* ---------- Гость ---------- */
  $('#guestBtn').addEventListener('click', function () { GH.setGuest(); });

  /* ---------- Уже вошли ---------- */
  function refresh() {
    var s = GH.getSession();
    $('#already').hidden = !s;
    $('#forms').hidden = !!s;
    if (s) {
      $('#alreadyAvatar').textContent = s.username.charAt(0).toUpperCase();
      $('#alreadyText').textContent = 'Вы вошли как ' + s.username + '.';
    }
  }
  $('#alreadyLogout').addEventListener('click', function () {
    GH.logout();
    GH.toast('Вы вышли из аккаунта.', 'info');
    refresh();
    showTab(tabFromHash());
  });

  GH.hydrateIcons(document);
  refresh();
  showTab(tabFromHash());
})();
