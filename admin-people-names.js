(() => {
  const refreshNames = async () => {
    try {
      if (typeof supabaseClient === 'undefined') return;
      const { data, error } = await supabaseClient.rpc('get_manageable_users');
      if (error || !Array.isArray(data)) return;

      const usersByEmail = new Map(
        data.map(user => [String(user.email || '').trim().toLowerCase(), user])
      );

      document.querySelectorAll('#peopleList .person-row').forEach(row => {
        const strong = row.querySelector('strong');
        if (!strong) return;

        const storedEmail = String(strong.dataset.originalEmail || '').trim().toLowerCase();
        const visibleText = String(strong.textContent || '').trim().toLowerCase();
        const user = usersByEmail.get(storedEmail) || usersByEmail.get(visibleText);
        if (!user) return;

        const email = String(user.email || '').trim();
        const name = String(user.display_name || '').trim();
        if (!email) return;

        // Запоминаем email отдельно, но главным текстом показываем имя.
        strong.dataset.originalEmail = email;
        strong.textContent = name || email;

        let emailLine = row.querySelector('.person-email-line');
        if (!emailLine) {
          emailLine = document.createElement('div');
          emailLine.className = 'person-email-line';
          emailLine.style.cssText = 'font-size:12px;opacity:.65;margin-top:2px;line-height:1.3;';
          strong.parentElement.appendChild(emailLine);
        }
        emailLine.textContent = email;
      });
    } catch (error) {
      console.debug('Не удалось обновить имена пользователей:', error);
    }
  };

  const scheduleRefresh = () => {
    clearTimeout(scheduleRefresh.timer);
    scheduleRefresh.timer = setTimeout(refreshNames, 100);
  };

  const start = () => {
    const list = document.getElementById('peopleList');
    if (list) {
      const observer = new MutationObserver(scheduleRefresh);
      observer.observe(list, { childList: true, subtree: true });
    }
    refreshNames();
    setTimeout(refreshNames, 500);
    setTimeout(refreshNames, 1500);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
