  
    /* LOADER */
    (function () {
      const canvas = document.getElementById('lc');
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setSize(200, 200);
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      const scene = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
      cam.position.z = 3.2;
      const COUNT = 280, geo = new THREE.BufferGeometry(), pos = new Float32Array(COUNT * 3);
      for (let i = 0; i < COUNT; i++) {
        const phi = Math.acos(2 * Math.random() - 1), theta = Math.random() * Math.PI * 2, r = 1 + (Math.random() - 0.5) * 0.35;
        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i * 3 + 2] = r * Math.cos(phi);
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x5bb8f5, size: 0.045, transparent: true, opacity: 0.8, sizeAttenuation: true }));
      scene.add(pts);
      let raf;
      const tick = () => { raf = requestAnimationFrame(tick); pts.rotation.y += 0.004; pts.rotation.x += 0.0015; renderer.render(scene, cam) };
      tick();
      const bar = document.getElementById('lbar');
      let prog = 0;
      const iv = setInterval(() => { prog = Math.min(prog + Math.random() * 8, 90); bar.style.width = prog + '%' }, 70);
      const dismiss = () => {
        clearInterval(iv); bar.style.width = '100%';
        setTimeout(() => { document.getElementById('loader').classList.add('done'); cancelAnimationFrame(raf); renderer.dispose() }, 400);
      };
      Promise.all([document.fonts.ready, new Promise(r => setTimeout(r, 1800))]).then(dismiss);
    })();

    /* NAV */
    const nav = document.getElementById('nav');
    window.addEventListener('scroll', () => nav.classList.toggle('stuck', scrollY > 30), { passive: true });

    /* COUNTER — triggers when stats bar enters viewport */
    function fmt(n) {
      if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
      if (n >= 1000) return Math.round(n / 1000) + 'K';
      return String(n);
    }
    function animCount(el, target, delay) {
      setTimeout(() => {
        const dur = 1800, t0 = performance.now();
        const tick = now => {
          const p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
          el.textContent = fmt(Math.floor(target * e));
          if (p < 1) requestAnimationFrame(tick); else el.textContent = fmt(target);
        };
        requestAnimationFrame(tick);
      }, delay || 0);
    }
    let counted = false;
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !counted) {
        counted = true;
        document.querySelectorAll('[data-count]').forEach((el, i) => animCount(el, +el.dataset.count, i * 80));
      }
    }, { threshold: 0.4 }).observe(document.querySelector('.stats-bar'));

    /* REVEAL */
    const ro = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') }), { threshold: 0.08 });
    document.querySelectorAll('.rv').forEach(el => ro.observe(el));

    /* MARQUEE CLONE — duplicate each row for seamless loop */
    ['row1', 'row2'].forEach(id => {
      const row = document.getElementById(id);
      row.innerHTML += row.innerHTML;
    });

    /* CARD TILT */
    document.querySelectorAll('.icard,.srow').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(600px) rotateX(${-y * 3}deg) rotateY(${x * 3}deg) translateY(-2px)`;
      });
      card.addEventListener('mouseleave', () => card.style.transform = '');
    });
