(() => {
  const refreshNames = async () => {
    try {
      if (!window.supabase || typeof supabaseClient === 'undefined') return;
      const { data, error } = await supabaseClient.rpc('get_manageable_users');
      if (error || !Array.isArray(data)) return;

      const byEmail = new Map(
        data.map(user => [String(user.email || '').trim().toLowerCase(), {
          name: String(user.display_name || '').trim(),
          email: String(user.email || '').trim()
        }])
      );

      document.querySelectorAll('#peopleList .person-row').forEach(row => {
        const strong = row.querySelector('strong');
        if (!strong) return;

        const currentEmail = String(strong.dataset.originalEmail || strong.textContent || '')
          .trim()
          .toLowerCase();
        const user = byEmail.get(currentEmail);
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
