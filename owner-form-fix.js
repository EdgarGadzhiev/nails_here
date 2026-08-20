(() => {
  const form = document.getElementById('salonForm');
  if (!form || !window.supabase) return;

  const SUPABASE_URL = 'https://smtufbilfcszuhywswmx.supabase.co';
  const SUPABASE_ANON_KEY = ['sb_publishable_o', '-blKCBreqQQDzolb9IMCQ_U9Ila5KH'].join('');
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const name = document.getElementById('salonName')?.value.trim();
    const ownerName = document.getElementById('ownerDisplayName')?.value.trim();
    const email = document.getElementById('ownerEmail')?.value.trim().toLowerCase();
    const password = document.getElementById('ownerPassword')?.value;
    const isMaster = Boolean(document.getElementById('ownerIsMaster')?.checked);
    const errorBox = document.getElementById('salonFormError');
    const button = document.getElementById('saveSalonBtn');

    if (!name || !ownerName || !email || !password) return;
    if (password.length < 6) {
      if (errorBox) errorBox.textContent = 'Пароль владельца должен содержать минимум 6 символов.';
      return;
    }

    if (button) { button.disabled = true; button.textContent = 'Создаём…'; }
    if (errorBox) errorBox.textContent = '';

    try {
      const { data, error } = await client.functions.invoke('create-salon-owner', {
        body: {
          salonName: name,
          displayName: ownerName,
          ownerEmail: email,
          ownerPassword: password,
          isMaster
        }
      });
      if (error) throw error;
      if (!data?.success || !data?.salon) throw new Error(data?.error || 'Сервер не подтвердил создание салона.');
      window.location.reload();
    } catch (error) {
      console.error(error);
      if (errorBox) errorBox.textContent = `Не удалось создать салон: ${error.message}`;
    } finally {
      if (button) { button.disabled = false; button.textContent = 'Создать салон и владельца'; }
    }
  }, true);
})();
