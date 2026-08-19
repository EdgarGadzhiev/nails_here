// Dynamic master loader.
// It runs before the booking logic when included before script.js.
(function () {
  const SUPABASE_URL = "https://smtufbilfcszuhywswmx.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_o-blKCBreqQQDzolb9IMCQ_U9Ila5KH";
  const SALON_ID = "027f2a41-f70b-4446-8898-7d110a8cd1bf";

  function loadMastersSync() {
    try {
      const xhr = new XMLHttpRequest();
      const url = `${SUPABASE_URL}/rest/v1/profiles?select=id&salon_id=eq.${encodeURIComponent(SALON_ID)}&is_master=eq.true&is_active=eq.true&order=created_at.asc`;
      xhr.open('GET', url, false);
      xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
      xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
      xhr.send();
      if (xhr.status < 200 || xhr.status >= 300) return [];
      return JSON.parse(xhr.responseText || '[]');
    } catch (e) {
      console.error('Не удалось загрузить мастеров:', e);
      return [];
    }
  }

  function applyMasters() {
    const masters = loadMastersSync();
    const list = document.querySelector('.booking-masters-list');
    if (!list) return;

    const any = Array.from(list.querySelectorAll('input[name="master"]')).find(input => input.value === 'Любой свободный');
    list.innerHTML = '';

    masters.forEach((master, index) => {
      const label = document.createElement('label');
      label.className = 'booking-master-item';
      label.innerHTML = `<input type="radio" name="master" value="${master.id}"><span class="master-radio-photo"><i class="fas fa-user"></i></span><span class="booking-master-name">Мастер ${index + 1}</span><span class="booking-master-role">Доступен для записи</span>`;
      list.appendChild(label);
    });

    const anyLabel = document.createElement('label');
    anyLabel.className = 'booking-master-item';
    anyLabel.innerHTML = '<input type="radio" name="master" value="Любой свободный"><span class="master-radio-photo"><i class="fas fa-users"></i></span><span class="booking-master-name">Не важно</span><span class="booking-master-role">Любой свободный мастер</span>';
    list.appendChild(anyLabel);

    if (!masters.length) {
      list.innerHTML = '<div class="booking-times-placeholder">Сейчас нет доступных мастеров для онлайн-записи.</div>';
    }
  }

  // The booking script is loaded immediately after this file, so a synchronous
  // request guarantees that its event handlers see the dynamic master list.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyMasters, { once: true });
  else applyMasters();
})();
