const SUPABASE_URL = "https://smtufbilfcszuhywswmx.supabase.co";
const SUPABASE_ANON_KEY = ["sb_publishable_o", "-blKCBreqQQDzolb9IMCQ_U9Ila5KH"].join("");

const { createClient } = window.supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginCard = document.getElementById('loginCard');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const adminEmail = document.getElementById('adminEmail');
const appointmentsBody = document.getElementById('appointmentsBody');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const tableError = document.getElementById('tableError');
const statusFilter = document.getElementById('statusFilter');
const salonFilter = document.getElementById('salonFilter');
const refreshBtn = document.getElementById('refreshBtn');
const logoutBtn = document.getElementById('logoutBtn');

const salonManagement = document.getElementById('salonManagement');
const addSalonBtn = document.getElementById('addSalonBtn');
const salonFormWrap = document.getElementById('salonFormWrap');
const salonForm = document.getElementById('salonForm');
const salonName = document.getElementById('salonName');
const ownerEmail = document.getElementById('ownerEmail');
const ownerPassword = document.getElementById('ownerPassword');
const saveSalonBtn = document.getElementById('saveSalonBtn');
const cancelSalonBtn = document.getElementById('cancelSalonBtn');
const salonFormError = document.getElementById('salonFormError');
const salonList = document.getElementById('salonList');
const salonLoading = document.getElementById('salonLoading');
const salonEmpty = document.getElementById('salonEmpty');

let appointments = [];
let salons = [];
let currentProfile = null;

const statusNames = {
  new: 'Новая',
  confirmed: 'Подтверждена',
  done: 'Завершена',
  cancelled: 'Отменена'
};

function isSuperAdmin() {
  return currentProfile?.role === 'super_admin';
}

async function loadCurrentProfile() {
  const { data, error } = await supabaseClient.rpc('get_my_profile');
  if (error) throw error;
  currentProfile = data;

  if (isSuperAdmin()) {
    salonFilter.hidden = false;
    salonManagement.hidden = false;
    await loadSalons();
  } else {
    salonFilter.hidden = true;
    salonManagement.hidden = true;
  }
}

async function loadSalons() {
  salonLoading.hidden = false;
  salonEmpty.hidden = true;
  salonList.innerHTML = '';

  const { data, error } = await supabaseClient
    .from('salons')
    .select('id,name,created_at')
    .order('name', { ascending: true });

  if (error) throw error;

  salons = data || [];
  salonFilter.innerHTML = '<option value="all">Все салоны</option>';

  salons.forEach(salon => {
    const option = document.createElement('option');
    option.value = salon.id;
    option.textContent = salon.name;
    salonFilter.appendChild(option);
  });

  renderSalonList();
  salonLoading.hidden = true;
  salonEmpty.hidden = salons.length !== 0;
}

function renderSalonList() {
  salonList.innerHTML = '';

  salons.forEach(salon => {
    const card = document.createElement('article');
    card.className = 'salon-card';
    card.innerHTML = `
      <h3>${escapeHtml(salon.name || 'Без названия')}</h3>
      <p class="salon-id">ID: ${escapeHtml(salon.id)}</p>
      <button class="salon-open" type="button" data-open-salon="${escapeAttr(salon.id)}">Открыть заявки →</button>
    `;
    salonList.appendChild(card);
  });
}

function openSalonForm() {
  salonFormWrap.hidden = false;
  salonFormError.textContent = '';
  salonName.value = '';
  ownerEmail.value = '';
  ownerPassword.value = '';
  salonName.focus();
}

function closeSalonForm() {
  salonFormWrap.hidden = true;
  salonFormError.textContent = '';
  salonForm.reset();
}

async function createSalon(event) {
  event.preventDefault();
  salonFormError.textContent = '';

  const name = salonName.value.trim();
  const email = ownerEmail.value.trim();
  const password = ownerPassword.value;

  if (!name || !email || !password) return;

  if (password.length < 6) {
    salonFormError.textContent = 'Пароль владельца должен содержать минимум 6 символов.';
    return;
  }

  saveSalonBtn.disabled = true;
  saveSalonBtn.textContent = 'Создаём…';

  try {
    const { data, error } = await supabaseClient.functions.invoke('create-salon-owner', {
      body: {
        salonName: name,
        ownerEmail: email,
        ownerPassword: password
      }
    });

    if (error) {
      let message = error.message || 'Не удалось создать салон и владельца.';

      try {
        if (error.context) {
          const details = await error.context.json();
          if (details?.error) message = details.error;
        }
      } catch (_) {
        // Оставляем исходное сообщение ошибки.
      }

      throw new Error(message);
    }

    if (!data?.success || !data?.salon) {
      throw new Error(data?.error || 'Сервер не подтвердил создание салона.');
    }

    await loadSalons();
    closeSalonForm();

    salonFilter.value = data.salon.id;
    updateStats();
    renderAppointments();
  } catch (error) {
    console.error(error);
    salonFormError.textContent = `Не удалось создать салон: ${error.message}`;
  } finally {
    saveSalonBtn.disabled = false;
    saveSalonBtn.textContent = 'Создать салон и владельца';
  }
}

async function showDashboard(user) {
  loginCard.hidden = true;
  dashboard.hidden = false;
  adminEmail.textContent = user?.email || '';

  try {
    await loadCurrentProfile();
    await loadAppointments();
  } catch (error) {
    console.error(error);
    tableError.textContent = `Не удалось загрузить профиль или салоны: ${error.message}`;
  }
}

