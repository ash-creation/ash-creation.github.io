/* ═══════════════════════════════════════════════════
   THREE-SCENE.JS — ReactBits Silk-Beams WebGL Shader
   + Interactive PixelCard Canvas
═══════════════════════════════════════════════════ */

(function () {
  // ── 1. HERO SILK / LIGHT-BEAMS SHADER (+ 2D FALLBACK) ─
  const heroCanvas = document.getElementById('hero-canvas');
  if (heroCanvas) {
    let webglReady = false;
    if (typeof THREE !== 'undefined') {
      try {
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        camera.position.z = 1;

        const renderer = new THREE.WebGLRenderer({
          canvas: heroCanvas,
          alpha: true,
          antialias: true,
        });
        webglReady = true;
        const dpr = Math.min(window.devicePixelRatio, 2);
        renderer.setPixelRatio(dpr);
        renderer.setSize(window.innerWidth, window.innerHeight);

        const uniforms = {
          u_time: { value: 0 },
          u_resolution: { value: new THREE.Vector2(window.innerWidth * dpr, window.innerHeight * dpr) },
          u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
          u_scroll: { value: 0 },
        };

        const geo = new THREE.PlaneGeometry(2, 2);
        const mat = new THREE.ShaderMaterial({
          uniforms,
          transparent: true,
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform vec2 u_mouse;
            uniform float u_scroll;
            varying vec2 vUv;

            float hash(vec2 p) {
              return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
            }

            float noise(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              f = f * f * (3.0 - 2.0 * f);
              return mix(
                mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
                f.y
              );
            }

            void main() {
              vec2 uv = vUv;
              float aspect = u_resolution.x / u_resolution.y;
              vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
              vec2 m = (u_mouse - 0.5) * vec2(aspect, 1.0);
              float t = u_time * 0.22;

              float wave1 = sin(p.x * 2.4 + t + noise(p * 1.8 + t * 0.5) * 2.2 + u_scroll * 1.5);
              float ribbon1 = exp(-abs(p.y - wave1 * 0.22) * 5.5);

              float wave2 = cos(p.x * 1.8 - t * 0.8 + noise(p * 2.2 - t * 0.3) * 1.8);
              float ribbon2 = exp(-abs(p.y - wave2 * 0.28 + 0.15) * 6.5);

              float mDist = length(p - m);
              float cursorLight = exp(-mDist * 2.6) * 0.28;

              vec3 base = vec3(0.035, 0.035, 0.043);
              vec3 platinum = vec3(0.85, 0.88, 0.94);
              vec3 cobalt = vec3(0.23, 0.51, 0.96);

              vec3 col = base;
              col += cobalt * ribbon1 * 0.16;
              col += platinum * ribbon2 * 0.07;
              col += cobalt * cursorLight * 0.35;

              vec2 grid = abs(fract(p * 8.0) - 0.5);
              float gridLine = smoothstep(0.48, 0.5, max(grid.x, grid.y)) * 0.035;
              col += platinum * gridLine * (0.3 + cursorLight * 2.0);

              float vig = smoothstep(1.1, 0.15, length(uv - 0.5));
              gl_FragColor = vec4(col * vig, 1.0);
            }
          `,
        });

        const mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);

        let tx = 0.5, ty = 0.5, cx = 0.5, cy = 0.5;
        document.addEventListener('mousemove', (e) => {
          tx = e.clientX / window.innerWidth;
          ty = 1.0 - e.clientY / window.innerHeight;
        });

        window.addEventListener('scroll', () => {
          uniforms.u_scroll.value = Math.min(1.5, window.scrollY / (window.innerHeight || 1));
        });

        const clock = new THREE.Clock();
        function animate() {
          requestAnimationFrame(animate);
          uniforms.u_time.value = clock.getElapsedTime();
          cx += (tx - cx) * 0.06;
          cy += (ty - cy) * 0.06;
          uniforms.u_mouse.value.set(cx, cy);
          renderer.render(scene, camera);
        }
        animate();

        window.addEventListener('resize', () => {
          const ndpr = Math.min(window.devicePixelRatio, 2);
          renderer.setPixelRatio(ndpr);
          renderer.setSize(window.innerWidth, window.innerHeight);
          uniforms.u_resolution.value.set(window.innerWidth * ndpr, window.innerHeight * ndpr);
        });
      } catch (_err) {
        webglReady = false;
      }
    }

    // Smooth 2D Canvas Silk-Beams fallback when WebGL context is unavailable
    if (!webglReady) {
      const ctx = heroCanvas.getContext('2d');
      if (ctx) {
        let w = (heroCanvas.width = window.innerWidth);
        let h = (heroCanvas.height = window.innerHeight);
        let mx = w * 0.6;
        let my = h * 0.45;

        window.addEventListener('resize', () => {
          w = heroCanvas.width = window.innerWidth;
          h = heroCanvas.height = window.innerHeight;
        });
        document.addEventListener('mousemove', (e) => {
          mx += (e.clientX - mx) * 0.12;
          my += (e.clientY - my) * 0.12;
        });

        function drawFallback(time) {
          const t = time * 0.0006;
          ctx.fillStyle = '#09090b';
          ctx.fillRect(0, 0, w, h);

          // Architectural silk ribbons
          for (let b = 0; b < 2; b++) {
            ctx.beginPath();
            for (let x = 0; x <= w; x += 24) {
              const y =
                h * (0.48 + b * 0.08) +
                Math.sin(x * 0.0035 + t + b * 1.4) * 90 +
                Math.cos(x * 0.002 - t * 0.7) * 45;
              if (x === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = b === 0 ? 'rgba(96, 165, 250, 0.18)' : 'rgba(255, 255, 255, 0.07)';
            ctx.lineWidth = b === 0 ? 48 : 28;
            ctx.filter = 'blur(26px)';
            ctx.stroke();
            ctx.filter = 'none';
          }

          // Subtle cursor radial glow
          const grad = ctx.createRadialGradient(mx, my, 0, mx, my, 340);
          grad.addColorStop(0, 'rgba(96, 165, 250, 0.14)');
          grad.addColorStop(1, 'rgba(9, 9, 11, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);

          requestAnimationFrame(drawFallback);
        }
        requestAnimationFrame(drawFallback);
      }
    }
  }

  // ── 2. REACTBITS PIXEL-CARD CANVAS ──────────────────
  const pixelCard = document.getElementById('pixel-card');
  const pixelCanvas = document.getElementById('pixel-canvas');
  if (pixelCard && pixelCanvas) {
    const ctx = pixelCanvas.getContext('2d');
    let w = 0, h = 0;
    let mx = -999, my = -999;
    let active = false;

    const resizePixel = () => {
      const rect = pixelCard.getBoundingClientRect();
      w = pixelCanvas.width = rect.width;
      h = pixelCanvas.height = rect.height;
    };
    resizePixel();
    window.addEventListener('resize', resizePixel);

    pixelCard.addEventListener('mouseenter', () => { active = true; });
    pixelCard.addEventListener('mouseleave', () => { active = false; mx = -999; my = -999; });
    pixelCard.addEventListener('mousemove', (e) => {
      const rect = pixelCard.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
    });

    const step = 14;
    function drawPixels(time) {
      ctx.clearRect(0, 0, w, h);
      for (let x = 6; x < w; x += step) {
        for (let y = 6; y < h; y += step) {
          const dist = Math.hypot(x - mx, y - my);
          const wave = Math.sin(x * 0.05 + y * 0.05 + time * 0.002) * 0.5 + 0.5;
          let alpha = 0.04 + wave * 0.04;
          if (active && dist < 110) {
            alpha += (1 - dist / 110) * 0.55;
          }
          ctx.fillStyle = `rgba(96, 165, 250, ${alpha})`;
          ctx.fillRect(x, y, 4, 4);
        }
      }
      requestAnimationFrame(drawPixels);
    }
    requestAnimationFrame(drawPixels);
  }
})();
