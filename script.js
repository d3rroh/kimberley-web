/* =====================================================
   KIMBERLEY MUBIRU PORTFOLIO – SCRIPT.JS
   Canvas animations, scroll effects, interactivity
   ===================================================== */

'use strict';

// ---- Utility ----
const qs = (s, ctx = document) => ctx.querySelector(s);
const qsa = (s, ctx = document) => ctx.querySelectorAll(s);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===================== SCROLL PROGRESS BAR =====================
const progressBar = qs('#progress-bar');
function updateProgress() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = `${docHeight > 0 ? (scrollTop / docHeight) * 100 : 0}%`;
}

// ===================== NAVBAR =====================
const navbar = qs('#navbar');
const navLinks = qsa('.nav-link');
const hamburger = qs('#hamburger');
const mobileMenu = qs('#mobile-menu');

// Active nav link on scroll
const navSections = ['about', 'philosophy', 'experience', 'skills', 'education', 'contact']
  .map(id => qs(`#${id}`))
  .filter(Boolean);
function updateActiveNav() {
  let current = '';
  navSections.forEach(el => {
    if (el.getBoundingClientRect().top <= 100) current = el.id;
  });
  navLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.section === current);
  });
}

// ===================== SCROLL-BASED PARALLAX (subtle) =====================
const heroContent = qs('.hero-content');
function updateParallax(y) {
  if (!heroContent || prefersReducedMotion || y > 800) return;
  heroContent.style.transform = `translateY(${y * 0.15}px)`;
  heroContent.style.opacity = Math.max(0, 1 - y / 600);
}

// Single scroll listener, batched to one update per animation frame
let scrollTicking = false;
function onScrollFrame() {
  const y = window.scrollY;
  updateProgress();
  navbar.classList.toggle('scrolled', y > 30);
  updateActiveNav();
  updateParallax(y);
  scrollTicking = false;
}
window.addEventListener('scroll', () => {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(onScrollFrame);
}, { passive: true });

// Mobile menu toggle
hamburger.addEventListener('click', () => {
  const isOpen = hamburger.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', isOpen);
  mobileMenu.classList.toggle('open', isOpen);
  mobileMenu.setAttribute('aria-hidden', !isOpen);
});

qsa('.mobile-nav-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', false);
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', true);
  });
});

// ===================== SMOOTH SCROLL =====================
qsa('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = qs(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  });
});

// ===================== TYPING ANIMATION =====================
const phrases = [
  'Growth, Governance, and Grit.',
  'Innovation & Reliability.',
  'Digital Transformation.',
  'Enterprise Excellence.',
];
let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;

const typingEl = qs('#typing-text');

function typeLoop() {
  if (!typingEl) return;
  if (prefersReducedMotion) {
    typingEl.textContent = phrases[0];
    return;
  }
  const phrase = phrases[phraseIndex];
  if (!isDeleting) {
    typingEl.textContent = phrase.slice(0, charIndex + 1);
    charIndex++;
    if (charIndex === phrase.length) {
      isDeleting = true;
      setTimeout(typeLoop, 2200);
      return;
    }
  } else {
    typingEl.textContent = phrase.slice(0, charIndex - 1);
    charIndex--;
    if (charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
    }
  }
  setTimeout(typeLoop, isDeleting ? 50 : 85);
}
typeLoop();

// ===================== NETWORK CANVAS (Site-wide) =====================
// Reusable network-nodes animation. Applied to the hero and every section
// so the effect persists throughout the whole site.

// One shared pointer position for every canvas
const netMouse = { x: -9999, y: -9999 };
window.addEventListener('mousemove', e => {
  netMouse.x = e.clientX;
  netMouse.y = e.clientY;
}, { passive: true });

// Pre-rendered glow sprites (one per hue) instead of a new gradient per node per frame
const glowSprites = {};
function getGlowSprite(hue) {
  if (glowSprites[hue]) return glowSprites[hue];
  const size = 32;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `hsla(${hue}, 90%, 70%, 0.15)`);
  grad.addColorStop(1, 'transparent');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return (glowSprites[hue] = c);
}

function debounce(fn, ms) {
  let t;
  return () => { clearTimeout(t); t = setTimeout(fn, ms); };
}

function initNetworkCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  let W, H, nodes = [];
  let visible = false;
  let rafId = null;

  const NODE_COUNT = window.innerWidth < 768 ? 30 : 60;
  const MAX_DIST = 130;
  const MAX_DIST_SQ = MAX_DIST * MAX_DIST;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function createNodes() {
    nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1,
        hue: Math.random() > 0.5 ? 195 : 220, // cyan or blue
        alpha: Math.random() * 0.5 + 0.3,
      });
    }
  }

  resize();
  createNodes();
  // Recreate nodes on resize so they stay within the new bounds
  window.addEventListener('resize', debounce(() => {
    resize();
    createNodes();
    if (!rafId) draw();
  }, 150), { passive: true });

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Mouse repulsion (mouse is viewport-based, canvas is section-based offset)
    const canvasRect = canvas.getBoundingClientRect();
    const mx = netMouse.x - canvasRect.left;
    const my = netMouse.y - canvasRect.top;

    // Update positions
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;

      const dx = n.x - mx;
      const dy = n.y - my;
      const distSq = dx * dx + dy * dy;
      if (distSq < 6400 && distSq > 0) {
        const dist = Math.sqrt(distSq);
        const f = (80 - dist) / 80 * 0.4;
        n.vx += (dx / dist) * f;
        n.vy += (dy / dist) * f;
        const speed = Math.hypot(n.vx, n.vy);
        if (speed > 2) { n.vx /= speed; n.vy /= speed; }
      }
    }

    // Draw connections
    ctx.lineWidth = 0.6;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < MAX_DIST_SQ) {
          const alpha = (1 - Math.sqrt(distSq) / MAX_DIST) * 0.25;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    for (const n of nodes) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${n.hue}, 90%, 70%, ${n.alpha})`;
      ctx.fill();

      // Glow
      const g = n.r * 3;
      ctx.drawImage(getGlowSprite(n.hue), n.x - g, n.y - g, g * 2, g * 2);
    }

    // Diagonal light beam
    const t = Date.now() * 0.0003;
    const bx = (Math.sin(t) * 0.5 + 0.5) * W;
    const beamGrad = ctx.createLinearGradient(bx - 80, 0, bx + 80, H);
    beamGrad.addColorStop(0, 'transparent');
    beamGrad.addColorStop(0.5, 'rgba(34,211,238,0.04)');
    beamGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(0, 0, W, H);
  }

  // Reduced motion: render a single still frame
  if (prefersReducedMotion) {
    draw();
    return;
  }

  // Only animate while the canvas is near the viewport. The rafId guard
  // ensures there is never more than one loop running per canvas.
  function loop() {
    if (!visible) { rafId = null; return; }
    draw();
    rafId = requestAnimationFrame(loop);
  }

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible && !rafId) rafId = requestAnimationFrame(loop);
  }, { rootMargin: '100px' }).observe(canvas);
}

// ===================== HERO CANVAS (Network Nodes) =====================
(function initHeroCanvas() {
  const canvas = qs('#hero-canvas');
  if (!canvas) return;
  initNetworkCanvas(canvas);
})();

// ===================== SECTIONS CANVAS =====================
// Inject the network animation into every section so it runs site-wide.
(function initSectionCanvases() {
  const sections = qsa('.section');
  sections.forEach(sec => {
    // Hero already has its own canvas
    if (sec.querySelector('#hero-canvas')) return;
    if (sec.querySelector('.section-net')) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'section-net';
    canvas.setAttribute('aria-hidden', 'true');
    sec.insertBefore(canvas, sec.firstChild);
    initNetworkCanvas(canvas);
  });
})();

// ===================== FLOATING PARTICLES (Site-wide) =====================
function createParticlesIn(container, count) {
  const colors = ['#22d3ee', '#3b82f6', '#a855f7', '#34d399'];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = `${Math.random() * 100}%`;
    p.style.width = p.style.height = `${Math.random() * 3 + 1}px`;
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDuration = `${Math.random() * 10 + 8}s`;
    p.style.animationDelay = `${Math.random() * 8}s`;
    container.appendChild(p);
  }
}

(function createParticles() {
  if (prefersReducedMotion) return;
  const heroContainer = qs('#hero-particles');
  if (heroContainer) {
    createParticlesIn(heroContainer, 25);
    return;
  }
  // Fallback: if hero particles container is missing, still add to sections
  qsa('.section').forEach(sec => createParticlesIn(sec, 12));
})();

// Spread floating particles across every section alongside the network canvas
(function createSectionParticles() {
  if (prefersReducedMotion || !qs('#hero-particles')) return;
  qsa('.section').forEach(sec => {
    if (sec.querySelector('.section-particles')) return;
    const layer = document.createElement('div');
    layer.className = 'section-particles';
    layer.setAttribute('aria-hidden', 'true');
    sec.insertBefore(layer, sec.firstChild);
    createParticlesIn(layer, 12);
  });
})();

// ===================== FOOTER CANVAS (Grid) =====================
(function initFooterCanvas() {
  const canvas = qs('#footer-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    drawGrid();
  }

  function drawGrid() {
    ctx.clearRect(0, 0, W, H);
    const step = 40;
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.07)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    // Dot intersections
    ctx.fillStyle = 'rgba(34, 211, 238, 0.15)';
    for (let x = 0; x <= W; x += step) {
      for (let y = 0; y <= H; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  resize();
  window.addEventListener('resize', debounce(resize, 150), { passive: true });
})();

// ===================== SCROLL REVEAL =====================
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, entry.target.dataset.delay || 0);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

// Stagger sibling reveals
function setupRevealDelays() {
  const groups = [
    '.philosophy-cards .philosophy-card',
    '.edu-grid .edu-card',
    '.certs-grid .cert-card',
    '.impact-grid .impact-card',
    '.languages-grid .language-card',
    '.rings-row .ring-item',
    '.timeline-item',
    '.skills-grid .skills-category',
    '.about-highlights .highlight-item',
  ];
  groups.forEach(selector => {
    qsa(selector).forEach((el, i) => {
      el.dataset.delay = i * 100;
    });
  });
}
setupRevealDelays();

qsa('.reveal').forEach(el => revealObserver.observe(el));

// ===================== SKILL BARS ANIMATION =====================
const skillBarObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const fills = qsa('.skill-fill', entry.target);
      fills.forEach(fill => {
        const w = fill.dataset.width;
        fill.style.setProperty('--target-width', `${w}%`);
        setTimeout(() => {
          fill.style.width = `${w}%`;
          fill.style.boxShadow = `0 0 10px var(--accent)`;
        }, 100);
      });
      // Also trigger lang bars if present
      const langFills = qsa('.lang-fill', entry.target);
      langFills.forEach(fill => {
        setTimeout(() => { fill.style.width = `${fill.dataset.width}%`; }, 100);
      });
      skillBarObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

qsa('.skills-category, .language-card').forEach(el => skillBarObserver.observe(el));

// ===================== RING ANIMATIONS =====================
const ringObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const fills = qsa('.ring-fill', entry.target);
      fills.forEach(fill => {
        const pct = parseInt(fill.dataset.pct);
        const circumference = 264; // 2πr where r=42
        const offset = circumference - (pct / 100) * circumference;
        setTimeout(() => { fill.style.strokeDashoffset = offset; }, 200);
      });
      ringObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.4 });

qsa('.rings-row').forEach(el => ringObserver.observe(el));

// Impact rings
const impactRingObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const fills = qsa('.impact-ring-fill', entry.target);
      fills.forEach(fill => {
        const offset = parseInt(fill.dataset.offset);
        const targetOffset = offset * 3.14; // approximate stroke-dashoffset
        setTimeout(() => { fill.style.strokeDashoffset = targetOffset; }, 300);
      });
      impactRingObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

qsa('.impact-section').forEach(el => impactRingObserver.observe(el));

// ===================== STAT COUNTER ANIMATION =====================
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      qsa('.stat-number', entry.target).forEach(el => {
        const target = parseInt(el.dataset.target);
        let current = 0;
        const step = target / 30;
        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            el.textContent = target;
            clearInterval(timer);
          } else {
            el.textContent = Math.floor(current);
          }
        }, 40);
      });
      statObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const heroStats = qs('.hero-stats');
if (heroStats) statObserver.observe(heroStats);

// ===================== CONTACT FORM =====================
// There is no backend, so the form composes an email in the visitor's mail
// client instead of pretending to send. All values are URL-encoded.
const CONTACT_EMAIL = 'kimberleymubiru21@gmail.com';
const contactForm = qs('#contact-form');
const formSuccess = qs('#form-success');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!contactForm.reportValidity()) return;

    const field = name => contactForm.elements[name].value.trim().slice(0, 2000);
    const subject = field('subject');
    const body = `${field('message')}\n\n— ${field('name')} <${field('email')}>`;
    window.location.href =
      `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    formSuccess.classList.add('show');
    setTimeout(() => formSuccess.classList.remove('show'), 6000);
  });
}

