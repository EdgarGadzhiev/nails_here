(() => {
  const roleNames = {
    super_admin: 'Супер админ',
    salon_owner: 'Владелец',
    salon_admin: 'Админ'
  };

  const roleBadge = document.getElementById('adminRole');
  const dashboardNav = document.getElementById('dashboardNav');
  const navButtons = dashboardNav?.querySelectorAll('[data-target]') || [];

  function updateRoleBadge() {
    if (!roleBadge || typeof currentProfile === 'undefined') return false;

    if (!currentProfile?.role) {
      roleBadge.hidden = true;
      return false;
    }

    roleBadge.textContent = roleNames[currentProfile.role] || currentProfile.role;
    roleBadge.hidden = false;

    const canNavigate =
      currentProfile.role === 'super_admin' ||
      currentProfile.role === 'salon_owner';

    if (dashboardNav) dashboardNav.hidden = !canNavigate;
    return true;
  }

  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      const target = document.getElementById(button.dataset.target);
      if (!target || target.hidden) return;

      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  });

  function updateActiveSection() {
    if (!dashboardNav || dashboardNav.hidden) return;

    const sections = [...navButtons]
      .map(button => document.getElementById(button.dataset.target))
      .filter(section => section && !section.hidden);

    if (!sections.length) return;

    // Активируем раздел только тогда, когда его верхняя граница
    // дошла до нижней границы sticky-навигации.
    const navBottom = dashboardNav.getBoundingClientRect().bottom;
    let activeId = sections[0].id;

    for (const section of sections) {
      const top = section.getBoundingClientRect().top;
      if (top <= navBottom + 8) {
        activeId = section.id;
      }
    }

    navButtons.forEach(button => {
      button.classList.toggle('is-active', button.dataset.target === activeId);
    });
  }

  window.addEventListener('scroll', updateActiveSection, { passive: true });
  window.addEventListener('resize', updateActiveSection);

  // admin.js loads the profile asynchronously, so wait briefly for it.
  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    const ready = updateRoleBadge();
    if (ready) {
      updateActiveSection();
      window.clearInterval(timer);
    } else if (attempts >= 100) {
      window.clearInterval(timer);
    }
  }, 100);
})();
