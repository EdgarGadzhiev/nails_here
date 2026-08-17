// ======================================================
// SUPABASE
// ======================================================

const SUPABASE_URL = "https://smtufbilfcszuhywswmx.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_o-blKCBreqQQDzolb9IMCQ_U9Ila5KH";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// ======================================================
// БУРГЕР-МЕНЮ
// ======================================================

const burgerBtn = document.getElementById('burgerBtn');
const navbar = document.getElementById('navbar');

if (burgerBtn && navbar) {

  burgerBtn.addEventListener('click', () => {
    navbar.classList.toggle('active');
  });

  document.querySelectorAll('#navbar a').forEach(link => {

    link.addEventListener('click', () => {
      navbar.classList.remove('active');
    });

  });

}


// ======================================================
// АНИМАЦИИ ПРИ СКРОЛЛЕ
// ======================================================

const revealEls =
  document.querySelectorAll('.reveal');

if (
  revealEls.length &&
  'IntersectionObserver' in window
) {

  const revealObserver =
    new IntersectionObserver(
      (entries) => {

        entries.forEach(entry => {

          if (entry.isIntersecting) {

            entry.target.classList.add(
              'is-visible'
            );

            revealObserver.unobserve(
              entry.target
            );

          }

        });

      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -60px 0px'
      }
    );

  revealEls.forEach(el => {
    revealObserver.observe(el);
  });

} else {

  revealEls.forEach(el => {
    el.classList.add('is-visible');
  });

}


// ======================================================
// ВИДЖЕТ ЗАПИСИ
// ======================================================

