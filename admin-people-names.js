(() => {
  const refreshNames = async () => {
    try {
      if (typeof supabaseClient === 'undefined') return;
      const { data, error } = await supabaseClient.rpc('get_manageable_users');
      if (error || !Array.isArray(data)) return;

      const users = data.map(user => ({
        name: String(user.display_name || '').trim(),
        email: String(user.email || '').trim()
      }));

      document.querySelectorAll('#peopleList .person-row').forEach(row => {
        const strong = row.querySelector('strong');
        if (!strong) return;

        const raw = String(strong.dataset.originalEmail || strong.textContent || '').trim();
        const currentEmail = raw.toLowerCase();
        const user = users.find(item => item.email.toLowerCase() === currentEmail)
          || users.find(item => item.name && item.name.toLowerCase() === currentEmail);
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

  const observer = new MutationObserver(() => refreshNames());
  const start = () => {
    const list = document.getElementById('peopleList');
    if (list) observer.observe(list, { childList: true, subtree: true });
    refreshNames();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
