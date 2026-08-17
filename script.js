// ===== БУРГЕР-МЕНЮ =====
const burgerBtn = document.getElementById('burgerBtn');
const navbar = document.getElementById('navbar');

burgerBtn.addEventListener('click', () => {
  navbar.classList.toggle('active');
});

document.querySelectorAll('#navbar a').forEach(link => {
  link.addEventListener('click', () => {
    navbar.classList.remove('active');
  });
});

// ===== АНИМАЦИИ ПРИ СКРОЛЛЕ =====
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
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
    services: [],   // [{name, price}]
    master: null,
    date: null,     // {label, weekday, day}
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

  const WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  const TIME_SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

  // ---------- Генерация дат (ближайшие 14 дней) ----------
  function renderDates() {
    datesList.innerHTML = '';
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const weekday = WEEKDAYS[d.getDay()];
      const day = d.getDate();
      const label = `${day}.${String(d.getMonth() + 1).padStart(2, '0')}`;

      const item = document.createElement('div');
      item.className = 'booking-date-item';
      item.innerHTML = `<div class="booking-date-weekday">${weekday}</div><div class="booking-date-day">${day}</div>`;
      item.addEventListener('click', () => {
        datesList.querySelectorAll('.booking-date-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
        state.date = { label, weekday, day };
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
    TIME_SLOTS.forEach(t => {
      const item = document.createElement('div');
      item.className = 'booking-time-item';
      item.textContent = t;
      item.addEventListener('click', () => {
        timesList.querySelectorAll('.booking-time-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
        state.time = t;
        validateStep();
      });
      timesList.appendChild(item);
    });
  }

  // ---------- Шаг 1: услуги ----------
  widget.querySelectorAll('input[name="service"]').forEach(cb => {
    cb.addEventListener('change', () => {
      state.services = Array.from(widget.querySelectorAll('input[name="service"]:checked'))
        .map(el => ({ name: el.value, price: parseInt(el.dataset.price, 10) }));
      validateStep();
    });
  });

  // ---------- Шаг 2: мастер ----------
  widget.querySelectorAll('input[name="master"]').forEach(radio => {
    radio.addEventListener('change', () => {
      state.master = radio.value;
      validateStep();
    });
  });

  // ---------- Валидация текущего шага ----------
  function validateStep() {
    let valid = false;
    if (currentStep === 1) valid = state.services.length > 0;
    else if (currentStep === 2) valid = !!state.master;
    else if (currentStep === 3) valid = !!state.date && !!state.time;
    else if (currentStep === 4) valid = nameInput.value.trim() !== '' && phoneInput.value.trim() !== '';

    if (currentStep === TOTAL_STEPS) {
      submitBtn.disabled = !valid;
    } else {
      nextBtn.disabled = !valid;
    }
  }

  nameInput.addEventListener('input', validateStep);
  phoneInput.addEventListener('input', validateStep);

  // ---------- Отрисовка сводки на шаге 4 ----------
  function renderSummary() {
    const total = state.services.reduce((sum, s) => sum + s.price, 0);
    const servicesText = state.services.map(s => s.name).join(', ');

    summaryBox.innerHTML = `
      <div class="booking-summary-row"><span class="booking-summary-label">Услуги</span><span>${servicesText}</span></div>
      <div class="booking-summary-row"><span class="booking-summary-label">Мастер</span><span>${state.master}</span></div>
      <div class="booking-summary-row"><span class="booking-summary-label">Дата и время</span><span>${state.date.label}, ${state.time}</span></div>
      <div class="booking-summary-row"><span class="booking-summary-label">Итого</span><span>${total.toLocaleString('ru-RU')} ₽</span></div>
    `;
  }

  // ---------- Переключение шагов ----------
  function goToStep(step) {
    currentStep = step;

    panels.forEach(p => p.classList.toggle('active', parseInt(p.dataset.step, 10) === step));

    stepIndicators.forEach(el => {
      const n = parseInt(el.dataset.stepIndicator, 10);
      el.classList.toggle('active', n === step);
      el.classList.toggle('done', n < step);
    });

    backBtn.style.display = step === 1 ? 'none' : 'block';
    nextBtn.style.display = step === TOTAL_STEPS ? 'none' : 'block';
    submitBtn.style.display = step === TOTAL_STEPS ? 'block' : 'none';
    restartBtn.style.display = 'none';

    if (step === 3 && !datesList.children.length) {
      renderDates();
    }
    if (step === 4) {
      renderSummary();
    }

    validateStep();
  }

  nextBtn.addEventListener('click', () => {
    if (currentStep < TOTAL_STEPS) goToStep(currentStep + 1);
  });

  backBtn.addEventListener('click', () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  });

  submitBtn.addEventListener('click', () => {
    // Демо: реальная отправка в базу/Telegram будет подключена отдельно
    document.querySelector('.booking-form-fields').style.display = 'none';
    summaryBox.style.display = 'none';
    submitBtn.style.display = 'none';
    backBtn.style.display = 'none';
    successBox.classList.add('active');
    restartBtn.style.display = 'block';

    stepIndicators.forEach(el => el.classList.add('done'));
  });

  restartBtn.addEventListener('click', () => {
    // Сброс состояния
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

    document.querySelector('.booking-form-fields').style.display = 'flex';
    summaryBox.style.display = 'block';
    successBox.classList.remove('active');

    goToStep(1);
  });

  goToStep(1);
})();