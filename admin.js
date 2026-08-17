const SUPABASE_URL = "https://smtufbilfcszuhywswmx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_o-blKCBreqQQDzol9IMCQ_U9Ila5KH";

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
const refreshBtn = document.getElementById('refreshBtn');
const logoutBtn = document.getElementById('logoutBtn');

let appointments = [];

const statusNames = {
  new: 'Новая',
  confirmed: 'Подтверждена',
  done: 'Завершена',
  cancelled: 'Отменена'
};

function showDashboard(user) {
  loginCard.hidden = true;
  dashboard.hidden = false;
  adminEmail.textContent = user?.email || '';
  loadAppointments();
}

function showLogin() {
  loginCard.hidden = false;
  dashboard.hidden = true;
}

function formatDate(value) {
  if (!value) return '—';
  const [year, month, day] = String(value).split('-');
  return day && month ? `${day}.${month}.${year}` : value;
}

function renderAppointments() {
  const filter = statusFilter.value;
  const filtered = filter === 'all'
    ? appointments
    : appointments.filter(item => item.status === filter);

  appointmentsBody.innerHTML = '';
  emptyState.hidden = filtered.length !== 0;

  filtered.forEach(item => {
    const tr = document.createElement('tr');
    const status = item.status || 'new';
    const safeStatus = statusNames[status] ? status : 'new';

    tr.innerHTML = `
      <td><div class="client-name">${escapeHtml(item.name || 'Без имени')}</div></td>
      <td><a class="phone" href="tel:${escapeAttr(item.phone || '')}">${escapeHtml(item.phone || '—')}</a></td>
      <td class="services">${escapeHtml(item.services || '—')}</td>
      <td>${escapeHtml(item.master || '—')}</td>
      <td class="date">${formatDate(item.booking_date)}</td>
      <td class="time">${escapeHtml(item.booking_time || '—')}</td>
      <td><span class="status status-${safeStatus}">${statusNames[safeStatus]}</span></td>
    `;

    appointmentsBody.appendChild(tr);
  });
}

function updateStats() {
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  document.getElementById('totalCount').textContent = appointments.length;
  document.getElementById('newCount').textContent = appointments.filter(item => (item.status || 'new') === 'new').length;
  document.getElementById('todayCount').textContent = appointments.filter(item => item.booking_date === todayIso).length;
}

async function loadAppointments() {
  loadingState.hidden = false;
  emptyState.hidden = true;
  tableError.textContent = '';
  appointmentsBody.innerHTML = '';

  try {
    const { data, error } = await supabaseClient
      .from('appointments')
      .select('id,name,phone,services,master,booking_date,booking_time,status,created_at')
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

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttr(value) {
  return String(value).replace(/[^0-9+()\-\s]/g, '');
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
    showDashboard(data.user);
  } catch (error) {
    console.error(error);
    loginError.textContent = error.message || 'Не удалось войти.';
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Войти';
  }
});

refreshBtn.addEventListener('click', loadAppointments);
statusFilter.addEventListener('change', renderAppointments);

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
  if (data.session?.user) showDashboard(data.session.user);
  else showLogin();
})();
