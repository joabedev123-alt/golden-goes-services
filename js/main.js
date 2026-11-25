(function () {
  "use strict";

  const config = window.SITE_CONFIG || { smsNumber: "", socialLinks: {} };

  const form = document.getElementById("quoteForm");
  const nameInput = document.getElementById("quoteName");
  const serviceSelect = document.getElementById("quoteService");
  const citySelect = document.getElementById("quoteCity");
  const detailsInput = document.getElementById("quoteDetails");
  const submitBtn = document.getElementById("quoteSubmit");
  const copyBtn = document.getElementById("copyQuoteBtn");
  const statusEl = document.getElementById("quoteStatus");
  const smsFloat = document.getElementById("smsFloat");
  const footerSocial = document.getElementById("footerSocial");
  const footerYear = document.getElementById("footerYear");
  const navCollapseEl = document.getElementById("primaryNav");
  const areaList = document.getElementById("areaList");
  const toggleAreasBtn = document.getElementById("toggleAreasBtn");

  if (footerYear) {
    footerYear.textContent = String(new Date().getFullYear());
  }

  function digitsOnly(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function getSmsNumber() {
    const raw = digitsOnly(config.smsNumber || config.phoneNumber || "");
    if (raw.length === 10) {
      return "+1" + raw;
    }
    if (raw.length >= 11) {
      return "+" + raw;
    }
    return "";
  }

  function isSmsConfigured() {
    return getSmsNumber().length >= 12;
  }

  function isIosDevice() {
    return /iPad|iPhone|iPod/i.test(navigator.userAgent || "");
  }

  function buildQuoteMessage() {
    const name = (nameInput.value || "").trim();
    const service = serviceSelect.value || "";
    const city = citySelect.value || "";
    const details = (detailsInput.value || "").trim();

    let message =
      "Hello Golden Goes Services LLC,\n\n" +
      "I would like to request a cleaning quote.\n\n" +
      "Name: " + name + "\n" +
      "Service: " + service + "\n" +
      "City: " + city;

    if (details) {
      message += "\nDetails: " + details;
    }

    message += "\n\nThank you.";
    return message;
  }

  function buildSmsUrl(message) {
    const number = getSmsNumber();
    if (!message) {
      return "sms:" + number;
    }
    const separator = isIosDevice() ? "&" : "?";
    return "sms:" + number + separator + "body=" + encodeURIComponent(message);
  }

  function hideStatus() {
    statusEl.className = "quote-status";
    statusEl.innerHTML = "";
    statusEl.classList.remove("is-visible");
  }

  function showStatus(type, html) {
    statusEl.className = "quote-status is-visible quote-status--" + type;
    statusEl.innerHTML = html;
  }

  function syncQuoteUiMode() {
    const configured = isSmsConfigured();

    if (configured) {
      submitBtn.textContent = "Send Quote via Text Message";
      submitBtn.classList.remove("d-none");
      copyBtn.classList.add("d-none");
      if (smsFloat) {
        smsFloat.hidden = false;
        smsFloat.classList.add("is-visible");
        smsFloat.href = buildSmsUrl("");
      }
    } else {
      submitBtn.textContent = "Send Quote via Text Message";
      submitBtn.classList.remove("d-none");
      copyBtn.classList.remove("d-none");
      if (smsFloat) {
        smsFloat.hidden = true;
        smsFloat.classList.remove("is-visible");
        smsFloat.removeAttribute("href");
      }
    }
  }

  function validateForm() {
    let valid = true;

    if (!nameInput.value.trim()) {
      nameInput.setCustomValidity("Please enter your name.");
      valid = false;
    } else {
      nameInput.setCustomValidity("");
    }

    if (!serviceSelect.value) {
      serviceSelect.setCustomValidity("Please select a service.");
      valid = false;
    } else {
      serviceSelect.setCustomValidity("");
    }

    if (!citySelect.value) {
      citySelect.setCustomValidity("Please select your city.");
      valid = false;
    } else {
      citySelect.setCustomValidity("");
    }

    form.classList.add("was-validated");
    return valid;
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function selectServiceAndScroll(serviceName) {
    if (!serviceName) return;

    const option = Array.from(serviceSelect.options).find(function (opt) {
      return opt.value === serviceName;
    });

    if (option) {
      serviceSelect.value = serviceName;
      serviceSelect.setCustomValidity("");
    }

    const quoteSection = document.getElementById("quote");
    if (quoteSection) {
      quoteSection.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
    }

    window.setTimeout(function () {
      if (window.matchMedia("(max-width: 991.98px)").matches) {
        serviceSelect.focus({ preventScroll: true });
      } else {
        nameInput.focus({ preventScroll: true });
      }
    }, prefersReducedMotion() ? 50 : 450);
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(area);
    return ok;
  }

  async function handleCopyQuote() {
    if (!validateForm()) {
      showStatus("info", "Please complete the required fields before copying your quote request.");
      const firstInvalid = form.querySelector(":invalid");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const message = buildQuoteMessage();
    try {
      const copied = await copyText(message);
      if (copied) {
        showStatus(
          "success",
          "<strong>Quote request copied.</strong> Text message contact will be available soon. Paste the message when you are ready to send it."
        );
      } else {
        throw new Error("copy failed");
      }
    } catch (err) {
      showStatus(
        "fallback",
        "<p class=\"mb-1\"><strong>Text message contact will be available soon.</strong></p>" +
          "<p class=\"mb-2\">We could not copy automatically. Select and copy the text below:</p>" +
          "<pre class=\"quote-preview-text\" tabindex=\"0\">" +
          escapeHtml(message) +
          "</pre>"
      );
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function handleSubmit(event) {
    event.preventDefault();
    hideStatus();

    if (!validateForm()) {
      const firstInvalid = form.querySelector(":invalid");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const message = buildQuoteMessage();

    if (isSmsConfigured()) {
      const url = buildSmsUrl(message);
      window.location.href = url;
      showStatus(
        "success",
        "Your quote request is ready in your Messages app. Review the text and send it when you are ready — nothing is sent automatically."
      );
      return;
    }

    showStatus(
      "info",
      "<strong>Text message contact will be available soon.</strong> Use <em>Copy Quote Request</em> to save your message, or keep browsing the preview."
    );
  }

  function renderSocialLinks() {
    if (!footerSocial) return;

    const links = config.socialLinks || {};
    const icons = {
      facebook: "bi-facebook",
      instagram: "bi-instagram",
      linkedin: "bi-linkedin",
      twitter: "bi-twitter-x",
      youtube: "bi-youtube",
      tiktok: "bi-tiktok",
    };

    const entries = Object.keys(links).filter(function (key) {
      return typeof links[key] === "string" && links[key].trim() !== "";
    });

    if (!entries.length) {
      footerSocial.hidden = true;
      footerSocial.innerHTML = "";
      return;
    }

    footerSocial.hidden = false;
    footerSocial.innerHTML = entries
      .map(function (key) {
        const href = links[key].trim();
        const icon = icons[key] || "bi-link-45deg";
        const label = key.charAt(0).toUpperCase() + key.slice(1);
        return (
          '<a href="' +
          escapeHtml(href) +
          '" target="_blank" rel="noopener noreferrer" aria-label="' +
          label +
          '">' +
          '<i class="bi ' +
          icon +
          '" aria-hidden="true"></i></a>'
        );
      })
      .join("");
  }

  function initNavCloseOnSelect() {
    if (!navCollapseEl || typeof bootstrap === "undefined") return;

    const collapse = bootstrap.Collapse.getOrCreateInstance(navCollapseEl, { toggle: false });

    navCollapseEl.querySelectorAll("a[href^='#']").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.getComputedStyle(document.querySelector(".navbar-toggler")).display !== "none") {
          collapse.hide();
        }
      });
    });
  }

  document.querySelectorAll("[data-service]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      selectServiceAndScroll(btn.getAttribute("data-service"));
    });
  });

  [nameInput, serviceSelect, citySelect].forEach(function (el) {
    el.addEventListener("input", function () {
      el.setCustomValidity("");
    });
    el.addEventListener("change", function () {
      el.setCustomValidity("");
    });
  });

  form.addEventListener("submit", handleSubmit);
  copyBtn.addEventListener("click", function () {
    handleCopyQuote();
  });

  syncQuoteUiMode();
  renderSocialLinks();
  initNavCloseOnSelect();

  if (areaList && toggleAreasBtn) {
    toggleAreasBtn.addEventListener("click", function () {
      const expanded = areaList.classList.toggle("is-expanded");
      toggleAreasBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
      toggleAreasBtn.textContent = expanded ? "Show fewer cities" : "View all 45 cities";
    });
  }
})();