(function () {

  const widget =
    document.querySelector('.booking-widget');

  if (!widget) return;


  // ====================================================
  // НАСТРОЙКИ
  // ====================================================

  const TOTAL_STEPS = 4;

  let currentStep = 1;


  // ====================================================
  // СОСТОЯНИЕ ЗАПИСИ
  // ====================================================

  const state = {

    services: [],

    master: null,

    date: null,

    time: null

  };


  // ====================================================
  // ЭЛЕМЕНТЫ
  // ====================================================

  const stepIndicators =
    widget.querySelectorAll('.booking-step');

  const panels =
    widget.querySelectorAll('.booking-panel');

  const backBtn =
    document.getElementById('bookingBack');

  const nextBtn =
    document.getElementById('bookingNext');

  const submitBtn =
    document.getElementById('bookingSubmit');

  const restartBtn =
    document.getElementById('bookingRestart');

  const datesList =
    document.getElementById('bookingDates');

  const timesList =
    document.getElementById('bookingTimes');

  const summaryBox =
    document.getElementById('bookingSummary');

  const successBox =
    document.getElementById('bookingSuccess');

  const nameInput =
    document.getElementById('bookingName');

  const phoneInput =
    document.getElementById('bookingPhone');


  // ====================================================
  // ДНИ НЕДЕЛИ
  // ====================================================

  const WEEKDAYS = [
    'вс',
    'пн',
    'вт',
    'ср',
    'чт',
    'пт',
    'сб'
  ];


  // ====================================================
  // ВРЕМЯ
  // ====================================================

  const TIME_SLOTS = [

    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00',
    '20:00',
    '21:00'

  ];


  // ====================================================
  // ГЕНЕРАЦИЯ ДАТ
  // ====================================================

  function renderDates() {

    datesList.innerHTML = '';

    const today = new Date();


    for (let i = 0; i < 14; i++) {

      const d =
        new Date(today);

      d.setDate(
        today.getDate() + i
      );


      const weekday =
        WEEKDAYS[d.getDay()];


      const day =
        d.getDate();


      const month =
        String(
          d.getMonth() + 1
        ).padStart(2, '0');


      const label =
        `${day}.${month}`;


      // Настоящая дата
      // для базы данных

      const iso =
        `${d.getFullYear()}-${month}-${String(day).padStart(2, '0')}`;


      const item =
        document.createElement('div');


      item.className =
        'booking-date-item';


      item.innerHTML = `

        <div class="booking-date-weekday">
          ${weekday}
        </div>

        <div class="booking-date-day">
          ${day}
        </div>

      `;


      item.addEventListener(
        'click',
        () => {

          datesList
            .querySelectorAll(
              '.booking-date-item'
            )
            .forEach(el => {

              el.classList.remove(
                'selected'
              );

            });


          item.classList.add(
            'selected'
          );


          state.date = {

            label: label,

            weekday: weekday,

            day: day,

            iso: iso

          };


          state.time = null;


          renderTimes();


          validateStep();

        }
      );


      datesList.appendChild(item);

    }

  }


  // ====================================================
  // ГЕНЕРАЦИЯ ВРЕМЕНИ
  // ====================================================

  function renderTimes() {

    if (!state.date) {

      timesList.innerHTML =
        '<div class="booking-times-placeholder">Сначала выберите дату</div>';

      return;

    }


    timesList.innerHTML = '';


    TIME_SLOTS.forEach(time => {

      const item =
        document.createElement('div');


      item.className =
        'booking-time-item';


      item.textContent =
        time;


      item.addEventListener(
        'click',
        () => {

          timesList
            .querySelectorAll(
              '.booking-time-item'
            )
            .forEach(el => {

              el.classList.remove(
                'selected'
              );

            });


          item.classList.add(
            'selected'
          );


          state.time =
            time;


          validateStep();

        }
      );


      timesList.appendChild(item);

    });

  }


  // ====================================================
  // ШАГ 1 — УСЛУГИ
  // ====================================================

  widget
    .querySelectorAll(
      'input[name="service"]'
    )
    .forEach(checkbox => {

      checkbox.addEventListener(
        'change',
        () => {

          state.services =
            Array.from(
              widget.querySelectorAll(
                'input[name="service"]:checked'
              )
            ).map(el => ({

              name: el.value,

              price:
                parseInt(
                  el.dataset.price,
                  10
                )

            }));


          validateStep();

        }
      );

    });


  // ====================================================
  // ШАГ 2 — МАСТЕР
  // ====================================================

  widget
    .querySelectorAll(
      'input[name="master"]'
    )
    .forEach(radio => {

      radio.addEventListener(
        'change',
        () => {

          state.master =
            radio.value;


          validateStep();

        }
      );

    });


  // ====================================================
  // ВАЛИДАЦИЯ
  // ====================================================

  function validateStep() {

    let valid = false;


    if (currentStep === 1) {

      valid =
        state.services.length > 0;

    }


    else if (currentStep === 2) {

      valid =
        !!state.master;

    }


    else if (currentStep === 3) {

      valid =
        !!state.date &&
        !!state.time;

    }


    else if (currentStep === 4) {

      valid =
        nameInput.value.trim() !== '' &&
        phoneInput.value.trim() !== '';

    }


    if (currentStep === TOTAL_STEPS) {

      submitBtn.disabled =
        !valid;

    }

    else {

      nextBtn.disabled =
        !valid;

    }

  }


  nameInput.addEventListener(
    'input',
    validateStep
  );


  phoneInput.addEventListener(
    'input',
    validateStep
  );


  // ====================================================
  // СВОДКА
  // ====================================================

  function renderSummary() {

    const total =
      state.services.reduce(
        (sum, service) => {

          return sum + service.price;

        },
        0
      );


    const servicesText =
      state.services
        .map(service => service.name)
        .join(', ');


    summaryBox.innerHTML = `

      <div class="booking-summary-row">

        <span class="booking-summary-label">
          Услуги
        </span>

        <span>
          ${servicesText}
        </span>

      </div>


      <div class="booking-summary-row">

        <span class="booking-summary-label">
          Мастер
        </span>

        <span>
          ${state.master}
        </span>

      </div>


      <div class="booking-summary-row">

        <span class="booking-summary-label">
          Дата и время
        </span>

        <span>
          ${state.date.label},
          ${state.time}
        </span>

      </div>


      <div class="booking-summary-row">

        <span class="booking-summary-label">
          Итого
        </span>

        <span>
          ${total.toLocaleString('ru-RU')} ₽
        </span>

      </div>

    `;

  }


  // ====================================================
  // ПЕРЕКЛЮЧЕНИЕ ШАГОВ
  // ====================================================

  function goToStep(step) {

    currentStep =
      step;


    panels.forEach(panel => {

      panel.classList.toggle(

        'active',

        parseInt(
          panel.dataset.step,
          10
        ) === step

      );

    });


    stepIndicators.forEach(indicator => {

      const number =
        parseInt(
          indicator.dataset.stepIndicator,
          10
        );


      indicator.classList.toggle(
        'active',
        number === step
      );


      indicator.classList.toggle(
        'done',
        number < step
      );

    });


    backBtn.style.display =
      step === 1
        ? 'none'
        : 'block';


    nextBtn.style.display =
      step === TOTAL_STEPS
        ? 'none'
        : 'block';


    submitBtn.style.display =
      step === TOTAL_STEPS
        ? 'block'
        : 'none';


    restartBtn.style.display =
      'none';


    if (
      step === 3 &&
      !datesList.children.length
    ) {

      renderDates();

    }


    if (step === 4) {

      renderSummary();

    }


    validateStep();

  }


  // ====================================================
  // ДАЛЕЕ
  // ====================================================

  nextBtn.addEventListener(
    'click',
    () => {

      if (
        currentStep < TOTAL_STEPS
      ) {

        goToStep(
          currentStep + 1
        );

      }

    }
  );


  // ====================================================
  // НАЗАД
  // ====================================================

  backBtn.addEventListener(
    'click',
    () => {

      if (currentStep > 1) {

        goToStep(
          currentStep - 1
        );

      }

    }
  );


  // ====================================================
  // ОТПРАВКА В SUPABASE
  // ====================================================

  submitBtn.addEventListener(
    'click',
    async () => {

      // ----------------------------------------------
      // Проверяем заполнение
      // ----------------------------------------------

      if (
        !state.services.length ||
        !state.master ||
        !state.date ||
        !state.time ||
        !nameInput.value.trim() ||
        !phoneInput.value.trim()
      ) {

        alert(
          'Пожалуйста, заполните все поля.'
        );

        return;

      }


      // ----------------------------------------------
      // Блокируем кнопку
      // ----------------------------------------------

      submitBtn.disabled =
        true;

      submitBtn.textContent =
        'Отправляем...';


      // ----------------------------------------------
      // Названия услуг
      // ----------------------------------------------

      const servicesText =
        state.services
          .map(service => service.name)
          .join(', ');


      try {

        // ============================================
        // ОТПРАВЛЯЕМ ЗАЯВКУ В SUPABASE
        // ============================================

        const { data, error } =
          await supabaseClient

            .from('appointments')

            .insert([

              {

                name:
                  nameInput.value.trim(),

                phone:
                  phoneInput.value.trim(),

                services:
                  servicesText,

                master:
                  state.master,

                booking_date:
                  state.date.iso,

                booking_time:
                  state.time,

                status:
                  'new'

              }

            ])

            .select();


        // ============================================
        // ПРОВЕРКА ОШИБКИ
        // ============================================

        if (error) {

          console.error(
            'Ошибка Supabase:',
            error
          );

          throw error;

        }


        // ============================================
        // УСПЕШНАЯ ЗАЯВКА
        // ============================================

        console.log(
          'Заявка успешно создана:',
          data
        );


        const formFields =
          document.querySelector(
            '.booking-form-fields'
          );


        if (formFields) {

          formFields.style.display =
            'none';

        }


        summaryBox.style.display =
          'none';


        submitBtn.style.display =
          'none';


        backBtn.style.display =
          'none';


        successBox.classList.add(
          'active'
        );


        restartBtn.style.display =
          'block';


        stepIndicators.forEach(
          indicator => {

            indicator.classList.add(
              'done'
            );

          }
        );


        // Меняем текст демо-сообщения
        const successText =
          successBox.querySelector('p');


        if (successText) {

          successText.textContent =
            'Спасибо! Ваша заявка успешно отправлена. Мы свяжемся с вами для подтверждения записи.';

        }


      }


      catch (error) {

        console.error(
          'Ошибка отправки заявки:',
          error
        );


        alert(
          'Не удалось отправить заявку. Проверьте подключение и попробуйте ещё раз.'
        );


        submitBtn.disabled =
          false;


        submitBtn.textContent =
          'Отправить заявку';

      }

    }
  );


  // ====================================================
  // НОВАЯ ЗАПИСЬ
  // ====================================================

  restartBtn.addEventListener(
    'click',
    () => {

      // ----------------------------------------------
      // Сбрасываем состояние
      // ----------------------------------------------

      state.services = [];

      state.master = null;

      state.date = null;

      state.time = null;


      // ----------------------------------------------
      // Сбрасываем услуги
      // ----------------------------------------------

      widget
        .querySelectorAll(
          'input[name="service"]'
        )
        .forEach(element => {

          element.checked =
            false;

        });


      // ----------------------------------------------
      // Сбрасываем мастеров
      // ----------------------------------------------

      widget
        .querySelectorAll(
          'input[name="master"]'
        )
        .forEach(element => {

          element.checked =
            false;

        });


      // ----------------------------------------------
      // Сбрасываем дату
      // ----------------------------------------------

      datesList.innerHTML =
        '';


      // ----------------------------------------------
      // Сбрасываем время
      // ----------------------------------------------

      timesList.innerHTML =
        '<div class="booking-times-placeholder">Сначала выберите дату</div>';


      // ----------------------------------------------
      // Сбрасываем имя
      // ----------------------------------------------

      nameInput.value =
        '';


      // ----------------------------------------------
      // Сбрасываем телефон
      // ----------------------------------------------

      phoneInput.value =
        '';


      // ----------------------------------------------
      // Показываем форму
      // ----------------------------------------------

      const formFields =
        document.querySelector(
          '.booking-form-fields'
        );


      if (formFields) {

        formFields.style.display =
          'flex';

      }


      // ----------------------------------------------
      // Показываем сводку
      // ----------------------------------------------

      summaryBox.style.display =
        'block';


      // ----------------------------------------------
      // Скрываем успешное сообщение
      // ----------------------------------------------

      successBox.classList.remove(
        'active'
      );


      // ----------------------------------------------
      // Возвращаем кнопку
      // ----------------------------------------------

      submitBtn.textContent =
        'Отправить заявку';


      submitBtn.disabled =
        true;


      // ----------------------------------------------
      // Первый шаг
      // ----------------------------------------------

      goToStep(1);

    }
  );


  // ====================================================
  // ЗАПУСК
  // ====================================================

  goToStep(1);

})();
