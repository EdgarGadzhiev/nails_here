(() => {
  const run = async () => {
    const list = document.getElementById('peopleList');
    if (!list || typeof supabaseClient === 'undefined') return;

    const { data, error } = await supabaseClient.rpc('get_manageable_users');
    if (error || !Array.isArray(data)) return;

    const byId = new Map(data.map(u => [String(u.id), u]));
    const byEmail = new Map(data.map(u => [String(u.email || '').trim().toLowerCase(), u]));

    list.querySelectorAll('.person-row').forEach(row => {
      const button = row.querySelector('[data-delete-owner], [data-delete-admin]');
      const id = button?.getAttribute('data-delete-owner') || button?.getAttribute('data-delete-admin');
      const strong = row.querySelector('strong');
      if (!strong) return;

      const current = String(strong.textContent || '').trim().toLowerCase();
      const user = (id && byId.get(id)) || byEmail.get(current) || data.find(u => current === String(u.email || '').trim().toLowerCase());
      if (!user) return;

      const name = String(user.display_name || '').trim();
      const email = String(user.email || '').trim();
      if (!name || !email) return;

      strong.textContent = name;
      strong.dataset.userNameFixed = '1';
      strong.dataset.userEmail = email;

      let emailLine = row.querySelector('.person-email-line');
      if (!emailLine) {
        emailLine = document.createElement('div');
        emailLine.className = 'person-email-line';
        strong.parentElement.appendChild(emailLine);
      }
      emailLine.textContent = email;
      emailLine.style.cssText = 'font-size:12px;opacity:.65;margin-top:2px;line-height:1.3;';
    });
  };

  let timer = null;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(run, 80);
  };

  const start = () => {
    const list = document.getElementById('peopleList');
    if (!list) return;
    const observer = new MutationObserver(schedule);
    observer.observe(list, { childList: true, subtree: true });
    run();
    setTimeout(run, 200);
    setTimeout(run, 700);
    setTimeout(run, 1500);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();