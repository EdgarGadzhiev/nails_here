(() => {
  const salonList = document.getElementById('salonList');
  if (!salonList) return;

  function addDeleteButtons() {
    if (typeof currentProfile === 'undefined' || currentProfile?.role !== 'super_admin') return;

    salonList.querySelectorAll('.salon-card').forEach(card => {
      if (card.querySelector('[data-delete-salon]')) return;

      const openButton = card.querySelector('[data-open-salon]');
      const salonId = openButton?.dataset.openSalon;
      if (!salonId) return;

      const actions = document.createElement('div');
      actions.className = 'salon-card-actions';
      actions.innerHTML = `
        <button class="salon-open" type="button" data-delete-salon="${salonId}">Удалить салон</button>
      `;
      card.appendChild(actions);
    });
  }

  salonList.addEventListener('click', async event => {
    const button = event.target.closest('[data-delete-salon]');
    if (!button) return;

    if (typeof currentProfile === 'undefined' || currentProfile?.role !== 'super_admin') return;

    const salonId = button.dataset.deleteSalon;
    const salon = typeof salons !== 'undefined' ? salons.find(item => item.id === salonId) : null;
    if (!salon) return;

    const confirmed = window.confirm(
      `Удалить салон «${salon.name}»?\n\n` +
      `Будут удалены все его заявки, владельцы и администраторы.\n` +
      `Аккаунты пользователей также будут удалены.\n\n` +
      `Это действие нельзя отменить.`
    );

    if (!confirmed) return;

    button.disabled = true;
    button.textContent = 'Удаляем…';

    try {
      const { data, error } = await supabaseClient.functions.invoke('delete-salon', {
        body: { salonId }
      });

      if (error) {
        let message = error.message || 'Не удалось удалить салон.';
        try {
          if (error.context) {
            const details = await error.context.json();
            if (details?.error) message = details.error;
          }
        } catch (_) {}
        throw new Error(message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Сервер не подтвердил удаление салона.');
      }

      await loadSalons();
      await loadManageableUsers();
      await loadAppointments();
    } catch (error) {
      console.error(error);
      window.alert(`Не удалось удалить салон: ${error.message}`);
      button.disabled = false;
      button.textContent = 'Удалить салон';
    }
  });

  const observer = new MutationObserver(addDeleteButtons);
  observer.observe(salonList, { childList: true, subtree: true });
  window.setTimeout(addDeleteButtons, 100);
})();
