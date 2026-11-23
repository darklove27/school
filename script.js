/* ============================================================
   Код & Дизайн — лендинг онлайн-школы
   script.js · тема, таймер, аккордеоны, тарифы, модалки,
   формы, анимации и мобильное меню. Без библиотек.
   ============================================================ */

(function () {
  'use strict';

  /* ---------- Небольшие утилиты ---------- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var numberFormat = new Intl.NumberFormat('ru-RU');

  function formatNumber(value) {
    return numberFormat.format(Math.round(value));
  }

  function safeGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      /* localStorage может быть недоступен — просто продолжаем работу */
    }
  }

  /* ============================================================
     1. Тема оформления
     ============================================================ */
  var themeToggle = document.getElementById('themeToggle');
  var themeColorMeta = document.querySelector('meta[name="theme-color"]');

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function syncThemeButton(theme) {
    if (!themeToggle) return;

    var isLight = theme === 'light';
    themeToggle.setAttribute('aria-pressed', String(isLight));
    themeToggle.setAttribute('aria-label', isLight ? 'Включить тёмную тему' : 'Включить светлую тему');

    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', isLight ? '#F8FAFC' : '#0B0D14');
    }
  }

  function applyTheme(theme, persist) {
    var next = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    syncThemeButton(next);

    if (persist) {
      safeSet('kd-theme', next);
    }
  }

  applyTheme(currentTheme(), false);

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
    });
  }

  /* ============================================================
     2. Шапка, активная навигация и кнопка «наверх»
     ============================================================ */
  var header = document.getElementById('header');
  var toTopButton = document.getElementById('toTop');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a'));
  var navSections = navLinks
    .map(function (link) {
      var href = link.getAttribute('href') || '';
      return href.charAt(0) === '#' ? document.querySelector(href) : null;
    })
    .filter(Boolean);

  function updateActiveNav() {
    if (!navSections.length) return;

    var headerHeight = header ? header.offsetHeight : 76;
    var marker = window.scrollY + headerHeight + 130;
    var currentId = '';
    var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 6;

    navSections.forEach(function (section) {
      if (section.offsetTop <= marker) {
        currentId = section.id;
      }
    });

    if (atBottom && navSections[navSections.length - 1]) {
      currentId = navSections[navSections.length - 1].id;
    }

    navLinks.forEach(function (link) {
      var isActive = link.getAttribute('href') === '#' + currentId;
      link.classList.toggle('is-active', isActive);

      if (isActive) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  var scrollTicking = false;

  function handleScrollFrame() {
    var scrolled = window.scrollY > 10;

    if (header) {
      header.classList.toggle('is-scrolled', scrolled);
    }

    if (toTopButton) {
      toTopButton.classList.toggle('is-visible', window.scrollY > 620);
    }

    updateActiveNav();
    scrollTicking = false;
  }

  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(handleScrollFrame);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: reduceMotion.matches ? 'auto' : 'smooth'
    });
  }

  if (toTopButton) {
    toTopButton.addEventListener('click', scrollToTop);
  }

  /* ============================================================
     3. Мобильное меню
     ============================================================ */
  var burger = document.getElementById('burger');
  var mobileNav = document.getElementById('mobileNav');
  var mobileNavLinks = document.getElementById('mobileNavLinks');
  var menuOpen = false;
  var burgerLabel = burger ? burger.getAttribute('aria-label') : '';

  function syncBodyLock() {
    document.body.classList.toggle('is-locked', menuOpen || modalOpen);
  }

  function openMenu() {
    if (!mobileNav || menuOpen) return;

    menuOpen = true;
    document.body.classList.add('menu-open');
    mobileNav.setAttribute('aria-hidden', 'false');

    if (burger) {
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Закрыть меню');
    }

    syncBodyLock();

    if (mobileNavLinks) {
      window.setTimeout(function () {
        if (!menuOpen) return;
        var firstLink = mobileNavLinks.querySelector('a');
        if (firstLink) firstLink.focus({ preventScroll: true });
      }, 220);
    }
  }

  function closeMenu(restoreFocus) {
    if (!mobileNav || !menuOpen) return;

    menuOpen = false;
    document.body.classList.remove('menu-open');
    mobileNav.setAttribute('aria-hidden', 'true');

    if (burger) {
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', burgerLabel || 'Открыть меню');

      if (restoreFocus) {
        burger.focus({ preventScroll: true });
      }
    }

    syncBodyLock();
  }

  if (burger) {
    burger.addEventListener('click', function () {
      if (menuOpen) {
        closeMenu(true);
      } else {
        openMenu();
      }
    });
  }

  if (mobileNav) {
    mobileNav.addEventListener('click', function (event) {
      var backdrop = event.target.closest('[data-close-menu]');
      if (backdrop) {
        closeMenu(true);
        return;
      }

      if (event.target.closest('a')) {
        closeMenu(false);
      }
    });
  }

  window.addEventListener('resize', function () {
    if (window.innerWidth > 980 && menuOpen) {
      closeMenu(false);
    }
  });

  /* ============================================================
     4. Таймер обратного отсчёта
     ============================================================ */
  var deadlineKey = 'kd-deadline';
  var deadline = parseInt(safeGet(deadlineKey), 10);
  var threeDays = 3 * 24 * 60 * 60 * 1000;

  if (!deadline || isNaN(deadline) || deadline <= Date.now()) {
    deadline = Date.now() + threeDays;
    safeSet(deadlineKey, String(deadline));
  }

  var cdDays = document.getElementById('cdDays');
  var cdHours = document.getElementById('cdHours');
  var cdMinutes = document.getElementById('cdMinutes');
  var cdSeconds = document.getElementById('cdSeconds');

  function pad(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function updateCountdown() {
    var diff = Math.max(0, deadline - Date.now());
    var days = Math.floor(diff / (24 * 60 * 60 * 1000));
    var hours = Math.floor((diff / (60 * 60 * 1000)) % 24);
    var minutes = Math.floor((diff / (60 * 1000)) % 60);
    var seconds = Math.floor((diff / 1000) % 60);

    if (cdDays) cdDays.textContent = pad(days);
    if (cdHours) cdHours.textContent = pad(hours);
    if (cdMinutes) cdMinutes.textContent = pad(minutes);
    if (cdSeconds) cdSeconds.textContent = pad(seconds);
  }

  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  /* ============================================================
     5. Аккордеоны программы и FAQ
     ============================================================ */
  function panelOf(item) {
    return item.querySelector('[data-acc-panel], .module__panel, .faq-item__panel');
  }

  function setAccordionState(item, open) {
    var trigger = item.querySelector('[data-acc-trigger]');
    var panel = panelOf(item);

    item.classList.toggle('is-open', open);

    if (trigger) {
      trigger.setAttribute('aria-expanded', String(open));
    }

    if (panel) {
      panel.setAttribute('aria-hidden', String(!open));
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-accordion]'), function (group) {
    var items = Array.prototype.slice.call(group.querySelectorAll('[data-acc-item]'));

    items.forEach(function (item) {
      var trigger = item.querySelector('[data-acc-trigger]');
      var open = item.classList.contains('is-open');

      setAccordionState(item, open);

      if (!trigger) return;

      trigger.addEventListener('click', function () {
        var willOpen = !item.classList.contains('is-open');

        if (willOpen && group.getAttribute('data-accordion') === 'single') {
          items.forEach(function (other) {
            if (other !== item) setAccordionState(other, false);
          });
        }

        setAccordionState(item, willOpen);
      });
    });
  });

  /* ============================================================
     6. Тарифы и переключатель оплаты
     ============================================================ */
  var pricing = document.getElementById('pricing');
  var billingButtons = Array.prototype.slice.call(document.querySelectorAll('[data-billing-btn]'));
  var tariffCards = Array.prototype.slice.call(document.querySelectorAll('.tariff'));
  var planPrices = {};

  tariffCards.forEach(function (card) {
    var nameEl = card.querySelector('.tariff__name');
    var priceEl = card.querySelector('[data-price]');
    if (!nameEl || !priceEl) return;

    planPrices[nameEl.textContent.trim()] = {
      full: Number(priceEl.getAttribute('data-full')) || 0,
      month: Number(priceEl.getAttribute('data-month')) || 0
    };
  });

  function animatePrice(element, target, animate) {
    var from = Number(element.getAttribute('data-current'));
    if (isNaN(from)) from = target;

    if (element._priceFrame) {
      window.cancelAnimationFrame(element._priceFrame);
      element._priceFrame = null;
    }

    if (!animate || reduceMotion.matches || from === target) {
      element.textContent = formatNumber(target);
      element.setAttribute('data-current', String(target));
      return;
    }

    var duration = 520;
    var startTime = 0;

    function step(now) {
      if (!startTime) startTime = now;
      var progress = Math.min(1, (now - startTime) / duration);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = Math.round(from + (target - from) * eased);

      element.textContent = formatNumber(value);
      element.setAttribute('data-current', String(value));

      if (progress < 1) {
        element._priceFrame = window.requestAnimationFrame(step);
      } else {
        element.textContent = formatNumber(target);
        element.setAttribute('data-current', String(target));
        element._priceFrame = null;
      }
    }

    element._priceFrame = window.requestAnimationFrame(step);
  }

  function updatePlanOptions(mode) {
    var planSelect = document.getElementById('modal-plan');
    if (!planSelect) return;

    Array.prototype.forEach.call(planSelect.options, function (option) {
      var plan = planPrices[option.value];
      if (!plan) return;

      if (mode === 'installment') {
        option.textContent = option.value + ' — ' + formatNumber(plan.month) + ' ₽/мес';
      } else {
        option.textContent = option.value + ' — ' + formatNumber(plan.full) + ' ₽';
      }
    });
  }

  function applyBilling(mode, animate) {
    if (!pricing) return;

    var targetMode = mode === 'installment' ? 'installment' : 'full';
    pricing.setAttribute('data-billing', targetMode);

    billingButtons.forEach(function (button) {
      var isActive = button.getAttribute('data-billing-btn') === targetMode;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });

    tariffCards.forEach(function (card) {
      var priceEl = card.querySelector('[data-price]');
      if (!priceEl) return;

      var full = Number(priceEl.getAttribute('data-full')) || 0;
      var month = Number(priceEl.getAttribute('data-month')) || 0;
      var periodEl = card.querySelector('[data-price-period]');
      var oldEl = card.querySelector('[data-price-old]');
      var badgeEl = card.querySelector('[data-price-badge]');
      var noteEl = card.querySelector('[data-price-note]');

      if (targetMode === 'installment') {
        animatePrice(priceEl, month, animate);
        if (periodEl) periodEl.textContent = 'в месяц';
        if (oldEl) oldEl.textContent = '';
        if (badgeEl) badgeEl.textContent = '0% переплат';
        if (noteEl) {
          noteEl.textContent = '12 платежей по ' + formatNumber(month) + ' ₽ · без процентов и переплат';
        }
      } else {
        animatePrice(priceEl, full, animate);
        if (periodEl) periodEl.textContent = 'за весь курс';
        if (oldEl) oldEl.textContent = 'вместо ' + formatNumber(Math.round(full / 0.8)) + ' ₽';
        if (badgeEl) badgeEl.textContent = 'выгода 20%';
        if (noteEl) noteEl.textContent = 'Скидка 20% при полной оплате';
      }
    });

    updatePlanOptions(targetMode);
  }

  billingButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var mode = button.getAttribute('data-billing-btn');
      if (pricing && pricing.getAttribute('data-billing') === mode) return;
      applyBilling(mode, true);
    });
  });

  applyBilling(pricing ? pricing.getAttribute('data-billing') : 'full', false);

  /* ============================================================
     7. Модальное окно
     ============================================================ */
  var modal = document.getElementById('leadModal');
  var modalDialog = modal ? modal.querySelector('.modal__dialog') : null;
  var modalForm = document.getElementById('modalForm');
  var modalSuccess = modal ? modal.querySelector('[data-modal-success]') : null;
  var modalHead = modal ? modal.querySelector('[data-modal-head]') : null;
  var modalEyebrow = document.getElementById('modalEyebrow');
  var modalTitle = document.getElementById('modalTitle');
  var modalSubtitle = document.getElementById('modalSubtitle');
  var planField = modal ? modal.querySelector('[data-plan-field]') : null;
  var planSelect = document.getElementById('modal-plan');
  var modalOpen = false;
  var lastFocused = null;
  var modalMode = 'free';

  var modalCopy = {
    free: {
      eyebrow: 'Бесплатный урок',
      title: 'Начните с бесплатного урока',
      subtitle: 'Оставьте контакты — куратор поможет выбрать формат и ответит на вопросы.'
    },
    tariff: {
      eyebrow: 'Заявка на тариф',
      title: 'Забронируйте место в потоке',
      subtitle: 'Оставьте контакты — куратор подтвердит место, расскажет про оплату и рассрочку.'
    }
  };

  function clearFieldError(field) {
    field.classList.remove('has-error');
    var input = field.querySelector('[data-validate]');
    var errorEl = field.querySelector('.field__error');

    if (input) input.removeAttribute('aria-invalid');
    if (errorEl) errorEl.textContent = '';
  }

  function resetModalContent() {
    if (!modalForm || !modal) return;

    modalForm.dataset.token = '';
    modalForm.reset();
    modalForm.hidden = false;
    modalForm.dataset.busy = 'false';

    Array.prototype.forEach.call(modalForm.querySelectorAll('.field'), clearFieldError);

    var submit = modalForm.querySelector('button[type="submit"]');
    if (submit) {
      submit.disabled = false;
      submit.classList.remove('is-loading');
    }

    if (modalSuccess) modalSuccess.hidden = true;
    if (modalHead) modalHead.hidden = false;

    if (planField) {
      planField.hidden = modalMode !== 'tariff';
    }

    if (modalDialog) {
      modalDialog.scrollTop = 0;
    }
  }

  function prepareModal(mode, plan) {
    modalMode = mode === 'tariff' ? 'tariff' : 'free';

    if (modalForm) {
      modalForm.dataset.token = '';
      modalForm.hidden = false;
      modalForm.dataset.busy = 'false';

      Array.prototype.forEach.call(modalForm.querySelectorAll('.field'), clearFieldError);

      var submit = modalForm.querySelector('button[type="submit"]');
      if (submit) {
        submit.disabled = false;
        submit.classList.remove('is-loading');
      }
    }

    if (modalSuccess) modalSuccess.hidden = true;
    if (modalHead) modalHead.hidden = false;

    var copy = modalCopy[modalMode];
    if (modalEyebrow) modalEyebrow.textContent = copy.eyebrow;
    if (modalTitle) modalTitle.textContent = copy.title;
    if (modalSubtitle) modalSubtitle.textContent = copy.subtitle;

    if (planField) {
      planField.hidden = modalMode !== 'tariff';
    }

    if (planSelect) {
      if (modalMode === 'tariff' && plan) {
        var exists = Array.prototype.some.call(planSelect.options, function (option) {
          return option.value === plan;
        });
        planSelect.value = exists ? plan : planSelect.options[0].value;
      } else {
        planSelect.selectedIndex = 0;
      }
    }

    if (modalDialog) {
      modalDialog.scrollTop = 0;
    }
  }

  function openModal(mode, plan, source) {
    if (!modal) return;

    var opener = source || document.activeElement;

    if (menuOpen) closeMenu(false);
    if (modalOpen) return;

    lastFocused = opener && opener.closest && opener.closest('#mobileNav') ? burger : opener;
    modalOpen = true;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    prepareModal(mode, plan);

    window.setTimeout(function () {
      if (!modalOpen || !modalForm || modalForm.hidden) return;
      var firstInput = modalForm.querySelector('input, select');
      if (firstInput) firstInput.focus({ preventScroll: true });
    }, 80);
  }

  function closeModal(restoreFocus) {
    if (!modal || !modalOpen) return;

    modalOpen = false;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    modalForm.dataset.token = '';
    syncBodyLock();

    if (restoreFocus !== false && lastFocused && document.contains(lastFocused)) {
      lastFocused.focus({ preventScroll: true });
    }

    window.setTimeout(function () {
      if (!modalOpen) resetModalContent();
    }, 340);
  }

  document.addEventListener('click', function (event) {
    var opener = event.target.closest('[data-open-modal]');
    if (opener) {
      event.preventDefault();
      openModal(opener.getAttribute('data-open-modal'), opener.getAttribute('data-plan'), opener);
      return;
    }

    if (event.target.closest('[data-modal-close]')) {
      event.preventDefault();
      closeModal(true);
    }
  });

  if (modal) {
    modal.addEventListener('click', function (event) {
      if (event.target === modal) closeModal(true);
    });
  }

  function getFocusable() {
    if (!modal) return [];
    var selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    return Array.prototype.filter.call(modal.querySelectorAll(selector), function (element) {
      return element.getClientRects().length > 0 && !element.closest('[hidden]');
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      if (modalOpen) {
        closeModal(true);
        return;
      }
      if (menuOpen) {
        closeMenu(true);
        return;
      }
    }

    if (event.key === 'Tab' && modalOpen) {
      var focusable = getFocusable();
      if (!focusable.length) return;

      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  /* ============================================================
     8. Toast-уведомление
     ============================================================ */
  var toast = document.getElementById('toast');
  var toastTitle = document.getElementById('toastTitle');
  var toastText = document.getElementById('toastText');
  var toastClose = document.getElementById('toastClose');
  var toastTimer = null;

  function hideToast() {
    if (!toast) return;
    toast.classList.remove('is-visible');
    if (toastTimer) {
      window.clearTimeout(toastTimer);
      toastTimer = null;
    }
  }

  function showToast(title, text) {
    if (!toast) return;

    if (toastTitle) toastTitle.textContent = title;
    if (toastText) toastText.textContent = text;

    toast.classList.add('is-visible');

    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(hideToast, 5600);
  }

  if (toastClose) {
    toastClose.addEventListener('click', hideToast);
  }

  /* ============================================================
     9. Валидация и отправка форм
     ============================================================ */
  function isValidPhone(value) {
    var digits = value.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  }

  function isValidTelegram(value) {
    if (value.charAt(0) === '@') {
      return /^[A-Za-z0-9_]{4,32}$/.test(value.slice(1));
    }

    var match = value.match(/^(?:https?:\/\/)?t\.me\/([A-Za-z0-9_]{4,32})\/?$/i);
    return Boolean(match);
  }

  function isValidContact(value) {
    return isValidPhone(value) || isValidTelegram(value);
  }

  function isValidName(value) {
    return value.length >= 2 && !/\d/.test(value);
  }

  function errorMessageFor(input, value) {
    var type = input.getAttribute('data-validate');
    var emptyMessage = input.getAttribute('data-empty-msg') || 'Заполните это поле';

    if (!value) return emptyMessage;

    if (type === 'name') {
      if (value.length < 2) return 'Имя должно содержать минимум 2 буквы';
      if (/\d/.test(value)) return 'Имя не должно содержать цифры';
    }

    if (type === 'contact' && !isValidContact(value)) {
      return 'Укажите телефон (10–15 цифр) или @username в Telegram';
    }

    return '';
  }

  function validateField(field) {
    var input = field.querySelector('[data-validate]');
    if (!input || field.hidden) return true;

    var value = input.value.trim();
    var message = errorMessageFor(input, value);
    var errorEl = field.querySelector('.field__error');

    field.classList.toggle('has-error', Boolean(message));

    if (message) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }

    if (errorEl) errorEl.textContent = message;
    return !message;
  }

  function resetFormView(form, successBlock, nameOutput) {
    form.reset();
    form.hidden = false;
    form.dataset.busy = 'false';
    form.dataset.token = '';
    successBlock.hidden = true;

    Array.prototype.forEach.call(form.querySelectorAll('.field'), clearFieldError);

    var submit = form.querySelector('button[type="submit"]');
    if (submit) {
      submit.disabled = false;
      submit.classList.remove('is-loading');
    }

    if (nameOutput) nameOutput.textContent = 'Спасибо';

    var firstInput = form.querySelector('input, select');
    if (firstInput) firstInput.focus({ preventScroll: true });
  }

  function bindForm(form, options) {
    if (!form) return;

    var isModal = Boolean(options && options.modal);
    var successBlock = isModal
      ? modalSuccess
      : form.parentElement.querySelector('[data-form-success]');

    Array.prototype.forEach.call(form.querySelectorAll('.field'), function (field) {
      var input = field.querySelector('[data-validate]');
      if (!input) return;

      input.addEventListener('input', function () {
        if (field.classList.contains('has-error')) validateField(field);
      });

      input.addEventListener('change', function () {
        if (field.classList.contains('has-error')) validateField(field);
      });

      input.addEventListener('blur', function () {
        if (input.value.trim() !== '') validateField(field);
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (form.dataset.busy === 'true') return;

      var fields = Array.prototype.slice.call(
        form.querySelectorAll('.field:not([hidden])')
      );

      var valid = true;
      var firstInvalid = null;

      fields.forEach(function (field) {
        if (!validateField(field)) {
          valid = false;
          if (!firstInvalid) firstInvalid = field;
        }
      });

      if (!valid) {
        var input = firstInvalid ? firstInvalid.querySelector('[data-validate]') : null;
        if (input) input.focus({ preventScroll: false });
        return;
      }

      var submit = form.querySelector('button[type="submit"]');
      var token = String(Date.now()) + Math.random().toString(16).slice(2);

      form.dataset.busy = 'true';
      form.dataset.token = token;

      if (submit) {
        submit.disabled = true;
        submit.classList.add('is-loading');
      }

      /* Имитация отправки на сервер: здесь можно подключить fetch */
      window.setTimeout(function () {
        if (form.dataset.token !== token) return;

        form.dataset.busy = 'false';
        form.dataset.token = '';

        if (submit) {
          submit.disabled = false;
          submit.classList.remove('is-loading');
        }

        var nameInput = form.querySelector('[name="name"]');
        var name = nameInput ? nameInput.value.trim() : '';

        if (successBlock) {
          var nameOutput = successBlock.querySelector('[data-success-name]');
          if (!isModal && nameOutput) {
            nameOutput.textContent = name;
          }

          form.hidden = true;
          if (isModal && modalHead) modalHead.hidden = true;
          successBlock.hidden = false;

          if (isModal && modalDialog) {
            modalDialog.scrollTop = 0;
          }

          var successFocusTarget = successBlock.querySelector('h3');
          if (successFocusTarget) {
            successFocusTarget.setAttribute('tabindex', '-1');
            successFocusTarget.focus({ preventScroll: true });
          }
        }

        if (isModal) {
          showToast('Заявка отправлена', 'Куратор свяжется с вами в течение 15 минут.');
        } else {
          showToast('Заявка принята', 'Мы свяжемся с вами в течение 15 минут и пришлём ссылку на урок.');
        }
      }, 900);
    });

    if (!isModal) {
      var resetButton = successBlock ? successBlock.querySelector('[data-form-reset]') : null;
      if (resetButton) {
        resetButton.addEventListener('click', function () {
          resetFormView(form, successBlock, successBlock.querySelector('[data-success-name]'));
        });
      }
    }

    return status;
  }

  var leadForm = document.getElementById('leadForm');

  bindForm(leadForm, { modal: false });

  if (modalForm) {
    bindForm(modalForm, { modal: true });
  }

  /* Закрытие модалки после успеха уже обработано делегированием
     через data-modal-close; при следующем открытии форма сбрасывается
     в resetModalContent(). */

  /* ============================================================
     10. Анимации появления при прокрутке
     ============================================================ */
  var revealItems = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  if (!('IntersectionObserver' in window) || reduceMotion.matches) {
    revealItems.forEach(function (element) {
      element.classList.add('is-visible');
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -6% 0px'
      }
    );

    revealItems.forEach(function (element) {
      revealObserver.observe(element);
    });
  }

  /* ============================================================
     11. Мелкие детали
     ============================================================ */
  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  /* Декоративные ссылки без реальных страниц не должны прыгать наверх */
  Array.prototype.forEach.call(document.querySelectorAll('a[href="#"]'), function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
    });
  });

  /* Синхронизация при возврате на вкладку: таймер и активный пункт */
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
      updateCountdown();
      updateActiveNav();
    }
  });

  /* Если пользователь отключил анимацию уже после загрузки,
     показываем все reveal-блоки */
  if (typeof reduceMotion.addEventListener === 'function') {
    reduceMotion.addEventListener('change', function (event) {
      if (!event.matches) return;
      revealItems.forEach(function (element) {
        element.classList.add('is-visible');
      });
    });
  }

  /* Первичная синхронизация интерфейса */
  handleScrollFrame();
})();