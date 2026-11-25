/* ═══════════════════════════════════════════════════
   CUSTOM CURSOR — Precision Kinetic Reticle
   Smooth spring-lerp follow, velocity tilt & particle-field sync
═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  const wrap = document.getElementById('cursor-wrap');
  const core = document.getElementById('cursor-core');
  const reticle = document.getElementById('cursor-reticle');
  const aura = document.getElementById('cursor-aura');

  if (!wrap || !core || !reticle || !aura) return;

  let hasMoved = false;
  let targetX = -100, targetY = -100;
  let coreX = -100, coreY = -100;
  let retX = -100, retY = -100;
  let auraX = -100, auraY = -100;
  let prevX = -100, prevY = -100;
  let rotAngle = 0;

  function onMove(e) {
    targetX = e.clientX;
    targetY = e.clientY;
    if (!hasMoved) {
      hasMoved = true;
      coreX = retX = auraX = prevX = targetX;
      coreY = retY = auraY = prevY = targetY;
      wrap.classList.add('active');
      wrap.style.opacity = '1';
    }
  }

  function onLeave() {
    wrap.classList.remove('active');
  }

  function onEnter() {
    if (hasMoved) wrap.classList.add('active');
  }

  function tick() {
    if (hasMoved) {
      // Core follows crisply
      coreX += (targetX - coreX) * 0.48;
      coreY += (targetY - coreY) * 0.48;

      // Reticle follows with subtle kinetic lag
      retX += (targetX - retX) * 0.2;
      retY += (targetY - retY) * 0.2;

      // Aura trails softly
      auraX += (targetX - auraX) * 0.1;
      auraY += (targetY - auraY) * 0.1;

      // Velocity-based subtle rotation when moving fast
      const vx = targetX - prevX;
      const vy = targetY - prevY;
      const speed = Math.hypot(vx, vy);
      prevX += vx * 0.25;
      prevY += vy * 0.25;

      const targetRot = window.__particlesRepelling ? rotAngle + 0.65 : Math.min(speed * 0.35, 18);
      rotAngle += (targetRot - rotAngle) * 0.12;

      core.style.left = coreX + 'px';
      core.style.top = coreY + 'px';

      reticle.style.left = retX + 'px';
      reticle.style.top = retY + 'px';
      reticle.style.transform = `translate(-50%, -50%) rotate(${rotAngle.toFixed(2)}deg)`;

      aura.style.left = auraX + 'px';
      aura.style.top = auraY + 'px';

      if (window.__particlesRepelling) {
        wrap.classList.add('interacting');
      } else {
        wrap.classList.remove('interacting');
      }
    }

    requestAnimationFrame(tick);
  }

  window.addEventListener('mousemove', onMove, { passive: true });
  document.addEventListener('mouseleave', onLeave);
  document.addEventListener('mouseenter', onEnter);
  tick();

  // Hide custom cursor on touch devices
  window.addEventListener('touchstart', function () {
    wrap.style.display = 'none';
  }, { once: true });

})();
