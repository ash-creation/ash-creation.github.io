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

    // Page 2 (#craft) — Crisp Entrance (No Blur While Reading) + Synced SVG Beam & Node Progression
    const archWrap = document.getElementById('arch-diagram-wrap');
    if (archWrap) {
      gsap.fromTo(
        archWrap,
        { opacity: 0.2, scale: 0.95, y: 28 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: archWrap,
            start: 'top 95%',
            end: 'top 76%',
            scrub: true,
          },
        }
      );
    }

    // Interactive Architecture Node Highlighting + Well-Timed Scroll Progression
    const archNodes = document.querySelectorAll('.arch-node');
    const archHls = document.querySelectorAll('.as-hl');
    const archPipeProgress = document.getElementById('arch-pipe-progress');
    const archOrder = ['git', 'docker', 'k8s', 'aws', 'net', 'linux'];

    let pipeLength = 0;
    if (archPipeProgress && typeof archPipeProgress.getTotalLength === 'function') {
      pipeLength = archPipeProgress.getTotalLength();
      archPipeProgress.style.strokeDasharray = `${pipeLength}`;
      archPipeProgress.style.strokeDashoffset = `${pipeLength}`;
    }

    function activateArchNode(key) {
      archNodes.forEach((n) => n.classList.toggle('active', n.dataset.node === key));
      archHls.forEach((h) => h.classList.toggle('active', h.dataset.for === key));
    }

    archNodes.forEach((node) => {
      node.addEventListener('mouseenter', () => {
        if (!document.body.classList.contains('is-scrolling')) {
          activateArchNode(node.dataset.node);
        }
      });
      node.addEventListener('click', () => activateArchNode(node.dataset.node));
    });

    if (archWrap) {
      ScrollTrigger.create({
        trigger: archWrap,
        start: 'top 72%',
        end: 'bottom 28%',
        scrub: true,
        onUpdate: (self) => {
          const p = Math.max(0, Math.min(1, self.progress));
          const idx = Math.min(archOrder.length - 1, Math.floor(p * archOrder.length));
          activateArchNode(archOrder[idx]);
          if (pipeLength > 0 && archPipeProgress) {
            archPipeProgress.style.strokeDashoffset = `${pipeLength * (1 - p)}`;
          }
        },
      });
    }

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
