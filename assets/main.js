// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// ===== Theme toggle (respects OS default, remembers choice) =====
(function () {
  const root = document.documentElement;
  const btn = document.getElementById("theme-toggle");
  const stored = localStorage.getItem("theme");
  if (stored) root.setAttribute("data-theme", stored);

  btn.addEventListener("click", () => {
    const current =
      root.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    const next = current === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });
})();

// ===== Typewriter (mirrors the GitHub profile typing banner) =====
(function () {
  const el = document.getElementById("tw");
  if (!el) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lines = [
    "Platform Engineer",
    "Kubernetes Multi-Tenancy @ Project Capsule",
    "Making shared clusters safe, scalable & boring",
  ];

  if (reduce) {
    el.textContent = lines[0];
    return;
  }

  let li = 0, ci = 0, deleting = false;
  function tick() {
    const word = lines[li];
    el.textContent = word.slice(0, ci);
    if (!deleting && ci < word.length) {
      ci++;
      setTimeout(tick, 55);
    } else if (!deleting && ci === word.length) {
      deleting = true;
      setTimeout(tick, 1600);
    } else if (deleting && ci > 0) {
      ci--;
      setTimeout(tick, 28);
    } else {
      deleting = false;
      li = (li + 1) % lines.length;
      setTimeout(tick, 350);
    }
  }
  tick();
})();
