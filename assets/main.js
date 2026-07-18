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

  function ignite() {
    igniteUntil = performance.now() + 3400; // clicking more extends the blaze
    if (igniting) return;
    igniting = true;
    if (reduce) { igniteReduced(); return; }
    const main = document.getElementById("main");
    if (main) { main.classList.add("shake"); setTimeout(() => main.classList.remove("shake"), 600); }
    startFire();
  }

  // Reduced-motion: a gentle static warm wash - no particles or shake.
  function igniteReduced() {
    if (!layer) { layer = document.createElement("div"); layer.id = "flame-layer"; document.body.appendChild(layer); }
    layer.innerHTML = '<div class="flame-glow"></div>';
    layer.classList.add("active");
    const check = setInterval(() => {
      if (performance.now() > igniteUntil) {
        clearInterval(check);
        layer.classList.remove("active");
        igniting = false;
      }
    }, 200);
  }

  // Canvas particle fire with additive ("lighter") blending: a white-hot base
  // fading through yellow and orange to red at the tips, plus rising sparks.
  function startFire() {
    const canvas = document.createElement("canvas");
    canvas.id = "fire-canvas";
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    function resize() {
      W = canvas.width = Math.floor(window.innerWidth * dpr);
      H = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    }
    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(() => canvas.classList.add("active"));

    const flames = [];
    const embers = [];
    const MAX = 640;

    // Hottest (white/yellow) when young at the base, cooling to red with age.
    function tint(t) {
      if (t < 0.22) return "255,250,214";
      if (t < 0.45) return "255,214,108";
      if (t < 0.72) return "255,122,26";
      return "206,48,52";
    }

    function emit() {
      if (performance.now() > igniteUntil) return;
      for (let i = 0; i < 16 && flames.length < MAX; i++) {
        flames.push({
          x: (Math.random() * 0.6 + Math.random() * 0.4) * W, // slight center bias
          y: H + Math.random() * 12 * dpr,
          vx: (Math.random() - 0.5) * 0.9 * dpr,
          vy: -(1.3 + Math.random() * 2.4) * dpr,
          life: 0, max: 42 + Math.random() * 46,
          size: (16 + Math.random() * 30) * dpr,
        });
      }
      if (Math.random() < 0.7 && embers.length < 160) {
        embers.push({
          x: Math.random() * W, y: H,
          vx: (Math.random() - 0.5) * 1.4 * dpr,
          vy: -(2.6 + Math.random() * 3.4) * dpr,
          life: 0, max: 90 + Math.random() * 90,
          size: (1.3 + Math.random() * 2.4) * dpr,
        });
      }
    }

    let raf;
    function frame() {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      emit();

      for (let i = flames.length - 1; i >= 0; i--) {
        const p = flames[i];
        p.life++;
        p.vx += (Math.random() - 0.5) * 0.5 * dpr; // turbulence
        p.vy -= 0.03 * dpr;                        // buoyancy
        p.vx *= 0.98;
        p.x += p.vx; p.y += p.vy;
        const t = p.life / p.max;
        if (t >= 1) { flames.splice(i, 1); continue; }
        const rgb = tint(t);
        const a = (1 - t) * 0.42;
        const size = p.size * (0.5 + (1 - t) * 0.9);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
        grad.addColorStop(0, `rgba(${rgb},${a})`);
        grad.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, 6.2832); ctx.fill();
      }

      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.life++;
        e.vx += (Math.random() - 0.5) * 0.4 * dpr;
        e.vy *= 0.99;
        e.x += e.vx; e.y += e.vy;
        const t = e.life / e.max;
        if (t >= 1 || e.y < -20) { embers.splice(i, 1); continue; }
        ctx.fillStyle = `rgba(255,${Math.round(200 - t * 130)},90,${1 - t})`;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.size * (1 - t * 0.5), 0, 6.2832); ctx.fill();
      }

      if (flames.length || embers.length || performance.now() < igniteUntil) {
        raf = requestAnimationFrame(frame);
      } else {
        window.removeEventListener("resize", resize);
        canvas.classList.remove("active");
        setTimeout(() => canvas.remove(), 450);
        igniting = false;
      }
    }
    raf = requestAnimationFrame(frame);
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
