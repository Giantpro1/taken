  (function () {
    'use strict';
 
    // ── GSAP registration ────────────────────────────────────────
    gsap.registerPlugin(ScrollTrigger, TextPlugin);
 
    // ── Custom cursor ────────────────────────────────────────────
    const cursor     = document.getElementById('cursor');
    const cursorRing = document.getElementById('cursor-ring');
    let   mx = 0, my = 0, rx = 0, ry = 0;
    let   cursorRAFPending = false;
 
    window.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      // throttle: only schedule one RAF per frame
      if (!cursorRAFPending) {
        cursorRAFPending = true;
        requestAnimationFrame(() => {
          gsap.set(cursor, { x: mx - 5, y: my - 5 });
          cursorRAFPending = false;
        });
      }
    }, { passive: true });
 
    // ── Scroll progress bar ──────────────────────────────────────
    const progressBar = document.getElementById('scroll-progress');
    window.addEventListener('scroll', () => {
      const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      gsap.set(progressBar, { scaleX: pct });
    }, { passive: true });
 
    // ── Particles + cursor ring — merged into one RAF loop ────────
    const canvas = document.getElementById('particles-canvas');
    const ctx    = canvas.getContext('2d', { alpha: true });
    let   W, H, particles = [];
 
    function resizeCanvas() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', () => {
      clearTimeout(resizeCanvas._t);
      resizeCanvas._t = setTimeout(resizeCanvas, 200); // debounce resize
    });
 
    // 40 particles instead of 80 — halves canvas draw cost
    const PARTICLE_COUNT = 40;
    const COLORS = [
      [126, 244, 244],
      [107,  79, 160],
      [74,  158, 142],
      [255, 255, 255],
    ];
 
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const c = COLORS[Math.floor(Math.random() * COLORS.length)];
      particles.push({
        x:  Math.random() * window.innerWidth,
        y:  Math.random() * window.innerHeight,
        r:  Math.random() * 1.4 + 0.3,
        vx: (Math.random() - .5) * 0.18,
        vy: (Math.random() - .5) * 0.12,
        r0: c[0], g0: c[1], b0: c[2],
        alpha: Math.random() * 0.35 + 0.05,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.018 + 0.004,
      });
    }
 
    // Throttle to ~30fps: skip every other frame
    let frameSkip = false;
 
    function drawLoop() {
      requestAnimationFrame(drawLoop);
      frameSkip = !frameSkip;
      if (frameSkip) return; // run at ~30fps
 
      // Cursor ring lerp (merged here — eliminates a separate RAF)
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      gsap.set(cursorRing, { x: rx - 18, y: ry - 18 });
 
      // Particles
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.twinkle += p.twinkleSpeed;
        const a = p.alpha * (0.6 + 0.4 * Math.sin(p.twinkle));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.r0},${p.g0},${p.b0},${a.toFixed(2)})`;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -5) p.x = W + 5;
        if (p.x > W + 5) p.x = -5;
        if (p.y < -5) p.y = H + 5;
        if (p.y > H + 5) p.y = -5;
      }
    }
    drawLoop();
 
    // ── Loader sequence ──────────────────────────────────────────
    const loader    = document.getElementById('loader');
    const loaderBar = document.getElementById('loader-bar');
    const loaderStatus = document.getElementById('loader-status');
    const nav       = document.getElementById('nav');
 
    const statusMessages = [
      'Initializing signal...',
      'Tuning aurora frequency...',
      'Loading the archive...',
      'Signal locked. Entering.',
    ];
    let statusIdx = 0;
    let progress  = 0;
 
    const loaderInterval = setInterval(() => {
      progress += Math.random() * 18 + 5;
      if (progress > 100) progress = 100;
      loaderBar.style.width = progress + '%';
 
      const msgIdx = Math.floor((progress / 100) * (statusMessages.length - 1));
      if (msgIdx !== statusIdx) {
        statusIdx = msgIdx;
        loaderStatus.textContent = statusMessages[statusIdx];
      }
 
      if (progress >= 100) {
        clearInterval(loaderInterval);
        setTimeout(revealSite, 400);
      }
    }, 160);
 
    function revealSite() {
      gsap.to(loader, {
        opacity: 0, duration: 1, ease: 'power2.inOut',
        onComplete: () => {
          loader.style.display = 'none';
          startHeroAnim();
        }
      });
    }
 
    function startHeroAnim() {
      // Nav
      gsap.to(nav, { opacity: 1, duration: .8, ease: 'power2.out' });
 
      // Hero sequence
      const tl = gsap.timeline({ delay: .1 });
      tl.to('#hero-eyebrow', {
        opacity: 1, y: 0, duration: .8, ease: 'power3.out'
      })
      .to('#hero-headline', {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out'
      }, '-=.4')
      .to('#hero-sub', {
        opacity: 1, y: 0, duration: .8, ease: 'power3.out'
      }, '-=.5')
      .to('#hero-actions', {
        opacity: 1, y: 0, duration: .8, ease: 'power3.out'
      }, '-=.4')
      .to('#hero-stats', {
        opacity: 1, y: 0, duration: .8, ease: 'power3.out'
      }, '-=.4');
 
      // Animate stat counters
      document.querySelectorAll('.stat-value').forEach(el => {
        const target = parseFloat(el.dataset.count);
        const unit   = el.querySelector('span') ? el.querySelector('span').outerHTML : '';
        const isDecimal = String(target).includes('.');
        gsap.to({ val: 0 }, {
          val: target,
          duration: 2,
          delay: 1.2,
          ease: 'power2.out',
          onUpdate: function () {
            const v = isDecimal ? this.targets()[0].val.toFixed(1) : Math.round(this.targets()[0].val);
            el.innerHTML = v + unit;
          }
        });
      });
    }
 
    // ── ScrollTrigger: section fades ────────────────────────────
    gsap.utils.toArray('.section-fade').forEach(el => {
      gsap.fromTo(el,
        { opacity: 0, y: 50 },
        {
          opacity: 1, y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          }
        }
      );
    });
 
    // ── ScrollTrigger: metric bars ───────────────────────────────
    document.querySelectorAll('.metric-bar-fill').forEach(bar => {
      const targetWidth = bar.dataset.width + '%';
      ScrollTrigger.create({
        trigger: bar,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to(bar, { width: targetWidth, duration: 1.5, ease: 'power3.out', delay: .2 });
        }
      });
    });
 
    // ── Lazy video: play/pause via IntersectionObserver ─────────
    // Videos with [data-lazy-video] only play when 20%+ visible
    const lazyVideos = document.querySelectorAll('video[data-lazy-video]');
    if ('IntersectionObserver' in window && lazyVideos.length) {
      const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const vid = entry.target;
          if (entry.isIntersecting) {
            vid.play().catch(() => {}); // play when entering viewport
          } else {
            vid.pause();               // pause when off-screen — frees GPU decoder
          }
        });
      }, { threshold: 0.15 });
 
      lazyVideos.forEach(vid => videoObserver.observe(vid));
    }
 
    // ── Parallax: video backgrounds — scrub:2 reduces update freq ─
    document.querySelectorAll('.video-bg').forEach(video => {
      const section = video.closest('.cinematic-section');
      if (!section) return;
      gsap.to(video, {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: 2, // scrub: true fires every scroll px; scrub:2 smooths & batches
        }
      });
    });
 
    // ── Nav background on scroll ─────────────────────────────────
    ScrollTrigger.create({
      start: 'top -80',
      onUpdate: self => {
        if (self.direction === 1) {
          // solid dark bg — NO backdrop-filter blur (very GPU expensive when video is behind)
          nav.style.background = 'rgba(5,13,26,0.94)';
          nav.style.borderBottom = '1px solid rgba(126,244,244,0.06)';
        } else {
          nav.style.background = '';
          nav.style.borderBottom = '';
        }
      }
    });
 
    // ── Penguin float card: subtle mouse parallax ────────────────
    const penguinCard = document.getElementById('lore-card');
    if (penguinCard) {
      window.addEventListener('mousemove', e => {
        const rx = ((e.clientX / window.innerWidth)  - .5) * 8;
        const ry = ((e.clientY / window.innerHeight) - .5) * -8;
        gsap.to(penguinCard, {
          rotateY: rx, rotateX: ry,
          duration: 1.5,
          ease: 'power3.out',
          transformPerspective: 800,
        });
      });
    }
 
    // ── Wall items: stagger on enter ────────────────────────────
    ScrollTrigger.batch('.wall-item', {
      onEnter: batch => gsap.fromTo(batch,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: .8, stagger: .08, ease: 'power3.out' }
      ),
      start: 'top 88%',
      once: true,
    });
 
    // ── Partner cards: stagger ───────────────────────────────────
    ScrollTrigger.batch('.partner-card', {
      onEnter: batch => gsap.fromTo(batch,
        { opacity: 0, scale: .97 },
        { opacity: 1, scale: 1, duration: .7, stagger: .07, ease: 'power3.out' }
      ),
      start: 'top 88%',
      once: true,
    });
 
    // ── CS cards: stagger ────────────────────────────────────────
    ScrollTrigger.batch('.cs-card', {
      onEnter: batch => gsap.fromTo(batch,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, stagger: .15, ease: 'power3.out' }
      ),
      start: 'top 85%',
      once: true,
    });
 
    // ── Smooth scroll for anchor links ───────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        gsap.to(window, {
          scrollTo: { y: target, offsetY: 0 },
          duration: 1.4,
          ease: 'power3.inOut',
        });
      });
    });
 
    // ── Gsap ScrollTo plugin fallback ───────────────────────────
    // (native smooth scroll for environments without the plugin)
    if (!gsap.plugins || !gsap.plugins.scrollTo) {
      document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
          const target = document.querySelector(a.getAttribute('href'));
          if (!target) return;
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        });
      });
    }
 
  })();