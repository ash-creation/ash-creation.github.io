/* ═══════════════════════════════════════════════════
   MAIN.JS — Unslopped Interactions, Dossier Switcher,
   Gallery/Index Toggle & Architecture Inspector
═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // ── 0. MINIMAL PRELOADER ────────────────────────────
  const preloader = document.getElementById('preloader');
  const preCounter = document.getElementById('pre-counter');
  if (preloader && preCounter) {
    let val = 0;
    const step = setInterval(() => {
      val = Math.min(100, val + 20);
      preCounter.textContent = String(val).padStart(3, '0');
      if (val >= 100) {
        clearInterval(step);
        setTimeout(() => preloader.classList.add('done'), 120);
      }
    }, 35);
  }

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
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
    });
    if (typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  function scrollToTarget(selector) {
    const el = document.querySelector(selector);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -64 });
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

  // ── 3. SCROLL NAV TRACKING & SUBTLE ENTRANCE ────────
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    const navLinks = document.querySelectorAll('.header-nav a[data-sec]');
    ['#about', '#works', '#architecture', '#trajectory', '#contact'].forEach((sel) => {
      const sec = document.querySelector(sel);
      if (!sec) return;
      const id = sel.replace('#', '');
      const setActive = () => {
        navLinks.forEach((a) => a.classList.toggle('active', a.dataset.sec === id));
      };
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 55%',
        end: 'bottom 55%',
        onEnter: setActive,
        onEnterBack: setActive,
      });
    });

    gsap.utils.toArray('.work-piece, .ledger-row').forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0.25, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: 'power3.out',
          clearProps: 'transform',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }
      );
    });

    setTimeout(() => ScrollTrigger.refresh(), 400);
  }

  // ── 4. ABOUT DOSSIER TAB SWITCHER ───────────────────
  const dossierData = {
    cloud: {
      code: 'ENV // AP-SOUTH-1',
      tag: 'Infrastructure',
      title: 'Hardened Linux & Elastic AWS',
      desc: 'Provisioning Ubuntu/Debian EC2 instances with key-only SSH, segmented /24 CIDR subnets, EBS & S3 storage sync, and supervised systemd daemons.',
      metrics: [
        ['Compute', 'AWS EC2 · Ubuntu'],
        ['Storage', 'EBS + S3 Sync'],
        ['Init System', 'systemd units'],
        ['Networking', 'CIDR /24 + UFW'],
      ],
    },
    containers: {
      code: 'RUNTIME // OCI-ALPINE',
      tag: 'Orchestration',
      title: 'Immutable Containers & K8s',
      desc: 'Building minimal non-root Alpine images with multi-stage Dockerfiles, health checks, and declarative Kubernetes rollouts that self-heal.',
      metrics: [
        ['Base Image', 'Alpine non-root'],
        ['Registry', 'Docker Hub'],
        ['Scheduler', 'Kubernetes Pods'],
        ['Strategy', 'RollingUpdate'],
      ],
    },
    security: {
      code: 'DEFENSE // ZERO-LATENCY',
      tag: 'Security',
      title: 'Client ML & Host Hardening',
      desc: 'Combining local TensorFlow.js inference and Chrome DNR rules in Secure Flow with strict Linux privilege boundaries and TLS 1.3.',
      metrics: [
        ['Inference', 'TensorFlow.js Local'],
        ['Enforcement', 'Chrome MV3 DNR'],
        ['Intel', 'Safe Browsing + VT'],
        ['Host Policy', 'ed25519 + NoNewPrivs'],
      ],
    },
  };

  const dTabs = document.querySelectorAll('.d-tab');
  const dCode = document.getElementById('dossier-code');
  const dTag = document.getElementById('dossier-tag');
  const dTitle = document.getElementById('dossier-title');
  const dDesc = document.getElementById('dossier-desc');
  const dMetrics = document.getElementById('dossier-metrics');

  dTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const key = tab.dataset.dossier;
      const data = dossierData[key];
      if (!data) return;

      dTabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      if (dCode) dCode.textContent = data.code;
      if (dTag) dTag.textContent = data.tag;
      if (dTitle) dTitle.textContent = data.title;
      if (dDesc) dDesc.textContent = data.desc;
      if (dMetrics) {
        dMetrics.innerHTML = data.metrics
          .map(([label, val]) => `<div class="dm-cell"><span>${label}</span><strong>${val}</strong></div>`)
          .join('');
      }
    });
  });

  // ── 5. GALLERY / INDEX VIEW TOGGLE ──────────────────
  const vtBtns = document.querySelectorAll('.vt-btn');
  const galleryEl = document.getElementById('works-gallery');
  const indexEl = document.getElementById('works-index');

  vtBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      vtBtns.forEach((b) => {
        const isAct = b === btn;
        b.classList.toggle('active', isAct);
        b.setAttribute('aria-selected', isAct ? 'true' : 'false');
      });
      if (galleryEl && indexEl) {
        galleryEl.classList.toggle('hidden', view !== 'gallery');
        indexEl.classList.toggle('hidden', view !== 'index');
      }
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    });
  });

  // ── 6. INTERACTIVE SYSTEMS ARCHITECTURE ─────────────
  const archSpecs = {
    git: {
      file: 'git-workflow.sh',
      tag: 'Source',
      code: `git checkout -b feat/hardened-nginx\ngit commit -S -m "chore(infra): enforce tls 1.3"\ngit tag -a v2.4.0 -m "production release"\ngit push origin v2.4.0`,
      note: 'Every push initiates reproducible container builds, automated health checks, and zero-downtime rollouts.',
    },
    docker: {
      file: 'Dockerfile',
      tag: 'Containers',
      code: `FROM node:20-alpine AS runner\nRUN addgroup -S app && adduser -S app -G app\nCOPY --chown=app:app dist/ /srv/app/\nUSER app\nHEALTHCHECK CMD wget -qO- http://localhost:8080/healthz`,
      note: 'Minimal non-root Alpine images keep the attack surface tight and cold-start times predictable.',
    },
    k8s: {
      file: 'deployment.yaml',
      tag: 'Orchestration',
      code: `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: edge-gateway\nspec:\n  replicas: 3\n  strategy:\n    type: RollingUpdate`,
      note: 'Declarative replica sets with liveness probes automatically reschedule unhealthy pods.',
    },
    aws: {
      file: 'ec2-provision.tf',
      tag: 'Cloud',
      code: `resource "aws_instance" "node" {\n  ami           = "ami-0f5ee92e2d63afc18"\n  instance_type = "t3.micro"\n  ebs_optimized = true\n  tags = { Region = "ap-south-1" }\n}`,
      note: 'Provisioned in ap-south-1 with encrypted EBS volumes and automated S3 artifact backups.',
    },
    net: {
      file: 'vpc-subnet.conf',
      tag: 'Network',
      code: `VPC_CIDR="192.168.0.0/16"\nPUBLIC_SUBNET="192.168.10.0/24"\nSSH_POLICY="ed25519 key-only, PasswordAuthentication no"\nFIREWALL="ufw allow 22/tcp, 443/tcp"`,
      note: 'Segmented /24 subnets with strict ingress rules and key-only SSH authentication.',
    },
    linux: {
      file: 'nginx-app.service',
      tag: 'Kernel',
      code: `[Unit]\nDescription=Hardened Reverse Proxy\nAfter=network-online.target\n[Service]\nRestart=always\nNoNewPrivileges=true\nProtectSystem=strict`,
      note: 'Hardened systemd units supervise processes with capability bounding and automatic recovery.',
    },
  };

  const archItems = document.querySelectorAll('#arch-list .arch-item');
  const aiFile = document.getElementById('ai-file');
  const aiTag = document.getElementById('ai-tag');
  const aiCode = document.getElementById('ai-code');
  const aiNote = document.getElementById('ai-note');

  function selectArch(key) {
    const spec = archSpecs[key];
    if (!spec) return;
    archItems.forEach((item) => item.classList.toggle('active', item.dataset.node === key));
    if (aiFile) aiFile.textContent = spec.file;
    if (aiTag) aiTag.textContent = spec.tag;
    if (aiCode) aiCode.innerHTML = `<code>${spec.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>`;
    if (aiNote) aiNote.textContent = spec.note;
  }

  archItems.forEach((item) => {
    item.addEventListener('click', () => selectArch(item.dataset.node));
  });

  // ── 7. CASE STUDY DIAGNOSTIC PROBES ─────────────────
  const simSF = document.getElementById('sim-secureflow');
  const sfLog = document.getElementById('sf-log');
  const sfBadge = document.getElementById('sf-badge');
  if (simSF && sfLog && sfBadge) {
    simSF.addEventListener('click', () => {
      sfBadge.textContent = 'Intercepting';
      sfLog.textContent = '> [TF.JS] Malicious redirect score: 0.96 -> BLOCKED via DNR (1.4ms)';
      setTimeout(() => { sfBadge.textContent = 'Shield Armed'; }, 2400);
    });
  }

  const simCL = document.getElementById('sim-cloudlab');
  const clLog = document.getElementById('cl-log');
  const clBadge = document.getElementById('cl-badge');
  if (simCL && clLog && clBadge) {
    simCL.addEventListener('click', () => {
      clBadge.textContent = 'Probing';
      clLog.textContent = '> [OK] systemd: 42 units active | docker: 2 running | s3: synced';
      setTimeout(() => { clBadge.textContent = 'EC2 Healthy'; }, 2400);
    });
  }

  // ── 8. COMMAND PALETTE (⌘K) ─────────────────────────
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
    cmdBackdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
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
        showToast('ashcreations218@gmail.com copied');
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

  const btnBackToTop = document.getElementById('btn-back-to-top');
  if (btnBackToTop) {
    btnBackToTop.addEventListener('click', () => scrollToTarget('#hero'));
  }
});
