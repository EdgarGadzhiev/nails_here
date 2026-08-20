(() => {
  if (!window.supabaseClient?.functions) return;

  const originalInvoke = supabaseClient.functions.invoke.bind(supabaseClient.functions);

  supabaseClient.functions.invoke = async (functionName, options = {}) => {
    const body = { ...(options.body || {}) };

    if (functionName === 'create-salon-admin') {
      const input = document.getElementById('adminDisplayName');
      const displayName = input?.value?.trim() || '';
      if (displayName) body.displayName = displayName;
      body.isMaster = true;
    }

    if (functionName === 'create-salon-owner') {
      const input = document.getElementById('ownerDisplayName');
      const checkbox = document.getElementById('ownerIsMaster');
      const displayName = input?.value?.trim() || '';
      if (displayName) body.displayName = displayName;
      body.isMaster = !!checkbox?.checked;
    }

    if (functionName === 'assign-salon-owner') {
      const input = document.getElementById('adminDisplayName');
      const checkbox = document.getElementById('assignOwnerIsMaster');
      const displayName = input?.value?.trim() || '';
      if (displayName) body.displayName = displayName;
      body.isMaster = !!checkbox?.checked;
    }

    return originalInvoke(functionName, { ...options, body });
  };

  const refreshPeople = () => {
    const list = document.getElementById('peopleList');
    if (!list || typeof supabaseClient.rpc !== 'function') return;

    supabaseClient.rpc('get_manageable_users').then(({ data, error }) => {
      if (error || !Array.isArray(data)) return;
      const users = data.map(u => ({
        id: String(u.id || ''),
        email: String(u.email || '').trim(),
        name: String(u.display_name || '').trim()
      }));

      list.querySelectorAll('.person-row').forEach(row => {
        const strong = row.querySelector('strong');
        if (!strong) return;
        const id = strong.dataset.userId || '';
        const current = String(strong.dataset.originalEmail || strong.textContent || '').trim();
        const user = users.find(u => id && u.id === id) || users.find(u => u.email.toLowerCase() === current.toLowerCase());
        if (!user) return;

        strong.dataset.userId = user.id;
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
    }).catch(() => {});
  };

  const list = document.getElementById('peopleList');
  if (list) new MutationObserver(refreshPeople).observe(list, { childList: true, subtree: true });
  setTimeout(refreshPeople, 500);
  setTimeout(refreshPeople, 1500);
})();
