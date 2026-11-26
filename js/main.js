/* ═══════════════════════════════════════════════════
   MAIN.JS — Architectural Scroll Choreography & Interactions
═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  // ── 1. LIVE IST CLOCK ───────────────────────────────
  const liveClock = document.getElementById('live-clock');
  if (liveClock) {
    const tick = () => {
      const ist = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date());
      liveClock.textContent = `${ist} IST`;
    };
    tick();
    setInterval(tick, 15000);
  }

  // ── 2. LENIS SMOOTH SCROLL ──────────────────────────
  let lenis = null;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToTarget(selector) {
    const el = document.querySelector(selector);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -60 });
    else el.scrollIntoView({ behavior: 'smooth' });
  }

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href && href.length > 1) {
        e.preventDefault();
        scrollToTarget(href);
      }
    });
  });

  // ── 3. SCRAMBLE / DECRYPTED TEXT ────────────────────
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/_';
  function scrambleEl(el) {
    const target = el.dataset.text || el.textContent;
    let iter = 0;
    const interval = setInterval(() => {
      el.textContent = target
        .split('')
        .map((c, idx) => (c === ' ' ? ' ' : idx < iter ? target[idx] : chars[Math.floor(Math.random() * chars.length)]))
        .join('');
      iter += 0.6;
      if (iter >= target.length) {
        el.textContent = target;
        clearInterval(interval);
      }
    }, 24);
  }

  document.querySelectorAll('.scramble-text').forEach((el) => {
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter: () => scrambleEl(el),
      });
    } else {
      scrambleEl(el);
    }
  });

  // ── 4. SCROLL CHOREOGRAPHY (SEAMLESS FLOW + REACTBITS BLURTEXT) ───
  // Split .blur-words headings into individual animated word spans
  document.querySelectorAll('.blur-words').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words
      .map((w, i) => {
        const isAccent = i >= words.length - 2;
        return `<span class="blur-word ${isAccent ? 'outline-text' : ''}">${w}</span>`;
      })
      .join('');
  });

  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    // ReactBits BlurText word-by-word stagger on scroll
    document.querySelectorAll('.blur-words').forEach((heading) => {
      const words = heading.querySelectorAll('.blur-word');
      gsap.fromTo(
        words,
        { opacity: 0, y: 24, filter: 'blur(10px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.75,
          stagger: 0.06,
          ease: 'power3.out',
          scrollTrigger: { trigger: heading, start: 'top 88%', once: true },
        }
      );
    });

    // Seamless Hero -> Craft exit morph (scales & softens hero as you scroll into #craft)
    const heroEl = document.getElementById('hero');
    const craftEl = document.getElementById('craft');
    if (heroEl && craftEl) {
      gsap.to(heroEl, {
        scale: 0.92,
        opacity: 0.15,
        filter: 'blur(8px)',
        ease: 'none',
        scrollTrigger: {
          trigger: craftEl,
          start: 'top bottom',
          end: 'top 25%',
          scrub: true,
        },
      });
    }

    // Continuous Left-Edge Pipeline Rail + Top Header Scroll Tracking
    const railFill = document.getElementById('rail-fill');
    const railNodes = document.querySelectorAll('.rail-node');
    const topLinks = document.querySelectorAll('.tb-links a[data-sec]');
    const sections = ['#hero-stage-wrap', '#craft', '#works', '#trajectory', '#contact'];
    if (railFill) {
      gsap.to(railFill, {
        height: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
        },
      });
    }
    sections.forEach((sel, idx) => {
      const sec = document.querySelector(sel);
      if (!sec) return;
      const secId = sel.replace('#', '');
      const setActive = () => {
        railNodes.forEach((n, i) => n.classList.toggle('active', i === idx));
        topLinks.forEach((a) => a.classList.toggle('active', a.dataset.sec === secId));
      };
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 55%',
        end: 'bottom 55%',
        onEnter: setActive,
        onEnterBack: setActive,
      });
    });

    // Track active scrolling so stationary cursor never triggers hover highlights during scroll
    let scrollTimer = null;
    const markScrolling = () => {
      document.body.classList.add('is-scrolling');
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        document.body.classList.remove('is-scrolling');
      }, 180);
    };
    window.addEventListener('scroll', markScrolling, { passive: true });
    if (lenis) lenis.on('scroll', markScrolling);

    // Page 2 (#craft) — Interactive Live Topology Canvas + Odometer + Physics Stack Playground
    const topoCanvas = document.getElementById('topo-canvas');
    const topoStatus = document.getElementById('topo-status');
    const topoRps = document.getElementById('topo-rps');
    const topoFailoverBtn = document.getElementById('topo-failover-btn');

    if (topoCanvas) {
      const ctx = topoCanvas.getContext('2d');
      let cw = 0, ch = 0;
      const pointer = { x: -999, y: -999, active: false };
      let failoverTimer = 0;
      let failedIdx = -1;
      const pulses = [];

      const nodes = [
        { label: 'GIT',    rx: 0.20, ry: 0.26, x: 0, y: 0, vx: 0, vy: 0, color: '#818cf8' },
        { label: 'DOCKER', rx: 0.50, ry: 0.20, x: 0, y: 0, vx: 0, vy: 0, color: '#38bdf8' },
        { label: 'K8S',    rx: 0.80, ry: 0.28, x: 0, y: 0, vx: 0, vy: 0, color: '#34d399' },
        { label: 'AWS',    rx: 0.76, ry: 0.68, x: 0, y: 0, vx: 0, vy: 0, color: '#f59e0b' },
        { label: 'NET/24', rx: 0.46, ry: 0.72, x: 0, y: 0, vx: 0, vy: 0, color: '#38bdf8' },
        { label: 'LINUX',  rx: 0.20, ry: 0.64, x: 0, y: 0, vx: 0, vy: 0, color: '#fafafa' },
      ];
      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [1, 4], [2, 4], [0, 4]
      ];
      const packets = edges.map(([a, b], i) => ({
        a, b, t: (i * 0.17) % 1, speed: 0.006 + (i % 3) * 0.0025
      }));

      function resizeTopo() {
        const rect = topoCanvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        cw = rect.width;
        ch = rect.height;
        topoCanvas.width = cw * dpr;
        topoCanvas.height = ch * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        nodes.forEach((n) => {
          n.x = n.rx * cw;
          n.y = n.ry * ch;
        });
      }
      resizeTopo();
      window.addEventListener('resize', resizeTopo);

      topoCanvas.addEventListener('pointermove', (e) => {
        const rect = topoCanvas.getBoundingClientRect();
        pointer.x = e.clientX - rect.left;
        pointer.y = e.clientY - rect.top;
        pointer.active = true;
      });
      topoCanvas.addEventListener('pointerleave', () => { pointer.active = false; });

      topoCanvas.addEventListener('click', (e) => {
        const rect = topoCanvas.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        pulses.push({ x: cx, y: cy, r: 8, alpha: 0.9 });
        packets.forEach((p) => { p.speed = Math.min(0.032, p.speed + 0.012); });
        if (topoRps) topoRps.textContent = `${Math.floor(2400 + Math.random() * 900)} req/s`;
      });

      if (topoFailoverBtn) {
        topoFailoverBtn.addEventListener('click', () => {
          failedIdx = Math.floor(Math.random() * nodes.length);
          failoverTimer = 110;
          topoFailoverBtn.classList.add('is-active');
          if (topoStatus) {
            topoStatus.innerHTML = `<span class="sp-dot" style="background:#f59e0b;box-shadow:0 0 10px #f59e0b"></span> REROUTING ${nodes[failedIdx].label}...`;
          }
          if (topoRps) topoRps.textContent = 'FAILOVER // 0ms DROP';
        });
      }

      function renderTopo(time) {
        if (!cw || !ch) return;
        ctx.clearRect(0, 0, cw, ch);

        // Subtle grid dots
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        for (let gx = 24; gx < cw; gx += 28) {
          for (let gy = 24; gy < ch - 36; gy += 28) {
            ctx.fillRect(gx, gy, 1.2, 1.2);
          }
        }

        // Update node positions (gentle float + pointer attraction)
        nodes.forEach((n, idx) => {
          const homeX = n.rx * cw + Math.sin(time * 0.0011 + idx * 1.4) * 8;
          const homeY = n.ry * (ch - 36) + Math.cos(time * 0.0013 + idx * 1.7) * 7;
          if (pointer.active) {
            const dx = pointer.x - n.x;
            const dy = pointer.y - n.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 140 && dist > 1) {
              n.vx += (dx / dist) * 0.32;
              n.vy += (dy / dist) * 0.32;
            }
          }
          n.vx += (homeX - n.x) * 0.045;
          n.vy += (homeY - n.y) * 0.045;
          n.vx *= 0.84;
          n.vy *= 0.84;
          n.x += n.vx;
          n.y += n.vy;
        });

        // Failover timer countdown
        if (failoverTimer > 0) {
          failoverTimer--;
          if (failoverTimer === 0) {
            failedIdx = -1;
            if (topoFailoverBtn) topoFailoverBtn.classList.remove('is-active');
            if (topoStatus) topoStatus.innerHTML = '<span class="sp-dot"></span> MESH NOMINAL // 6 NODES';
            if (topoRps) topoRps.textContent = '1,240 req/s';
          }
        }

        // Draw edges
        edges.forEach(([a, b]) => {
          const na = nodes[a], nb = nodes[b];
          const isDegraded = (a === failedIdx || b === failedIdx);
          ctx.beginPath();
          ctx.moveTo(na.x, na.y);
          ctx.lineTo(nb.x, nb.y);
          ctx.strokeStyle = isDegraded ? 'rgba(245, 158, 11, 0.22)' : 'rgba(148, 163, 184, 0.2)';
          ctx.lineWidth = isDegraded ? 1 : 1.4;
          if (isDegraded) ctx.setLineDash([4, 4]);
          else ctx.setLineDash([]);
          ctx.stroke();
        });
        ctx.setLineDash([]);

        // Draw moving packets
        packets.forEach((p, idx) => {
          p.speed += ((0.006 + (idx % 3) * 0.0025) - p.speed) * 0.03;
          p.t = (p.t + p.speed) % 1;
          if (p.a === failedIdx || p.b === failedIdx) return;
          const na = nodes[p.a], nb = nodes[p.b];
          const px = na.x + (nb.x - na.x) * p.t;
          const py = na.y + (nb.y - na.y) * p.t;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // Click shockwaves
        for (let i = pulses.length - 1; i >= 0; i--) {
          const pl = pulses[i];
          pl.r += 4.5;
          pl.alpha *= 0.92;
          ctx.beginPath();
          ctx.arc(pl.x, pl.y, pl.r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(56, 189, 248, ${pl.alpha})`;
          ctx.lineWidth = 1.6;
          ctx.stroke();
          if (pl.alpha < 0.04) pulses.splice(i, 1);
        }

        // Draw nodes
        nodes.forEach((n, idx) => {
          const isFailed = idx === failedIdx;
          ctx.beginPath();
          ctx.arc(n.x, n.y, isFailed ? 17 : 20, 0, Math.PI * 2);
          ctx.fillStyle = isFailed ? 'rgba(42, 22, 12, 0.92)' : 'rgba(12, 14, 22, 0.92)';
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = isFailed ? '#f59e0b' : n.color;
          ctx.stroke();

          ctx.font = '500 10px "IBM Plex Mono", monospace';
          ctx.fillStyle = isFailed ? '#fcd34d' : '#fafafa';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(n.label, n.x, n.y);
        });
      }

      gsap.ticker.add((t) => renderTopo(t * 1000));
    }

    // Odometer roll-up animation
    const odoNums = document.querySelectorAll('.odo-num');
    if (odoNums.length) {
      ScrollTrigger.create({
        trigger: '#odo-grid',
        start: 'top 85%',
        once: true,
        onEnter: () => {
          odoNums.forEach((el) => {
            const target = parseFloat(el.dataset.target || '0');
            const suffix = el.dataset.suffix || '';
            const state = { val: 0 };
            gsap.to(state, {
              val: target,
              duration: 1.5,
              ease: 'power3.out',
              onUpdate: () => {
                el.textContent = `${Math.round(state.val)}${suffix}`;
              },
            });
          });
        },
      });
    }

    // Draggable Physics Stack Playground
    const stackMeta = {
      linux:  ['LINUX & SYSTEMD',  'Declarative service supervision, journald log forensics, and hardened Ubuntu LTS hosts.'],
      docker: ['DOCKER',           'Multi-stage minimal container images running as unprivileged users with zero-drift builds.'],
      k8s:    ['KUBERNETES',       'Self-healing deployments, liveness probes, and declarative horizontal scaling across nodes.'],
      aws:    ['AWS EC2 & S3',     'Scoped IAM roles, elastic compute provisioning, EBS snapshots, and lifecycle-managed S3 storage.'],
      net:    ['/24 NETWORKING',   'CIDR subnetting, strict ingress security groups, socket auditing (ss), and UFW firewall rules.'],
      sec:    ['SECURITY & SSH',   'Key-only SSH hardening, TLS verification, and real-time Chrome DNR + TensorFlow.js threat blocking.'],
      git:    ['GIT & CI/CD',      'Clean atomic commits, automated build gates, and reproducible release pipelines.'],
      python: ['PYTHON & BASH',    'Automation scripts, telemetry daemons, and fast CLI tooling for daily ops.'],
    };

    const stickers = Array.from(document.querySelectorAll('.stack-sticker'));
    const spArena = document.getElementById('sp-arena');
    const sprBadge = document.getElementById('spr-badge');
    const sprText = document.getElementById('spr-text');
    const scatterBtn = document.getElementById('sp-scatter-btn');
    const resetBtn = document.getElementById('sp-reset-btn');

    const stickerState = new Map();
    stickers.forEach((el) => {
      const tilt = parseFloat(el.dataset.tilt || '0');
      stickerState.set(el, { x: 0, y: 0, vx: 0, vy: 0, rot: tilt });
      el.style.transform = `translate3d(0px, 0px, 0) rotate(${tilt}deg)`;
    });

    function selectSticker(el) {
      stickers.forEach((s) => s.classList.toggle('is-selected', s === el));
      const key = el.dataset.stack;
      if (key && stackMeta[key] && sprBadge && sprText) {
        sprBadge.textContent = stackMeta[key][0];
        sprText.textContent = stackMeta[key][1];
      }
    }
    if (stickers[0]) selectSticker(stickers[0]);

    stickers.forEach((el) => {
      let dragging = false;
      let moved = false;
      let startX = 0, startY = 0;
      let lastX = 0, lastY = 0;

      el.addEventListener('pointerdown', (e) => {
        dragging = true;
        moved = false;
        el.classList.add('is-dragging');
        el.setPointerCapture(e.pointerId);
        const st = stickerState.get(el);
        startX = e.clientX - st.x;
        startY = e.clientY - st.y;
        lastX = e.clientX;
        lastY = e.clientY;
        st.vx = 0;
        st.vy = 0;
        selectSticker(el);
      });

      el.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const st = stickerState.get(el);
        const nx = e.clientX - startX;
        const ny = e.clientY - startY;
        if (Math.abs(nx - st.x) > 3 || Math.abs(ny - st.y) > 3) moved = true;
        st.vx = (e.clientX - lastX) * 0.45;
        st.vy = (e.clientY - lastY) * 0.45;
        st.x = nx;
        st.y = ny;
        lastX = e.clientX;
        lastY = e.clientY;
        el.style.transform = `translate3d(${st.x}px, ${st.y}px, 0) rotate(${st.rot * 0.5}deg) scale(1.06)`;
      });

      const endDrag = () => {
        if (!dragging) return;
        dragging = false;
        el.classList.remove('is-dragging');
        if (!moved) selectSticker(el);
      };
      el.addEventListener('pointerup', endDrag);
      el.addEventListener('pointercancel', endDrag);
    });

    if (scatterBtn) {
      scatterBtn.addEventListener('click', () => {
        stickers.forEach((el) => {
          const st = stickerState.get(el);
          st.vx = (Math.random() - 0.5) * 10;
          st.vy = (Math.random() - 0.5) * 8;
          st.rot = (Math.random() - 0.5) * 14;
        });
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        stickers.forEach((el) => {
          const st = stickerState.get(el);
          const tilt = parseFloat(el.dataset.tilt || '0');
          st.x = 0; st.y = 0; st.vx = 0; st.vy = 0; st.rot = tilt;
          el.style.transform = `translate3d(0px, 0px, 0) rotate(${tilt}deg)`;
        });
      });
    }

    // Physics ticker
    gsap.ticker.add(() => {
      if (!spArena) return;
      const arenaRect = spArena.getBoundingClientRect();
      stickers.forEach((el) => {
        if (el.classList.contains('is-dragging')) return;
        const st = stickerState.get(el);
        if (Math.abs(st.vx) > 0.05 || Math.abs(st.vy) > 0.05) {
          st.x += st.vx;
          st.y += st.vy;
          st.vx *= 0.91;
          st.vy *= 0.91;

          // Keep softly bounded inside arena
          const maxX = Math.max(40, arenaRect.width * 0.22);
          const maxY = Math.max(24, arenaRect.height * 0.22);
          if (st.x > maxX || st.x < -maxX) { st.vx *= -0.65; st.x = Math.max(-maxX, Math.min(maxX, st.x)); }
          if (st.y > maxY || st.y < -maxY) { st.vy *= -0.65; st.y = Math.max(-maxY, Math.min(maxY, st.y)); }

          el.style.transform = `translate3d(${st.x.toFixed(1)}px, ${st.y.toFixed(1)}px, 0) rotate(${st.rot}deg)`;
        }
      });
    });

    // Framer-style Scroll-Linked 3D Perspective Entry on Telemetry Stages
    gsap.utils.toArray('.case-visual').forEach((stage) => {
      gsap.fromTo(
        stage,
        { y: 50, rotateX: 8, opacity: 0.4 },
        {
          y: 0,
          rotateX: 0,
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: stage,
            start: 'top 95%',
            end: 'top 45%',
            scrub: true,
          },
        }
      );
    });

    const spineBeam = document.getElementById('spine-beam');
    const spineWrap = document.getElementById('spine-wrap');
    if (spineBeam && spineWrap) {
      gsap.to(spineBeam, {
        height: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: spineWrap,
          start: 'top 72%',
          end: 'bottom 68%',
          scrub: true,
        },
      });
    }

    gsap.utils.toArray('.case-row').forEach((row) => {
      gsap.fromTo(
        row,
        { opacity: 0, y: 34 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          ease: 'power3.out',
          clearProps: 'transform',
          scrollTrigger: { trigger: row, start: 'top 86%', once: true },
        }
      );
    });

    gsap.utils.toArray('.spine-item').forEach((item) => {
      gsap.fromTo(
        item,
        { opacity: 0, x: -24 },
        {
          opacity: 1,
          x: 0,
          duration: 0.65,
          ease: 'power3.out',
          clearProps: 'transform',
          scrollTrigger: { trigger: item, start: 'top 86%', once: true },
        }
      );
    });

    setTimeout(() => ScrollTrigger.refresh(), 600);
  }

  // ── 5. 3D TILT TELEMETRY STAGES ─────────────────────
  document.querySelectorAll('.tilt-stage').forEach((stage) => {
    stage.addEventListener('mousemove', (e) => {
      const r = stage.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const rx = ((y - r.height / 2) / (r.height / 2)) * -6;
      const ry = ((x - r.width / 2) / (r.width / 2)) * 6;
      stage.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    stage.addEventListener('mouseleave', () => {
      stage.style.transform = 'perspective(900px) rotateX(0) rotateY(0)';
    });
  });

  // ── 6. REACTBITS SPOTLIGHT, TILTED IDENTITY & BEUI GLIDING PILLS ──
  document.querySelectorAll('.spotlight-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', `${e.clientX - r.left}px`);
      card.style.setProperty('--mouse-y', `${e.clientY - r.top}px`);
    });
  });

  // ReactBits TiltedCard 3D perspective on #tilted-identity
  const tiltedId = document.getElementById('tilted-identity');
  if (tiltedId && window.innerWidth >= 768) {
    tiltedId.addEventListener('mousemove', (e) => {
      const r = tiltedId.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const rx = ((y - r.height / 2) / (r.height / 2)) * -5;
      const ry = ((x - r.width / 2) / (r.width / 2)) * 5;
      tiltedId.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      tiltedId.style.setProperty('--glare-x', `${(x / r.width) * 100}%`);
      tiltedId.style.setProperty('--glare-y', `${(y / r.height) * 100}%`);
    });
    tiltedId.addEventListener('mouseleave', () => {
      tiltedId.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    });
  }

  // ReactBits PixelCanvas inside #tilted-identity
  const pixelCanvas = document.getElementById('pixel-canvas');
  if (tiltedId && pixelCanvas) {
    const pctx = pixelCanvas.getContext('2d');
    let pw = 0, ph = 0, pmx = -999, pmy = -999, pActive = false;
    const resizePixel = () => {
      const r = tiltedId.getBoundingClientRect();
      pw = pixelCanvas.width = r.width;
      ph = pixelCanvas.height = r.height;
    };
    resizePixel();
    window.addEventListener('resize', resizePixel);
    tiltedId.addEventListener('mouseenter', () => { pActive = true; });
    tiltedId.addEventListener('mouseleave', () => { pActive = false; pmx = -999; pmy = -999; });
    tiltedId.addEventListener('mousemove', (e) => {
      const r = tiltedId.getBoundingClientRect();
      pmx = e.clientX - r.left;
      pmy = e.clientY - r.top;
    });
    const step = 16;
    function drawPixels(time) {
      pctx.clearRect(0, 0, pw, ph);
      for (let x = 8; x < pw; x += step) {
        for (let y = 8; y < ph; y += step) {
          const dist = Math.hypot(x - pmx, y - pmy);
          const wave = Math.sin(x * 0.04 + y * 0.04 + time * 0.002) * 0.5 + 0.5;
          let alpha = 0.025 + wave * 0.025;
          if (pActive && dist < 120) {
            alpha += (1 - dist / 120) * 0.35;
          }
          pctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
          pctx.fillRect(x, y, 3, 3);
        }
      }
      requestAnimationFrame(drawPixels);
    }
    requestAnimationFrame(drawPixels);
  }

  // BEUI Gliding Pill Switcher
  const glider = document.getElementById('pill-glider');
  const pillBtns = document.querySelectorAll('.beui-pill');
  const tabPanels = document.querySelectorAll('.beui-panels .tab-panel');
  function moveGlider(btn) {
    if (!glider || !btn) return;
    glider.style.width = `${btn.offsetWidth}px`;
    glider.style.transform = `translateX(${btn.offsetLeft - 4}px)`;
  }
  const activePill = document.querySelector('.beui-pill.active');
  if (activePill) setTimeout(() => moveGlider(activePill), 80);
  window.addEventListener('resize', () => moveGlider(document.querySelector('.beui-pill.active')));

  pillBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      pillBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      moveGlider(btn);
      const target = btn.dataset.tab;
      tabPanels.forEach((p) => p.classList.toggle('active', p.dataset.panel === target));
    });
  });

  // ── 7. LIVE INTERACTIVE SHELL ───────────────────────
  const termForm = document.getElementById('term-form');
  const termInput = document.getElementById('term-input');
  const termOutput = document.getElementById('term-output');

  const commands = {
    help: 'available: whoami, stack, status, aws, docker, clear',
    whoami: 'ashwin biju — cloud & linux systems engineer (b.tech cse 2026, kerala)',
    stack: 'linux (ubuntu/debian, systemd) | aws (ec2, s3, ebs) | docker | python | tf.js',
    status: '[ok] open to entry-level devops, cloud support & linux sysadmin roles.',
    aws: 'ec2 provisioning, ssh key-pair hardening, ebs volumes, s3 fundamentals.',
    docker: 'container lifecycle, custom images, docker hub registry workflows.',
  };

  function runTermCmd(raw) {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;
    if (cmd === 'clear') {
      termOutput.innerHTML = '';
      return;
    }
    const line1 = document.createElement('div');
    line1.innerHTML = `<span class="t-prompt">$</span> ${cmd}`;
    termOutput.appendChild(line1);

    const line2 = document.createElement('div');
    line2.style.color = '#fafafa';
    line2.textContent = commands[cmd] || `command not found: ${cmd}. try 'help'.`;
    termOutput.appendChild(line2);
    termOutput.scrollTop = termOutput.scrollHeight;
  }

  if (termForm) {
    termForm.addEventListener('submit', (e) => {
      e.preventDefault();
      runTermCmd(termInput.value);
      termInput.value = '';
    });
  }

  document.querySelectorAll('.term-quick button').forEach((btn) => {
    btn.addEventListener('click', () => runTermCmd(btn.dataset.cmd));
  });

  // ── 8. CASE STUDY INTERACTIVE SIMULATORS ────────────
  const simSF = document.getElementById('sim-secureflow');
  const sfLog = document.getElementById('sf-log');
  const sfBadge = document.getElementById('sf-badge');
  if (simSF && sfLog) {
    simSF.addEventListener('click', () => {
      sfBadge.textContent = 'INTERCEPTING';
      sfLog.textContent = '> [TF.JS] Malicious redirect score: 0.96 -> BLOCKED via DNR';
      setTimeout(() => { sfBadge.textContent = 'SHIELD ARMED'; }, 2400);
    });
  }

  const simCL = document.getElementById('sim-cloudlab');
  const clLog = document.getElementById('cl-log');
  const clBadge = document.getElementById('cl-badge');
  if (simCL && clLog) {
    simCL.addEventListener('click', () => {
      clBadge.textContent = 'PROBING...';
      clLog.textContent = '> [OK] systemd: 42 units active | docker: 2 running | s3: synced';
      setTimeout(() => { clBadge.textContent = 'EC2 HEALTHY'; }, 2400);
    });
  }

  // ── 9. COMMAND PALETTE (⌘K / Ctrl+K) ────────────────
  const cmdBackdrop = document.getElementById('cmd-backdrop');
  const cmdTrigger = document.getElementById('cmd-trigger');
  const cmdInput = document.getElementById('cmd-input');
  const cmdItems = document.querySelectorAll('.cmd-item');
  const toast = document.getElementById('toast');

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function toggleCmd(open) {
    if (!cmdBackdrop) return;
    cmdBackdrop.classList.toggle('open', open);
    if (open && cmdInput) {
      cmdInput.value = '';
      cmdItems.forEach((i) => (i.style.display = 'flex'));
      setTimeout(() => cmdInput.focus(), 50);
    }
  }

  if (cmdTrigger) cmdTrigger.addEventListener('click', () => toggleCmd(true));
  if (cmdBackdrop) {
    cmdBackdrop.addEventListener('click', (e) => {
      if (e.target === cmdBackdrop) toggleCmd(false);
    });
  }

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      toggleCmd(!cmdBackdrop.classList.contains('open'));
    } else if (e.key === 'Escape') {
      toggleCmd(false);
    }
  });

  if (cmdInput) {
    cmdInput.addEventListener('input', () => {
      const q = cmdInput.value.toLowerCase();
      cmdItems.forEach((item) => {
        item.style.display = item.textContent.toLowerCase().includes(q) ? 'flex' : 'none';
      });
    });
  }

  cmdItems.forEach((item) => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      toggleCmd(false);
      if (action === 'scroll') scrollToTarget(item.dataset.target);
      else if (action === 'copy') {
        navigator.clipboard?.writeText(item.dataset.value);
        showToast('Email copied to clipboard');
      } else if (action === 'link') {
        window.open(item.dataset.url, '_blank', 'noopener,noreferrer');
      }
    });
  });

  const copyEmailBtn = document.getElementById('copy-email-btn');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', () => {
      navigator.clipboard?.writeText('ashcreations218@gmail.com');
      showToast('ashcreations218@gmail.com copied');
    });
  }

  // Back to Top Button
  const btnBackToTop = document.getElementById('btn-back-to-top');
  if (btnBackToTop) {
    btnBackToTop.addEventListener('click', () => {
      scrollToTarget('#hero-stage-wrap');
    });
  }

  // ── 10. MAGNETIC BUTTONS & DOCK MAGNIFICATION ───────
  if (window.innerWidth >= 768) {
    document.querySelectorAll('.magnetic').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.2;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.2;
        btn.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0, 0)';
      });
    });

    const dock = document.getElementById('dock');
    const dockItems = document.querySelectorAll('.dock-item');
    if (dock && dockItems.length) {
      dock.addEventListener('mousemove', (e) => {
        dockItems.forEach((item) => {
          const r = item.getBoundingClientRect();
          const dist = Math.abs(e.clientX - (r.left + r.width / 2));
          const scale = Math.max(1, 1.38 - dist / 140);
          item.style.transform = `translateY(${-(scale - 1) * 14}px) scale(${scale})`;
        });
      });
      dock.addEventListener('mouseleave', () => {
        dockItems.forEach((item) => {
          item.style.transform = 'translateY(0) scale(1)';
        });
      });
    }
  }
});
