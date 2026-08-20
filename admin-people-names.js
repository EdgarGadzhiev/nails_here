(() => {
  const refreshNames = async () => {
    try {
      if (typeof supabaseClient === 'undefined') return;
      const { data, error } = await supabaseClient.rpc('get_manageable_users');
      if (error || !Array.isArray(data)) return;
      const users = data.map(user => ({
        id: String(user.id || '').trim(),
        name: String(user.display_name || '').trim(),
        email: String(user.email || '').trim()
      }));
      document.querySelectorAll('#peopleList .person-row').forEach(row => {
        const strong = row.querySelector('strong');
        if (!strong) return;
        const raw = String(strong.dataset.originalEmail || strong.textContent || '').trim();
        const user = users.find(item => item.email.toLowerCase() === raw.toLowerCase())
          || users.find(item => item.name && item.name.toLowerCase() === raw.toLowerCase());
        if (!user) return;
        strong.dataset.originalEmail = user.email;
        strong.textContent = user.name || user.email;
        let emailLine = row.querySelector('.person-email-line');
        if (!emailLine) {
          emailLine = document.createElement('div');
          emailLine.className = 'person-email-line';
          emailLine.style.cssText = 'font-size:12px;opacity:.65;margin-top:2px;line-height:1.3;';
          strong.parentElement?.appendChild(emailLine);
        }
        emailLine.textContent = user.email;
      });
    } catch (error) {
      console.debug('Не удалось обновить имена пользователей:', error);
    }
  };

  const value = id => document.getElementById(id)?.value?.trim() || '';
  const invoke = async (fn, body) => {
    const { data, error } = await supabaseClient.functions.invoke(fn, { body });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Сервер не подтвердил операцию.');
    return data;
  };

  // This handler is installed in the capture phase and therefore replaces the
  // older submit handlers in admin.js. It always sends the actual name field
  // as displayName instead of accidentally using the email as the name.
  const installNameSubmissionFix = () => {
    const adminForm = document.getElementById('adminForm');
    const salonForm = document.getElementById('salonForm');
    if (adminForm && !adminForm.dataset.nameFixInstalled) {
      adminForm.dataset.nameFixInstalled = '1';
      adminForm.addEventListener('submit', async event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        const errorBox = document.getElementById('adminFormError');
        const button = document.getElementById('saveAdminBtn');
        const email = value('adminEmailInput').toLowerCase();
        const password = document.getElementById('adminPasswordInput')?.value || '';
        const displayName = value('adminDisplayName') || value('adminName') || value('adminUserName');
        const salonId = typeof isSuperAdmin === 'function' && isSuperAdmin()
          ? value('adminSalonSelect')
          : window.currentProfile?.salon_id || '';
        const mode = adminForm.dataset.mode || 'admin';
        if (!email || !password || !displayName) {
          if (errorBox) errorBox.textContent = 'Заполни имя, email и пароль.';
          return;
        }
        if (password.length < 6) {
          if (errorBox) errorBox.textContent = 'Пароль должен содержать минимум 6 символов.';
          return;
        }
        button && (button.disabled = true);
        try {
          if (mode === 'owner') {
            const targetSalonId = adminForm.dataset.salonId || salonId;
            await invoke('assign-salon-owner', {
              salonId: targetSalonId,
              ownerEmail: email,
              ownerPassword: password,
              displayName
            });
          } else {
            if (!salonId) throw new Error('Не выбран салон.');
            await invoke('create-salon-admin', { email, password, salonId, displayName });
          }
          if (typeof closeAdminForm === 'function') closeAdminForm();
          if (typeof resetAdminFormMode === 'function') resetAdminFormMode();
          if (typeof loadManageableUsers === 'function') await loadManageableUsers();
          await refreshNames();
        } catch (error) {
          console.error(error);
          if (errorBox) errorBox.textContent = `Не удалось создать пользователя: ${error.message}`;
        } finally {
          button && (button.disabled = false);
        }
      }, true);
    }

    if (salonForm && !salonForm.dataset.nameFixInstalled) {
      salonForm.dataset.nameFixInstalled = '1';
      salonForm.addEventListener('submit', async event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        const errorBox = document.getElementById('salonFormError');
        const button = document.getElementById('saveSalonBtn');
        const salonName = value('salonName');
        const ownerEmail = value('ownerEmail').toLowerCase();
        const ownerPassword = document.getElementById('ownerPassword')?.value || '';
        const displayName = value('ownerDisplayName') || value('ownerName') || value('ownerUserName');
        const isMaster = Boolean(document.getElementById('ownerIsMaster')?.checked);
        if (!salonName || !ownerEmail || !ownerPassword || !displayName) {
          if (errorBox) errorBox.textContent = 'Заполни название салона, имя владельца, email и пароль.';
          return;
        }
        if (ownerPassword.length < 6) {
          if (errorBox) errorBox.textContent = 'Пароль владельца должен содержать минимум 6 символов.';
          return;
        }
        button && (button.disabled = true);
        try {
          const data = await invoke('create-salon-owner', {
            salonName,
            displayName,
            ownerEmail,
            ownerPassword,
            isMaster
          });
          if (typeof loadSalons === 'function') await loadSalons();
          if (typeof loadManageableUsers === 'function') await loadManageableUsers();
          if (typeof closeSalonForm === 'function') closeSalonForm();
          if (typeof updateStats === 'function') updateStats();
          if (typeof renderAppointments === 'function') renderAppointments();
          await refreshNames();
          if (data?.salon && document.getElementById('salonFilter')) document.getElementById('salonFilter').value = data.salon.id;
        } catch (error) {
          console.error(error);
          if (errorBox) errorBox.textContent = `Не удалось создать салон: ${error.message}`;
        } finally {
          button && (button.disabled = false);
        }
      }, true);
    }
  };

  const observer = new MutationObserver(() => refreshNames());
  const start = () => {
    const list = document.getElementById('peopleList');
    if (list) observer.observe(list, { childList: true, subtree: true });
    installNameSubmissionFix();
    refreshNames();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
