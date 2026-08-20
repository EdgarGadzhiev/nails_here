(() => {
  const originalInvoke = supabaseClient.functions.invoke.bind(supabaseClient.functions);

  const hideAdminMasterOption = () => {
    const checkbox = document.getElementById('adminIsMaster');
    const label = checkbox?.closest('label');
    if (label) label.hidden = true;
  };

  hideAdminMasterOption();
  new MutationObserver(hideAdminMasterOption).observe(document.body, { childList: true, subtree: true });

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
        body.isMaster = true;
        body.displayName = nameInput?.value?.trim() || '';
      }

      return originalInvoke(functionName, { ...options, body });
    };
  })();
})();
