(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    document.documentElement.classList.add("reduce-motion");
  }

  /* ------------------------------------------------------------------ */
  /* Lenis smooth scroll                                                  */
  /* ------------------------------------------------------------------ */
  let lenis = null;

  if (!reduceMotion && window.Lenis) {
    lenis = new window.Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    if (window.gsap && window.ScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }

    if (window.location.hash) {
      const boot = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (boot) {
        requestAnimationFrame(() => lenis.scrollTo(boot, { offset: -88, immediate: true }));
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Sticky header — solid after 80px                                     */
  /* ------------------------------------------------------------------ */
  const header = document.getElementById("site-header");

  const onScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (!header) return;
    header.classList.toggle("is-scrolled", y > 80);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ------------------------------------------------------------------ */
  /* Mobile nav                                                           */
  /* ------------------------------------------------------------------ */
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  const closeBtn = document.querySelector(".nav-close");
  const navLinks = nav ? [...nav.querySelectorAll("a")] : [];

  const closeNav = () => {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    nav.classList.remove("is-open");
    if (header) header.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    document.body.style.overflow = "";
    if (lenis) lenis.start();
  };

  const openNav = () => {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    nav.classList.add("is-open");
    if (header) header.classList.add("is-open");
    document.body.classList.add("nav-open");
    document.body.style.overflow = "hidden";
    if (lenis) lenis.stop();
  };

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      if (expanded) closeNav();
      else openNav();
    });

    navLinks.forEach((link) => link.addEventListener("click", closeNav));

    if (closeBtn) closeBtn.addEventListener("click", closeNav);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 1024) closeNav();
    });
  }

  /* ------------------------------------------------------------------ */
  /* In-page hash links (Lenis-aware)                                     */
  /* ------------------------------------------------------------------ */
  document.querySelectorAll('a[href*="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;
      const url = new URL(href, window.location.href);
      const here = window.location.pathname.replace(/\/index\.html$/, "/");
      const there = url.pathname.replace(/\/index\.html$/, "/");
      if (there !== here && !href.startsWith("#")) return;
      const id = decodeURIComponent(url.hash.replace("#", ""));
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      closeNav();
      if (lenis) lenis.scrollTo(target, { offset: -88 });
      else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  });

  /* ------------------------------------------------------------------ */
  /* GSAP ScrollTrigger reveals                                           */
  /* ------------------------------------------------------------------ */
  if (!reduceMotion && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray(".reveal").forEach((el) => {
      gsap.fromTo(
        el,
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: "play none none none",
          },
        }
      );
    });

    gsap.utils.toArray(".reveal-stagger").forEach((group) => {
      const items = group.querySelectorAll(":scope > *");
      gsap.fromTo(
        items,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: group,
            start: "top 86%",
            toggleActions: "play none none none",
          },
        }
      );
    });
  } else {
    document.querySelectorAll(".reveal, .reveal-stagger > *").forEach((el) => {
      el.style.opacity = "1";
    });
  }

  /* ------------------------------------------------------------------ */
  /* Count-up stats via IntersectionObserver                              */
  /* ------------------------------------------------------------------ */
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count || "0");
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const duration = 1600;
    const start = performance.now();

    const format = (val) => {
      const n = decimals ? val.toFixed(decimals) : Math.floor(val).toLocaleString("en-IN");
      return `${prefix}${n}${suffix}`;
    };

    if (reduceMotion) {
      el.textContent = format(target);
      return;
    }

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = format(target * eased);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = format(target);
    };

    requestAnimationFrame(tick);
  };

  const statNodes = document.querySelectorAll("[data-count]");
  if (statNodes.length) {
    const io = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );
    statNodes.forEach((node) => io.observe(node));
  }

  /* ------------------------------------------------------------------ */
  /* What We Do — tabs / accordion                                        */
  /* ------------------------------------------------------------------ */
  const tablist = document.querySelector('[role="tablist"]');
  if (tablist) {
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    const panels = [...document.querySelectorAll('[role="tabpanel"]')];

    const activate = (tab) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach((panel) => {
        const match = panel.id === tab.getAttribute("aria-controls");
        panel.classList.toggle("is-active", match);
        panel.hidden = !match;
      });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => activate(tab));
      tab.addEventListener("keydown", (e) => {
        const i = tabs.indexOf(tab);
        let next = i;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % tabs.length;
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + tabs.length) % tabs.length;
        if (e.key === "Home") next = 0;
        if (e.key === "End") next = tabs.length - 1;
        if (next !== i) {
          e.preventDefault();
          tabs[next].focus();
          activate(tabs[next]);
        }
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Testimonial carousel                                                 */
  /* ------------------------------------------------------------------ */
  const carousel = document.querySelector("[data-carousel]");
  if (carousel) {
    const slides = [...carousel.querySelectorAll(".carousel-slide")];
    const prev = carousel.querySelector("[data-prev]");
    const next = carousel.querySelector("[data-next]");
    let index = 0;

    const show = (i) => {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, n) => s.classList.toggle("is-active", n === index));
    };

    if (prev) prev.addEventListener("click", () => show(index - 1));
    if (next) next.addEventListener("click", () => show(index + 1));
  }

  /* ------------------------------------------------------------------ */
  /* Contact form — EmailJS placeholder                                   */
  /* ------------------------------------------------------------------ */
  const form = document.getElementById("contact-form");
  if (form) {
    // TODO: add EmailJS service ID/template ID/public key
    const EMAILJS_PUBLIC_KEY = ""; // TODO: add EmailJS public key
    const EMAILJS_SERVICE_ID = ""; // TODO: add EmailJS service ID
    const EMAILJS_TEMPLATE_ID = ""; // TODO: add EmailJS template ID

    const status = document.getElementById("form-status");

    if (window.emailjs && EMAILJS_PUBLIC_KEY) {
      emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!status) return;

      if (!form.reportValidity()) return;

      status.className = "form-status";
      status.textContent = "Sending…";

      if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) {
        status.classList.add("is-error");
        status.textContent =
          "The form is not connected yet. Please write to us at the Head Office address, or telephone the nearest branch.";
        return;
      }

      try {
        await emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form);
        status.classList.add("is-success");
        status.textContent = "Thank you. Your message has been received.";
        form.reset();
      } catch (err) {
        status.classList.add("is-error");
        status.textContent = "Something went wrong. Please try again, or contact us directly.";
      }
    });
  }
})();
