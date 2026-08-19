// ======================================================
// CONFIGURATION
// ======================================================

const SUPABASE_URL = "https://smtufbilfcszuhywswmx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_o-blKCBreqQQDzolb9IMCQ_U9Ila5KH";
const NAILS_HERE_SALON_ID = "027f2a41-f70b-4446-8898-7d110a8cd1bf";

// ======================================================
// БУРГЕР-МЕНЮ
// ======================================================

const burgerBtn = document.getElementById('burgerBtn');
const navbar = document.getElementById('navbar');

if (burgerBtn && navbar) {
  burgerBtn.addEventListener('click', () => navbar.classList.toggle('active'));
  document.querySelectorAll('#navbar a').forEach(link => {
    link.addEventListener('click', () => navbar.classList.remove('active'));
  });
}

// ======================================================
// АНИМАЦИИ
// ======================================================

const revealEls = document.querySelectorAll('.reveal');

if (revealEls.length && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  revealEls.forEach(el => revealObserver.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('is-visible'));
}

// ======================================================
// ВИДЖЕТ ЗАПИСИ
// ======================================================

(function () {
  const widget = document.querySelector('.booking-widget');
  if (!widget) return;

  const TOTAL_STEPS = 4;
  let currentStep = 1;

  const state = {
    services: [],
    master: null,
    date: null,
    time: null
  };

  const stepIndicators = widget.querySelectorAll('.booking-step');
  const panels = widget.querySelectorAll('.booking-panel');
  const backBtn = document.getElementById('bookingBack');
  const nextBtn = document.getElementById('bookingNext');
  const submitBtn = document.getElementById('bookingSubmit');
  const restartBtn = document.getElementById('bookingRestart');
  const datesList = document.getElementById('bookingDates');
  const timesList = document.getElementById('bookingTimes');
  const summaryBox = document.getElementById('bookingSummary');
  const successBox = document.getElementById('bookingSuccess');
  const nameInput = document.getElementById('bookingName');
  const phoneInput = document.getElementById('bookingPhone');

  // Success-state is hidden until Supabase confirms a successful request.
  successBox.classList.remove('active');
  successBox.style.display = 'none';

  const WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  const TIME_SLOTS = ['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'];

  function renderDates() {
    datesList.innerHTML = '';
    const today = new Date();

    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const weekday = WEEKDAYS[d.getDay()];
      const day = d.getDate();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const label = `${day}.${month}`;
      const iso = `${d.getFullYear()}-${month}-${String(day).padStart(2, '0')}`;

      const item = document.createElement('div');
      item.className = 'booking-date-item';
      item.innerHTML = `
        <div class="booking-date-weekday">${weekday}</div>
        <div class="booking-date-day">${day}</div>
      `;

      item.addEventListener('click', () => {
        datesList.querySelectorAll('.booking-date-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
        state.date = { label, weekday, day, iso };
        state.time = null;
        renderTimes();
        validateStep();
      });

      datesList.appendChild(item);
    }
  }

  function renderTimes() {
    if (!state.date) {
      timesList.innerHTML = '<div class="booking-times-placeholder">Сначала выберите дату</div>';
      return;
    }

    timesList.innerHTML = '';

    TIME_SLOTS.forEach(time => {
      const item = document.createElement('div');
      item.className = 'booking-time-item';
      item.textContent = time;

      item.addEventListener('click', () => {
        timesList.querySelectorAll('.booking-time-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
        state.time = time;
        validateStep();
      });

      timesList.appendChild(item);
    });
  }

  widget.querySelectorAll('input[name="service"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      state.services = Array.from(widget.querySelectorAll('input[name="service"]:checked')).map(el => ({
        name: el.value,
        price: parseInt(el.dataset.price, 10)
      }));
      validateStep();
    });
  });

  widget.querySelectorAll('input[name="master"]').forEach(radio => {
    radio.addEventListener('change', () => {
      state.master = radio.value;
      validateStep();
    });
  });

  function validateStep() {
    let valid = false;

    if (currentStep === 1) valid = state.services.length > 0;
    else if (currentStep === 2) valid = !!state.master;
    else if (currentStep === 3) valid = !!state.date && !!state.time;
    else if (currentStep === 4) valid = nameInput.value.trim() !== '' && phoneInput.value.trim() !== '';

    if (currentStep === TOTAL_STEPS) submitBtn.disabled = !valid;
    else nextBtn.disabled = !valid;
  }

  nameInput.addEventListener('input', validateStep);
  phoneInput.addEventListener('input', validateStep);

  function renderSummary() {
    const total = state.services.reduce((sum, service) => sum + service.price, 0);
    const servicesText = state.services.map(service => service.name).join(', ');

    summaryBox.innerHTML = `
      <div class="booking-summary-row">
        <span class="booking-summary-label">Услуги</span>
        <span>${servicesText}</span>
      </div>
      <div class="booking-summary-row">
        <span class="booking-summary-label">Мастер</span>
        <span>${state.master}</span>
      </div>
      <div class="booking-summary-row">
        <span class="booking-summary-label">Дата и время</span>
        <span>${state.date.label}, ${state.time}</span>
      </div>
      <div class="booking-summary-row">
        <span class="booking-summary-label">Итого</span>
        <span>${total.toLocaleString('ru-RU')} ₽</span>
      </div>
    `;
  }

  function goToStep(step) {
    currentStep = step;

    panels.forEach(panel => {
      panel.classList.toggle('active', parseInt(panel.dataset.step, 10) === step);
    });

    stepIndicators.forEach(indicator => {
      const number = parseInt(indicator.dataset.stepIndicator, 10);
      indicator.classList.toggle('active', number === step);
      indicator.classList.toggle('done', number < step);
    });

    backBtn.style.display = step === 1 ? 'none' : 'block';
    nextBtn.style.display = step === TOTAL_STEPS ? 'none' : 'block';
    submitBtn.style.display = step === TOTAL_STEPS ? 'block' : 'none';
    restartBtn.style.display = 'none';

    // A success message belongs only to the completed submission state.
    if (step !== TOTAL_STEPS) {
      successBox.classList.remove('active');
      successBox.style.display = 'none';
    } else {
      successBox.classList.remove('active');
      successBox.style.display = 'none';
      const formFields = widget.querySelector('.booking-form-fields');
      if (formFields) formFields.style.display = 'flex';
      summaryBox.style.display = 'block';
    }

    if (step === 3 && !datesList.children.length) renderDates();
    if (step === 4) renderSummary();

    validateStep();
  }

  nextBtn.addEventListener('click', () => {
    if (currentStep < TOTAL_STEPS) goToStep(currentStep + 1);
  });

  backBtn.addEventListener('click', () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  });

  submitBtn.addEventListener('click', async () => {
    if (!state.services.length || !state.master || !state.date || !state.time || !nameInput.value.trim() || !phoneInput.value.trim()) {
      alert('Пожалуйста, заполните все поля.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправляем...';

    const servicesText = state.services.map(service => service.name).join(', ');

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          name: nameInput.value.trim(),
          phone: phoneInput.value.trim(),
          services: servicesText,
          master: state.master,
          booking_date: state.date.iso,
          booking_time: state.time,
          status: 'new',
          salon_id: NAILS_HERE_SALON_ID
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      console.log('Заявка успешно отправлена в Supabase');

      const formFields = widget.querySelector('.booking-form-fields');
      if (formFields) formFields.style.display = 'none';

      summaryBox.style.display = 'none';
      submitBtn.style.display = 'none';
      backBtn.style.display = 'none';
      successBox.style.display = 'block';
      successBox.classList.add('active');
      restartBtn.style.display = 'block';

      stepIndicators.forEach(indicator => indicator.classList.add('done'));

      const successText = successBox.querySelector('p');
      if (successText) {
        successText.textContent = 'Спасибо! Ваша заявка успешно отправлена. Мы свяжемся с вами для подтверждения записи.';
      }
    } catch (error) {
      console.error('Ошибка Supabase:', error);
      alert('Не удалось отправить заявку:\n\n' + error.message);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Отправить заявку';
    }
  });

  restartBtn.addEventListener('click', () => {
    state.services = [];
    state.master = null;
    state.date = null;
    state.time = null;

    widget.querySelectorAll('input[name="service"]').forEach(el => el.checked = false);
    widget.querySelectorAll('input[name="master"]').forEach(el => el.checked = false);

    datesList.innerHTML = '';
    timesList.innerHTML = '<div class="booking-times-placeholder">Сначала выберите дату</div>';
    nameInput.value = '';
    phoneInput.value = '';

    const formFields = widget.querySelector('.booking-form-fields');
    if (formFields) formFields.style.display = 'flex';

    summaryBox.style.display = 'block';
    successBox.classList.remove('active');
    successBox.style.display = 'none';
    submitBtn.textContent = 'Отправить заявку';
    submitBtn.disabled = true;

    goToStep(1);
  });

  goToStep(1);
})();