// ===================== BUTTON RIPPLE EFFECT =====================
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn');
  if (!btn || prefersReducedMotion) return;
  const ripple = document.createElement('span');
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.5;
  ripple.className = 'ripple';
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 700);
});

// ===================== SECTION ENTRY ANIMATIONS =====================
// Stagger timeline items
qsa('.timeline-item').forEach((item, i) => {
  item.style.transitionDelay = `${i * 80}ms`;
});

// ===================== HOVER GLOW on CARDS =====================
qsa('.timeline-card, .edu-card, .cert-card, .impact-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--mouse-x', `${x}%`);
    card.style.setProperty('--mouse-y', `${y}%`);
  });
});

// ===================== DOWNLOAD CV =====================
const downloadCvBtn = qs('#download-cv-btn');
if (downloadCvBtn) {
  downloadCvBtn.addEventListener('click', (e) => {
    e.preventDefault();
    // Show a feedback message until the final CV is published
    const original = downloadCvBtn.innerHTML;
    downloadCvBtn.innerHTML = '<i class="ph ph-check"></i> CV Coming Soon!';
    setTimeout(() => { downloadCvBtn.innerHTML = original; }, 2500);
  });
}

// ===================== INIT =====================
// The script is loaded with `defer`, so the DOM is already parsed here.
updateProgress();
updateActiveNav();
