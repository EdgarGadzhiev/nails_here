(() => {
  const originalInvoke = supabaseClient.functions.invoke.bind(supabaseClient.functions);

  const hideAdminMasterOption = () => {
    const checkbox = document.getElementById('adminIsMaster');
    const label = checkbox?.closest('label');
    if (label) label.hidden = true;
  };

  const syncOwnerMasterOption = () => {
    const form = document.getElementById('adminForm');
    const password = document.getElementById('adminPasswordInput');
    if (!form || !password) return;
    let wrap = document.getElementById('assignOwnerMasterOption');
    if (form.dataset.mode === 'owner') {
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'assignOwnerMasterOption';
        wrap.className = 'master-option';
        wrap.innerHTML = '<label class="master-option"><input id="assignOwnerIsMaster" type="checkbox"> <span>Владелец также является мастером</span></label>';
        password.closest('label')?.after(wrap);
      }
      wrap.hidden = false;
    } else if (wrap) {
      wrap.hidden = true;
      const checkbox = document.getElementById('assignOwnerIsMaster');
      if (checkbox) checkbox.checked = false;
    }
  };

  const forceAdminMode = () => {
    const form = document.getElementById('adminForm');
    if (!form) return;
    form.dataset.mode = 'admin';
    syncOwnerMasterOption();
  };

  hideAdminMasterOption();
  syncOwnerMasterOption();

  document.getElementById('addAdminBtn')?.addEventListener('click', () => {
    forceAdminMode();
    setTimeout(forceAdminMode, 0);
    setTimeout(forceAdminMode, 50);
  });

  document.getElementById('cancelAdminBtn')?.addEventListener('click', () => {
    setTimeout(forceAdminMode, 0);
  });

  const observer = new MutationObserver(() => {
    hideAdminMasterOption();
    syncOwnerMasterOption();
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-mode'] });

  supabaseClient.functions.invoke = (function () {
    return async function (functionName, options = {}) {
      const body = { ...(options.body || {}) };
      if (functionName === 'create-salon-admin') {
        const nameInput = document.getElementById('adminDisplayName');
        body.isMaster = true;
        body.displayName = nameInput?.value?.trim() || '';
      }
      if (functionName === 'create-salon-owner') {
        const checkbox = document.getElementById('ownerIsMaster');
        const nameInput = document.getElementById('ownerDisplayName');
        body.isMaster = !!checkbox?.checked;
        body.displayName = nameInput?.value?.trim() || '';
      }
      if (functionName === 'assign-salon-owner') {
        const nameInput = document.getElementById('adminDisplayName');
        const checkbox = document.getElementById('assignOwnerIsMaster');
        body.isMaster = !!checkbox?.checked;
        body.displayName = nameInput?.value?.trim() || '';
      }
      return originalInvoke(functionName, { ...options, body });
    };
  })();
})();