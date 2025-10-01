(function(){
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  // Year in footer
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav toggle
  const navToggle = $('.nav-toggle');
  const menu = $('#primary-menu');
  if (navToggle && menu){
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      menu.style.display = expanded ? 'none' : 'flex';
    });
    // Close menu on link click (mobile)
    $$('#primary-menu a').forEach(a => a.addEventListener('click', () => {
      if (window.innerWidth <= 600) {
        navToggle.setAttribute('aria-expanded', 'false');
        menu.style.display = 'none';
      }
    }));
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
    window.addEventListener('scroll', () => {
      if (window.scrollY > 500) backToTop.classList.add('show');
      else backToTop.classList.remove('show');
    });
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

  // Testimonials slider
  const slider = $('#testimonialSlider');
  if (slider){
    const slides = $$('.slide', slider);
    let idx = 0;
    const show = n => {
      slides.forEach(s => s.classList.remove('current'));
      slides[n].classList.add('current');
    };
    $('[data-prev]', slider).addEventListener('click', () => { idx = (idx-1+slides.length)%slides.length; show(idx); });
    $('[data-next]', slider).addEventListener('click', () => { idx = (idx+1)%slides.length; show(idx); });
    setInterval(() => { idx = (idx+1)%slides.length; show(idx); }, 6000);
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
        <div class="card">
          <h3>Your weekly plan (${hours} hr${hours>1?'s':''})</h3>
          <table class="plan-table">
            <thead><tr><th>Subject</th><th>Time</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <p class="muted">Tip: Break each hour into 45 mins focused study + 15 mins review.</p>
        </div>
      `;
    });
  }

})();