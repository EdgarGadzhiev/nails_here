(() => {
  const STATUS = { NEW: 'new', WAITING: 'confirmed', PAST: 'done' };

  function localDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function appointmentDateTime(item) {
    if (!item?.booking_date || !item?.booking_time) return null;
    const [y, m, d] = String(item.booking_date).split('-').map(Number);
    const [hh, mm, ss = 0] = String(item.booking_time).slice(0, 8).split(':').map(Number);
    if (![y, m, d, hh, mm].every(Number.isFinite)) return null;
    return new Date(y, m - 1, d, hh, mm, ss);
  }

  function deriveStatus(item, now = new Date()) {
    const bookingAt = appointmentDateTime(item);
    if (bookingAt && bookingAt <= now) return STATUS.PAST;

    if (item?.created_at) {
      const created = new Date(item.created_at);
      if (!Number.isNaN(created.getTime()) && localDateKey(created) === localDateKey(now)) return STATUS.NEW;
    }

    return STATUS.WAITING;
  }

  function syncStatusNames() {
    if (typeof statusNames === 'object' && statusNames) {
      statusNames.new = 'Новая';
      statusNames.confirmed = 'Ожидает';
      statusNames.done = 'Прошедшая';
    }
  }

  let lastSignature = '';

  function syncStatuses() {
    if (typeof appointments === 'undefined' || !Array.isArray(appointments)) return;

    syncStatusNames();
    const now = new Date();
    let changed = false;
    const signatureParts = [];

    appointments.forEach(item => {
      const next = deriveStatus(item, now);
      signatureParts.push(`${item.id || ''}:${next}`);
      if (item._displayStatus !== next || item.status !== next) changed = true;
      item._displayStatus = next;
      item.status = next;
    });

    const signature = signatureParts.join('|');
    if (changed || signature !== lastSignature) {
      lastSignature = signature;
      if (typeof renderAppointments === 'function') renderAppointments();
    }
  }

  function configureFilter() {
    const filter = document.getElementById('statusFilter');
    if (!filter) return;
    const current = filter.value || 'all';
    filter.innerHTML = '';
    [['all', 'Все статусы'], ['new', 'Новые'], ['confirmed', 'Ожидают'], ['done', 'Прошедшие']].forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      filter.appendChild(option);
    });
    filter.value = ['all', 'new', 'confirmed', 'done'].includes(current) ? current : 'all';
  }

  configureFilter();

  // admin.js загружает заявки асинхронно, поэтому быстро проверяем первые секунды,
  // затем обновляем статус раз в 30 секунд.
  let bootstrapChecks = 0;
  const bootstrapTimer = setInterval(() => {
    syncStatuses();
    bootstrapChecks += 1;
    if (bootstrapChecks >= 20) clearInterval(bootstrapTimer);
  }, 500);

  syncStatuses();
  setInterval(syncStatuses, 30000);
})();
