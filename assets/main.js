// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// ===== Expired-certification ribbons =====
// Any .badge[data-expires] whose date has passed gets a corner ribbon showing
// the expiry date. Evaluated at page load, so ribbons appear on their own as
// certs lapse - no rebuild needed.
(function () {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  document.querySelectorAll(".badge[data-expires]").forEach((el) => {
    const raw = el.getAttribute("data-expires");
    const expiry = new Date(raw + "T23:59:59");
    if (isNaN(expiry) || expiry >= now) return;
    el.classList.add("expired");
    const date = `${expiry.getDate()} ${MONTHS[expiry.getMonth()]} ${expiry.getFullYear()}`;
    const ribbon = document.createElement("span");
    ribbon.className = "ribbon";
    ribbon.innerHTML = `Expired<small>${date}</small>`;
    el.setAttribute("aria-label", (el.getAttribute("title") || "") + " — expired " + date);
    el.appendChild(ribbon);
  });
})();

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
