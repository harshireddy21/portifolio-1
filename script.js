const THEME_KEY = "harsha-portfolio-theme";
const STORAGE_KEY = "harsha-portfolio-contacts";

/* ---------- THEME ---------- */

function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

function storeTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* storage unavailable — theme just won't persist */
  }
}



function initTheme() {
  document.documentElement.setAttribute("data-theme", getStoredTheme() || "dark");

  document.getElementById("themeToggle")?.addEventListener("click", () => {
    const next =
      document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    storeTheme(next);
  });
}

/* ---------- MOBILE NAV ---------- */

function initNav() {
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");
  const header = document.querySelector(".site-header");
  if (!toggle || !menu) return;

  const close = () => {
    menu.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));

  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  window.addEventListener(
    "scroll",
    () => header?.classList.toggle("scrolled", window.scrollY > 8),
    { passive: true }
  );
}

/* ---------- SCROLL SPY ---------- */

function initScrollSpy() {
  const links = [...document.querySelectorAll(".nav-link")];
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) =>
          link.classList.toggle(
            "active",
            link.getAttribute("href") === `#${entry.target.id}`
          )
        );
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );

  sections.forEach((section) => observer.observe(section));
}

/* ---------- REVEAL ON SCROLL ---------- */

function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.style.setProperty("--reveal-delay", `${entry.target.dataset.delay || 0}ms`);
        entry.target.classList.add("visible");
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
  );

  items.forEach((el) => observer.observe(el));
}

/* ---------- TYPING EFFECT ---------- */

function initTypewriter() {
  const target = document.getElementById("typed");
  if (!target) return;

  const phrases = ["full-stack applications.", "APIs with Spring Boot.", "React interfaces.", "clean, maintainable code."];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    target.textContent = phrases[0];
    return;
  }

  let phrase = 0;
  let char = 0;
  let deleting = false;

  const tick = () => {
    const current = phrases[phrase];
    char += deleting ? -1 : 1;
    target.textContent = current.slice(0, char);

    if (!deleting && char === current.length) {
      deleting = true;
      setTimeout(tick, 1600);
      return;
    }

    if (deleting && char === 0) {
      deleting = false;
      phrase = (phrase + 1) % phrases.length;
      setTimeout(tick, 320);
      return;
    }

    setTimeout(tick, deleting ? 45 : 95);
  };

  setTimeout(tick, 600);
}

/* ---------- PROJECT FILTERS ---------- */

function initProjectFilters() {
  const buttons = document.querySelectorAll(".filter-btn");
  const projects = document.querySelectorAll("#projectsGrid .project");
  if (!buttons.length || !projects.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.toggle("active", b === btn));
      const filter = btn.dataset.filter;

      projects.forEach((project) => {
        const show = filter === "all" || project.dataset.category === filter;
        project.classList.toggle("hidden", !show);
        if (show) {
          project.classList.remove("visible");
          requestAnimationFrame(() => project.classList.add("visible"));
        }
      });
    });
  });
}

/* ---------- CONTACT FORM ---------- */

function readSavedMessages() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function initContactForm() {
  const form = document.getElementById("contactForm");
  const note = document.getElementById("formNote");
  if (!form || !note) return;

  const rules = {
    name: {
      test: (v) => v.trim().length >= 2,
      message: "Please enter your name.",
    },
    email: {
      test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
      message: "Please enter a valid email address.",
    },
    message: {
      test: (v) => v.trim().length >= 10,
      message: "Message should be at least 10 characters.",
    },
  };

  const validateField = (field) => {
    const rule = rules[field.name];
    if (!rule) return true;
    const valid = rule.test(field.value);
    field.closest(".form-row").classList.toggle("invalid", !valid);
    const errorEl = field.parentElement.querySelector(".error");
    if (errorEl) errorEl.textContent = valid ? "" : rule.message;
    return valid;
  };

  Object.keys(rules).forEach((name) => {
    const field = form.elements[name];
    if (!field) return;
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.closest(".form-row").classList.contains("invalid")) validateField(field);
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const results = Object.keys(rules)
      .map((name) => form.elements[name])
      .filter(Boolean)
      .map(validateField);

    if (results.includes(false)) {
      note.style.color = "var(--danger)";
      note.textContent = "Please fix the highlighted fields and try again.";
      return;
    }

    const messages = readSavedMessages();
    messages.push({
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      subject: form.elements.subject.value.trim(),
      message: form.elements.message.value.trim(),
      at: new Date().toISOString(),
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
    } catch {
      /* ignore quota errors */
    }

    form.reset();
    note.style.color = "var(--success)";
    note.textContent =
      "Thanks! Your message was saved. I'll get back to you shortly.";
  });
}

/* ---------- MISC ---------- */

function initMisc() {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  document.getElementById("backToTop")?.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function init() {
  initTheme();
  initNav();
  initScrollSpy();
  initReveal();
  initTypewriter();
  initProjectFilters();
  initContactForm();
  initMisc();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}