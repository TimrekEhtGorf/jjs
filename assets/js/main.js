(function(){
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Year in footer
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav toggle (animated)
  const navToggle = $('.nav-toggle');
  const menu = $('#primary-menu');
  if (navToggle && menu){
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      menu.classList.toggle('open', !expanded);
    });
    // Close menu on link click (mobile)
    $$('#primary-menu a').forEach(a => a.addEventListener('click', () => {
      if (window.innerWidth <= 600) {
        navToggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('open');
      }
    }));
    // Reset state on resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 600) {
        menu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Theme toggle
  const themeToggle = $('#themeToggle');
  const pref = localStorage.getItem('theme');
  if (pref) document.documentElement.setAttribute('data-theme', pref);
  if (themeToggle){
    themeToggle.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      themeToggle.textContent = next === 'dark' ? '🌞' : '🌙';
    });
    themeToggle.textContent = (pref === 'dark') ? '🌞' : '🌙';
  }

  // Back to top
  const backToTop = $('#backToTop');
  if (backToTop){
    const onScroll = () => {
      if (window.scrollY > 500) backToTop.classList.add('show');
      else backToTop.classList.remove('show');
    };
    window.addEventListener('scroll', onScroll, { passive:true });
    backToTop.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
    onScroll();
  }

  // Typed words on homepage (reduce motion friendly)
  const typedEl = $('#typedWords');
  if (typedEl){
    const words = [
      'Physics',
      'Chemistry',
      'Biology',
      'Mathematics Advanced',
      'Mathematics Extension 1',
      'Mathematics Extension 2'
    ];
    if (reduceMotion){
      typedEl.textContent = words[0];
    } else {
      let i=0, j=0, deleting=false;
      function tick(){
        const word = words[i];
        typedEl.textContent = word.slice(0, j);
        if (!deleting && j < word.length){ j++; }
        else if (deleting && j > 0){ j--; }
        else {
          if (!deleting){ deleting = true; setTimeout(tick, 1200); return; }
          deleting = false; i = (i+1) % words.length;
        }
        setTimeout(tick, deleting ? 35 : 70);
      }
      tick();
    }
  }

  // Testimonials slider with smooth height transitions
  const slider = $('#testimonialSlider');
  if (slider){
    const slidesWrap = $('.slides', slider);
    const slides = $$('.slide', slider);
    let idx = slides.findIndex(s => s.classList.contains('current'));
    if (idx < 0) idx = 0;

    const show = n => {
      slides.forEach(s => s.classList.remove('current'));
      slides[n].classList.add('current');
      if (slidesWrap) slidesWrap.style.height = slides[n].offsetHeight + 'px';
    };

    // Init height
    const initHeight = () => { if (slidesWrap) slidesWrap.style.height = slides[idx].offsetHeight + 'px'; };
    window.addEventListener('load', initHeight);
    initHeight();

    const prevBtn = $('[data-prev]', slider);
    const nextBtn = $('[data-next]', slider);
    prevBtn.addEventListener('click', () => { idx = (idx-1+slides.length)%slides.length; show(idx); });
    nextBtn.addEventListener('click', () => { idx = (idx+1)%slides.length; show(idx); });
    if (!reduceMotion) setInterval(() => { idx = (idx+1)%slides.length; show(idx); }, 6000);
    window.addEventListener('resize', initHeight);
  }

  // Subjects filter
  const subjectGrid = $('.subject-grid');
  if (subjectGrid){
    const yearRadios = $$('input[name="year-filter"]');
    const onlineChk = $('input[name="mode-online"]');
    const faceChk = $('input[name="mode-face"]');
    function applyFilters(){
      const year = (yearRadios.find(r=>r.checked)||{}).value || 'all';
      const online = onlineChk.checked;
      const face = faceChk.checked;
      $$('.subject-card', subjectGrid).forEach(card => {
        const acceptsYear = card.dataset.year === 'both' || card.dataset.year === year || year === 'all';
        const acceptsMode = (online && card.dataset.online === 'true') || (face && card.dataset.face === 'true');
        card.style.display = (acceptsYear && acceptsMode) ? '' : 'none';
      });
    }
    [...yearRadios, onlineChk, faceChk].forEach(el => el && el.addEventListener('change', applyFilters));
    applyFilters();
  }

  // Tutors modal
  const tutorGrid = $('.tutor-grid');
  const modal = $('#tutorModal');
  if (tutorGrid && modal){
    const modalImg = $('#modalImg');
    const modalName = $('#modalName');
    const modalSubjects = $('#modalSubjects');
    const modalBio = $('#modalBio');
    tutorGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-profile]');
      if (!btn) return;
      const card = e.target.closest('.tutor-card');
      const data = JSON.parse(card.getAttribute('data-tutor'));
      modalImg.src = data.image || '';
      modalImg.alt = 'Photo of ' + data.name;
      modalName.textContent = data.name;
      modalSubjects.textContent = data.subjects;
      modalBio.textContent = data.bio;
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
    });
    modal.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-close') || e.target.classList.contains('modal-close')){
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')){
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  }

  // Study planner generator
  const plannerForm = $('#plannerForm');
  const plannerOutput = $('#plannerOutput');
  if (plannerForm && plannerOutput){
    plannerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const hours = Math.max(1, Math.min(60, Number($('#hours').value || 0)));
      const subjects = $$('input[type="checkbox"]:checked', plannerForm).map(cb => cb.value);
      if (subjects.length === 0){ plannerOutput.innerHTML = '<p class="muted">Please select at least one subject.</p>'; return; }
      // Weighted distribution: heavier weight for Extension subjects
      const weights = subjects.map(s => /Extension 2/.test(s) ? 1.5 : /Extension 1/.test(s) ? 1.2 : 1);
      const total = weights.reduce((a,b)=>a+b,0);
      const allocation = subjects.map((s, i) => ({ subject:s, hours: Math.max(1, Math.round(hours * (weights[i]/total))) }));
      // Adjust rounding to sum to hours
      let diff = hours - allocation.reduce((a,b)=>a+b.hours, 0);
      while (diff !== 0){
        for (let i=0;i<allocation.length && diff!==0;i++){
          allocation[i].hours += (diff>0 ? 1 : -1);
          diff += (diff>0 ? -1 : 1);
        }
      }
      const rows = allocation.map(a => `<tr><td>${a.subject}</td><td>${a.hours} hr${a.hours>1?'s':''}</td></tr>`).join('');
      plannerOutput.innerHTML = `
        <div class="card reveal zoom-in">
          <h3>Your weekly plan (${hours} hr${hours>1?'s':''})</h3>
          <table class="plan-table">
            <thead><tr><th>Subject</th><th>Time</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <p class="muted">Tip: Break each hour into 45 mins focused study + 15 mins review.</p>
        </div>
      `;
      // Trigger reveal immediately for newly injected content
      if (!reduceMotion) requestAnimationFrame(() => document.querySelector('.plan-table')?.closest('.reveal')?.classList.add('in'));
    });
  }

  // Button ripple effect
  $$('.btn').forEach(btn => {
    btn.addEventListener('pointerdown', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = (e.clientX || (rect.left + rect.width/2)) - rect.left;
      const y = (e.clientY || (rect.top + rect.height/2)) - rect.top;
      btn.style.setProperty('--rx', x + 'px');
      btn.style.setProperty('--ry', y + 'px');
      btn.classList.remove('rippling');
      // restart animation
      void btn.offsetWidth; 
      btn.classList.add('rippling');
      setTimeout(() => btn.classList.remove('rippling'), 650);
    });
  });

  // 3D Tilt on cards (desktop only)
  if (!reduceMotion && window.matchMedia('(pointer:fine)').matches){
    const maxTilt = 8; // degrees
    $$('.card').forEach(card => {
      let raf;
      const onMove = (e) => {
        const r = card.getBoundingClientRect();
        const mx = (e.clientX - r.left) / r.width;   // 0..1
        const my = (e.clientY - r.top) / r.height;  // 0..1
        const tiltY = (mx - 0.5) * (maxTilt*2);     // left/right
        const tiltX = (0.5 - my) * (maxTilt*2);     // up/down
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.setProperty('--tiltX', tiltX.toFixed(2) + 'deg');
          card.style.setProperty('--tiltY', tiltY.toFixed(2) + 'deg');
        });
      };
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--tiltX', '0deg');
        card.style.setProperty('--tiltY', '0deg');
      });
    });
  }

  // Hero parallax
  const hero = $('.hero');
  const heroArt = $('.hero-art');
  if (hero && heroArt && !reduceMotion && window.matchMedia('(pointer:fine)').matches){
    let raf;
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      const mx = (e.clientX - r.left) / r.width - 0.5;
      const my = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const tx = mx * 20; // px
        const ty = my * 12; // px
        heroArt.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });
    });
    hero.addEventListener('mouseleave', () => { heroArt.style.transform = 'none'; });
  }

  // Scroll reveal (auto-applied to common elements, can also add .reveal manually in HTML)
  function addRevealList(selector, effect, offset=0){
    $$(selector).forEach((el, i) => {
      if (!el.classList.contains('reveal')) el.classList.add('reveal');
      if (effect) el.classList.add(effect);
      el.style.setProperty('--d', (offset + i).toString());
    });
  }
  addRevealList('.page-header', 'fade-left', 0);
  addRevealList('.feature-cards .card', '', 0);
  addRevealList('.subjects-highlight .subject-chip', 'fade-right', 0);
  addRevealList('.subject-grid .subject-card', '', 0);
  addRevealList('.tutor-grid .tutor-card', '', 0);
  addRevealList('.resource-list li', '', 0);
  addRevealList('.contact-form .form-row', 'blur-in', 0);
  addRevealList('.cta-inner', 'zoom-in', 0);
  // Hero copy children
  $$('.hero-copy > *').forEach((el, i) => { el.classList.add('reveal','fade-right'); el.style.setProperty('--d', i.toString()); });

  if (reduceMotion){
    // If user prefers reduced motion, show all immediately
    $$('.reveal').forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('in');
        else entry.target.classList.remove('in');
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });
    $$('.reveal').forEach(el => io.observe(el));
  }

})();
