(() => {
  const STATUS = {
    NEW: 'new',
    WAITING: 'confirmed',
    PAST: 'done'
  };

  function localDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function appointmentDateTime(item) {
    if (!item?.booking_date || !item?.booking_time) return null;
    const time = String(item.booking_time).slice(0, 8);
    const [y, m, d] = String(item.booking_date).split('-').map(Number);
    const [hh, mm, ss = 0] = time.split(':').map(Number);
    if (![y, m, d, hh, mm].every(Number.isFinite)) return null;
    return new Date(y, m - 1, d, hh, mm, ss);
  }

  function deriveStatus(item, now = new Date()) {
    const bookingAt = appointmentDateTime(item);

    // Once the scheduled time has passed, the appointment is always "Прошедшая".
    if (bookingAt && bookingAt <= now) return STATUS.PAST;

    // A new request is "Новая" only during the calendar day on which it was created.
    if (item?.created_at) {
      const created = new Date(item.created_at);
      if (!Number.isNaN(created.getTime()) && localDateKey(created) === localDateKey(now)) {
        return STATUS.NEW;
      }
    }

    // Future appointments that are no longer new are simply waiting/expected.
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
    filter.innerHTML = '';
    [
      ['all', 'Все статусы'],
      ['new', 'Новые'],
      ['confirmed', 'Ожидают'],
      ['done', 'Прошедшие']
    ].forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      filter.appendChild(option);
    });
  }

  configureFilter();
  syncStatuses();
  setInterval(syncStatuses, 30000);
})();
