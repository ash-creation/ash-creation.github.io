/* ═══════════════════════════════════════════════════
   MAIN.JS — Theme Polarity, Interactive Pipeline,
   Gallery/Index Toggle & Command Menu
═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
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

  // ── 2. THEME POLARITY (SCROLL + MANUAL TOGGLE) ──────
  let manualTheme = null; // null = auto by scroll, 'light' | 'dark' = manual override
  const themeToggleBtn = document.getElementById('theme-toggle');
  const iconMoon = document.getElementById('theme-icon-moon');
  const iconSun = document.getElementById('theme-icon-sun');
  const worksSection = document.getElementById('works');

  function applyTheme(mode) {
    const isDark = mode === 'dark';
    document.body.classList.toggle('theme-dark', isDark);
    document.body.classList.toggle('theme-light', !isDark);
    if (iconMoon && iconSun) {
      iconMoon.classList.toggle('hidden', isDark);
      iconSun.classList.toggle('hidden', !isDark);
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', isDark ? '#0B0F17' : '#F4F6F8');
  }

  function toggleManualTheme() {
    const currentlyDark = document.body.classList.contains('theme-dark');
    manualTheme = currentlyDark ? 'light' : 'dark';
    applyTheme(manualTheme);
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleManualTheme);
  }

  // Smoothly switch theme on scroll unless user manually locked a theme
  const navLinks = document.querySelectorAll('.header-nav a[data-sec]');
  const trackedSections = ['#works', '#architecture', '#trajectory', '#contact']
    .map((sel) => document.querySelector(sel))
    .filter(Boolean);

  function onScrollUpdate() {
    if (manualTheme === null && worksSection) {
      const rect = worksSection.getBoundingClientRect();
      applyTheme(rect.top < window.innerHeight * 0.55 ? 'dark' : 'light');
    }

    let currentId = '';
    const mid = window.innerHeight * 0.45;
    trackedSections.forEach((sec) => {
      const r = sec.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) currentId = sec.id;
    });
    navLinks.forEach((a) => a.classList.toggle('active', a.dataset.sec === currentId));
  }

  window.addEventListener('scroll', onScrollUpdate, { passive: true });
  onScrollUpdate();

  // ── 3. GALLERY / INDEX VIEW TOGGLE ──────────────────
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
    });
  });

  // ── 4. INTERACTIVE SYSTEMS ARCHITECTURE + LIVE PIPELINE ─
  const archOrder = ['git', 'docker', 'k8s', 'aws', 'net', 'linux'];
  const archSpecs = {
    git: {
      num: '01',
      file: 'git-workflow.sh',
      tag: 'Source',
      code: `git checkout -b feat/hardened-nginx\ngit commit -S -m "chore(infra): enforce tls 1.3"\ngit tag -a v2.4.0 -m "production release"\ngit push origin v2.4.0`,
      note: 'Every push initiates reproducible container builds, automated health checks, and zero-downtime rollouts.',
    },
    docker: {
      num: '02',
      file: 'Dockerfile',
      tag: 'Containers',
      code: `FROM node:20-alpine AS runner\nRUN addgroup -S app && adduser -S app -G app\nCOPY --chown=app:app dist/ /srv/app/\nUSER app\nHEALTHCHECK CMD wget -qO- http://localhost:8080/healthz`,
      note: 'Minimal non-root Alpine images keep the attack surface tight and cold-start times predictable.',
    },
    k8s: {
      num: '03',
      file: 'deployment.yaml',
      tag: 'Orchestration',
      code: `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: edge-gateway\nspec:\n  replicas: 3\n  strategy:\n    type: RollingUpdate`,
      note: 'Declarative replica sets with liveness probes automatically reschedule unhealthy pods.',
    },
    aws: {
      num: '04',
      file: 'ec2-provision.tf',
      tag: 'Cloud',
      code: `resource "aws_instance" "node" {\n  ami           = "ami-0f5ee92e2d63afc18"\n  instance_type = "t3.micro"\n  ebs_optimized = true\n  tags = { Region = "ap-south-1" }\n}`,
      note: 'Provisioned in ap-south-1 with encrypted EBS volumes and automated S3 artifact backups.',
    },
    net: {
      num: '05',
      file: 'vpc-subnet.conf',
      tag: 'Network',
      code: `VPC_CIDR="192.168.0.0/16"\nPUBLIC_SUBNET="192.168.10.0/24"\nSSH_POLICY="ed25519 key-only, PasswordAuthentication no"\nFIREWALL="ufw allow 22/tcp, 443/tcp"`,
      note: 'Segmented /24 subnets with strict ingress rules and key-only SSH authentication.',
    },
    linux: {
      num: '06',
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
  const psFill = document.getElementById('ps-fill');
  const psStatus = document.getElementById('ps-status');
  const aiCopyBtn = document.getElementById('ai-copy-btn');
  const runPipelineBtn = document.getElementById('run-pipeline-btn');
  const runPipelineLabel = document.getElementById('run-pipeline-label');

  let activeArchKey = 'git';
  let pipelineTimer = null;

  function selectArch(key) {
    const spec = archSpecs[key];
    if (!spec) return;
    activeArchKey = key;
    archItems.forEach((item) => item.classList.toggle('active', item.dataset.node === key));
    if (aiFile) aiFile.textContent = spec.file;
    if (aiTag) aiTag.textContent = spec.tag;
    if (aiCode) aiCode.innerHTML = `<code>${spec.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>`;
    if (aiNote) aiNote.textContent = spec.note;

    const idx = archOrder.indexOf(key);
    if (psFill && idx >= 0) {
      psFill.style.width = `${((idx + 1) / archOrder.length) * 100}%`;
    }
    if (psStatus) {
      psStatus.textContent = `Stage ${spec.num} / 06 · ${spec.tag}`;
    }
  }

  archItems.forEach((item) => {
    item.addEventListener('click', () => {
      stopPipeline();
      selectArch(item.dataset.node);
    });
  });

  function stopPipeline() {
    if (pipelineTimer) {
      clearInterval(pipelineTimer);
      pipelineTimer = null;
    }
    if (runPipelineLabel) runPipelineLabel.textContent = 'Run pipeline';
  }

  if (runPipelineBtn) {
    runPipelineBtn.addEventListener('click', () => {
      if (pipelineTimer) {
        stopPipeline();
        return;
      }
      let step = 0;
      selectArch(archOrder[step]);
      if (runPipelineLabel) runPipelineLabel.textContent = 'Stop';
      pipelineTimer = setInterval(() => {
        step += 1;
        if (step >= archOrder.length) {
          stopPipeline();
          return;
        }
        selectArch(archOrder[step]);
      }, 1100);
    });
  }

  if (aiCopyBtn) {
    aiCopyBtn.addEventListener('click', () => {
      const spec = archSpecs[activeArchKey];
      if (!spec) return;
      navigator.clipboard?.writeText(spec.code);
      showToast(`Copied ${spec.file}`);
    });
  }

  // ── 5. COMMAND PALETTE (⌘K) & TOAST ─────────────────
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
      setTimeout(() => cmdInput.focus(), 40);
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
      if (action === 'scroll') {
        const el = document.querySelector(item.dataset.target);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else if (action === 'theme') {
        toggleManualTheme();
      } else if (action === 'copy') {
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
    btnBackToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});
