const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ===== Mobil menyu ===== */
const navLinks = $('#navLinks');
$('#menuBtn').onclick = () => navLinks.classList.toggle('open');
$$('a', navLinks).forEach(a => a.onclick = () => navLinks.classList.remove('open'));

/* ===== Kirish: koinot bo'ylab uchish -> yulduzlardan "Xush kelibsiz" -> saytga kirish ===== */
const intro = $('#intro'), ic = $('#introCanvas'), ix = ic.getContext('2d');
let introOver = false;
function closeIntro() {
  if (introOver) return;
  introOver = true;
  intro.classList.add('done');
  setTimeout(() => intro.remove(), 1400);
}
$('#skipBtn').onclick = closeIntro;

function runIntro() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const W = innerWidth, H = innerHeight;
  ic.width = W * dpr; ic.height = H * dpr;
  ix.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cx = W / 2, cy = H / 2, F = Math.max(W, H) * .6, Z = 1400;
  const colors = ['#ffffff', '#67e8f9', '#a78bfa', '#f9a8d4'];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  // 1) Koinot bo'ylab uchish: 3D yulduzlar, tumanliklar va sayyoralar
  const newStar = init => {
    const a = Math.random() * 6.283, r = Math.pow(Math.random(), .6) * 1800 + 10;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r, z: init ? Math.random() * Z : Z, c: colors[(Math.random() * 4) | 0] };
  };
  const stars = Array.from({ length: W < 600 ? 260 : 460 }, () => newStar(true));
  const objs = [
    { t: 'neb', x: -250, y: -120, z: 2700, R: 700, c: '124,58,237' },
    { t: 'neb', x: -700, y: -300, z: 1700, R: 900, c: '109,40,217' },
    { t: 'neb', x: 800, y: 350, z: 2300, R: 800, c: '14,116,144' },
    { t: 'neb', x: -600, y: 500, z: 3000, R: 900, c: '190,24,93' },
    { t: 'pl', x: 650, y: -260, z: 2000, R: 140 },
    { t: 'pl', x: -520, y: 200, z: 3300, R: 90 }
  ];

  // 2) Yulduzlar "Xush kelibsiz" yozuvini hosil qiladi
  const off = document.createElement('canvas');
  off.width = W; off.height = H;
  const ox = off.getContext('2d');
  const fs = Math.min(W / 6.2, 130);
  ox.fillStyle = '#fff';
  ox.textAlign = 'center'; ox.textBaseline = 'middle';
  ox.font = `800 ${fs}px Sora, system-ui, sans-serif`;
  ox.fillText('Xush', W / 2, H / 2 - fs * .62);
  ox.fillText('kelibsiz', W / 2, H / 2 + fs * .62);
  const data = ox.getImageData(0, 0, W, H).data;
  const step = W < 600 ? 5 : 6, targets = [];
  for (let y = 0; y < H; y += step)
    for (let x = 0; x < W; x += step)
      if (data[(y * W + x) * 4 + 3] > 128) targets.push([x, y]);
  const P = targets.map(([tx, ty]) => {
    const a = Math.random() * 6.283, r = Math.max(W, H) * (.6 + Math.random() * .6);
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, tx, ty,
      s: Math.random() * 1.4 + .8, d: Math.random() * .5, c: colors[(Math.random() * 4) | 0], p: Math.random() * 6 };
  });

  // Vaqt jadvali (ms): uchish -> sekinlash -> yozuv -> ushlab turish -> sayt ichiga kirish
  const GS = 3000, GATHER = 2400, EXIT = 6700, END = 7700;
  const speed = t => t < 2600 ? .15 + 2.1 * Math.pow(t / 2600, 3)
    : t < 4400 ? .25 + 2 * Math.pow(1 - (t - 2600) / 1800, 2)
    : t < EXIT ? .25 : .25 + 3 * Math.pow((t - EXIT) / (END - EXIT), 3);

  const t0 = performance.now();
  let last = t0;
  (function frame(now) {
    if (introOver) return;
    const t = now - t0, dt = Math.min(50, now - last), sp = speed(t);
    last = now;
    ix.clearRect(0, 0, W, H);

    // tumanlik va sayyoralar yonidan o'tib ketadi
    objs.forEach(o => {
      o.z -= sp * dt;
      if (o.z < 60) return;
      const s = F / o.z, X = cx + o.x * s, Y = cy + o.y * s, r = o.R * s;
      const a = clamp((2600 - o.z) / 900) * clamp(o.z / 300) * clamp(t / 800);
      if (a <= 0) return;
      if (o.t === 'neb') {
        const g = ix.createRadialGradient(X, Y, 0, X, Y, r);
        g.addColorStop(0, `rgba(${o.c},${.5 * a})`); g.addColorStop(1, `rgba(${o.c},0)`);
        ix.globalCompositeOperation = 'lighter'; ix.globalAlpha = 1;
        ix.fillStyle = g; ix.fillRect(X - r, Y - r, r * 2, r * 2);
      } else {
        ix.globalCompositeOperation = 'source-over'; ix.globalAlpha = a;
        ix.strokeStyle = '#67e8f9'; ix.lineWidth = Math.max(1, r * .07);
        ix.beginPath(); ix.ellipse(X, Y, r * 1.7, r * .38, -.31, 0, 6.283); ix.globalAlpha = a * .45; ix.stroke();
        const g = ix.createRadialGradient(X - r * .3, Y - r * .35, r * .1, X, Y, r);
        g.addColorStop(0, '#c4b5fd'); g.addColorStop(.5, '#7c3aed'); g.addColorStop(1, '#1e1b4b');
        ix.globalAlpha = a; ix.fillStyle = g;
        ix.beginPath(); ix.arc(X, Y, r, 0, 6.283); ix.fill();
        ix.globalAlpha = a * .9;
        ix.beginPath(); ix.ellipse(X, Y, r * 1.7, r * .38, -.31, 0, Math.PI); ix.stroke();
      }
    });

    // yulduzlar oralab uchish (tezlik oshganda chiziqqa aylanadi)
    ix.globalCompositeOperation = 'source-over'; ix.lineCap = 'round';
    stars.forEach(s => {
      s.z -= sp * dt;
      if (s.z < 8) return Object.assign(s, newStar(false));
      const k = F / s.z, x = cx + s.x * k, y = cy + s.y * k;
      if (x < -60 || x > W + 60 || y < -60 || y > H + 60) return Object.assign(s, newStar(false));
      const k0 = F / (s.z + sp * 70), near = 1 - s.z / Z;
      ix.globalAlpha = Math.min(1, .25 + near * 1.2);
      ix.strokeStyle = s.c; ix.lineWidth = .6 + near * 2.2;
      ix.beginPath(); ix.moveTo(cx + s.x * k0, cy + s.y * k0); ix.lineTo(x, y); ix.stroke();
    });

    // "Xush kelibsiz" yozuvi
    if (t > GS) {
      const ek = clamp((t - EXIT) / (END - EXIT)), m = 1 + ek * ek * 5;
      P.forEach(p => {
        const k = clamp(((t - GS) / GATHER - p.d) / (1 - p.d)), e = 1 - Math.pow(1 - k, 3);
        const x = cx + (p.x + (p.tx - p.x) * e - cx) * m, y = cy + (p.y + (p.ty - p.y) * e - cy) * m;
        ix.globalAlpha = (k >= 1 ? .75 + .25 * Math.sin(t / 220 + p.p) : clamp(k * 3)) * (1 - ek);
        ix.fillStyle = p.c; ix.shadowColor = p.c; ix.shadowBlur = 6;
        ix.beginPath(); ix.arc(x, y, p.s * (k >= 1 ? 1 : .8 + .4 * k), 0, 7); ix.fill();
      });
      ix.shadowBlur = 0;
    }
    ix.globalAlpha = 1;
    if (t > END) return closeIntro();
    requestAnimationFrame(frame);
  })(t0);
}
if (reduce) closeIntro();
else (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))]) : Promise.resolve()).then(runIntro);