// ======================================================
// PREMIUM VISUAL POLISH
// ======================================================

(() => {
  const style = document.createElement('style');
  style.textContent = `
    html { scroll-padding-top: 84px; }
    section:not(.hero) { padding-top: 64px !important; padding-bottom: 92px !important; scroll-margin-top: 84px; }
    .section-eyebrow { margin-bottom: 10px; }
    .section-title { margin-bottom: 38px !important; }

    .hero-content { transform: translateY(-42px); }
    .hero-visual { transform: translateY(-18px); }

    header { height: 76px; }
    body { padding-top: 76px; }
    #navbar { padding: 5px; border: 1px solid rgba(55,37,27,.08); border-radius: 999px; background: rgba(255,255,255,.52); box-shadow: 0 8px 28px rgba(55,37,27,.045); }
    #navbar a:not(.nav-cta) { padding: 9px 12px; border-radius: 999px; transition: color .3s ease, background .3s ease, transform .3s ease; }
    #navbar a:not(.nav-cta):after { display:none; }
    #navbar a:not(.nav-cta):hover, #navbar a:not(.nav-cta).nav-active { background: rgba(194,142,93,.13); color: var(--brand-dark); }
    #navbar .nav-cta { margin-left: 2px; }

    .booking-widget { max-width: 980px; padding: clamp(24px,4vw,46px); border-radius: 30px; }
    .booking-steps { justify-content: space-between; gap: 8px; padding: 0 4px 8px; }
    .booking-step { min-width: 0; }
    .step-circle { width: 40px; height: 40px; font-weight: 800; box-shadow: 0 5px 15px rgba(55,37,27,.06); transition: .3s ease; }
    .booking-step.active .step-circle { background: var(--brand); border-color: var(--brand); box-shadow: 0 9px 22px rgba(194,142,93,.25); }
    .booking-step.completed .step-circle, .booking-step.done .step-circle { background: var(--ink); border-color: var(--ink); }
    .booking-step-line { flex: 1; max-width: 110px; height: 2px; background: #eadfd4; }
    .booking-panel-title { font-size: 1.65rem; margin-bottom: 20px; }
    .booking-service-item, .booking-master-item { min-height: 66px; padding: 15px 18px; border-radius: 16px; border-width: 1px; box-shadow: 0 5px 16px rgba(55,37,27,.025); }
    .booking-service-item:has(input:checked), .booking-master-item:has(input:checked) { box-shadow: 0 10px 24px rgba(194,142,93,.13); }
    .check-box { width: 23px; height: 23px; border-radius: 7px; }
    .booking-date-item, .booking-time-item { min-height: 58px; display:grid; place-items:center; transition: .25s var(--ease); }
    .booking-date-item:hover, .booking-time-item:hover { transform: translateY(-2px); border-color: rgba(194,142,93,.55); box-shadow: 0 8px 18px rgba(55,37,27,.06); }
    .booking-nav { display:flex; justify-content:flex-end; align-items:center; gap:10px; margin-top:28px; padding-top:22px; border-top:1px solid var(--line); }
    .booking-btn { min-width: 142px; min-height: 48px; padding: 0 22px; border-radius: 12px; border:1px solid rgba(36,27,23,.14); background:#fff; color:var(--ink); font-weight:800; box-shadow:0 7px 18px rgba(55,37,27,.06); transition:.3s var(--ease); }
    .booking-btn:hover:not(:disabled) { transform:translateY(-2px); border-color:var(--brand); box-shadow:0 12px 24px rgba(55,37,27,.1); }
    .booking-btn:disabled { opacity:.42; cursor:not-allowed; box-shadow:none; }
    .booking-btn-next, .booking-btn-submit { background:var(--ink); color:#fff; border-color:var(--ink); }
    .booking-btn-next:hover:not(:disabled), .booking-btn-submit:hover:not(:disabled) { background:var(--brand-dark); border-color:var(--brand-dark); }
    .booking-btn-restart { margin-left:auto; background:var(--brand); color:#fff; border-color:var(--brand); }
    .booking-summary { padding: 20px; border:1px solid var(--line); border-radius:18px; background:#fff; }
    .booking-summary-row { display:flex; justify-content:space-between; gap:20px; padding:13px 0; border-bottom:1px solid var(--line); }
    .booking-summary-row:last-child { border-bottom:0; }
    .booking-summary-label { color:var(--muted); font-size:.8rem; font-weight:800; text-transform:uppercase; letter-spacing:.06em; }
    .booking-success { border-radius:20px; background:linear-gradient(145deg,#fffdf9,#f4e5d5); padding:34px 24px; text-align:center; border:1px solid rgba(194,142,93,.2); }

    #gallery .gallery-grid { grid-template-columns:1.15fr .85fr .85fr !important; grid-auto-rows:210px !important; gap:12px !important; }
    #gallery .gallery-item { min-height:0 !important; background-size:cover !important; background-position:center !important; border-radius:10px !important; box-shadow:0 12px 35px rgba(55,37,27,.08); }
    #gallery .gallery-item i { display:none !important; }
    #gallery .gallery-item:first-child { grid-row:span 2 !important; }
    #gallery .gallery-item:nth-child(2) { background-image:url('https://minimalmani.com/wp-content/uploads/2025/12/gold-cuticle-cuff-nails.jpg') !important; }
    #gallery .gallery-item:nth-child(3) { background-image:url('https://zeluxbeautyhub.com/assets/images/nail-service.png') !important; }
    #gallery .gallery-item:nth-child(4) { background-image:url('https://www.chicstylecollective.com/wp-content/uploads/2024/11/Elegant-Simple-Nail-Ideas-with-Neutral-Plain-Colors-for-a-Chic-Look.jpg') !important; }
    #gallery .gallery-item:nth-child(5) { background-image:url('https://mujibloom.mujilab.com/images/services/ongles.webp') !important; }
    #gallery .gallery-item:nth-child(6) { background-image:url('https://www.indigo-nails.com/media/catalog/product/cache/2e5d3fbe0a09eb090838b13321b8284a/m/e/megan-vegan-www.jpg') !important; }
    #gallery .gallery-item:nth-child(7) { background-image:url('https://ohora.co.jp/cdn/shop/products/nd-315_mood01_a1f8d51d-8203-42cb-8b29-b8d86fa5faa2_2048x.jpg?v=1673839190') !important; }
    #gallery .gallery-item:nth-child(8) { background-image:url('https://media.easy-peasy.ai/fc04ebf6-3a45-4827-ae9a-9a33886339e0/7ce5b49f-cd1e-4212-ad4a-773b2c508aa0.png') !important; }
    #gallery .gallery-item:after { content:''; position:absolute; inset:0; background:linear-gradient(180deg,transparent 55%,rgba(36,27,23,.2)); pointer-events:none; opacity:.65; }

    #contacts { padding-bottom:100px !important; }
    .contacts-grid { display:grid; grid-template-columns:.82fr 1.18fr; gap:18px; align-items:stretch; }
    .contacts-info { padding:34px; border:1px solid var(--line); border-radius:24px; background:var(--paper); box-shadow:var(--shadow); display:flex; flex-direction:column; justify-content:center; }
    .contacts-info p { display:flex; align-items:flex-start; gap:14px; margin:0; padding:18px 0; border-bottom:1px solid var(--line); color:#67584e; font-size:.94rem; line-height:1.65; }
    .contacts-info p:last-of-type { border-bottom:0; }
    .contacts-info p i { flex:0 0 22px; margin-top:4px; color:var(--brand); text-align:center; }
    .contacts-info a { color:var(--ink); font-weight:800; transition:color .25s ease; }
    .contacts-info a:hover { color:var(--brand-dark); }
    .contacts-info .btn-primary { align-self:flex-start; margin-top:22px; }
    .map-wrapper { min-height:100%; padding:8px; border:1px solid var(--line); border-radius:26px; background:var(--paper); box-shadow:var(--shadow); overflow:hidden; }
    .map-wrapper iframe { width:100% !important; height:100% !important; min-height:390px; border:0 !important; border-radius:20px !important; }

    footer { padding:48px 20px 30px !important; text-align:center; }
    footer > .logo { justify-content:center !important; margin-bottom:20px !important; }
    .footer-menu { display:flex; justify-content:center; align-items:center; flex-wrap:wrap; gap:24px; margin:0 auto 14px; }
    .footer-menu a { font-size:.76rem; color:rgba(248,238,229,.7); font-weight:600; transition:color .25s ease; }
    .footer-menu a:hover { color:var(--brand) !important; }
    .footer-copy { max-width:100%; margin:0 auto; color:rgba(248,238,229,.38); font-size:.68rem; line-height:1.5; text-align:center; }

    @media (max-width: 900px) {
      .hero-content { transform:translateY(-20px); }
      .hero-visual { transform:none; }
      .contacts-grid { grid-template-columns:1fr; }
      .map-wrapper iframe { min-height:320px; }
    }
    @media (max-width: 640px) {
      html { scroll-padding-top:76px; }
      section:not(.hero) { padding-top:52px !important; padding-bottom:72px !important; scroll-margin-top:76px; }
      .hero-content { transform:translateY(-10px); }
      #navbar { border:0; border-radius:0; background:var(--paper); box-shadow:var(--shadow); padding:18px; }
      .booking-steps { overflow-x:auto; justify-content:flex-start; padding-bottom:12px; }
      .booking-step { flex:0 0 auto; }
      .booking-step-line { min-width:24px; }
      .booking-step .step-label { display:none; }
      .booking-masters-list { grid-template-columns:1fr; }
      .booking-dates-list { grid-template-columns:repeat(4,1fr); }
      .booking-times-list { grid-template-columns:repeat(3,1fr); }
      .booking-nav { justify-content:stretch; }
      .booking-btn { flex:1; min-width:0; padding:0 12px; }
      #gallery .gallery-grid { grid-template-columns:1fr 1fr !important; grid-auto-rows:190px !important; }
      #gallery .gallery-item:first-child { grid-row:span 2 !important; }
      .contacts-info { padding:24px; }
      .footer-menu { gap:16px; }
    }

    @media (prefers-reduced-motion: reduce) {
      .hero-content, .hero-visual, .service-card, .master-card, .booking-btn, #navbar a { transition:none !important; transform:none !important; }
    }
  `;
  document.head.appendChild(style);

  const gallery = document.querySelector('#gallery .gallery-grid');
  if (gallery && gallery.children.length === 6) {
    [
      'https://ohora.co.jp/cdn/shop/products/nd-315_mood01_a1f8d51d-8203-42cb-8b29-b8d86fa5faa2_2048x.jpg?v=1673839190',
      'https://media.easy-peasy.ai/fc04ebf6-3a45-4827-ae9a-9a33886339e0/7ce5b49f-cd1e-4212-ad4a-773b2c508aa0.png'
    ].forEach(url => {
      const item = document.createElement('div');
      item.className = 'gallery-item reveal is-visible';
      item.style.backgroundImage = `url("${url}")`;
      gallery.appendChild(item);
    });
  }

  const navLinks = [...document.querySelectorAll('#navbar a[href^="#"]')];
  const navSections = navLinks
    .map(link => ({ link, section: document.querySelector(link.getAttribute('href')) }))
    .filter(item => item.section);

  const setActiveNav = id => {
    navSections.forEach(({ link, section }) => {
      link.classList.toggle('nav-active', section.id === id);
    });
  };

  navSections.forEach(({ link, section }) => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const headerHeight = document.querySelector('header')?.offsetHeight || 76;
      const top = window.scrollY + section.getBoundingClientRect().top - headerHeight - 18;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      setActiveNav(section.id);
    });
  });

  const navObserver = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setActiveNav(visible.target.id);
  }, { rootMargin: '-25% 0px -60% 0px', threshold: [0.05, 0.2, 0.5] });

  navSections.forEach(({ section }) => navObserver.observe(section));
})();
