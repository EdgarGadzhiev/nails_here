// Dynamic master loader. Include immediately before script.js.
(function () {
  const SUPABASE_URL = "https://smtufbilfcszuhywswmx.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_o-blKCBreqQQDzolb9IMCQ_U9Ila5KH";
  const SALON_ID = "027f2a41-f70b-4446-8898-7d110a8cd1bf";

  function loadMastersSync() {
    try {
      const xhr = new XMLHttpRequest();
      const url = `${SUPABASE_URL}/rest/v1/profiles?select=id,display_name&salon_id=eq.${encodeURIComponent(SALON_ID)}&is_master=eq.true&is_active=eq.true&order=created_at.asc`;
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

  const list = document.querySelector('.booking-masters-list');
  if (!list) return;
  const masters = loadMastersSync();
  const byName = new Map();
  masters.forEach(master => byName.set(master.display_name || `Мастер ${byName.size + 1}`, master.id));
  window.NAILS_HERE_MASTERS = masters;

  list.innerHTML = '';
  masters.forEach((master, index) => {
    const name = master.display_name || `Мастер ${index + 1}`;
    const label = document.createElement('label');
    label.className = 'booking-master-item';
    label.innerHTML = `<input type="radio" name="master" value="${name.replace(/"/g, '&quot;')}"><span class="master-radio-photo"><i class="fas fa-user"></i></span><span class="booking-master-name">${name}</span><span class="booking-master-role">Мастер салона</span>`;
    list.appendChild(label);
  });

  const anyLabel = document.createElement('label');
  anyLabel.className = 'booking-master-item';
  anyLabel.innerHTML = '<input type="radio" name="master" value="Любой свободный"><span class="master-radio-photo"><i class="fas fa-users"></i></span><span class="booking-master-name">Не важно</span><span class="booking-master-role">Любой свободный мастер</span>';
  list.appendChild(anyLabel);

  const originalFetch = window.fetch.bind(window);
  window.fetch = async function (input, init = {}) {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (url.includes('/rest/v1/appointments') && init?.body) {
      try {
        const payload = JSON.parse(init.body);
        const selected = masters.find(m => (m.display_name || '') === payload.master);
        if (selected) {
          payload.master_id = selected.id;
          init = { ...init, body: JSON.stringify(payload) };
        }
      } catch (_) {}
    }
    return originalFetch(input, init);
  };
})();
