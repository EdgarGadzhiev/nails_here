(() => {
  const form = document.getElementById('adminForm');
  if (!form || !window.supabase) return;

  const SUPABASE_URL = 'https://smtufbilfcszuhywswmx.supabase.co';
  const SUPABASE_ANON_KEY = ['sb_publishable_o', '-blKCBreqQQDzolb9IMCQ_U9Ila5KH'].join('');
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  form.addEventListener('submit', async (event) => {
    if (form.dataset.mode !== 'owner') return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const salonId = form.dataset.salonId || document.getElementById('adminSalonSelect')?.value;
    const displayName = document.getElementById('adminDisplayName')?.value.trim();
    const email = document.getElementById('adminEmailInput')?.value.trim().toLowerCase();
    const password = document.getElementById('adminPasswordInput')?.value;
    const errorBox = document.getElementById('adminFormError');
    const button = document.getElementById('saveAdminBtn');

    if (!salonId || !displayName || !email || !password) {
      if (errorBox) errorBox.textContent = 'Заполни имя, email и пароль владельца.';
      return;
    }
    if (password.length < 6) {
      if (errorBox) errorBox.textContent = 'Пароль владельца должен содержать минимум 6 символов.';
      return;
    }

    if (button) { button.disabled = true; button.textContent = 'Назначаем…'; }
    if (errorBox) errorBox.textContent = '';

    try {
      const { data, error } = await client.functions.invoke('assign-salon-owner', {
        body: {
          salonId,
          ownerEmail: email,
          ownerPassword: password,
          displayName,
          isMaster: false
        }
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Сервер не подтвердил назначение владельца.');
      window.location.reload();
    } catch (error) {
      console.error(error);
      if (errorBox) errorBox.textContent = `Не удалось назначить владельца: ${error.message}`;
    } finally {
      if (button) { button.disabled = false; button.textContent = 'Назначить owner'; }
    }
  }, true);
})();
