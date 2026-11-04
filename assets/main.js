// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// ===== Current Mood: recent Spotify tracks, rendered with attitude =====
(function () {
  const root = document.getElementById("mood-content");
  if (!root) return;

  const QUIPS = [
    "Reconciling my feelings to",
    "A healthy control plane sounds like",
    "Fueling the commits with",
    "Svarog headbangs to",
    "Debugging RBAC to the sound of",
    "On loop while the pipeline burns",
    "Multi-tenant chaos, scored by",
    "Currently possessed by",
  ];

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const searchUrl = (t) => "https://open.spotify.com/search/" + encodeURIComponent(t.artist + " " + t.name);
  const link = (t) => t.url || searchUrl(t);
  const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };

  function ago(iso) {
    if (!iso) return "on repeat";
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 90) return "just now";
    const m = s / 60; if (m < 60) return Math.round(m) + "m ago";
    const h = m / 60; if (h < 24) return Math.round(h) + "h ago";
    return Math.round(h / 24) + "d ago";
  }

  function render(data) {
    const tracks = (data && data.tracks) || [];
    if (!tracks.length) {
      root.innerHTML = '<p class="mood-loading">The gods are between tracks. Svarog is picking the next banger - check back soon.</p>';
      return;
    }
    const top = tracks[0];
    const quip = QUIPS[hash(top.name + top.artist) % QUIPS.length];
    const art = top.image
      ? `<img class="mood-art" src="${esc(top.image)}" alt="" width="76" height="76" loading="lazy" />`
      : '<div class="mood-art" aria-hidden="true">🎵</div>';

    const rest = tracks.slice(1, 6).map((t, i) => `
      <li class="mood-track">
        <span class="num">${i + 2}</span>
        <span class="t"><a href="${esc(link(t))}" target="_blank" rel="noopener">${esc(t.name)}</a> <span>&middot; ${esc(t.artist)}</span></span>
        <span class="ago">${ago(t.played_at)}</span>
      </li>`).join("");

    const chip = data.sample ? '<span class="mood-chip">sample vibes</span>' : "";
    const foot = data.sample
      ? "Demo playlist until Spotify is connected."
      : (data.updated ? "Synced from Spotify " + ago(data.updated) : "");

    root.innerHTML = `
      <div class="mood-now">
        ${art}
        <div class="mood-now-body">
          <p class="mood-quip">${esc(quip)}</p>
          <h3><a href="${esc(link(top))}" target="_blank" rel="noopener">${esc(top.name)}</a></h3>
          <p class="mood-artist">${esc(top.artist)} &nbsp;·&nbsp; <span class="mood-when">${ago(top.played_at)}</span></p>
        </div>
      </div>
      ${rest ? `<ul class="mood-list">${rest}</ul>` : ""}
      <p class="mood-foot">${foot}${chip}</p>`;
  }

  fetch("./assets/mood.json", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then(render)
    .catch(() => render(null));
})();

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
    el.setAttribute("aria-label", (el.getAttribute("title") || "") + " - expired " + date);
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

  // ----- Hint bubble -----
  const hint = document.getElementById("avatar-hint");
  let hintDismissed = false;
  let hintAutoHide;
  function showHint() {
    if (!hint || hintDismissed || igniting) return;
    hint.classList.add("show");
    clearTimeout(hintAutoHide);
    hintAutoHide = setTimeout(() => hint.classList.remove("show"), 11000);
  }
  function hideHint(permanent) {
    if (!hint) return;
    if (permanent) hintDismissed = true;
    clearTimeout(hintAutoHide);
    hint.classList.remove("show");
  }
  if (hint) {
    setTimeout(showHint, 2800);                    // pop up shortly after load
    avatar.addEventListener("mouseenter", showHint); // and remind on hover
    hint.querySelector(".avatar-hint-close").addEventListener("click", (ev) => {
      ev.stopPropagation();
      hideHint(true);
    });
  }

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
    hideHint(true); // they found it - stop nagging
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
    const backdrop = document.createElement("div");
    backdrop.id = "fire-backdrop";
    document.body.appendChild(backdrop);
    requestAnimationFrame(() => backdrop.classList.add("active"));
    if (!layer) { layer = document.createElement("div"); layer.id = "flame-layer"; document.body.appendChild(layer); }
    layer.innerHTML = '<div class="flame-glow"></div>';
    layer.classList.add("active");
    const check = setInterval(() => {
      if (performance.now() > igniteUntil) {
        clearInterval(check);
        layer.classList.remove("active");
        backdrop.classList.remove("active");
        setTimeout(() => backdrop.remove(), 500);
        igniting = false;
      }
    }, 200);
  }

  // ----- Canvas fire -----
  // Sprite-based particle fire. Flames advect through one shared noise field
  // (so tongues lick and swirl together instead of jittering), taper and cool
  // along a blackbody-ish ramp, shed sparks and smoke, and light the page with
  // a flickering glow. Frames fade instead of clearing, leaving short trails
  // that join the tongues up. The fire starts on the avatar - it is the thing
  // that was clicked - and spreads along the floor.
  function startFire() {
    const backdrop = document.createElement("div");
    backdrop.id = "fire-backdrop";
    document.body.appendChild(backdrop);
    requestAnimationFrame(() => backdrop.classList.add("active"));

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

    // Coherent 2D value noise: hashed lattice, smoothstep interpolation, 0..1.
    const PERM = new Uint8Array(512);
    for (let i = 0; i < 256; i++) PERM[i] = i;
    for (let i = 255; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const t = PERM[i]; PERM[i] = PERM[j]; PERM[j] = t; }
    for (let i = 0; i < 256; i++) PERM[256 + i] = PERM[i];
    const fade = (t) => t * t * (3 - 2 * t);
    function noise(x, y) {
      const X = Math.floor(x), Y = Math.floor(y);
      const xf = x - X, yf = y - Y, xi = X & 255, yi = Y & 255;
      const a = PERM[PERM[xi] + yi], b = PERM[PERM[xi + 1] + yi];
      const c = PERM[PERM[xi] + yi + 1], d = PERM[PERM[xi + 1] + yi + 1];
      const u = fade(xf), v = fade(yf);
      return ((a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v) / 255;
    }

    // Blackbody-ish ramp: white-hot core, through yellow and orange, to dark
    // red at the tips. Baked into soft sprites so a frame is just blits.
    const RAMP = [
      [255, 252, 232], [255, 240, 170], [255, 214, 92], [255, 170, 40],
      [255, 120, 20], [240, 76, 20], [200, 40, 24], [130, 18, 16], [60, 8, 8],
    ];
    const STEPS = 32;
    function rampColor(t) {
      const f = Math.min(0.9999, Math.max(0, t)) * (RAMP.length - 1);
      const i = Math.floor(f), k = f - i, A = RAMP[i], B = RAMP[i + 1];
      return [0, 1, 2].map((c) => Math.round(A[c] + (B[c] - A[c]) * k)).join(",");
    }
    function softSprite(rgb, stops) {
      const s = 64, c = document.createElement("canvas");
      c.width = c.height = s;
      const g = c.getContext("2d");
      const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      stops.forEach(([at, a]) => grad.addColorStop(at, `rgba(${rgb},${a})`));
      g.fillStyle = grad; g.fillRect(0, 0, s, s);
      return c;
    }
    const FLAME_STOPS = [[0, 1], [0.25, 0.7], [0.6, 0.16], [1, 0]];
    const SPRITES = Array.from({ length: STEPS }, (_, i) => softSprite(rampColor(i / (STEPS - 1)), FLAME_STOPS));
    const SMOKE = softSprite("28,22,20", [[0, 0.5], [0.5, 0.2], [1, 0]]);

    const flames = [], sparks = [], smoke = [];
    const MAX_FLAMES = 900, MAX_SPARKS = 220, MAX_SMOKE = 160;
    const t0 = performance.now();
    let last = t0, time = 0, accFloor = 0, accCrown = 0;

    // A few hot spots wander along the floor so the fire has a shape rather
    // than a uniform curtain.
    const spots = Array.from({ length: 5 }, (_, i) => ({ u: (i + 0.5) / 5, seed: Math.random() * 100 }));
    function floorX() {
      if (Math.random() < 0.65) {
        const s = spots[(Math.random() * spots.length) | 0];
        const wander = (noise(s.seed, time * 0.25) - 0.5) * 0.25;
        return (s.u + wander + (Math.random() - 0.5) * 0.12) * W;
      }
      return Math.random() * W;
    }
    function avatarRect() {
      const r = avatar.getBoundingClientRect();
      return {
        cx: (r.left + r.width / 2) * dpr, cy: (r.top + r.height / 2) * dpr, r: (r.width / 2) * dpr,
        onScreen: r.bottom > 0 && r.top < window.innerHeight,
      };
    }

    // Velocities are device px per second; life is in seconds.
    function spawnFlame(x, y, vx, vy, scale) {
      if (flames.length >= MAX_FLAMES) return;
      flames.push({ x, y, vx, vy, life: 0, max: 0.8 + Math.random() * 0.8,
        size: (14 + Math.random() * 22) * dpr * scale, seed: Math.random() * 1000 });
    }
    function spawnSpark(x, y, burst) {
      if (sparks.length >= MAX_SPARKS) return;
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.3 * burst;
      const sp = (160 + Math.random() * 320) * dpr * (0.6 + burst * 0.6);
      sparks.push({ x, y, px: x, py: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        life: 0, max: 0.8 + Math.random() * 1.4, seed: Math.random() * 10, size: (1 + Math.random() * 1.6) * dpr });
    }
    function emit(dt, k) {
      // Floor: emission scales with viewport width so phones get a smaller fire.
      accFloor += (W / dpr) * 0.7 * k * dt;
      while (accFloor >= 1) {
        accFloor--;
        spawnFlame(floorX(), H + Math.random() * 10 * dpr,
          (Math.random() - 0.5) * 30 * dpr, -(120 + Math.random() * 180) * dpr, 1);
      }
      // Crown of fire on the avatar, the thing that was clicked.
      const a = avatarRect();
      if (a.onScreen) {
        accCrown += 140 * k * dt;
        while (accCrown >= 1) {
          accCrown--;
          const ang = -Math.PI * (0.1 + Math.random() * 0.8); // top half of the ring
          const rr = a.r * (0.85 + Math.random() * 0.15);
          spawnFlame(a.cx + Math.cos(ang) * rr, a.cy + Math.sin(ang) * rr,
            Math.cos(ang) * 20 * dpr + (Math.random() - 0.5) * 20 * dpr,
            -(60 + Math.random() * 90) * dpr, 0.55);
        }
      }
      // Sparks: a steady trickle plus the odd crackle burst.
      if (Math.random() < 0.08 * k) {
        const bx = floorX(), n = 4 + ((Math.random() * 8) | 0);
        for (let i = 0; i < n; i++) spawnSpark(bx, H, 1);
      }
      if (Math.random() < 0.5 * k) spawnSpark(floorX(), H, 0.5);
    }

    function step(dt) {
      time += dt;
      const ns = 0.004 / dpr; // noise feature size, roughly 250 css px
      for (let i = flames.length - 1; i >= 0; i--) {
        const p = flames[i];
        p.life += dt;
        const t = p.life / p.max;
        if (t >= 1) { flames[i] = flames[flames.length - 1]; flames.pop(); continue; }
        const n = noise(p.x * ns + p.seed * 0.01, p.y * ns - time * 0.8);
        p.vx += (n - 0.5) * 900 * dpr * dt;  // shared swirl
        p.vy -= 200 * dpr * dt;              // buoyancy
        p.vx *= Math.exp(-2.2 * dt);
        p.vy *= Math.exp(-0.6 * dt);
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (t > 0.75 && Math.random() < 0.05 && smoke.length < MAX_SMOKE) {
          smoke.push({ x: p.x, y: p.y, vx: p.vx * 0.3, vy: p.vy * 0.25, life: 0,
            max: 1.6 + Math.random() * 1.6, size: p.size * 1.2, seed: Math.random() * 1000 });
        }
      }
      for (let i = smoke.length - 1; i >= 0; i--) {
        const s = smoke[i];
        s.life += dt;
        if (s.life >= s.max) { smoke[i] = smoke[smoke.length - 1]; smoke.pop(); continue; }
        const n = noise(s.x * ns * 0.6 + s.seed * 0.01, s.y * ns * 0.6 - time * 0.3);
        s.vx += (n - 0.5) * 300 * dpr * dt;
        s.vy -= 40 * dpr * dt;
        s.vx *= Math.exp(-1.5 * dt); s.vy *= Math.exp(-1.2 * dt);
        s.x += s.vx * dt; s.y += s.vy * dt;
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const e = sparks[i];
        e.life += dt;
        if (e.life >= e.max || e.y < -20) { sparks[i] = sparks[sparks.length - 1]; sparks.pop(); continue; }
        e.px = e.x; e.py = e.y;
        const n = noise(e.x * ns + e.seed, e.y * ns - time * 0.8);
        e.vx += (n - 0.5) * 700 * dpr * dt;
        e.vy += 120 * dpr * dt;              // sparks arc and fall
        e.vx *= Math.exp(-1.2 * dt); e.vy *= Math.exp(-0.8 * dt);
        e.x += e.vx * dt; e.y += e.vy * dt;
      }
    }

    function draw(dt, k) {
      // Fade the last frame rather than clearing it. Every draw below scales
      // its alpha by the same factor, so steady-state brightness equals the
      // particle's intensity whatever the frame rate.
      const fadeA = 1 - Math.exp(-30 * dt);
      ctx.globalCompositeOperation = "destination-out";
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgba(0,0,0,${fadeA})`;
      ctx.fillRect(0, 0, W, H);

      ctx.globalCompositeOperation = "lighter";

      // Firelight on the page: a broad flickering glow from the floor, and a
      // halo on the avatar while it burns.
      const flick = 0.7 + 0.3 * noise(time * 3, 7.3);
      const g = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, W * 0.75);
      g.addColorStop(0, `rgba(255,140,50,${0.3 * k * flick * fadeA})`);
      g.addColorStop(0.5, `rgba(255,90,30,${0.12 * k * flick * fadeA})`);
      g.addColorStop(1, "rgba(255,90,30,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const a = avatarRect();
      if (a.onScreen && k > 0) {
        const h = ctx.createRadialGradient(a.cx, a.cy, a.r * 0.5, a.cx, a.cy, a.r * 2.2);
        h.addColorStop(0, `rgba(255,150,60,${0.35 * k * flick * fadeA})`);
        h.addColorStop(1, "rgba(255,150,60,0)");
        ctx.fillStyle = h; ctx.fillRect(a.cx - a.r * 2.2, a.cy - a.r * 2.2, a.r * 4.4, a.r * 4.4);
      }

      // Flames: tall soft sprites that grow, then taper and cool with age.
      for (let i = 0; i < flames.length; i++) {
        const p = flames[i];
        const t = p.life / p.max;
        const idx = Math.min(STEPS - 1, (t * STEPS) | 0);
        const w = p.size * (0.5 + 1.1 * t) * Math.sqrt(1 - t);
        const stretch = 1.3 + Math.min(1, Math.abs(p.vy) / (300 * dpr)) * 0.9;
        ctx.globalAlpha = Math.pow(1 - t, 1.4) * 0.85 * fadeA;
        ctx.drawImage(SPRITES[idx], p.x - w / 2, p.y - (w * stretch) / 2, w, w * stretch);
      }

      // Sparks: short bright streaks that twinkle.
      ctx.lineCap = "round";
      for (let i = 0; i < sparks.length; i++) {
        const e = sparks[i];
        const t = e.life / e.max;
        const tw = 0.55 + 0.45 * Math.sin(e.life * 40 + e.seed);
        ctx.globalAlpha = (1 - t) * tw * fadeA;
        ctx.strokeStyle = t < 0.5 ? "rgb(255,236,170)" : "rgb(255,150,60)";
        ctx.lineWidth = e.size * (1 - t * 0.5);
        ctx.beginPath(); ctx.moveTo(e.px, e.py); ctx.lineTo(e.x, e.y); ctx.stroke();
      }

      // Smoke: drawn normally so it can darken what is behind it.
      ctx.globalCompositeOperation = "source-over";
      for (let i = 0; i < smoke.length; i++) {
        const s = smoke[i];
        const t = s.life / s.max;
        const w = s.size * (1 + 2.2 * t);
        ctx.globalAlpha = 0.4 * (1 - t) * Math.min(1, t * 4) * fadeA;
        ctx.drawImage(SMOKE, s.x - w / 2, s.y - w / 2, w, w);
      }
      ctx.globalAlpha = 1;
    }

    let raf;
    function frame(now) {
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      // Intensity envelope: ramps up over half a second, holds while clicks
      // keep extending igniteUntil, then dies down instead of cutting off.
      const up = Math.min(1, (now - t0) / 500);
      const down = Math.max(0, Math.min(1, (igniteUntil - now) / 600));
      const k = up * down;

      emit(dt, k);
      step(dt);
      draw(dt, k);

      if (flames.length || sparks.length || smoke.length || now < igniteUntil) {
        raf = requestAnimationFrame(frame);
      } else {
        window.removeEventListener("resize", resize);
        canvas.classList.remove("active");
        backdrop.classList.remove("active");
        setTimeout(() => { canvas.remove(); backdrop.remove(); }, 500);
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
