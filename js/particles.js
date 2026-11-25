/* ═══════════════════════════════════════════════════════════
   MATRIX PARTICLE PORTRAIT ENGINE
   ─────────────────────────────────────────────────────────
   • Crops tightly around the portrait (removing margins & watermark)
   • Samples into high-detail matrix dot-particles
   • Boosts particle size & luminosity on the face for crisp visibility
   • Particles start scattered & assemble on scroll
   • Cursor repels nearby particles with spring physics
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Configuration ──
  const CONFIG = {
    sampleStep: 3,              // grid step in px
    dotMinSize: 1.35,           // base minimum dot size
    dotMaxSize: 2.75,           // base maximum dot size
    faceSizeBoost: 1.55,        // size multiplier on the face region
    colors: [
      [56, 189, 248],           // electric cyan #38bdf8
      [96, 165, 250],           // cobalt #60a5fa
      [129, 140, 248],          // indigo #818cf8
      [186, 230, 253],          // ice cyan
      [224, 242, 254],          // pale frost
      [255, 255, 255],          // pure white
    ],
    brightnessThreshold: 22,    // skip near-black pixels
    scatterRadius: 1.08,        // controlled scatter radius (prevents over-spreading)
    cursorRadius: 88,           // subtle holographic scan radius in px
    cursorForce: 520,           // gentle ripple nudge (keeps face intact)
    springStiffness: 0.11,      // crisp critically-damped snap
    springDamping: 0.76,        // zero mushy bounce-back
    bgParticleCount: 180,
    assemblyStart: 0.0,
    assemblyEnd: 0.55,          // faster formation with less scroll travel
    textRevealStart: 0.42,
    textRevealEnd: 0.60,
  };

  // ── State ──
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  let W, H;
  let particles = [];
  let bgParticles = [];
  let cachedImg = null;
  let portraitCenter = { x: 0, y: 0, radius: 300 };
  let mouse = { x: -9999, y: -9999 };
  let scrollProgress = 0;
  let imageLoaded = false;
  let preloaderDone = false;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  // ── Resize ──
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (imageLoaded && cachedImg) {
      sampleImage(cachedImg);
    }
    initBgParticles();
  }

  // ── Load Image ──
  function loadImage() {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      cachedImg = img;
      sampleImage(img);
      imageLoaded = true;
      finishPreloader();
    };
    img.onerror = function () {
      console.error('Failed to load portrait image');
      finishPreloader();
    };
    img.src = 'assets/images/ashwin.jpg';
  }

  // ── Sample Image into Matrix Particles ──
  function sampleImage(img) {
    // Tight crop around the subject (excludes empty side margins & bottom-right watermark)
    const sx = Math.floor(img.width * 0.16);
    const sy = Math.floor(img.height * 0.02);
    const sw = Math.floor(img.width * 0.68);
    const sh = Math.floor(img.height * 0.94);

    // Scale generously to command the hero viewport while leaving room for bottom title
    const maxW = Math.min(W * 0.68, 720);
    const maxH = Math.min(H * 0.68, 720);
    const scale = Math.min(maxW / sw, maxH / sh);
    const iw = Math.floor(sw * scale);
    const ih = Math.floor(sh * scale);

    const offscreen = document.createElement('canvas');
    const oc = offscreen.getContext('2d');
    offscreen.width = iw;
    offscreen.height = ih;
    oc.drawImage(img, sx, sy, sw, sh, 0, 0, iw, ih);

    const imageData = oc.getImageData(0, 0, iw, ih);
    const data = imageData.data;

    particles = [];

    const offsetX = (W - iw) / 2;
    const offsetY = (H - ih) / 2 - H * 0.08;

    portraitCenter = {
      x: W / 2,
      y: offsetY + ih * 0.42,
      radius: Math.max(iw, ih) * 0.58,
    };

    const step = CONFIG.sampleStep;

    for (let y = 0; y < ih; y += step) {
      const normY = y / ih;
      for (let x = 0; x < iw; x += step) {
        const i = (y * iw + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a < 128) continue;

        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        if (brightness < CONFIG.brightnessThreshold) continue;

        const normX = x / iw;

        // Smooth elliptical weight for the face/head region (centered horizontally, upper half)
        const fx = (normX - 0.5) / 0.22;
        const fy = (normY - 0.27) / 0.22;
        const faceDist = Math.sqrt(fx * fx + fy * fy);
        const faceWeight = clamp(1 - Math.max(0, faceDist - 0.55) / 0.65, 0, 1);

        const homeX = offsetX + x;
        const homeY = offsetY + y;

        const angle = Math.random() * Math.PI * 2;
        const dist = (Math.random() * 0.5 + 0.5) * Math.max(W, H) * CONFIG.scatterRadius;
        const scatterX = W / 2 + Math.cos(angle) * dist;
        const scatterY = H / 2 + Math.sin(angle) * dist;

        const normBright = brightness / 255;

        // Boost dot size on the face for crisp facial visibility
        const sizeMultiplier = 1 + faceWeight * (CONFIG.faceSizeBoost - 1);
        const dotSize = (CONFIG.dotMinSize + normBright * (CONFIG.dotMaxSize - CONFIG.dotMinSize)) * sizeMultiplier;

        // Boost color & alpha slightly on face so features pop
        const boostedBright = clamp(normBright + faceWeight * 0.14, 0, 1);
        const colorIdx = Math.min(
          Math.floor(boostedBright * CONFIG.colors.length),
          CONFIG.colors.length - 1
        );
        const color = CONFIG.colors[colorIdx];
        const alpha = clamp(0.32 + boostedBright * 0.68, 0, 1);

        particles.push({
          homeX, homeY,
          scatterX, scatterY,
          x: scatterX,
          y: scatterY,
          vx: 0,
          vy: 0,
          size: dotSize,
          color,
          alpha,
          delay: Math.random() * 0.28,
        });
      }
    }
  }

  // ── Background Ambient Particles ──
  function initBgParticles() {
    bgParticles = [];
    for (let i = 0; i < CONFIG.bgParticleCount; i++) {
      bgParticles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: Math.random() * 1.5 + 0.3,
        alpha: Math.random() * 0.3 + 0.05,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: (Math.random() - 0.5) * 0.15,
        pulse: Math.random() * Math.PI * 2,
      });
    }
  }

  // ── Preloader ──
  function finishPreloader() {
    const counter = document.getElementById('pre-counter');
    const preloader = document.getElementById('preloader');
    let count = 0;

    const interval = setInterval(() => {
      count += Math.floor(Math.random() * 8) + 3;
      if (count >= 100) {
        count = 100;
        counter.textContent = count;
        clearInterval(interval);
        setTimeout(() => {
          preloader.classList.add('done');
          preloaderDone = true;
          document.querySelectorAll('.corner-info').forEach((el, i) => {
            setTimeout(() => el.classList.add('visible'), i * 150 + 300);
          });
        }, 350);
      }
      counter.textContent = count;
    }, 30);
  }

  // ── Helpers ──
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  // ── Animation Loop ──
  function animate() {
    requestAnimationFrame(animate);

    const wrap = document.getElementById('hero-stage-wrap');
    if (wrap && wrap.getBoundingClientRect().bottom <= 0) {
      window.__particlesRepelling = false;
      return;
    }

    ctx.clearRect(0, 0, W, H);

    drawBackdropGlow();
    drawBgParticles();

    if (!particles.length || !preloaderDone) return;
    drawParticles();
  }

  function drawBackdropGlow() {
    const glowAlpha = 0.04 + scrollProgress * 0.08;
    const grad = ctx.createRadialGradient(
      portraitCenter.x, portraitCenter.y, 10,
      portraitCenter.x, portraitCenter.y, portraitCenter.radius
    );
    grad.addColorStop(0, `rgba(96, 165, 250, ${glowAlpha})`);
    grad.addColorStop(0.55, `rgba(30, 58, 138, ${glowAlpha * 0.45})`);
    grad.addColorStop(1, 'rgba(5, 5, 5, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  function drawBgParticles() {
    for (let i = 0; i < bgParticles.length; i++) {
      const p = bgParticles[i];
      p.x += p.speedX;
      p.y += p.speedY;
      p.pulse += 0.01;

      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      const flickAlpha = p.alpha * (0.5 + 0.5 * Math.sin(p.pulse));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(96,165,250,${flickAlpha})`;
      ctx.fill();
    }
  }

  function drawParticles() {
    const len = particles.length;
    const radius = CONFIG.cursorRadius;
    const radiusSq = radius * radius;
    let repellingCount = 0;

    for (let i = 0; i < len; i++) {
      const p = particles[i];

      const rawProgress = clamp(
        (scrollProgress - CONFIG.assemblyStart - p.delay) /
        (CONFIG.assemblyEnd - CONFIG.assemblyStart - p.delay),
        0, 1
      );
      const easedProgress = easeInOutCubic(rawProgress);

      const targetX = p.scatterX + (p.homeX - p.scatterX) * easedProgress;
      const targetY = p.scatterY + (p.homeY - p.scatterY) * easedProgress;

      // Gentle holographic ripple & luminance energize on hover (preserves portrait clarity)
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const distSq = dx * dx + dy * dy;
      let hoverGlow = 0;

      if (distSq < radiusSq && distSq > 0) {
        const dist = Math.sqrt(distSq);
        const falloff = 1 - dist / radius;
        hoverGlow = falloff;
        // Subtle tangential + outward micro-shimmer instead of blowing a hole
        const nx = dx / dist;
        const ny = dy / dist;
        const ripple = falloff * CONFIG.cursorForce * 0.001;
        p.vx += (nx * 0.65 - ny * 0.55) * ripple;
        p.vy += (ny * 0.65 + nx * 0.55) * ripple;
        repellingCount++;
      }

      // Tighten spring once assembled so portrait locks crisply without bounce-back
      const stiffness = easedProgress > 0.94 ? CONFIG.springStiffness * 1.6 : CONFIG.springStiffness;
      const springX = (targetX - p.x) * stiffness;
      const springY = (targetY - p.y) * stiffness;
      p.vx = (p.vx + springX) * CONFIG.springDamping;
      p.vy = (p.vy + springY) * CONFIG.springDamping;

      p.x += p.vx;
      p.y += p.vy;

      const displayAlpha = clamp(p.alpha * (0.2 + 0.8 * easedProgress) + hoverGlow * 0.45, 0, 1);
      const c = p.color;
      if (hoverGlow > 0.15) {
        // Shift hovered dots toward luminous cyan-white
        const r = Math.min(255, Math.round(c[0] + (56 - c[0]) * hoverGlow * 0.5));
        const g = Math.min(255, Math.round(c[1] + (225 - c[1]) * hoverGlow * 0.5));
        const b = Math.min(255, Math.round(c[2] + (255 - c[2]) * hoverGlow * 0.5));
        ctx.fillStyle = `rgba(${r},${g},${b},${displayAlpha})`;
      } else {
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${displayAlpha})`;
      }
      const s = p.size * (1 + hoverGlow * 0.35);
      ctx.fillRect(p.x - s * 0.5, p.y - s * 0.5, s, s);
    }

    window.__particlesRepelling = repellingCount > 6;

    // Hero Text Reveal
    const heroText = document.getElementById('hero-text');
    if (heroText) {
      const textProgress = clamp(
        (scrollProgress - CONFIG.textRevealStart) / (CONFIG.textRevealEnd - CONFIG.textRevealStart),
        0, 1
      );
      const textEased = easeInOutCubic(textProgress);
      heroText.style.opacity = textEased;
      heroText.style.transform = `translateX(-50%) translateY(${(1 - textEased) * 30}px)`;
    }

    // Scroll Indicator fade out
    const scrollInd = document.getElementById('scroll-indicator');
    if (scrollInd) {
      scrollInd.style.opacity = clamp(1 - scrollProgress * 5, 0, 1);
    }
  }

  // ── Scroll & Pointer Tracking ──
  function onScroll() {
    const wrap = document.getElementById('hero-stage-wrap');
    if (!wrap) return;
    const maxScroll = Math.max(1, wrap.offsetHeight - window.innerHeight);
    scrollProgress = clamp(window.scrollY / maxScroll, 0, 1);
  }

  function onMouseMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }

  function onMouseLeave() {
    mouse.x = -9999;
    mouse.y = -9999;
  }

  function onTouchMove(e) {
    if (e.touches.length > 0) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    }
  }

  function onTouchEnd() {
    mouse.x = -9999;
    mouse.y = -9999;
  }

  // ── Init ──
  function init() {
    resize();
    loadImage();
    animate();

    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
