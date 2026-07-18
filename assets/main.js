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

// ===== Svarog fire easter egg: click the avatar fast to ignite the page =====
(function () {
  const avatar = document.querySelector(".hero-avatar img");
  if (!avatar) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let heat = 0;               // 0..12, builds per click, decays over time
  let igniting = false;
  let igniteUntil = 0;
  let layer = null;
  const clicks = [];          // timestamps within the rolling window

  function applyHeat() {
    const h = Math.min(heat, 10) / 10; // normalized 0..1
    if (h <= 0) { avatar.style.filter = ""; avatar.style.transform = ""; return; }
    const blur = 26 + h * 64;
    const alpha = (0.4 + h * 0.5).toFixed(2);
    const green = Math.round(150 - h * 80);
    avatar.style.filter = `drop-shadow(0 6px ${blur}px rgba(255, ${green}, 60, ${alpha}))`;
    avatar.style.transform = `scale(${(1 + h * 0.05).toFixed(3)})`;
  }

  setInterval(() => { if (heat > 0) { heat = Math.max(0, heat - 0.6); applyHeat(); } }, 300);

  avatar.addEventListener("click", () => {
    const now = performance.now();
    clicks.push(now);
    while (clicks.length && now - clicks[0] > 1200) clicks.shift();
    heat = Math.min(12, heat + 1.6);
    applyHeat();
    if (!reduce) {
      avatar.animate(
        [{ transform: `scale(${(1 + Math.min(heat, 10) / 10 * 0.05 + 0.05).toFixed(3)})` },
         { transform: avatar.style.transform || "scale(1)" }],
        { duration: 150, easing: "ease-out" }
      );
    }
    if (clicks.length >= 6) ignite(); // ~5 clicks/sec
  });

  function ensureLayer() {
    if (!layer) { layer = document.createElement("div"); layer.id = "flame-layer"; document.body.appendChild(layer); }
    return layer;
  }

  function spawnEmber(l) {
    const e = document.createElement("div");
    e.className = "ember";
    const size = 4 + Math.random() * 8;
    e.style.left = (Math.random() * 100).toFixed(1) + "vw";
    e.style.width = e.style.height = size.toFixed(1) + "px";
    e.style.setProperty("--rise", (58 + Math.random() * 40).toFixed(0) + "vh");
    e.style.setProperty("--drift", (Math.random() * 90 - 45).toFixed(0) + "px");
    e.style.setProperty("--dur", (2 + Math.random() * 2).toFixed(2) + "s");
    l.appendChild(e);
    e.addEventListener("animationend", () => e.remove());
    setTimeout(() => e.remove(), 4600);
  }

  function ignite() {
    igniteUntil = performance.now() + 3200; // clicking more extends the blaze
    if (igniting) return;
    igniting = true;
    const l = ensureLayer();
    l.innerHTML = '<div class="flame-glow"></div>';
    l.classList.add("active");

    if (reduce) { // gentle warm wash only - no shake, flames, or embers
      setTimeout(stop, 2600);
      return;
    }

    const main = document.getElementById("main");
    if (main) { main.classList.add("shake"); setTimeout(() => main.classList.remove("shake"), 600); }

    const count = Math.min(20, Math.round(window.innerWidth / 65));
    for (let i = 0; i < count; i++) {
      const f = document.createElement("div");
      f.className = "flame";
      const w = 40 + Math.random() * 75;
      f.style.left = ((i / count) * 100 + Math.random() * 3).toFixed(1) + "%";
      f.style.width = w.toFixed(0) + "px";
      f.style.height = (w * (1.7 + Math.random())).toFixed(0) + "px";
      f.style.setProperty("--f", (0.28 + Math.random() * 0.3).toFixed(2) + "s");
      f.style.animationDelay = (-Math.random() * 0.5).toFixed(2) + "s";
      l.appendChild(f);
    }

    const timer = setInterval(() => {
      if (performance.now() > igniteUntil) { clearInterval(timer); stop(); return; }
      for (let i = 0; i < 3; i++) spawnEmber(l);
    }, 90);
  }

  function stop() {
    igniting = false;
    if (!layer) return;
    layer.classList.remove("active");
    setTimeout(() => { if (!igniting && layer) layer.innerHTML = ""; }, 500);
  }
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
