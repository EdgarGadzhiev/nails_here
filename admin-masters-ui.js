(() => {
  const originalInvoke = supabaseClient.functions.invoke.bind(supabaseClient.functions);

  supabaseClient.functions.invoke = (function () {
    return async function (functionName, options = {}) {
      const body = { ...(options.body || {}) };

      if (functionName === 'create-salon-admin') {
        const checkbox = document.getElementById('adminIsMaster');
        body.isMaster = !!checkbox?.checked;
      }

      if (functionName === 'create-salon-owner') {
        const checkbox = document.getElementById('ownerIsMaster');
        body.isMaster = !!checkbox?.checked;
      }

      if (functionName === 'assign-salon-owner') {
        const checkbox = document.getElementById('adminIsMaster');
        body.isMaster = !!checkbox?.checked;
      }

      return originalInvoke(functionName, { ...options, body });
    };
  })();

  function decoratePeople() {
    document.querySelectorAll('.person-row').forEach(row => {
      if (row.querySelector('.master-badge')) return;
      const text = row.textContent || '';
      if (!/OWNER|ADMIN/.test(text)) return;
      const badge = document.createElement('span');
      badge.className = 'master-badge';
      badge.textContent = 'Мастер определяется настройкой аккаунта';
      badge.hidden = true;
      row.querySelector('div')?.appendChild(badge);
    });
  }

  const observer = new MutationObserver(decoratePeople);
  observer.observe(document.body, { childList: true, subtree: true });
})();
