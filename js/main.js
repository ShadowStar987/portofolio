/*
 * Portfolio behaviour. No libraries, no build step.
 * Every feature checks that its elements exist, so removing a section from
 * index.html never causes a runtime error.
 */
(function () {
  'use strict';

  var I18N = window.I18N || { nl: {}, ui: { en: {}, nl: {} } };
  var SUPPORTED = ['en', 'nl'];
  var root = document.documentElement;
  var currentLang = 'en';
  var videoSyncs = []; // VOEG TOE: updates play/pause labels after a language switch

  /* ---------- Helpers ---------- */
  function $(selector, scope) { return (scope || document).querySelector(selector); }
  function $all(selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); }

  function ui(key, vars) {
    var table = I18N.ui[currentLang] || I18N.ui.en;
    var text = table[key] || I18N.ui.en[key] || key;
    Object.keys(vars || {}).forEach(function (name) {
      text = text.split('{' + name + '}').join(vars[name]);
    });
    return text;
  }

  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function storageSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* private mode: ignore */ }
  }

  /* ---------- Language switching ---------- */
  // The English text in the HTML is the default; remember it so we can switch back.
  var textEls = $all('[data-i18n]');
  var attrEls = $all('[data-i18n-attr]');
  var textDefaults = textEls.map(function (el) { return el.textContent; });

  function parseAttrSpec(el) {
    return el.getAttribute('data-i18n-attr').split(';')
      .map(function (pair) { return pair.split(':').map(function (s) { return s.trim(); }); })
      .filter(function (pair) { return pair.length === 2 && pair[0] && pair[1]; });
  }
  var attrDefaults = attrEls.map(function (el) {
    var saved = {};
    parseAttrSpec(el).forEach(function (pair) { saved[pair[0]] = el.getAttribute(pair[0]); });
    return saved;
  });

  function applyLanguage(lang) {
    if (SUPPORTED.indexOf(lang) === -1) { lang = 'en'; }
    currentLang = lang;
    var dict = lang === 'en' ? null : (I18N[lang] || {});

    textEls.forEach(function (el, i) {
      var key = el.getAttribute('data-i18n');
      el.textContent = dict && typeof dict[key] === 'string' ? dict[key] : textDefaults[i];
    });

    attrEls.forEach(function (el, i) {
      parseAttrSpec(el).forEach(function (pair) {
        var attr = pair[0];
        var key = pair[1];
        var value = dict && typeof dict[key] === 'string' ? dict[key] : attrDefaults[i][attr];
        if (value !== null && value !== undefined) { el.setAttribute(attr, value); }
      });
    });

    root.setAttribute('lang', lang);
    $all('[data-lang]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang') === lang));
    });

    formatDates();
    clearFormMessages();
    videoSyncs.forEach(function (sync) { sync(); });
    storageSet('lang', lang);
  }

  function detectLanguage() {
    var fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (fromUrl && SUPPORTED.indexOf(fromUrl) !== -1) { return fromUrl; }
    var saved = storageGet('lang');
    if (saved && SUPPORTED.indexOf(saved) !== -1) { return saved; }
    var browser = (navigator.language || 'en').toLowerCase();
    return browser.indexOf('nl') === 0 ? 'nl' : 'en';
  }

  $all('[data-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () { applyLanguage(btn.getAttribute('data-lang')); });
  });

  /* ---------- Dates in the dev log ---------- */
  function formatDates() {
    if (!window.Intl || !Intl.DateTimeFormat) { return; }
    var locale = currentLang === 'nl' ? 'nl-NL' : 'en-GB';
    var formatter = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    $all('time[data-format-date]').forEach(function (el) {
      var date = new Date(el.getAttribute('datetime') + 'T00:00:00Z');
      if (!isNaN(date.getTime())) { el.textContent = formatter.format(date); }
    });
    // VOEG TOE: month + year dates in the timeline
    var monthFormatter = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });
    $all('time[data-format-month]').forEach(function (el) {
      var date = new Date(el.getAttribute('datetime') + '-01T00:00:00Z');
      if (!isNaN(date.getTime())) { el.textContent = monthFormatter.format(date); }
    });
  }

  /* ---------- Mobile menu ---------- */
  var menuBtn = $('.menu-toggle');
  var navList = $('#nav-list');

  function setMenu(open) {
    if (!menuBtn || !navList) { return; }
    menuBtn.setAttribute('aria-expanded', String(open));
    navList.classList.toggle('is-open', open);
  }

  if (menuBtn && navList) {
    menuBtn.addEventListener('click', function () {
      setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
    });
    $all('a', navList).forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        menuBtn.focus();
      }
    });
  }

  /* ---------- Project dialogs ---------- */
  $all('[data-dialog]').forEach(function (btn) {
    var dialog = document.getElementById(btn.getAttribute('data-dialog'));
    if (!dialog) { return; }
    btn.addEventListener('click', function () {
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', ''); // very old browsers: show inline
      }
    });
  });

  $all('dialog').forEach(function (dialog) {
    // Close when clicking the dark backdrop (the dialog element itself, outside .dialog-inner).
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog && typeof dialog.close === 'function') { dialog.close(); }
    });
  });

  /* ---------- Resume printing ---------- */
  // WIJZIG: the resume is a pop-up. Close it while printing so it prints as normal page
  // content (all browsers handle that the same way), then open it again afterwards.
  var printBtn = $('#print-resume');
  var resumeDialog = $('#dlg-resume');
  if (printBtn && resumeDialog) {
    printBtn.addEventListener('click', function () {
      var wasOpen = resumeDialog.open;
      if (wasOpen && typeof resumeDialog.close === 'function') { resumeDialog.close(); }
      root.classList.add('print-resume');

      var restored = false;
      function restore() {
        if (restored) { return; }
        restored = true;
        root.classList.remove('print-resume');
        window.removeEventListener('afterprint', restore);
        if (wasOpen && typeof resumeDialog.showModal === 'function') { resumeDialog.showModal(); }
      }
      window.addEventListener('afterprint', restore);
      window.print();
      // Some browsers never fire afterprint; this makes sure the page is always restored.
      window.setTimeout(restore, 1000);
    });
  }

  /* ---------- Contact form (opens the visitor's email app) ---------- */
  var form = $('#contact-form');
  var statusEl = $('#form-status');
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setFieldError(field, message) {
    var errorEl = document.getElementById(field.id + '-error');
    if (message) { field.setAttribute('aria-invalid', 'true'); } else { field.removeAttribute('aria-invalid'); }
    if (errorEl) { errorEl.textContent = message || ''; }
  }

  function clearFormMessages() {
    if (!form) { return; }
    $all('input, textarea', form).forEach(function (field) { setFieldError(field, ''); });
    if (statusEl) { statusEl.textContent = ''; }
    $all('.copy-status').forEach(function (el) { el.textContent = ''; });
  }

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var name = form.elements.name;
      var email = form.elements.email;
      var message = form.elements.message;

      var checks = [
        [name, name.value.trim() ? '' : ui('errName')],
        [email, EMAIL_PATTERN.test(email.value.trim()) ? '' : ui('errEmail')],
        [message, message.value.trim() ? '' : ui('errMessage')]
      ];

      var firstInvalid = null;
      checks.forEach(function (check) {
        setFieldError(check[0], check[1]);
        if (check[1] && !firstInvalid) { firstInvalid = check[0]; }
      });
      if (firstInvalid) {
        if (statusEl) { statusEl.textContent = ''; }
        firstInvalid.focus();
        return;
      }

      var to = form.getAttribute('data-email');
      var subject = ui('subject', { name: name.value.trim() });
      var body = message.value.trim() + '\n\n' + name.value.trim() + '\n' + email.value.trim();
      window.location.href = 'mailto:' + to +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);

      if (statusEl) { statusEl.textContent = ui('formOpened', { email: to }); }
    });

    // Clear a field's error as soon as the visitor fixes it.
    $all('input, textarea', form).forEach(function (field) {
      field.addEventListener('input', function () {
        if (field.getAttribute('aria-invalid') === 'true') { setFieldError(field, ''); }
      });
    });
  }

  /* ---------- VOEG TOE: copy Discord username ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback for pages opened from file:// or older browsers
    return new Promise(function (resolve, reject) {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(area);
      if (ok) { resolve(); } else { reject(new Error('copy failed')); }
    });
  }

  $all('[data-copy-target]').forEach(function (btn) {
    var source = document.getElementById(btn.getAttribute('data-copy-target'));
    var status = btn.closest('li') ? $('.copy-status', btn.closest('li')) : null;
    if (!source) { return; }
    btn.addEventListener('click', function () {
      var text = source.textContent.trim();
      copyText(text).then(function () {
        if (status) { status.textContent = ui('copied', { text: text }); }
      }).catch(function () {
        if (status) { status.textContent = ui('copyFailed', { text: text }); }
      });
    });
  });

  /* ---------- VOEG TOE: gameplay clips on project cards ---------- */
  // Desktop: plays on hover. Keyboard: plays when the card gets focus. Touch: tap the button.
  // Visitors who turned off animations only get the button, nothing starts by itself.
  function mediaMatches(query) {
    return typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
  }
  var reduceMotion = mediaMatches('(prefers-reduced-motion: reduce)');
  var canHover = mediaMatches('(hover: hover)');

  $all('.project-thumb video').forEach(function (video) {
    var thumb = video.parentElement;
    var card = thumb.closest('.project-card');
    var toggle = $('.video-toggle', thumb);
    var label = toggle ? $('.video-toggle-label', toggle) : null;

    function play() {
      try {
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') { promise.catch(function () { /* blocked or not loaded yet */ }); }
      } catch (e) { /* ignore */ }
    }
    function pause() {
      try { video.pause(); } catch (e) { /* ignore */ }
    }
    function sync() {
      if (!toggle) { return; }
      var playing = !video.paused;
      toggle.classList.toggle('is-playing', playing);
      if (label) { label.textContent = ui(playing ? 'pauseClip' : 'playClip'); }
    }

    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    videoSyncs.push(sync);

    if (toggle) {
      toggle.addEventListener('click', function () {
        if (video.paused) { play(); } else { pause(); }
      });
    }
    if (card && !reduceMotion) {
      if (canHover) {
        card.addEventListener('mouseenter', play);
        card.addEventListener('mouseleave', pause);
      }
      card.addEventListener('focusin', play);
      card.addEventListener('focusout', function (event) {
        if (!card.contains(event.relatedTarget)) { pause(); }
      });
    }
    sync();
  });

  // Pause a clip in a project pop-up when the pop-up closes.
  $all('dialog').forEach(function (dialog) {
    dialog.addEventListener('close', function () {
      $all('video', dialog).forEach(function (video) { try { video.pause(); } catch (e) { /* ignore */ } });
    });
  });

  /* ---------- Footer year ---------- */
  var yearEl = $('#year');
  if (yearEl) { yearEl.textContent = String(new Date().getFullYear()); }

  /* ---------- Start ---------- */
  applyLanguage(detectLanguage());
})();
