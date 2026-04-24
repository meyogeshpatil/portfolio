/* ============================================================
   GSAP SETUP
   ============================================================ */
gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   CUSTOM CURSOR
   ============================================================ */
const cursor     = document.getElementById('cursor');
const cursorRing = document.getElementById('cursorRing');
let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  cursor.style.left = mouseX + 'px';
  cursor.style.top  = mouseY + 'px';
});
(function animateRing() {
  ringX += (mouseX - ringX) * 0.11;
  ringY += (mouseY - ringY) * 0.11;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top  = ringY + 'px';
  requestAnimationFrame(animateRing);
})();

document.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('link-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('link-hover'));
});

/* ============================================================
   SCROLL PROGRESS BAR
   ============================================================ */
const progressBar = document.getElementById('scrollProgress');
window.addEventListener('scroll', () => {
  const d = document.documentElement;
  progressBar.style.width = ((window.scrollY / (d.scrollHeight - d.clientHeight)) * 100) + '%';
}, { passive: true });

/* ============================================================
   ORGANIC FLOW FIELD — replaces particles/aurora
   Particles follow a multi-octave noise vector field,
   leaving lime trails that slowly fade → looks like data streams
   ============================================================ */
(function initFlowField() {
  const canvas = document.getElementById('flowCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const COUNT = 130;
  const SPEED = 0.55;
  const SCALE = 0.0042;

  let W, H, particles = [], t = 0;

  function getBg()     { return document.documentElement.getAttribute('data-theme') === 'light' ? '#F4F4EF' : '#060608'; }
  function getBgFade() { return document.documentElement.getAttribute('data-theme') === 'light' ? 'rgba(244,244,239,0.06)' : 'rgba(6,6,8,0.016)'; }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    ctx.fillStyle = getBg();
    ctx.fillRect(0, 0, W, H);
  }
  resize();
  window.addEventListener('resize', () => { resize(); spawn(); });

  // Multi-octave sinusoidal noise — no library needed
  function noise(x, y) {
    return (
      Math.sin(x * 1.1 + t * 0.55) * Math.cos(y * 0.9 + t * 0.38) * 0.50 +
      Math.sin(x * 0.45 - y * 0.65 + t * 0.42) * 0.32 +
      Math.cos(x * 2.1  + y * 1.45 + t * 0.22) * 0.18
    );
  }
  function flowAngle(x, y) { return noise(x * SCALE, y * SCALE) * Math.PI * 3; }

  function mkParticle() {
    const maxLife = 140 + Math.random() * 220;
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      spd: SPEED * (0.55 + Math.random() * 0.9),
      life: Math.floor(Math.random() * maxLife),
      maxLife,
    };
  }
  function spawn() { particles = Array.from({ length: COUNT }, mkParticle); }
  spawn();

  function draw() {
    // Very slow trail fade — persistent organic streaks
    ctx.fillStyle = getBgFade();
    ctx.fillRect(0, 0, W, H);

    particles.forEach(p => {
      p.life++;
      if (p.life >= p.maxLife) {
        p.x = Math.random() * W;
        p.y = Math.random() * H;
        p.life = 0;
        p.maxLife = 140 + Math.random() * 220;
      }

      // Smooth alpha envelope: ramp in → hold → ramp out
      const lt = p.life / p.maxLife;
      const alpha = lt < 0.12 ? lt / 0.12 : lt > 0.88 ? (1 - lt) / 0.12 : 1;

      const a  = flowAngle(p.x, p.y);
      const nx = p.x + Math.cos(a) * p.spd;
      const ny = p.y + Math.sin(a) * p.spd;

      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = `rgba(200,255,65,${(alpha * 0.095).toFixed(3)})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Edge wrap
      p.x = nx < 0 ? W : nx > W ? 0 : nx;
      p.y = ny < 0 ? H : ny > H ? 0 : ny;
    });

    t += 0.003;
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ============================================================
   CHARACTER SPLIT — hover-bounce on individual hero name letters
   ============================================================ */
(function splitHeroName() {
  const hn1 = document.querySelector('.hn-1');
  if (!hn1) return;
  hn1.innerHTML = [...hn1.textContent].map(
    ch => `<span class="char">${ch}</span>`
  ).join('');
  // Activate hover only after the entrance animation finishes
  setTimeout(() => {
    hn1.querySelectorAll('.char').forEach(ch => {
      ch.addEventListener('mouseenter', () => {
        gsap.killTweensOf(ch);
        const returnColor = getComputedStyle(document.documentElement).getPropertyValue('--white').trim() || '#F4F4EF';
        gsap.to(ch, { y: -14, color: '#C8FF41', rotation: (Math.random() - 0.5) * 20, duration: 0.2, ease: 'power2.out' });
        gsap.to(ch, { y: 0, color: returnColor, rotation: 0, duration: 0.65, ease: 'elastic.out(1, 0.4)', delay: 0.18 });
      });
    });
  }, 2100);
})();

/* ============================================================
   GSAP HERO ENTRANCE — staggered cinematic reveal on load
   ============================================================ */
const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
heroTl
  .from('.hero-badge',       { opacity: 0, y: 18, duration: 0.65 },                       0.25)
  .from('.hn-1',             { opacity: 0, y: 90, skewY: -4, duration: 1.0 },             0.42)
  .from('.hn-2',             { opacity: 0, y: 70, skewY:  3, duration: 0.95 },            0.68)
  .from('.hero-meta',        { opacity: 0, y: 22, duration: 0.7 },                        0.88)
  .from('.hero-actions > *', { opacity: 0, y: 18, duration: 0.6, stagger: 0.14 },         1.0)
  .from('.hero-scroll-hint', { opacity: 0, y: 8,  duration: 0.7 },                        1.5);

/* ============================================================
   GSAP SCROLL REVEAL — smoother than IntersectionObserver
   ============================================================ */
document.querySelectorAll('[data-reveal]').forEach((el, i) => {
  const dir = el.dataset.reveal;
  const from = dir === 'left'  ? { x: -45, opacity: 0 }
             : dir === 'right' ? { x:  45, opacity: 0 }
             :                   { y:  45, opacity: 0 };

  gsap.fromTo(el, from, {
    x: 0, y: 0, opacity: 1,
    duration: 0.85,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: el,
      start: 'top 88%',
    },
  });
});

/* ============================================================
   GSAP SKILL ROW STAGGER — rows cascade in as you scroll
   ============================================================ */
gsap.fromTo('.sr', { opacity: 0, x: -30 }, {
  opacity: 1, x: 0,
  duration: 0.7,
  ease: 'power3.out',
  stagger: 0.08,
  scrollTrigger: { trigger: '.skills-list', start: 'top 82%' },
});

/* ============================================================
   GSAP COUNTER ANIMATION
   ============================================================ */
document.querySelectorAll('.counter').forEach(el => {
  const target = parseInt(el.dataset.to, 10);
  gsap.fromTo(el, { innerText: 0 }, {
    innerText: target,
    duration: 1.8,
    ease: 'power2.out',
    snap: { innerText: 1 },
    scrollTrigger: { trigger: el.closest('.stats-band'), start: 'top 80%', once: true },
  });
});

/* ============================================================
   MAGNETIC BUTTONS — elements pull toward the cursor when nearby
   ============================================================ */
document.querySelectorAll('.magnetic').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left - r.width  / 2;
    const y = e.clientY - r.top  - r.height / 2;
    gsap.to(btn, { x: x * 0.32, y: y * 0.32, duration: 0.35, ease: 'power2.out' });
  });
  btn.addEventListener('mouseleave', () => {
    gsap.to(btn, { x: 0, y: 0, duration: 0.65, ease: 'elastic.out(1, 0.55)' });
  });
});

/* ============================================================
   3D CARD TILT — cards rotate toward the cursor on hover
   ============================================================ */
document.querySelectorAll('.tilt-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    if (window.innerWidth < 900) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    gsap.to(card, {
      rotateX: -y * 7,
      rotateY:  x * 7,
      transformPerspective: 900,
      duration: 0.35,
      ease: 'power2.out',
    });
  });
  card.addEventListener('mouseleave', () => {
    gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.65, ease: 'power2.out' });
  });
});

/* ============================================================
   SECTION PROGRESS DOTS — update active dot as you scroll
   ============================================================ */
const dotLinks  = document.querySelectorAll('.sdot');
const sectionIds = ['hero', 'about', 'skills', 'experience', 'achievements', 'contact'];

sectionIds.forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  ScrollTrigger.create({
    trigger: el,
    start: 'top center',
    end:   'bottom center',
    onToggle: self => {
      if (!self.isActive) return;
      dotLinks.forEach(d => d.classList.remove('active'));
      const dot = document.querySelector(`.sdot[href="#${id}"]`);
      if (dot) dot.classList.add('active');
    },
  });
});

/* ============================================================
   TYPING ANIMATION
   ============================================================ */
const words  = ['API Engineer','API Designer','Python Expert','FastAPI Developer','Systems Engineer','Async Specialist'];
let wIdx = 0, cIdx = 0, deleting = false;
const typeEl = document.getElementById('typeTarget');

function type() {
  const word = words[wIdx];
  typeEl.textContent = deleting ? word.slice(0, --cIdx) : word.slice(0, ++cIdx);
  if (!deleting && cIdx === word.length)  setTimeout(() => { deleting = true; }, 1900);
  else if (deleting && cIdx === 0) { deleting = false; wIdx = (wIdx + 1) % words.length; }
  setTimeout(type, deleting ? 50 : 85);
}
setTimeout(type, 1800); // delay until after GSAP entrance

/* ============================================================
   NAVBAR SCROLL
   ============================================================ */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

/* ============================================================
   HAMBURGER MENU
   ============================================================ */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

/* ============================================================
   ACTIVE NAV LINK — synced with section dots
   ============================================================ */
const navLinkEls = document.querySelectorAll('.nav-link');
document.querySelectorAll('section[id]').forEach(sec => {
  ScrollTrigger.create({
    trigger: sec,
    start: 'top center',
    end:   'bottom center',
    onToggle: self => {
      if (!self.isActive) return;
      navLinkEls.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + sec.id));
    },
  });
});

/* ============================================================
   SVG SQUIGGLE DRAW-IN — hand-drawn path under "Patil"
   ============================================================ */
gsap.to('.squiggle-path', {
  strokeDashoffset: 0,
  duration: 1.1,
  ease: 'power2.inOut',
  delay: 1.85,
});

/* ============================================================
   HERO DECO SHAPES — fade in after entrance, then float
   ============================================================ */
gsap.to('.deco', {
  opacity: 0.16,
  duration: 0.7,
  stagger: 0.11,
  ease: 'power2.out',
  delay: 1.95,
});
[
  ['.deco-plus',    { y: -15, rotation: 18  }, 7  ],
  ['.deco-circle',  { y: -10, rotation: -10 }, 8.5],
  ['.deco-diamond', { y: -18, rotation: 22  }, 6  ],
  ['.deco-dots',    { y: -8,  rotation: -15 }, 9  ],
  ['.deco-wave',    { y: -12, x: 6          }, 7.5],
  ['.deco-star',    { y: -20, rotation: 45  }, 10 ],
].forEach(([sel, props, dur], i) => {
  gsap.to(sel, { ...props, yoyo: true, repeat: -1, ease: 'sine.inOut', duration: dur, delay: 2 + i * 0.35 });
});

/* ============================================================
   CURSOR TRAIL — lime particle history tail
   ============================================================ */
(function initTrail() {
  const N = 14;
  const dots = Array.from({ length: N }, () => {
    const d = document.createElement('div');
    d.className = 'trail-dot';
    document.body.appendChild(d);
    return d;
  });
  const hist = [];
  let tx = 0, ty = 0;
  document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
  (function step() {
    hist.unshift({ x: tx, y: ty });
    if (hist.length > N) hist.length = N;
    dots.forEach((dot, i) => {
      if (!hist[i]) return;
      const t = i / N;
      dot.style.left      = hist[i].x + 'px';
      dot.style.top       = hist[i].y + 'px';
      dot.style.transform = `translate(-50%,-50%) scale(${1 - t * 0.75})`;
      dot.style.opacity   = String((1 - t) * 0.36);
    });
    requestAnimationFrame(step);
  })();
})();

/* ============================================================
   CONFETTI BURST — lime + white particles on CTA click
   ============================================================ */
document.querySelectorAll('.btn-lime, .btn-outline').forEach(btn => {
  btn.addEventListener('click', () => {
    const r  = btn.getBoundingClientRect();
    const cx = r.left + r.width  / 2;
    const cy = r.top  + r.height / 2;
    for (let i = 0; i < 16; i++) {
      const dot = document.createElement('div');
      dot.className = 'confetti-dot';
      if (Math.random() > 0.55) dot.style.borderRadius = '1px';
      dot.style.background = Math.random() > 0.45 ? '#C8FF41' : '#F4F4EF';
      dot.style.left = cx + 'px';
      dot.style.top  = cy + 'px';
      document.body.appendChild(dot);
      const angle = (i / 16) * Math.PI * 2 + (Math.random() - 0.5);
      const dist  = 50 + Math.random() * 80;
      gsap.to(dot, {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - 25,
        opacity: 0,
        scale: 0.15,
        rotation: Math.random() * 520,
        duration: 0.58 + Math.random() * 0.38,
        ease: 'power2.out',
        onComplete: () => dot.remove(),
      });
    }
  });
});


/* ============================================================
   AVATAR — periodic eye blink
   ============================================================ */
(function initAvatarBlink() {
  function blink() {
    gsap.to(['.av-blink-l', '.av-blink-r'], {
      opacity: 1, duration: 0.055, ease: 'power2.in',
      onComplete() {
        gsap.to(['.av-blink-l', '.av-blink-r'], { opacity: 0, duration: 0.09, ease: 'power2.out' });
      },
    });
    setTimeout(blink, 2800 + Math.random() * 3400);
  }
  setTimeout(blink, 2200);
})();

/* ============================================================
   AVATAR — pupils track mouse cursor
   ============================================================ */
(function initEyeTracking() {
  const BASES = { l: { cx: 104, cy: 150 }, r: { cx: 138, cy: 150 } };
  const MAX_DIST = 2.6;

  document.addEventListener('mousemove', e => {
    const svgEl = document.querySelector('.avatar-svg');
    if (!svgEl) return;
    const sr = svgEl.getBoundingClientRect();
    if (sr.bottom < 0 || sr.top > window.innerHeight) return;

    const scaleX = sr.width  / 240;
    const scaleY = sr.height / 285;

    ['l', 'r'].forEach(side => {
      const el   = document.querySelector(`.av-pupil-${side}`);
      if (!el) return;
      const base = BASES[side];
      const eyeX = sr.left + base.cx * scaleX;
      const eyeY = sr.top  + base.cy * scaleY;
      const angle = Math.atan2(e.clientY - eyeY, e.clientX - eyeX);
      gsap.to(el, {
        attr: {
          cx: base.cx + Math.cos(angle) * MAX_DIST,
          cy: base.cy + Math.sin(angle) * MAX_DIST,
        },
        duration: 0.35, ease: 'power2.out',
      });
    });
  });
})();
