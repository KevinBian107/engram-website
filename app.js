/* ===================================================================
   Engram — page interactions: scroll-reveal, active nav, copy buttons.
   =================================================================== */
(function () {
  "use strict";

  // current year in footer
  const yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  // reveal-on-scroll
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      }
    }, { threshold: 0.15 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  // active section in nav
  const links = Array.from(document.querySelectorAll(".nav__links a"));
  const map = new Map();
  links.forEach((a) => {
    const id = a.getAttribute("href").slice(1);
    const sec = document.getElementById(id);
    if (sec) map.set(sec, a);
  });
  if ("IntersectionObserver" in window && map.size) {
    const spy = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          links.forEach((l) => l.classList.remove("active"));
          const a = map.get(e.target);
          if (a) a.classList.add("active");
        }
      }
    }, { rootMargin: "-45% 0px -50% 0px" });
    map.forEach((_, sec) => spy.observe(sec));
  }

  // copy-to-clipboard for code blocks
  document.querySelectorAll(".copy").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pre = btn.closest(".codeblock").querySelector("pre");
      const text = pre ? pre.innerText : "";
      navigator.clipboard.writeText(text).then(() => {
        const old = btn.textContent;
        btn.textContent = "copied ✓"; btn.classList.add("copied");
        setTimeout(() => { btn.textContent = old; btn.classList.remove("copied"); }, 1400);
      }).catch(() => { btn.textContent = "copy failed"; });
    });
  });
})();
