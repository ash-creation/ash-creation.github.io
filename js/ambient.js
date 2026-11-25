/* ═══════════════════════════════════════════════════════════
   AMBIENT DEVOPS MESH & INFINITE BLURRED AURORA
   ─────────────────────────────────────────────────────────
   • Continuous background layer connecting all portfolio sections
   • Subtle ice-cyan & indigo nodes (no distracting green dots)
   • Soft interactive cursor-reactive telemetry links
   • Subtle mouse parallax on blurred aurora orbs
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let nodes = [];
  let packets = [];
  let mouse = { x: -9999, y: -9999 };
  let scrollY = 0;

  const NODE_COUNT = 24;
  const LINK_DIST = 220;
  const LABELS = ['EC2', 'S3', 'POD', '/24', 'SSH', 'TLS', 'DNS', 'API'];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initNodes();
  }

  function initNodes() {
    nodes = [];
    const palette = [
      [56, 189, 248],  // soft cyan
      [129, 140, 248], // soft indigo
      [148, 163, 184], // slate
    ];
    for (let i = 0; i < NODE_COUNT; i++) {
      const col = palette[i % palette.length];
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.2 + 0.7,
        col,
        label: i % 5 === 0 ? LABELS[i % LABELS.length] : null,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    packets = [];
    for (let i = 0; i < 4; i++) {
      packets.push({
        a: Math.floor(Math.random() * NODE_COUNT),
        b: Math.floor(Math.random() * NODE_COUNT),
        t: Math.random(),
        speed: 0.003 + Math.random() * 0.004,
      });
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, W, H);

    const parallaxOffset = (scrollY * 0.035) % H;

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;
      n.pulse += 0.015;

      if (n.x < -40) n.x = W + 40;
      if (n.x > W + 40) n.x = -40;
      if (n.y < -40) n.y = H + 40;
      if (n.y > H + 40) n.y = -40;

      const drawY = (n.y - parallaxOffset + H) % H;
      n._drawY = drawY;

      const distMouse = Math.hypot(n.x - mouse.x, drawY - mouse.y);
      const nearMouse = distMouse < 170 ? 1 - distMouse / 170 : 0;

      const alpha = 0.1 + 0.07 * Math.sin(n.pulse) + nearMouse * 0.35;
      const [r, g, b] = n.col;

      ctx.beginPath();
      ctx.arc(n.x, drawY, n.r + nearMouse * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.fill();

      if (n.label && nearMouse > 0.25) {
        ctx.font = '9px "IBM Plex Mono", monospace';
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${nearMouse * 0.45})`;
        ctx.fillText(n.label, n.x + 7, drawY + 3);
      }

      if (nearMouse > 0.15) {
        ctx.beginPath();
        ctx.moveTo(n.x, drawY);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = `rgba(56, 189, 248, ${nearMouse * 0.11})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const d = Math.hypot(a.x - b.x, a._drawY - b._drawY);
        if (d < LINK_DIST) {
          const alpha = (1 - d / LINK_DIST) * 0.065;
          ctx.beginPath();
          ctx.moveTo(a.x, a._drawY);
          ctx.lineTo(b.x, b._drawY);
          ctx.strokeStyle = `rgba(129, 140, 248, ${alpha})`;
          ctx.lineWidth = 0.65;
          ctx.stroke();
        }
      }
    }

    // Subtle ice-cyan routing packets (no green dots)
    for (let i = 0; i < packets.length; i++) {
      const p = packets[i];
      const na = nodes[p.a];
      const nb = nodes[p.b];
      if (!na || !nb) continue;

      const d = Math.hypot(na.x - nb.x, na._drawY - nb._drawY);
      p.t += p.speed;
      if (p.t >= 1 || d > LINK_DIST * 1.35) {
        p.a = Math.floor(Math.random() * nodes.length);
        p.b = Math.floor(Math.random() * nodes.length);
        p.t = 0;
        continue;
      }

      const px = na.x + (nb.x - na.x) * p.t;
      const py = na._drawY + (nb._drawY - na._drawY) * p.t;

      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.fill();
    }
  }

  const orbs = document.querySelectorAll('.aurora-orb');
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    const nx = (e.clientX / window.innerWidth - 0.5) * 30;
    const ny = (e.clientY / window.innerHeight - 0.5) * 30;
    orbs.forEach((orb, idx) => {
      const factor = (idx + 1) * 0.45;
      orb.style.setProperty('--px', `${nx * factor}px`);
      orb.style.setProperty('--py', `${ny * factor}px`);
    });
  }, { passive: true });

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
  }, { passive: true });

  window.addEventListener('resize', resize);
  resize();
  animate();
})();