function showLogin() {
  loginCard.hidden = false;
  dashboard.hidden = true;
  currentProfile = null;
  salons = [];
  salonFilter.hidden = true;
  salonManagement.hidden = true;
  closeSalonForm();
}

function formatDate(value) {
  if (!value) return '—';
  const [year, month, day] = String(value).split('-');
  return day && month ? `${day}.${month}.${year}` : value;
}

function renderAppointments() {
  const status = statusFilter.value;
  const selectedSalon = salonFilter.value;

  const filtered = appointments.filter(item => {
    const statusMatches = status === 'all' || item.status === status;
    const salonMatches = !isSuperAdmin() || selectedSalon === 'all' || item.salon_id === selectedSalon;
    return statusMatches && salonMatches;
  });

  appointmentsBody.innerHTML = '';
  emptyState.hidden = filtered.length !== 0;

  filtered.forEach(item => {
    const tr = document.createElement('tr');
    const itemStatus = item.status || 'new';
    const safeStatus = statusNames[itemStatus] ? itemStatus : 'new';

    tr.innerHTML = `
      <td><div class="client-name">${escapeHtml(item.name || 'Без имени')}</div></td>
      <td><a class="phone" href="tel:${escapeAttr(item.phone || '')}">${escapeHtml(item.phone || '—')}</a></td>
      <td class="services">${escapeHtml(item.services || '—')}</td>
      <td>${escapeHtml(item.master || '—')}</td>
      <td class="date">${formatDate(item.booking_date)}</td>
      <td class="time">${escapeHtml(item.booking_time || '—')}</td>
      <td><span class="status status-${safeStatus}">${statusNames[safeStatus]}</span></td>
      <td class="actions-cell">
        <button class="delete-btn" type="button" data-delete-id="${escapeAttr(item.id)}" aria-label="Удалить заявку" title="Удалить заявку">🗑</button>
      </td>
    `;

    appointmentsBody.appendChild(tr);
  });
}

function updateStats() {
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const selectedSalon = salonFilter.value;

  const statsAppointments = isSuperAdmin() && selectedSalon !== 'all'
    ? appointments.filter(item => item.salon_id === selectedSalon)
    : appointments;

  document.getElementById('totalCount').textContent = statsAppointments.length;
  document.getElementById('newCount').textContent = statsAppointments.filter(item => (item.status || 'new') === 'new').length;
  document.getElementById('todayCount').textContent = statsAppointments.filter(item => item.booking_date === todayIso).length;
}

async function loadAppointments() {
  loadingState.hidden = false;
  emptyState.hidden = true;
  tableError.textContent = '';
  appointmentsBody.innerHTML = '';

  try {
    const { data, error } = await supabaseClient
      .from('appointments')
      .select('id,name,phone,services,master,booking_date,booking_time,status,created_at,salon_id')
      .order('created_at', { ascending: false });

    if (error) throw error;

    appointments = data || [];
    updateStats();
    renderAppointments();
  } catch (error) {
    console.error(error);
    appointments = [];
    updateStats();
    tableError.textContent = `Не удалось загрузить заявки: ${error.message}`;
    emptyState.hidden = true;
  } finally {
    loadingState.hidden = true;
  }
}

async function deleteAppointment(id) {
  const appointment = appointments.find(item => item.id === id);
  if (!appointment) return;

  const clientName = appointment.name || 'этого клиента';
  const confirmed = window.confirm(`Удалить заявку клиента «${clientName}»?\n\nЭто действие нельзя отменить.`);
  if (!confirmed) return;

  const button = appointmentsBody.querySelector(`[data-delete-id="${CSS.escape(id)}"]`);
  if (button) {
    button.disabled = true;
    button.textContent = '…';
  }

  try {
    const { error } = await supabaseClient
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    appointments = appointments.filter(item => item.id !== id);
    updateStats();
    renderAppointments();
  } catch (error) {
    console.error(error);
    tableError.textContent = `Не удалось удалить заявку: ${error.message}`;
    if (button) {
      button.disabled = false;
      button.textContent = '🗑';
    }
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttr(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '');
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.textContent = '';
  loginBtn.disabled = true;
  loginBtn.textContent = 'Входим…';

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await showDashboard(data.user);
  } catch (error) {
    console.error(error);
    loginError.textContent = error.message || 'Не удалось войти.';
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Войти';
  }
});

appointmentsBody.addEventListener('click', (event) => {
  const button = event.target.closest('[data-delete-id]');
  if (!button) return;
  deleteAppointment(button.dataset.deleteId);
});

salonList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-open-salon]');
  if (!button) return;

  salonFilter.value = button.dataset.openSalon;
  updateStats();
  renderAppointments();
  document.querySelector('.panel:not(.salon-management)')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

addSalonBtn.addEventListener('click', openSalonForm);
cancelSalonBtn.addEventListener('click', closeSalonForm);
salonForm.addEventListener('submit', createSalon);

refreshBtn.addEventListener('click', async () => {
  try {
    if (isSuperAdmin()) await loadSalons();
    await loadAppointments();
  } catch (error) {
    console.error(error);
    tableError.textContent = `Не удалось обновить данные: ${error.message}`;
  }
});

statusFilter.addEventListener('change', () => {
  updateStats();
  renderAppointments();
});
salonFilter.addEventListener('change', () => {
  updateStats();
  renderAppointments();
});

logoutBtn.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  showLogin();
});

supabaseClient.auth.onAuthStateChange((_event, session) => {
  if (session?.user) showDashboard(session.user);
  else showLogin();
});

(async function init() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session?.user) await showDashboard(data.session.user);
  else showLogin();
})();
