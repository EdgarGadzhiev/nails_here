(() => {
  const refreshNames = async () => {
    try {
      if (!window.supabase || typeof supabaseClient === 'undefined') return;
      const { data, error } = await supabaseClient.rpc('get_manageable_users');
      if (error || !Array.isArray(data)) return;
      const byEmail = new Map(data.map(user => [String(user.email || '').toLowerCase(), user.display_name || '']));
      document.querySelectorAll('#peopleList .person-row').forEach(row => {
        const strong = row.querySelector('strong');
        if (!strong) return;
        const key = strong.textContent.trim().toLowerCase();
        const name = byEmail.get(key);
        if (name) strong.textContent = name;
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