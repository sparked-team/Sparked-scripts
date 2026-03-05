/**
 * ============================================
 * SPARKED STUDIO — Premium Website Effects
 * ============================================
 * 
 * Includes:
 * 1. Lenis Smooth Scroll
 * 2. Three.js Animated 3D Blob Background (blue/white theme)
 * 3. GSAP ScrollTrigger Animations (parallax, reveals, staggers)
 * 4. Custom Cursor with blue glow
 * 5. Scroll Indicator
 * 6. Magnetic Buttons
 * 7. Text Split Animations
 * 
 * Dependencies (loaded automatically):
 * - Three.js r128
 * - GSAP 3.12 + ScrollTrigger
 * - Lenis Smooth Scroll
 */

(function () {
  "use strict";

  // ─── CONFIG ───────────────────────────────────────
  const CONFIG = {
    colors: {
      primary: "#3b7dff",
      primaryRgb: "59,125,255",
      dark: "#1a1e2e",
      text: "#6b7394",
      light: "#f8faff",
      white: "#ffffff",
    },
    blob: {
      color1: 0x3b7dff,
      color2: 0x6b9fff,
      color3: 0xa8c4ff,
      bgColor: 0xf0f4ff,
    },
  };

  // ─── DEPENDENCY LOADER ────────────────────────────
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function loadDependencies() {
    // Load in order
    await loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
    );
    await loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"
    );
    await loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"
    );
    await loadScript(
      "https://unpkg.com/lenis@1.1.18/dist/lenis.min.js"
    );
  }

  // ─── INJECT STYLES ───────────────────────────────
  function injectStyles() {
    const css = document.createElement("style");
    css.textContent = `
      /* ── Base ── */
      html, body {
        overflow-x: hidden;
      }
      body {
        background: ${CONFIG.colors.light};
      }

      /* ── Three.js Canvas ── */
      #sparked-canvas-wrap {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
        pointer-events: none;
      }
      #sparked-canvas-wrap canvas {
        display: block;
        width: 100%;
        height: 100%;
      }

      /* ── All sections above canvas ── */
      .hero-navigator,
      section,
      [class*="section-"],
      .footer-section {
        position: relative;
        z-index: 1;
      }

      /* ── Custom Cursor ── */
      .sparked-cursor {
        position: fixed;
        top: 0;
        left: 0;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 1.5px solid rgba(${CONFIG.colors.primaryRgb}, 0.5);
        pointer-events: none;
        z-index: 9999;
        transition: width 0.3s cubic-bezier(0.22, 1, 0.36, 1),
                    height 0.3s cubic-bezier(0.22, 1, 0.36, 1),
                    border-color 0.3s,
                    background 0.3s;
        transform: translate(-50%, -50%);
        mix-blend-mode: normal;
      }
      .sparked-cursor-dot {
        position: fixed;
        top: 0;
        left: 0;
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: rgba(${CONFIG.colors.primaryRgb}, 0.8);
        pointer-events: none;
        z-index: 10000;
        transform: translate(-50%, -50%);
      }
      .sparked-cursor.hovering {
        width: 50px;
        height: 50px;
        border-color: rgba(${CONFIG.colors.primaryRgb}, 0.3);
        background: rgba(${CONFIG.colors.primaryRgb}, 0.06);
      }
      .sparked-cursor.clicking {
        width: 16px;
        height: 16px;
        border-color: rgba(${CONFIG.colors.primaryRgb}, 0.8);
      }

      /* Hide on touch devices */
      @media (hover: none) {
        .sparked-cursor, .sparked-cursor-dot { display: none; }
      }

      /* ── Scroll Indicator ── */
      .sparked-scroll-hint {
        position: fixed;
        bottom: 32px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        z-index: 50;
        opacity: 1;
        transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        pointer-events: none;
      }
      .sparked-scroll-hint.hidden {
        opacity: 0;
      }
      .sparked-scroll-mouse {
        width: 24px;
        height: 40px;
        border: 2px solid rgba(${CONFIG.colors.primaryRgb}, 0.25);
        border-radius: 12px;
        position: relative;
      }
      .sparked-scroll-dot {
        width: 3px;
        height: 8px;
        background: rgba(${CONFIG.colors.primaryRgb}, 0.5);
        border-radius: 2px;
        position: absolute;
        top: 7px;
        left: 50%;
        transform: translateX(-50%);
        animation: sparked-scroll-anim 2.2s cubic-bezier(0.45, 0, 0.55, 1) infinite;
      }
      .sparked-scroll-label {
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 3px;
        text-transform: uppercase;
        color: rgba(${CONFIG.colors.primaryRgb}, 0.35);
        font-family: system-ui, -apple-system, sans-serif;
      }
      @keyframes sparked-scroll-anim {
        0%, 100% { top: 7px; opacity: 0.8; }
        50% { top: 22px; opacity: 0.15; }
      }

      /* ── Reveal Animations ── */
      .sparked-reveal {
        opacity: 0;
        transform: translateY(60px);
        transition: none;
      }
      .sparked-reveal-left {
        opacity: 0;
        transform: translateX(-60px);
        transition: none;
      }
      .sparked-reveal-right {
        opacity: 0;
        transform: translateX(60px);
        transition: none;
      }
      .sparked-reveal-scale {
        opacity: 0;
        transform: scale(0.9);
        transition: none;
      }
      .sparked-char {
        display: inline-block;
        opacity: 0;
        transform: translateY(100%);
      }
      .sparked-word {
        display: inline-block;
        overflow: hidden;
        vertical-align: top;
        padding-bottom: 0.08em;
      }
      .sparked-line-mask {
        overflow: hidden;
        display: block;
      }

      /* ── Magnetic Button ── */
      [data-magnetic] {
        transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
      }

      /* ── Parallax ── */
      [data-parallax] {
        will-change: transform;
      }

      /* ── Smooth gradient overlay for footer transition ── */
      .sparked-footer-fade {
        position: relative;
        z-index: 1;
      }
      .sparked-footer-fade::before {
        content: '';
        position: absolute;
        top: -200px;
        left: 0;
        width: 100%;
        height: 200px;
        background: linear-gradient(180deg, transparent 0%, #0a0e1a 100%);
        pointer-events: none;
        z-index: 0;
      }
    `;
    document.head.appendChild(css);
  }

  // ─── THREE.JS 3D BACKGROUND ──────────────────────
  function initThreeBackground() {
    const wrap = document.createElement("div");
    wrap.id = "sparked-canvas-wrap";
    document.body.prepend(wrap);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(CONFIG.blob.bgColor);

    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    wrap.appendChild(renderer.domElement);

    // Create soft ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(2, 3, 5);
    scene.add(dirLight);

    // Create organic blob meshes
    const blobs = [];
    const blobConfigs = [
      { color: CONFIG.blob.color1, scale: 1.8, pos: [-2.5, 1.5, -2], speed: 0.3, opacity: 0.12 },
      { color: CONFIG.blob.color2, scale: 2.2, pos: [2.5, -1, -3], speed: 0.25, opacity: 0.09 },
      { color: CONFIG.blob.color3, scale: 1.5, pos: [0, -2.5, -1.5], speed: 0.35, opacity: 0.1 },
      { color: CONFIG.blob.color1, scale: 2.0, pos: [-1, 3, -2.5], speed: 0.2, opacity: 0.08 },
      { color: CONFIG.blob.color2, scale: 1.6, pos: [3, 2, -3.5], speed: 0.28, opacity: 0.07 },
    ];

    blobConfigs.forEach((cfg) => {
      const geometry = new THREE.IcosahedronGeometry(cfg.scale, 4);
      const material = new THREE.MeshPhysicalMaterial({
        color: cfg.color,
        transparent: true,
        opacity: cfg.opacity,
        roughness: 1,
        metalness: 0,
        clearcoat: 0.1,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...cfg.pos);
      mesh.userData = {
        speed: cfg.speed,
        origPos: [...cfg.pos],
        phase: Math.random() * Math.PI * 2,
      };
      scene.add(mesh);
      blobs.push(mesh);
    });

    // Scroll position tracking
    let scrollY = 0;
    let targetScrollY = 0;

    window.addEventListener("scroll", () => {
      targetScrollY = window.scrollY;
    }, { passive: true });

    // Mouse tracking for subtle camera movement
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    document.addEventListener("mousemove", (e) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Animation
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth scroll interpolation
      scrollY += (targetScrollY - scrollY) * 0.05;
      mouseX += (targetMouseX - mouseX) * 0.03;
      mouseY += (targetMouseY - mouseY) * 0.03;

      // Subtle camera parallax from mouse
      camera.position.x = mouseX * 0.15;
      camera.position.y = -mouseY * 0.1;
      camera.lookAt(0, 0, 0);

      // Animate blobs
      const scrollFactor = scrollY * 0.0003;
      blobs.forEach((blob, i) => {
        const ud = blob.userData;
        const t = elapsed * ud.speed + ud.phase;

        // Organic floating motion
        blob.position.x = ud.origPos[0] + Math.sin(t * 0.7) * 0.8;
        blob.position.y = ud.origPos[1] + Math.cos(t * 0.5) * 0.6 - scrollFactor * (i + 1) * 0.5;
        blob.position.z = ud.origPos[2] + Math.sin(t * 0.3) * 0.4;

        // Organic rotation
        blob.rotation.x = Math.sin(t * 0.4) * 0.3;
        blob.rotation.y = Math.cos(t * 0.3) * 0.3;

        // Subtle morph via scale
        const scaleOffset = 1 + Math.sin(t * 0.8) * 0.08;
        blob.scale.set(
          scaleOffset,
          1 + Math.cos(t * 0.6) * 0.08,
          scaleOffset
        );
      });

      // Shift background color based on scroll (blue → white → blue waves)
      const scrollProgress = scrollY / (document.body.scrollHeight - window.innerHeight);
      const wave = Math.sin(scrollProgress * Math.PI * 4) * 0.5 + 0.5;
      const r = 0.94 + wave * 0.06;
      const g = 0.96 + wave * 0.04;
      const b = 1.0;
      scene.background.setRGB(r, g, b);

      renderer.render(scene, camera);
    }

    animate();

    // Resize handler
    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  // ─── LENIS SMOOTH SCROLL ─────────────────────────
  function initSmoothScroll() {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
    });

    // Connect GSAP ticker to Lenis
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    return lenis;
  }

  // ─── GSAP SCROLL ANIMATIONS ──────────────────────
  function initScrollAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    // ── Hero Text Animation ──
    const heroHeading = document.querySelector(".Heading, h1");
    if (heroHeading) {
      // Split text into words and chars
      const text = heroHeading.textContent;
      const words = text.split(" ");
      heroHeading.innerHTML = words
        .map(
          (word) =>
            `<span class="sparked-word">${word
              .split("")
              .map((c) => `<span class="sparked-char">${c}</span>`)
              .join("")}</span>`
        )
        .join(" ");

      gsap.to(".sparked-char", {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.03,
        ease: "power4.out",
        delay: 0.3,
      });
    }

    // ── Hero Paragraph Fade ──
    const heroParagraph = document.querySelector(".hero-content .Paragraph, .hero-content p, .products-wrapper .Paragraph");
    if (heroParagraph) {
      gsap.from(heroParagraph, {
        opacity: 0,
        y: 30,
        duration: 1,
        ease: "power3.out",
        delay: 0.8,
      });
    }

    // ── Hero Button ──
    const heroButton = document.querySelector(".hero-content .Button, .hero-content a[class*='btn'], .products-wrapper .Button");
    if (heroButton) {
      gsap.from(heroButton, {
        opacity: 0,
        y: 20,
        scale: 0.95,
        duration: 0.8,
        ease: "back.out(1.7)",
        delay: 1.1,
      });
    }

    // ── Section Headers — Scale & Fade ──
    gsap.utils.toArray(".section-header").forEach((header) => {
      const tag = header.querySelector("[class*='section-tag'], [class*='section-label']");
      const h2 = header.querySelector("h2, [class*='h2-']");
      const desc = header.querySelector("[class*='section-desc'], [class*='desc-']");

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: header,
          start: "top 82%",
          end: "bottom 20%",
          toggleActions: "play none none reverse",
        },
      });

      if (tag) tl.from(tag, { opacity: 0, y: 20, duration: 0.6, ease: "power3.out" });
      if (h2) tl.from(h2, { opacity: 0, y: 40, duration: 0.8, ease: "power3.out" }, "-=0.3");
      if (desc) tl.from(desc, { opacity: 0, y: 25, duration: 0.7, ease: "power3.out" }, "-=0.4");
    });

    // ── Service Cards — Staggered Reveal ──
    gsap.utils.toArray(".services-grid, .pricing-grid, .process-grid").forEach((grid) => {
      const cards = grid.children;
      gsap.from(cards, {
        scrollTrigger: {
          trigger: grid,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse",
        },
        opacity: 0,
        y: 80,
        scale: 0.95,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
      });
    });

    // ── Parallax on sections ──
    gsap.utils.toArray(".service-card, .pricing-card").forEach((card) => {
      gsap.to(card, {
        scrollTrigger: {
          trigger: card,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
        },
        y: -20,
        ease: "none",
      });
    });

    // ── Service Icon Wrap — Rotate on scroll ──
    gsap.utils.toArray(".service-icon-wrap").forEach((icon) => {
      gsap.to(icon, {
        scrollTrigger: {
          trigger: icon,
          start: "top bottom",
          end: "bottom top",
          scrub: 2,
        },
        rotation: 8,
        ease: "none",
      });
    });

    // ── Process Steps — Horizontal slide-in ──
    gsap.utils.toArray(".process-step").forEach((step, i) => {
      gsap.from(step, {
        scrollTrigger: {
          trigger: step,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
        opacity: 0,
        x: i % 2 === 0 ? -50 : 50,
        duration: 0.8,
        ease: "power3.out",
        delay: i * 0.08,
      });
    });

    // ── CTA Section — Grand entrance ──
    const ctaSection = document.querySelector(".cta-section, [class*='cta-section']");
    if (ctaSection) {
      const ctaH = ctaSection.querySelector("h2, [class*='cta-heading']");
      const ctaP = ctaSection.querySelector("p, [class*='cta-desc']");
      const ctaBtn = ctaSection.querySelector("a, [class*='btn-cta']");

      const ctaTl = gsap.timeline({
        scrollTrigger: {
          trigger: ctaSection,
          start: "top 75%",
          toggleActions: "play none none reverse",
        },
      });

      if (ctaH) ctaTl.from(ctaH, { opacity: 0, y: 50, scale: 0.97, duration: 1, ease: "power3.out" });
      if (ctaP) ctaTl.from(ctaP, { opacity: 0, y: 30, duration: 0.8, ease: "power3.out" }, "-=0.5");
      if (ctaBtn) ctaTl.from(ctaBtn, { opacity: 0, y: 20, scale: 0.9, duration: 0.7, ease: "back.out(1.7)" }, "-=0.3");
    }

    // ── Nav parallax — slight shift on scroll ──
    const nav = document.querySelector(".Nav-wrapper");
    if (nav) {
      gsap.to(nav, {
        scrollTrigger: {
          trigger: "body",
          start: "top top",
          end: "200px top",
          scrub: true,
        },
        y: -5,
        opacity: 0.95,
        ease: "none",
      });
    }

    // ── Hero content parallax ──
    const heroContent = document.querySelector(".hero-content");
    if (heroContent) {
      gsap.to(heroContent, {
        scrollTrigger: {
          trigger: heroContent,
          start: "top top",
          end: "bottom top",
          scrub: 1.5,
        },
        y: 80,
        opacity: 0.3,
        ease: "none",
      });
    }
  }

  // ─── CUSTOM CURSOR ────────────────────────────────
  function initCustomCursor() {
    // Don't init on touch devices
    if ("ontouchstart" in window) return;

    const cursor = document.createElement("div");
    cursor.className = "sparked-cursor";
    document.body.appendChild(cursor);

    const dot = document.createElement("div");
    dot.className = "sparked-cursor-dot";
    document.body.appendChild(dot);

    let cursorX = 0;
    let cursorY = 0;
    let dotX = 0;
    let dotY = 0;
    let clientX = -100;
    let clientY = -100;

    document.addEventListener("mousemove", (e) => {
      clientX = e.clientX;
      clientY = e.clientY;
    });

    // Hover states
    const interactiveElements = "a, button, [role='button'], input, textarea, .service-card, .pricing-card, .process-step";
    document.querySelectorAll(interactiveElements).forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("hovering"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("hovering"));
    });

    // Click state
    document.addEventListener("mousedown", () => cursor.classList.add("clicking"));
    document.addEventListener("mouseup", () => cursor.classList.remove("clicking"));

    // Smooth follow animation
    function updateCursor() {
      cursorX += (clientX - cursorX) * 0.12;
      cursorY += (clientY - cursorY) * 0.12;
      dotX += (clientX - dotX) * 0.25;
      dotY += (clientY - dotY) * 0.25;

      cursor.style.left = cursorX + "px";
      cursor.style.top = cursorY + "px";
      dot.style.left = dotX + "px";
      dot.style.top = dotY + "px";

      requestAnimationFrame(updateCursor);
    }
    updateCursor();

    // Hide default cursor
    document.documentElement.style.cursor = "none";
    document.querySelectorAll("a, button, [role='button']").forEach((el) => {
      el.style.cursor = "none";
    });
  }

  // ─── SCROLL INDICATOR ─────────────────────────────
  function initScrollIndicator() {
    const hint = document.createElement("div");
    hint.className = "sparked-scroll-hint";
    hint.innerHTML = `
      <div class="sparked-scroll-mouse">
        <div class="sparked-scroll-dot"></div>
      </div>
      <span class="sparked-scroll-label">Scroll</span>
    `;
    document.body.appendChild(hint);

    let hideTimer;

    window.addEventListener("scroll", () => {
      hint.classList.add("hidden");
      clearTimeout(hideTimer);

      hideTimer = setTimeout(() => {
        const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
        // Only show in first 80% of page
        if (scrollPercent < 0.8) {
          hint.classList.remove("hidden");
        }
      }, 2000);
    }, { passive: true });
  }

  // ─── MAGNETIC BUTTONS ─────────────────────────────
  function initMagneticButtons() {
    if ("ontouchstart" in window) return;

    const buttons = document.querySelectorAll(
      ".Button, .btn-pricing, .btn-cta, .nav-link-om-oss, [class*='btn']"
    );

    buttons.forEach((btn) => {
      btn.setAttribute("data-magnetic", "");

      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
      });

      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "translate(0, 0)";
      });
    });
  }

  // ─── FOOTER FADE ──────────────────────────────────
  function initFooterFade() {
    const footer = document.querySelector(".footer-section");
    if (footer) {
      footer.classList.add("sparked-footer-fade");
    }
  }

  // ─── INIT ─────────────────────────────────────────
  async function init() {
    // Inject CSS immediately
    injectStyles();

    // Load dependencies
    try {
      await loadDependencies();
    } catch (e) {
      console.warn("Sparked Effects: Failed to load dependencies", e);
      return;
    }

    // Wait for DOM ready
    if (document.readyState === "loading") {
      await new Promise((r) => document.addEventListener("DOMContentLoaded", r));
    }

    // Small delay to ensure Webflow has rendered
    await new Promise((r) => setTimeout(r, 100));

    // Initialize all modules
    initThreeBackground();
    const lenis = initSmoothScroll();
    initScrollAnimations();
    initCustomCursor();
    initScrollIndicator();
    initMagneticButtons();
    initFooterFade();

    console.log("✨ Sparked Studio Effects — Active");
  }

  init();
})();
