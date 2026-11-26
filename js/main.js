(function () {
  var SCRIPT_URL_RE = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;
  var STRINGS = {
    uk: {
      themeToLight: "Увімкнути світлу тему",
      themeToDark: "Увімкнути темну тему",
      andUp: "і далі",
      noPackage: "Без пакета, після розмови",
      packageOne: "пакет",
      packageFew: "пакети",
      packageMany: "пакетів",
      chooseService: "Оберіть тип задачі",
      choosePackage: "Оберіть бюджет",
      budgetEmpty: "Бюджет з’явиться після вибору діапазону.",
      budgetPrefix: "Бюджет: ",
      termPrefix: "Термін: ",
      errService: "Оберіть тип задачі.",
      errPackage: "Оберіть бюджет.",
      severalRanges: "Кілька діапазонів — оберіть на наступному кроці.",
      errName: "Вкажіть, як до вас звертатися.",
      errContact: "Вкажіть Telegram або телефон.",
      errTask: "Опишіть задачу хоча б одним реченням.",
      errTaskLong: "Скоротіть опис до 2000 символів.",
      errConsent: "Потрібна згода, щоб зв’язатися щодо заявки.",
      errNoUrl: "Заявка з сайту ще не підключена до таблиці. Напишіть у Telegram — так вона точно дійде.",
      errBadUrl: "Адреса форми налаштована некоректно. Напишіть у Telegram — відповімо там.",
      errSend: "Не вдалося надіслати заявку з сайту. Напишіть у Telegram — відповімо там.",
      sending: "Надсилаємо…",
      send: "Надіслати заявку",
      sendingStatus: "Надсилаємо заявку…",
      savedStatus: "Заявку записали.",
      consentValue: "так",
      unsureName: "Ще не визначились",
      unsurePackage: "Після брифу",
      unsurePrice: "узгодимо після брифу",
      unsureTime: "після розмови",
      unsureSummary: "Коротко опишете задачу — запропонуємо пакет або оцінку поза пакетом."
    },
    en: {
      themeToLight: "Switch to light theme",
      themeToDark: "Switch to dark theme",
      andUp: "and up",
      noPackage: "No package yet, after a call",
      packageOne: "package",
      packageFew: "packages",
      packageMany: "packages",
      chooseService: "Choose a task type",
      choosePackage: "Choose a budget",
      budgetEmpty: "The budget appears after you choose a range.",
      budgetPrefix: "Budget: ",
      termPrefix: "Timeline: ",
      errService: "Choose a task type.",
      errPackage: "Choose a budget.",
      severalRanges: "A few ranges — choose on the next step.",
      errName: "Tell us what to call you.",
      errContact: "Leave a Telegram handle or a phone number.",
      errTask: "Describe the task in at least one sentence.",
      errTaskLong: "Shorten the description to 2000 characters.",
      errConsent: "Consent is required so we can contact you about the request.",
      errNoUrl: "The site form is not connected to the spreadsheet yet. Message us on Telegram and it will get through.",
      errBadUrl: "The form address is misconfigured. Message us on Telegram and we will reply there.",
      errSend: "The request could not be sent from the site. Message us on Telegram and we will reply there.",
      sending: "Sending…",
      send: "Send request",
      sendingStatus: "Sending the request…",
      savedStatus: "The request is saved.",
      consentValue: "yes",
      unsureName: "Not sure yet",
      unsurePackage: "After a brief",
      unsurePrice: "we will confirm after a brief",
      unsureTime: "after a call",
      unsureSummary: "Describe the task briefly and we will suggest a package or an estimate outside one."
    }
  };
  var lang = document.documentElement.lang === "en" ? "en" : "uk";
  var t = STRINGS[lang];

  var state = {
    step: 1,
    maxReached: 1,
    service: "",
    packageName: "",
    sending: false
  };

  var services = readCatalog();
  var form = document.getElementById("lead-form");
  var serviceSelect = document.getElementById("lead-service");
  var packageSelect = document.getElementById("lead-package");

  initTheme();
  initNav();
  initLangSwitch();
  initHeader();
  initReveal();
  initCatalog();
  initFunnel();
  initTeamCarousel();

  function readCatalog() {
    var order = [];
    var map = {};
    document.querySelectorAll(".package").forEach(function (card) {
      var name = card.dataset.service;
      if (!map[name]) {
        map[name] = [];
        order.push(name);
      }
      map[name].push({
        name: card.dataset.package,
        price: card.dataset.price,
        usd: card.dataset.usd || "",
        time: card.dataset.time,
        summary: card.querySelector(".desc").textContent.trim()
      });
    });
    return order.map(function (name) {
      return { name: name, packages: map[name] };
    });
  }

  function serviceByName(name) {
    return services.filter(function (item) { return item.name === name; })[0] || null;
  }

  function packageByName(serviceName, packageName) {
    var service = serviceByName(serviceName);
    if (!service) return null;
    return service.packages.filter(function (item) { return item.name === packageName; })[0] || null;
  }

  function initTheme() {
    var button = document.getElementById("theme-toggle");
    if (!button) return;
    button.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("burcob-theme", next); } catch (error) {}
      updateThemeLabel();
    });
    updateThemeLabel();
    var media = window.matchMedia("(prefers-color-scheme: dark)");
    if (media.addEventListener) {
      media.addEventListener("change", function (event) {
        var stored = "";
        try { stored = localStorage.getItem("burcob-theme") || ""; } catch (error) {}
        if (stored === "light" || stored === "dark") return;
        document.documentElement.setAttribute("data-theme", event.matches ? "dark" : "light");
        updateThemeLabel();
      });
    }
  }

  function updateThemeLabel() {
    var button = document.getElementById("theme-toggle");
    if (!button) return;
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    button.setAttribute("aria-label", dark ? t.themeToLight : t.themeToDark);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#10161e" : "#f3eee6");
  }

  function initNav() {
    var toggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeNav();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeNav();
    });
  }

  function closeNav() {
    var toggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!nav) return;
    nav.classList.remove("is-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  function initLangSwitch() {
    document.querySelectorAll("[data-lang]").forEach(function (link) {
      link.addEventListener("click", function () {
        try { localStorage.setItem("burcob-lang", link.getAttribute("data-lang")); } catch (error) {}
        if (!location.hash) return;
        link.href = new URL(link.getAttribute("href"), location.origin).pathname + location.hash;
      });
    });
  }

  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initReveal() {
    var nodes = document.querySelectorAll(".reveal");
    if (!nodes.length) return;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function show(node) {
      node.classList.add("is-in");
    }
    if (reduced || !("IntersectionObserver" in window)) {
      nodes.forEach(show);
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        show(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    nodes.forEach(function (node) { observer.observe(node); });
    document.addEventListener("focusin", function (event) {
      var block = event.target.closest && event.target.closest(".reveal");
      if (block) show(block);
    });
  }

  function initCatalog() {
    var root = document.getElementById("poslugy");
    if (!root) return;
    root.addEventListener("click", function (event) {
      var button = event.target.closest("[data-choose]");
      if (!button) return;
      var card = button.closest(".package");
      choose(card.dataset.service, card.dataset.package, true);
    });
  }

  function initFunnel() {
    fillServiceSelect();
    renderStep(1);
    document.getElementById("choice-service").addEventListener("click", function (event) {
      var button = event.target.closest(".choice");
      if (!button) return;
      state.service = button.dataset.value;
      state.packageName = "";
      syncSelects();
      renderStep(state.step);
      clearStepError();
    });
    document.getElementById("choice-package").addEventListener("click", function (event) {
      var button = event.target.closest(".choice");
      if (!button) return;
      state.packageName = button.dataset.value;
      syncSelects();
      renderStep(state.step);
      clearStepError();
    });
    document.getElementById("funnel-back").addEventListener("click", function () {
      if (state.step > 1) renderStep(state.step - 1);
    });
    document.getElementById("funnel-next").addEventListener("click", function () {
      if (!validateStep(state.step)) return;
      state.maxReached = Math.max(state.maxReached, state.step + 1);
      renderStep(state.step + 1);
    });
    document.querySelector(".progress").addEventListener("click", function (event) {
      var button = event.target.closest("[data-goto]");
      if (!button || button.disabled) return;
      renderStep(Number(button.dataset.goto));
    });
    serviceSelect.addEventListener("change", function () {
      state.service = serviceSelect.value;
      state.packageName = "";
      fillPackageSelect();
      updateBudget();
      renderChoices();
    });
    packageSelect.addEventListener("change", function () {
      state.packageName = packageSelect.value;
      updateBudget();
      renderChoices();
    });
    form.addEventListener("submit", onSubmit);
  }

  function choose(serviceName, packageName, scroll) {
    hideBanners();
    form.hidden = false;
    state.service = serviceName;
    state.packageName = packageName;
    state.maxReached = 3;
    state.sending = false;
    syncSelects();
    renderStep(3);
    if (scroll) {
      var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById("zayavka").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      window.setTimeout(function () {
        document.getElementById("lead-name").focus();
      }, reduced ? 0 : 350);
    }
  }

  function renderStep(step) {
    state.step = step;
    document.querySelectorAll(".step").forEach(function (panel) {
      panel.hidden = Number(panel.dataset.step) !== step;
    });
    document.querySelectorAll("[data-goto]").forEach(function (button) {
      var index = Number(button.dataset.goto);
      button.disabled = index > state.maxReached;
      if (index === step) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    document.getElementById("funnel-back").hidden = step === 1;
    document.getElementById("funnel-next").hidden = step === 3;
    document.getElementById("lead-submit").hidden = step !== 3;
    renderChoices();
    clearStepError();
    var heading = document.querySelector('.step[data-step="' + step + '"] h3');
    if (heading && document.activeElement && document.activeElement.closest && document.activeElement.closest(".funnel")) {
      heading.focus();
    }
  }

  function renderChoices() {
    renderChoiceButtons(
      document.getElementById("choice-service"),
      services.map(function (service) {
        var first = service.packages[0];
        return {
          value: service.name,
          title: service.name,
          meta: service.packages.length > 1 ? first.price + " " + t.andUp : first.price,
          text: service.packages.length > 1 ? t.severalRanges : first.time
        };
      }),
      state.service
    );
    var current = serviceByName(state.service);
    renderChoiceButtons(
      document.getElementById("choice-package"),
      current ? current.packages.map(function (item) {
        return {
          value: item.name,
          title: item.name,
          meta: item.usd ? item.price + " (" + item.usd + ")" : item.price,
          text: item.time + ". " + item.summary
        };
      }) : [],
      state.packageName
    );
    updateBudget();
  }

  function renderChoiceButtons(container, items, current) {
    container.replaceChildren();
    items.forEach(function (item) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "choice";
      button.dataset.value = item.value;
      button.setAttribute("aria-pressed", item.value === current ? "true" : "false");
      var title = document.createElement("span");
      title.className = "choice-title";
      title.textContent = item.title;
      var meta = document.createElement("span");
      meta.className = "choice-meta";
      meta.textContent = item.meta;
      var text = document.createElement("span");
      text.className = "choice-text";
      text.textContent = item.text;
      button.append(title, meta, text);
      container.appendChild(button);
    });
  }

  function fillServiceSelect() {
    serviceSelect.replaceChildren();
    var placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = t.chooseService;
    serviceSelect.appendChild(placeholder);
    services.forEach(function (service) {
      var option = document.createElement("option");
      option.value = service.name;
      option.textContent = service.name;
      serviceSelect.appendChild(option);
    });
    fillPackageSelect();
  }

  function fillPackageSelect() {
    var current = serviceByName(state.service);
    packageSelect.replaceChildren();
    var placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = t.choosePackage;
    packageSelect.appendChild(placeholder);
    if (!current) return;
    current.packages.forEach(function (item) {
      var option = document.createElement("option");
      option.value = item.name;
      option.textContent = item.name + " · " + item.price;
      packageSelect.appendChild(option);
    });
    packageSelect.value = state.packageName;
  }

  function syncSelects() {
    serviceSelect.value = state.service;
    fillPackageSelect();
    packageSelect.value = state.packageName;
    updateBudget();
  }

  function updateBudget() {
    var line = document.getElementById("budget-line");
    var pkg = packageByName(state.service, state.packageName);
    if (!pkg) {
      line.textContent = t.budgetEmpty;
      return;
    }
    line.textContent = t.budgetPrefix + (pkg.usd ? pkg.price + " (" + pkg.usd + ")" : pkg.price) + ". " + t.termPrefix + pkg.time + ".";
  }

  function validateStep(step) {
    if (step === 1 && !state.service) {
      setStepError(t.errService);
      return false;
    }
    if (step === 2 && !state.packageName) {
      setStepError(t.errPackage);
      return false;
    }
    return true;
  }

  function setStepError(message) {
    document.querySelector('.step[data-step="' + state.step + '"] .step-error').textContent = message;
  }

  function clearStepError() {
    document.querySelectorAll(".step-error").forEach(function (node) {
      node.textContent = "";
    });
  }

  function onSubmit(event) {
    event.preventDefault();
    if (state.sending) return;
    hideBanners();
    var name = clean(document.getElementById("lead-name").value);
    var contact = clean(document.getElementById("lead-contact").value);
    var task = cleanTask(document.getElementById("lead-task").value);
    var consent = document.getElementById("lead-consent").checked;
    var honeypot = document.getElementById("company_url").value.trim();
    var valid = true;

    valid = setFieldError("lead-name", name.length >= 2 ? "" : t.errName) && valid;
    valid = setFieldError("lead-contact", validContact(contact) ? "" : t.errContact) && valid;
    valid = setFieldError("lead-service", state.service ? "" : t.errService) && valid;
    valid = setFieldError("lead-package", state.packageName ? "" : t.errPackage) && valid;
    valid = setFieldError("lead-task", task.length >= 10 ? "" : t.errTask) && valid;
    if (task.length > 2000) {
      valid = setFieldError("lead-task", t.errTaskLong) && valid;
    }
    valid = setFieldError("lead-consent", consent ? "" : t.errConsent) && valid;
    if (!valid) {
      var firstInvalid = form.querySelector("[aria-invalid='true']");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    if (honeypot) {
      showSuccess();
      return;
    }

    var url = scriptUrl();
    if (url === "") {
      showError(t.errNoUrl);
      return;
    }
    if (url === null) {
      showError(t.errBadUrl);
      return;
    }

    var pkg = packageByName(state.service, state.packageName);
    var payload = {
      name: name,
      contact: contact,
      service: state.service,
      package: pkg.name + " · " + pkg.time,
      budget: pkg.usd ? pkg.price + " (" + pkg.usd + ")" : pkg.price,
      task: task,
      consent: t.consentValue,
      company_url: "",
      page: location.origin + location.pathname,
      origin: location.origin,
      nonce: nonce()
    };

    state.sending = true;
    var submit = document.getElementById("lead-submit");
    submit.disabled = true;
    submit.textContent = t.sending;
    document.getElementById("form-status").textContent = t.sendingStatus;
    postLead(url, payload).then(function () {
      showSuccess();
    }).catch(function () {
      document.getElementById("form-status").textContent = "";
      showError(t.errSend);
    }).finally(function () {
      state.sending = false;
      var submitButton = document.getElementById("lead-submit");
      submitButton.disabled = false;
      submitButton.textContent = t.send;
    });
  }

  function scriptUrl() {
    var config = window.BURCOB_CONFIG || {};
    var url = String(config.GOOGLE_SCRIPT_URL || "").trim();
    if (!url) return "";
    return SCRIPT_URL_RE.test(url) ? url : null;
  }

  function postLead(url, fields) {
    return new Promise(function (resolve, reject) {
      var iframe = document.getElementById("lead-frame");
      var carrier = document.createElement("form");
      carrier.method = "POST";
      carrier.action = url;
      carrier.target = "lead-frame";
      carrier.acceptCharset = "UTF-8";
      carrier.hidden = true;
      Object.keys(fields).forEach(function (key) {
        var input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = fields[key];
        carrier.appendChild(input);
      });
      document.body.appendChild(carrier);

      var timer = window.setTimeout(function () { finish(new Error("timeout")); }, 25000);
      function onMessage(event) {
        var data = event.data;
        if (!data || data.source !== "burcob-lead" || data.nonce !== fields.nonce) return;
        if (!originAllowed(event.origin)) return;
        finish(data.ok ? null : new Error(data.error || "rejected"));
      }
      function finish(error) {
        window.clearTimeout(timer);
        window.removeEventListener("message", onMessage);
        carrier.remove();
        if (error) reject(error);
        else resolve();
      }
      window.addEventListener("message", onMessage);
      iframe.addEventListener("load", function ignore() {}, { once: true });
      carrier.submit();
    });
  }

  function originAllowed(origin) {
    if (origin === "null" || origin === "") return true;
    try {
      var host = new URL(origin).hostname;
      return host === "script.google.com" ||
        host === "googleusercontent.com" ||
        host.endsWith(".googleusercontent.com") ||
        host === "localhost" ||
        host === "127.0.0.1";
    } catch (error) {
      return false;
    }
  }

  function showSuccess() {
    form.hidden = true;
    document.getElementById("form-error").hidden = true;
    var success = document.getElementById("form-success");
    success.hidden = false;
    document.getElementById("form-status").textContent = t.savedStatus;
    success.focus();
  }

  function showError(message) {
    var box = document.getElementById("form-error");
    box.querySelector("p").textContent = message;
    box.hidden = false;
    document.getElementById("form-success").hidden = true;
  }

  function hideBanners() {
    document.getElementById("form-error").hidden = true;
    document.getElementById("form-success").hidden = true;
  }

  function setFieldError(id, message) {
    var field = document.getElementById(id);
    var error = document.getElementById(id + "-error");
    if (message) {
      field.setAttribute("aria-invalid", "true");
      error.textContent = message;
      return false;
    }
    field.removeAttribute("aria-invalid");
    error.textContent = "";
    return true;
  }

  function validContact(value) {
    if (value.length < 3 || value.length > 120) return false;
    if (value.charAt(0) === "@") return /^@[A-Za-z0-9_]{3,}$/.test(value);
    if (/t\.me\//i.test(value)) return value.length >= 8;
    if (value.indexOf("@") !== -1) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }
    var digits = value.replace(/\D/g, "");
    if (digits.length >= 7 && /^[+\d()\s-]+$/.test(value)) return true;
    return value.length >= 5;
  }

  function clean(value) {
    return String(value || "").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  }

  function cleanTask(value) {
    return String(value || "").replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim();
  }

  function nonce() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return String(Date.now()) + Math.random().toString(16).slice(2);
  }

  function initTeamCarousel() {
    var root = document.querySelector("[data-team-carousel]");
    if (!root) return;
    var track = root.querySelector("[data-team-track]");
    var prev = root.querySelector("[data-team-prev]");
    var next = root.querySelector("[data-team-next]");
    if (!track || !prev || !next) return;

    var drag = null;

    function reducedMotion() {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    function gapSize() {
      var styles = window.getComputedStyle(track);
      var value = parseFloat(styles.columnGap || styles.gap);
      return isNaN(value) ? 12 : value;
    }

    function stepSize() {
      var card = track.querySelector(".person");
      if (!card) return track.clientWidth || 1;
      return card.getBoundingClientRect().width + gapSize();
    }

    function scrollToIndex(index) {
      var size = stepSize();
      var max = Math.max(0, track.scrollWidth - track.clientWidth);
      var left = Math.min(max, Math.max(0, index * size));
      track.scrollTo({ left: left, behavior: reducedMotion() ? "auto" : "smooth" });
    }

    function currentIndex() {
      return Math.round(track.scrollLeft / stepSize());
    }

    function updateButtons() {
      var max = track.scrollWidth - track.clientWidth;
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = max <= 4 || track.scrollLeft >= max - 4;
    }

    prev.addEventListener("click", function () {
      scrollToIndex(currentIndex() - 1);
    });
    next.addEventListener("click", function () {
      scrollToIndex(currentIndex() + 1);
    });

    track.addEventListener("keydown", function (event) {
      if (event.target !== track) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollToIndex(currentIndex() + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollToIndex(currentIndex() - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        scrollToIndex(0);
      } else if (event.key === "End") {
        event.preventDefault();
        scrollToIndex(track.querySelectorAll(".person").length);
      }
    });

    track.addEventListener("pointerdown", function (event) {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      if (event.target.closest("a, button")) return;
      drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startScroll: track.scrollLeft,
        moved: false
      };
      track.classList.add("is-dragging");
      track.setPointerCapture(event.pointerId);
    });

    track.addEventListener("pointermove", function (event) {
      if (!drag || drag.pointerId !== event.pointerId) return;
      var delta = event.clientX - drag.startX;
      if (Math.abs(delta) > 4) drag.moved = true;
      track.scrollLeft = drag.startScroll - delta;
    });

    function endDrag(event) {
      if (!drag || (event && drag.pointerId !== event.pointerId)) return;
      var moved = drag.moved;
      drag = null;
      track.classList.remove("is-dragging");
      if (event && track.hasPointerCapture && track.hasPointerCapture(event.pointerId)) {
        track.releasePointerCapture(event.pointerId);
      }
      if (moved) scrollToIndex(currentIndex());
      else updateButtons();
    }

    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);
    track.addEventListener("scroll", updateButtons, { passive: true });
    window.addEventListener("resize", updateButtons);
    if (window.ResizeObserver) new ResizeObserver(updateButtons).observe(track);
    updateButtons();
  }
})();
