(() => {
  const form = document.getElementById('salonForm');
  if (!form) return;

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

    if (button) {
      button.disabled = true;
      button.textContent = 'Создаём…';
    }
    if (errorBox) errorBox.textContent = '';

    try {
      const { data, error } = await window.supabaseClientForOwnerFix.functions.invoke('create-salon-owner', {
        body: {
          salonName: name,
          ownerDisplayName: ownerName,
          ownerEmail: email,
          ownerPassword: password,
          isMaster
        }
      });
      if (error) throw error;
      if (!data?.success || !data?.salon) throw new Error(data?.error || 'Сервер не подтвердил создание салона.');

      if (typeof window.loadSalons === 'function') await window.loadSalons();
      if (typeof window.loadManageableUsers === 'function') await window.loadManageableUsers();
      if (typeof window.closeSalonForm === 'function') window.closeSalonForm();
    } catch (error) {
      console.error(error);
      if (errorBox) errorBox.textContent = `Не удалось создать салон: ${error.message}`;
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = 'Создать салон и владельца';
      }
    }
  }, true);
})();