/* ===== Fon: miltillovchi yulduzlar, uchar yulduzlar ===== */
const sc = $('#space'), sx = sc.getContext('2d');
let SW, SH, stars = [], shooters = [], mx = 0, my = 0;
function sizeSpace() {
  SW = sc.width = innerWidth; SH = sc.height = innerHeight;
  const n = Math.min(260, Math.floor(SW * SH / 6500));
  stars = Array.from({ length: n }, () => ({
    x: Math.random() * SW, y: Math.random() * SH, z: Math.random() * .9 + .1,
    r: Math.random() * 1.4 + .3, p: Math.random() * 6, sp: Math.random() * .002 + .0008,
    c: ['#fff', '#cffafe', '#ddd6fe', '#fbcfe8'][(Math.random() * 4) | 0]
  }));
}
addEventListener('resize', sizeSpace); sizeSpace();
addEventListener('pointermove', e => { mx = (e.clientX / innerWidth - .5); my = (e.clientY / innerHeight - .5); }, { passive: true });
function space(t) {
  sx.clearRect(0, 0, SW, SH);
  stars.forEach(s => {
    s.y -= s.z * .08; if (s.y < -2) { s.y = SH + 2; s.x = Math.random() * SW; }
    const px = s.x - mx * 30 * s.z, py = s.y - my * 30 * s.z;
    sx.globalAlpha = .35 + .65 * Math.abs(Math.sin(t * s.sp + s.p));
    sx.fillStyle = s.c; sx.beginPath(); sx.arc(px, py, s.r * s.z + .2, 0, 7); sx.fill();
  });
  if (Math.random() < .006 && shooters.length < 2)
    shooters.push({ x: Math.random() * SW, y: Math.random() * SH * .5, vx: 7 + Math.random() * 4, vy: 3 + Math.random() * 2, l: 1 });
  shooters = shooters.filter(s => s.l > 0);
  shooters.forEach(s => {
    const g = sx.createLinearGradient(s.x, s.y, s.x - s.vx * 9, s.y - s.vy * 9);
    g.addColorStop(0, `rgba(255,255,255,${s.l})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    sx.globalAlpha = 1; sx.strokeStyle = g; sx.lineWidth = 1.6;
    sx.beginPath(); sx.moveTo(s.x, s.y); sx.lineTo(s.x - s.vx * 9, s.y - s.vy * 9); sx.stroke();
    s.x += s.vx; s.y += s.vy; s.l -= .012;
  });
  sx.globalAlpha = 1;
  if (!reduce) requestAnimationFrame(space);
}
requestAnimationFrame(space);

/* ===== Yozuv effekti ===== */
const words = ['Frontend dasturchiman', "o'yin yaratuvchiman", "koinotni sevaman", "o'rganishni yaxshi ko'raman"];
const typed = $('#typed');
let w = 0, c = 0, del = false;
(function type() {
  const word = words[w];
  typed.textContent = word.slice(0, c);
  if (!del && c === word.length) { del = true; return setTimeout(type, 1500); }
  if (del && c === 0) { del = false; w = (w + 1) % words.length; }
  c += del ? -1 : 1;
  setTimeout(type, del ? 40 : 80);
})();

/* ===== Paydo bo'lish, ko'nikma chiziqlari, raqam sanash ===== */
function countUp(el) {
  const to = +el.dataset.count; let n = 0;
  clearInterval(el._t);
  el._t = setInterval(() => { el.textContent = ++n; if (n >= to) clearInterval(el._t); }, Math.max(60, 900 / to));
}
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    const lvl = e.target.dataset.level;
    if (lvl) $('.bar i', e.target).style.width = lvl + '%';
    $$('[data-count]', e.target).forEach(countUp);
    io.unobserve(e.target);
  });
}, { threshold: .15 });
$$('.reveal').forEach(el => io.observe(el));

/* ===== Aloqa formasi ===== */
$('#form').onsubmit = e => {
  e.preventDefault();
  const body = `Ism: ${$('#fName').value}\nEmail: ${$('#fMail').value}\n\n${$('#fMsg').value}`;
  location.href = `mailto:cripmayngame@gmail.com?subject=${encodeURIComponent('Portfolio orqali xabar')}&body=${encodeURIComponent(body)}`;
};

/* ===== Skroll ===== */
const progress = $('#progress'), toTop = $('#toTop');
const sections = $$('main section'), links = $$('a', navLinks);
addEventListener('scroll', () => {
  const h = document.documentElement;
  progress.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%';
  toTop.classList.toggle('show', h.scrollTop > 500);
  const cur = sections.filter(s => s.offsetTop - 120 <= h.scrollTop).pop();
  links.forEach(a => a.classList.toggle('active', cur && a.getAttribute('href') === '#' + cur.id));
}, { passive: true });
toTop.onclick = () => scrollTo({ top: 0, behavior: 'smooth' });


/* ===== SICHQONCHA EFFEKTLARI ===== */
(() => {
  if (reduce) return;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const fx = $('#fx'), g = fx.getContext('2d');
  let W, H, parts = [], running = false;
  const size = () => { W = fx.width = innerWidth; H = fx.height = innerHeight; };
  size(); addEventListener('resize', size);
  const cols = ['#ffffff', '#67e8f9', '#a78bfa', '#f9a8d4', '#fde68a'];
  const glyphs = ['✦', '✧', '·', '✶'];

  function add(p) { parts.push(p); if (!running) { running = true; requestAnimationFrame(loop); } }
  function trail(x, y) {
    add({ x, y, vx: (Math.random() - .5) * 1.2, vy: Math.random() * 1.2 + .2, l: 1, d: .022 + Math.random() * .02,
      c: cols[(Math.random() * cols.length) | 0], s: 8 + Math.random() * 10, ch: glyphs[(Math.random() * glyphs.length) | 0], rot: Math.random() * 3, vr: (Math.random() - .5) * .15, g: 0 });
  }
  function burst(x, y) {
    for (let i = 0; i < 34; i++) {
      const a = Math.random() * 6.283, v = 2 + Math.random() * 6;
      add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 1, d: .018 + Math.random() * .02,
        c: cols[(Math.random() * cols.length) | 0], s: 2 + Math.random() * 3, ch: null, rot: 0, vr: 0, g: .08 });
    }
    for (let i = 0; i < 6; i++) trail(x, y);
    add({ x, y, ring: 1, l: 1, d: .04, c: '#67e8f9' });
  }
  function loop() {
    g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    parts = parts.filter(p => p.l > 0);
    for (const p of parts) {
      p.l -= p.d;
      if (p.ring) {
        g.globalAlpha = Math.max(p.l, 0) * .7; g.strokeStyle = p.c; g.lineWidth = 2;
        g.beginPath(); g.arc(p.x, p.y, (1 - p.l) * 70, 0, 6.283); g.stroke(); continue;
      }
      p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= .985; p.rot += p.vr;
      g.globalAlpha = Math.max(p.l, 0); g.fillStyle = p.c;
      if (p.ch) {
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.font = `${p.s * (.5 + p.l * .5)}px sans-serif`;
        g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = p.c; g.shadowBlur = 10; g.fillText(p.ch, 0, 0); g.restore();
      } else { g.beginPath(); g.arc(p.x, p.y, p.s * p.l, 0, 6.283); g.fill(); }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    if (parts.length) requestAnimationFrame(loop); else { running = false; g.clearRect(0, 0, W, H); }
  }

  const dot = $('#curDot'), ring = $('#curRing'), spot = $('#spot');
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, lx = mx, ly = my, tilt = null;
  if (fine) {
    document.body.classList.add('fx-ready');
    (function follow() {
      rx += (mx - rx) * .16; ry += (my - ry) * .16;
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      requestAnimationFrame(follow);
    })();
  }
  const hoverSel = 'a,button,.card,.chip,input,textarea';

  addEventListener('pointermove', e => {
    mx = e.clientX; my = e.clientY;
    if (fine) {
      document.body.classList.add('fx-on');
      dot.style.transform = `translate(${mx}px,${my}px)`;
      spot.style.opacity = 1; spot.style.transform = `translate(${mx}px,${my}px)`;
      ring.classList.toggle('hov', !!e.target.closest(hoverSel));
      if (Math.hypot(mx - lx, my - ly) > 22) { lx = mx; ly = my; trail(mx, my); }
    }
    // 3D egilish va yaltirash: loyiha kartalari
    const card = e.target.closest('.card');
    if (tilt && tilt !== card) { tilt.style.transform = ''; tilt = null; }
    if (card && fine) {
      const b = card.getBoundingClientRect(), px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height;
      card.style.transform = `perspective(700px) rotateY(${(px - .5) * 14}deg) rotateX(${-(py - .5) * 14}deg) translateZ(8px)`;
      card.style.setProperty('--gx', px * 100 + '%'); card.style.setProperty('--gy', py * 100 + '%');
      tilt = card;
    }
    // Magnit tugmalar
    $$('.btn,.to-top').forEach(b => {
      const r = b.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, d = Math.hypot(e.clientX - cx, e.clientY - cy);
      b.style.translate = fine && d < 90 ? `${(e.clientX - cx) * .25}px ${(e.clientY - cy) * .25}px` : '';
    });
    // Avatar parallaksi
    const av = $('.avatar-wrap');
    if (av && fine) av.style.rotate = `${(mx / innerWidth - .5) * 10}deg`;
  }, { passive: true });

  document.addEventListener('pointerleave', () => { document.body.classList.remove('fx-on'); spot.style.opacity = 0; if (tilt) { tilt.style.transform = ''; tilt = null; } });
  addEventListener('pointerdown', e => { ring.classList.add('down'); burst(e.clientX, e.clientY); });
  addEventListener('pointerup', () => ring.classList.remove('down'));
})();
