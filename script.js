/* =====================================================
   KIMBERLEY MUBIRU PORTFOLIO – SCRIPT.JS
   Canvas animations, scroll effects, interactivity
   ===================================================== */

'use strict';

// ---- Utility ----
const qs = (s, ctx = document) => ctx.querySelector(s);
const qsa = (s, ctx = document) => ctx.querySelectorAll(s);

// ===================== SCROLL PROGRESS BAR =====================
const progressBar = qs('#progress-bar');
function updateProgress() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = `${(scrollTop / docHeight) * 100}%`;
}
window.addEventListener('scroll', updateProgress, { passive: true });

// ===================== NAVBAR =====================
const navbar = qs('#navbar');
const navLinks = qsa('.nav-link');
const hamburger = qs('#hamburger');
const mobileMenu = qs('#mobile-menu');

let lastScrollY = 0;

window.addEventListener('scroll', () => {
  const y = window.scrollY;
  navbar.classList.toggle('scrolled', y > 30);
  lastScrollY = y;
}, { passive: true });

// Active nav link on scroll
function updateActiveNav() {
  const sections = ['about', 'philosophy', 'experience', 'skills', 'education', 'contact'];
  let current = '';
  sections.forEach(id => {
    const el = qs(`#${id}`);
    if (el && el.getBoundingClientRect().top <= 100) current = id;
  });
  navLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.section === current);
  });
}
window.addEventListener('scroll', updateActiveNav, { passive: true });

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
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

// ===================== HERO CANVAS (Network Nodes) =====================
(function initHeroCanvas() {
  const canvas = qs('#hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, nodes = [];

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const NODE_COUNT = 60;
  const MAX_DIST = 130;

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
  createNodes();

  let mouse = { x: W / 2, y: H / 2 };
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }, { passive: true });

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Update positions
    nodes.forEach(n => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;

      // Mouse repulsion
      const dx = n.x - mouse.x;
      const dy = n.y - mouse.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 80) {
        const f = (80 - dist) / 80 * 0.4;
        n.vx += (dx / dist) * f;
        n.vy += (dy / dist) * f;
        const speed = Math.hypot(n.vx, n.vy);
        if (speed > 2) { n.vx /= speed; n.vy /= speed; }
      }
    });

    // Draw connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.25;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${n.hue}, 90%, 70%, ${n.alpha})`;
      ctx.fill();

      // Glow
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 3);
      grad.addColorStop(0, `hsla(${n.hue}, 90%, 70%, 0.15)`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fill();
    });

    // Diagonal light beam
    const t = Date.now() * 0.0003;
    const bx = (Math.sin(t) * 0.5 + 0.5) * W;
    const beamGrad = ctx.createLinearGradient(bx - 80, 0, bx + 80, H);
    beamGrad.addColorStop(0, 'transparent');
    beamGrad.addColorStop(0.5, 'rgba(34,211,238,0.04)');
    beamGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(0, 0, W, H);

    requestAnimationFrame(draw);
  }
  draw();
})();

// ===================== FLOATING PARTICLES (Hero) =====================
(function createParticles() {
  const container = qs('#hero-particles');
  if (!container) return;
  const colors = ['#22d3ee', '#3b82f6', '#a855f7', '#34d399'];
  for (let i = 0; i < 25; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = `${Math.random() * 100}%`;
    p.style.width = p.style.height = `${Math.random() * 3 + 1}px`;
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDuration = `${Math.random() * 10 + 8}s`;
    p.style.animationDelay = `${Math.random() * 8}s`;
    container.appendChild(p);
  }
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
  window.addEventListener('resize', resize, { passive: true });
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

// Lang bars (global trigger)
const langBarObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const fill = entry.target.querySelector('.lang-fill');
      if (fill) setTimeout(() => { fill.style.width = `${fill.dataset.width}%`; }, 200);
      langBarObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.4 });
qsa('.language-card').forEach(el => langBarObserver.observe(el));

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
const contactForm = qs('#contact-form');
const formSuccess = qs('#form-success');

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = qs('#form-submit-btn');
    btn.innerHTML = '<i class="ph ph-circle-notch" style="animation:spin 1s linear infinite"></i> Sending...';
    btn.disabled = true;

    // Simulate send delay
    await new Promise(r => setTimeout(r, 1200));

    contactForm.reset();
    btn.innerHTML = '<i class="ph ph-paper-plane-tilt"></i> Send Message';
    btn.disabled = false;
    formSuccess.classList.add('show');

    setTimeout(() => formSuccess.classList.remove('show'), 4000);
  });
}

// Spin keyframe for loading icon
const spinStyle = document.createElement('style');
spinStyle.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
document.head.appendChild(spinStyle);

// ===================== BUTTON RIPPLE EFFECT =====================
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn');
  if (!btn) return;
  const ripple = document.createElement('span');
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.5;
  ripple.style.cssText = `
    position:absolute;
    width:${size}px;height:${size}px;
    left:${e.clientX - rect.left - size/2}px;
    top:${e.clientY - rect.top - size/2}px;
    background:rgba(255,255,255,0.15);
    border-radius:50%;
    pointer-events:none;
    animation:ripple-anim 0.6s ease-out forwards;
  `;
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 700);
});

const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
  @keyframes ripple-anim {
    from { transform:scale(0); opacity:1; }
    to { transform:scale(1); opacity:0; }
  }
`;
document.head.appendChild(rippleStyle);

// ===================== TIMELINE HOVER GLOW =====================
qsa('.timeline-node i').forEach(node => {
  const colors = { '--glow-color': 'rgba(34,211,238,0.4)' };
});

// ===================== SCROLL-BASED PARALLAX (subtle) =====================
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  const heroContent = qs('.hero-content');
  if (heroContent) {
    heroContent.style.transform = `translateY(${y * 0.15}px)`;
    heroContent.style.opacity = Math.max(0, 1 - y / 600);
  }
}, { passive: true });

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

// Mouse-following glow effect for cards
const cardGlowStyle = document.createElement('style');
cardGlowStyle.textContent = `
  .timeline-card::before,
  .edu-card::before,
  .impact-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(
      circle 120px at var(--mouse-x, 50%) var(--mouse-y, 50%),
      rgba(34,211,238,0.06) 0%,
      transparent 70%
    );
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s;
  }
  .timeline-card:hover::before,
  .edu-card:hover::before,
  .impact-card:hover::before {
    opacity: 1;
  }
  .timeline-card { position: relative; overflow: hidden; }
`;
document.head.appendChild(cardGlowStyle);

// ===================== DOWNLOAD CV =====================
const downloadCvBtn = qs('#download-cv-btn');
if (downloadCvBtn) {
  downloadCvBtn.addEventListener('click', (e) => {
    e.preventDefault();
    // Show a feedback message since no CV file exists yet
    const original = downloadCvBtn.innerHTML;
    downloadCvBtn.innerHTML = '<i class="ph ph-check"></i> CV Coming Soon!';
    setTimeout(() => { downloadCvBtn.innerHTML = original; }, 2500);
  });
}

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
  // Ensure all observers run after DOM is ready
  updateProgress();
  updateActiveNav();
  console.log('🚀 Kimberley Mubiru Portfolio | Powered by Growth, Governance & Grit');
});
