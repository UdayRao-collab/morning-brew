/* ============================================================
   MORNING BREW — script.js
============================================================ */

(function () {
  'use strict';

  /* ── Navbar scroll effect ──────────────────────────────── */
  const navbar = document.getElementById('navbar');

  function onScroll() {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run on load

  /* ── Mobile hamburger ──────────────────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  // Close menu when a link is clicked
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', false);
    });
  });

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target)) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
    }
  });

  /* ── Smooth scroll for anchor links ────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      if (this.hasAttribute('data-video-trigger')) return; // handled by video overlay
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 72; // navbar height
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ── In-hero video ─────────────────────────────────────── */
  const videoBtn    = document.getElementById('menuVideoBtn');
  const heroSection = document.querySelector('.hero');
  const heroVideo   = document.getElementById('heroVideo');
  const skipBtn     = document.getElementById('heroSkipBtn');
  const menuSection = document.getElementById('menu');

  function scrollToMenu() {
    const offset = 72;
    const top = menuSection.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  function startVideo() {
    // Kick off all CSS transitions by adding the state class
    heroSection.classList.add('is-playing');
    // Start playing immediately — video is transparent until CSS delay lifts
    heroVideo.play().catch(() => {
      // Autoplay blocked (shouldn't happen on a user click, but handle gracefully)
      heroSection.classList.remove('is-playing');
      scrollToMenu();
    });
  }

  function endVideo() {
    heroVideo.pause();
    // Scroll after the fade-in transition delay so it feels intentional
    setTimeout(scrollToMenu, 200);
    // Note: is-playing stays on the hero so restoreHero() can detect it later
  }

  function restoreHero() {
    if (!heroSection.classList.contains('is-playing')) return;

    // The skip btn's CSS transition has a 1.4s appearance delay which would
    // run in reverse, keeping it visible for 1.4s before fading — bad UX.
    // Override inline so it fades out immediately.
    skipBtn.style.transition = 'opacity 0.4s ease';
    skipBtn.style.opacity = '0';
    skipBtn.style.pointerEvents = 'none';

    // Removing this class reverses ALL hero transitions simultaneously:
    //   overlay   → fades back IN over 1.4s
    //   content   → fades back IN over 0.7s (driven by [data-animate] rule)
    //   scroll-hint → fades back IN over 0.8s
    //   hero-video  → fades back OUT over 1.2s (with 0.5s delay, so overlay
    //                 and text reappear first, then video recedes beneath them)
    heroSection.classList.remove('is-playing');

    // After the longest transition finishes (0.5s delay + 1.2s duration = 1.7s),
    // reset the video to the start and clean up inline overrides so the next
    // "Explore Our Menu" click works identically.
    setTimeout(() => {
      heroVideo.pause();
      heroVideo.currentTime = 0;
      skipBtn.style.transition = '';
      skipBtn.style.opacity = '';
      skipBtn.style.pointerEvents = '';
    }, 2000);
  }

  // "Explore Our Menu" button
  videoBtn.addEventListener('click', (e) => {
    e.preventDefault();
    startVideo();
  });

  // Skip button
  skipBtn.addEventListener('click', endVideo);

  // Auto-scroll when video finishes naturally
  heroVideo.addEventListener('ended', endVideo);

  // Restore hero when the user scrolls back up far enough that
  // 35% of the hero section is visible again (≈ top third of screen).
  const heroRestoreObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) restoreHero();
    });
  }, { threshold: 0.35 });

  heroRestoreObserver.observe(heroSection);

  /* ── Scroll-reveal animations ──────────────────────────── */
  const animElements = document.querySelectorAll('[data-animate]');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Stagger sibling cards
          const delay = getSiblingIndex(entry.target) * 80;
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  animElements.forEach(el => observer.observe(el));

  function getSiblingIndex(el) {
    // Only stagger menu cards and similar grid children
    const gridParent = el.closest('.menu-grid, .visit-grid');
    if (!gridParent) return 0;
    return Array.from(gridParent.children).indexOf(el);
  }

  /* ── Active nav link on scroll ─────────────────────────── */
  const sections = document.querySelectorAll('section[id]');

  function updateActiveLink() {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) current = section.getAttribute('id');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });

  /* ── Contact form ──────────────────────────────────────── */
  const form        = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Basic validation
    const name    = form.fname.value.trim();
    const email   = form.femail.value.trim();
    const message = form.fmessage.value.trim();

    if (!name || !email || !message) {
      shakeForm();
      return;
    }

    if (!isValidEmail(email)) {
      form.femail.focus();
      shakeElement(form.femail);
      return;
    }

    // Simulate send (replace with real API call)
    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Sending…';
    btn.disabled = true;

    setTimeout(() => {
      form.reset();
      btn.textContent = 'Send Message →';
      btn.disabled = false;
      formSuccess.classList.add('show');
      setTimeout(() => formSuccess.classList.remove('show'), 5000);
    }, 1200);
  });

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function shakeForm() {
    shakeElement(form);
  }

  function shakeElement(el) {
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = 'shake .4s ease';
    el.addEventListener('animationend', () => { el.style.animation = ''; }, { once: true });
  }

  /* Add shake keyframe dynamically */
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%,100% { transform: translateX(0); }
      20%      { transform: translateX(-6px); }
      40%      { transform: translateX(6px); }
      60%      { transform: translateX(-4px); }
      80%      { transform: translateX(4px); }
    }
  `;
  document.head.appendChild(style);

  /* ── Menu card tap effect (touch devices) ──────────────── */
  // On pointer-fine (mouse) devices CSS :hover already handles everything.
  // On touch devices :hover doesn't persist, so we toggle .is-active on tap.
  const isTouchPrimary = window.matchMedia('(hover: none) and (pointer: coarse)');

  if (isTouchPrimary.matches) {
    const menuCards = document.querySelectorAll('.menu-card');

    menuCards.forEach(card => {
      card.addEventListener('click', () => {
        const alreadyActive = card.classList.contains('is-active');
        // Clear every card first
        menuCards.forEach(c => c.classList.remove('is-active'));
        // If it wasn't active, activate it; if it was, leave it cleared (toggle off)
        if (!alreadyActive) card.classList.add('is-active');
      });
    });

    // Tap anywhere outside the grid clears all active states
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.menu-card')) {
        menuCards.forEach(c => c.classList.remove('is-active'));
      }
    });
  }

  /* ── About section retro slideshow ─────────────────────── */
  const slides = document.querySelectorAll('.about-slideshow .slide');

  if (slides.length) {
    let current = 0;

    function advanceSlide() {
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }

    setInterval(advanceSlide, 3800);
  }

  /* ── Parallax subtle effect on hero ────────────────────── */
  const heroBg = document.querySelector('.hero-bg');

  window.addEventListener('scroll', () => {
    if (!heroBg) return;
    const scrolled = window.scrollY;
    if (scrolled < window.innerHeight) {
      heroBg.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
  }, { passive: true });

})();
