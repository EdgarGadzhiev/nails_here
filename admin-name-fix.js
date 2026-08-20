(() => {
  const getValue = (id) => document.getElementById(id)?.value?.trim() || '';
  if (typeof supabaseClient === 'undefined') return;

  const originalInvoke = supabaseClient.functions.invoke.bind(supabaseClient.functions);
  supabaseClient.functions.invoke = async (functionName, options = {}) => {
    const body = { ...(options.body || {}) };

    if (functionName === 'create-salon-admin') {
      body.displayName = getValue('adminDisplayName');
      body.email = getValue('adminEmailInput').toLowerCase();
      body.password = document.getElementById('adminPasswordInput')?.value || '';
      body.salonId = document.getElementById('adminSalonSelect')?.value || body.salonId || '';
    }

    if (functionName === 'create-salon-owner') {
      body.displayName = getValue('ownerDisplayName');
      body.ownerEmail = getValue('ownerEmail').toLowerCase();
      body.ownerPassword = document.getElementById('ownerPassword')?.value || '';
      body.salonName = getValue('salonName');
      body.isMaster = !!document.getElementById('ownerIsMaster')?.checked;
    }

    if (functionName === 'assign-salon-owner') {
      body.displayName = getValue('adminDisplayName');
      body.ownerEmail = getValue('adminEmailInput').toLowerCase();
      body.ownerPassword = document.getElementById('adminPasswordInput')?.value || '';
      body.salonId = document.getElementById('adminSalonSelect')?.value || body.salonId || '';
    }

    return originalInvoke(functionName, { ...options, body });
  };
})();
