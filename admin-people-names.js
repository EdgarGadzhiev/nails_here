(() => {
  const refreshNames = async () => {
    try {
      if (typeof supabaseClient === 'undefined') return;
      const { data, error } = await supabaseClient.rpc('get_manageable_users');
      if (error || !Array.isArray(data)) return;

      const usersByEmail = new Map();
      data.forEach(user => {
        const email = String(user.email || '').trim().toLowerCase();
        if (email) usersByEmail.set(email, user);
      });

      document.querySelectorAll('#peopleList .person-row').forEach(row => {
        const strong = row.querySelector('strong');
        if (!strong) return;

        const email = String(strong.dataset.originalEmail || strong.textContent || '').trim().toLowerCase();
        const user = usersByEmail.get(email);
        if (!user) return;

        const userEmail = String(user.email || '').trim();
        const userName = String(user.display_name || '').trim();
        if (!userEmail) return;

        strong.dataset.originalEmail = userEmail;
        strong.textContent = userName || userEmail;

        let emailLine = row.querySelector('.person-email-line');
        if (!emailLine) {
          emailLine = document.createElement('div');
          emailLine.className = 'person-email-line';
          strong.parentElement.appendChild(emailLine);
        }
        emailLine.textContent = userEmail;
        emailLine.style.cssText = 'font-size:12px;opacity:.65;margin-top:2px;line-height:1.3;';
      });
    } catch (error) {
      console.debug('Не удалось обновить имена пользователей:', error);
    }
  };

  let timer;
  const scheduleRefresh = () => {
    clearTimeout(timer);
    timer = setTimeout(refreshNames, 50);
  };

  const start = () => {
    const list = document.getElementById('peopleList');
    if (!list) return;

    const observer = new MutationObserver(scheduleRefresh);
    observer.observe(list, { childList: true, subtree: true });

    refreshNames();
    setTimeout(refreshNames, 300);
    setTimeout(refreshNames, 1000);
    setTimeout(refreshNames, 2000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
