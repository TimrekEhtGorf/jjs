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
    // Reset on resize
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

  // Back to top + header shadow + scroll progress
  const backToTop = $('#backToTop');
  const header = $('.site-header');
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  document.body.appendChild(progressBar);

  function updateScrollUI(){
    const y = window.scrollY;
    if (header){
      if (y > 6) header.classList.add('scrolled'); else header.classList.remove('scrolled');
    }
    if (backToTop){
      if (y > 500) backToTop.classList.add('show'); else backToTop.classList.remove('show');
    }
    // progress
    const doc = document.documentElement;
    const h = doc.scrollHeight - window.innerHeight;
    const pct = h > 0 ? Math.min(100, Math.max(0, (y / h) * 100)) : 0;
    progressBar.style.width = pct + '%';
  }
  window.addEventListener('scroll', updateScrollUI, { passive:true });
  window.addEventListener('resize', updateScrollUI);
  updateScrollUI();

  if (backToTop){
    backToTop.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
  }

  // Typed words on homepage
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

  // Testimonials slider (smooth height + pause on hover)
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

    const initHeight = () => { if (slidesWrap) slidesWrap.style.height = slides[idx].offsetHeight + 'px'; };
    window.addEventListener('load', initHeight);
    initHeight();

    const prevBtn = $('[data-prev]', slider);
    const nextBtn = $('[data-next]', slider);
    prevBtn.addEventListener('click', () => { idx = (idx-1+slides.length)%slides.length; show(idx); });
    nextBtn.addEventListener('click', () => { idx = (idx+1)%slides.length; show(idx); });

    let autoTimer = null;
    const startAuto = () => { if (!reduceMotion) autoTimer = setInterval(() => { idx = (idx+1)%slides.length; show(idx); }, 6000); };
    const stopAuto = () => { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } };
    startAuto();
    slider.addEventListener('mouseenter', stopAuto);
    slider.addEventListener('mouseleave', startAuto);
    window.addEventListener('blur', stopAuto);
    window.addEventListener('focus', startAuto);
    window.addEventListener('resize', initHeight);
  }

  // Subjects filter (animated show/hide)
  const subjectGrid = $('.subject-grid');
  if (subjectGrid){
    $$('.subject-card', subjectGrid).forEach(card => card.classList.add('fade-toggle'));
    const yearRadios = $$('input[name="year-filter"]');
    const onlineChk = $('input[name="mode-online"]');
    const faceChk = $('input[name="mode-face"]');

    function showCard(card){
      if (!card.classList.contains('hidden')) {
        card.classList.remove('hide');
        return;
      }
      card.classList.remove('hidden');
      card.style.display = '';
      requestAnimationFrame(() => card.classList.remove('hide'));
    }

    function hideCard(card){
      if (card.classList.contains('hidden')) return;
      card.classList.add('hide');
      const onEnd = (e) => {
        if (e.propertyName !== 'opacity') return;
        card.style.display = 'none';
        card.classList.add('hidden');
        card.removeEventListener('transitionend', onEnd);
      };
      card.addEventListener('transitionend', onEnd);
    }

    function applyFilters(){
      const year = (yearRadios.find(r=>r.checked)||{}).value || 'all';
      const online = onlineChk.checked;
      const face = faceChk.checked;
      $$('.subject-card', subjectGrid).forEach(card => {
        const acceptsYear = card.dataset.year === 'both' || card.dataset.year === year || year === 'all';
        const acceptsMode = (online && card.dataset.online === 'true') || (face && card.dataset.face === 'true');
        const shouldShow = acceptsYear && acceptsMode;
        shouldShow ? showCard(card) : hideCard(card);
      });
    }
    [...yearRadios, onlineChk, faceChk].forEach(el => el && el.addEventListener('change', applyFilters));
    applyFilters();
  }

  // Tutors modal + smooth FLIP transition
  const tutorGrid = $('.tutor-grid');
  const modal = $('#tutorModal');
  let lastCard = null;
  if (tutorGrid && modal){
    const modalImg = $('#modalImg');
    const modalName = $('#modalName');
    const modalSubjects = $('#modalSubjects');
    const modalBio = $('#modalBio');

    function openWithAnimation(card){
      const cardImg = card.querySelector('img');
      if (!cardImg) return;
      const data = JSON.parse(card.getAttribute('data-tutor'));
      modalImg.src = data.image || '';
      modalImg.alt = 'Photo of ' + data.name;
      modalName.textContent = data.name;
      modalSubjects.textContent = data.subjects;
      modalBio.textContent = data.bio;

      // Open modal
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');

      if (reduceMotion) return;

      // FLIP clone
      const from = cardImg.getBoundingClientRect();
      // Ensure modal layout applied
      requestAnimationFrame(() => {
        const to = modalImg.getBoundingClientRect();

        // Hide target while animating
        modalImg.style.opacity = '0';

        const clone = cardImg.cloneNode(true);
        clone.className = 'anim-clone';
        clone.style.left = from.left + 'px';
        clone.style.top = from.top + 'px';
        clone.style.width = from.width + 'px';
        clone.style.height = from.height + 'px';
        clone.style.transform = 'translate(0,0) scale(1)';
        clone.style.transition = 'transform 420ms cubic-bezier(.2,.8,.2,1), opacity 300ms ease';
        document.body.appendChild(clone);

        const dx = to.left - from.left;
        const dy = to.top - from.top;
        const sx = to.width / from.width;
        const sy = to.height / from.height;

        requestAnimationFrame(() => {
          clone.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
        });

        const onEnd = () => {
          clone.removeEventListener('transitionend', onEnd);
          clone.remove();
          modalImg.style.opacity = '';
        };
        clone.addEventListener('transitionend', onEnd, { once:true });
      });
    }

    function closeWithAnimation(){
      if (!modal.classList.contains('active')) return;
      const modalImg = $('#modalImg');
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');

      if (reduceMotion || !lastCard) return;

      const cardImg = lastCard.querySelector('img');
      if (!cardImg) return;

      const from = modalImg.getBoundingClientRect();
      const to = cardImg.getBoundingClientRect();

      const clone = modalImg.cloneNode(true);
      clone.className = 'anim-clone';
      clone.style.left = from.left + 'px';
      clone.style.top = from.top + 'px';
      clone.style.width = from.width + 'px';
      clone.style.height = from.height + 'px';
      clone.style.transform = 'translate(0,0) scale(1)';
      clone.style.transition = 'transform 360ms cubic-bezier(.2,.8,.2,1), opacity 300ms ease';
      document.body.appendChild(clone);

      const dx = to.left - from.left;
      const dy = to.top - from.top;
      const sx = to.width / from.width;
      const sy = to.height / from.height;

      requestAnimationFrame(() => {
        clone.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
        clone.style.opacity = '0.98';
      });

      clone.addEventListener('transitionend', () => clone.remove(), { once:true });
    }

    tutorGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-profile]');
      if (!btn) return;
      const card = e.target.closest('.tutor-card');
      lastCard = card;
      openWithAnimation(card);
    });

    modal.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-close') || e.target.classList.contains('modal-close')){
        closeWithAnimation();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')){
        closeWithAnimation();
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

  // Hero parallax (moves the atom)
  const hero = $('.hero');
  const atom = $('.atom');
  if (hero && atom && !reduceMotion && window.matchMedia('(pointer:fine)').matches){
    let raf;
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      const mx = (e.clientX - r.left) / r.width - 0.5;
      const my = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const tx = mx * 20; // px
        const ty = my * 12; // px
        atom.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });
    });
    hero.addEventListener('mouseleave', () => { atom.style.transform = 'none'; });
  }

  // Scroll reveal (auto-applied)
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
  $$('.hero-copy > *').forEach((el, i) => { el.classList.add('reveal','fade-right'); el.style.setProperty('--d', i.toString()); });

  if (reduceMotion){
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

  // Smooth anchor scrolling for in-page links
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href.length <= 1) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    history.pushState(null, '', href);
  });

  // Page transition fade between internal pages
  if (!reduceMotion){
    const overlay = document.createElement('div');
    overlay.className = 'page-overlay';
    document.body.appendChild(overlay);

    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target === '_blank' || a.hasAttribute('download') || a.dataset.noTransition !== undefined) return;
      if (/^(mailto:|tel:)/i.test(href)) return;

      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return;

      e.preventDefault();
      overlay.classList.add('show');
      setTimeout(() => { location.href = url.href; }, 200);
    });

    window.addEventListener('pageshow', () => overlay.classList.remove('show'));
  }

})();
