(() => {
  const roleNames = {
    super_admin: 'Супер админ',
    salon_owner: 'Владелец',
    salon_admin: 'Админ'
  };

  const roleBadge = document.getElementById('adminRole');
  const dashboardNav = document.getElementById('dashboardNav');
  const navButtons = dashboardNav?.querySelectorAll('[data-target]') || [];

  function setActiveSection(id) {
    navButtons.forEach(button => {
      button.classList.toggle('is-active', button.dataset.target === id);
    });
  }

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

      setActiveSection(target.id);

      const navHeight = dashboardNav.getBoundingClientRect().height;
      const targetTop = window.scrollY + target.getBoundingClientRect().top - navHeight - 12;

      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth'
      });
    });
  });

  function updateActiveSectionByScroll() {
    if (!dashboardNav || dashboardNav.hidden) return;

    const sections = [...navButtons]
      .map(button => document.getElementById(button.dataset.target))
      .filter(section => section && !section.hidden);

    if (!sections.length) return;

    const navBottom = dashboardNav.getBoundingClientRect().bottom;
    const documentBottom = document.documentElement.scrollHeight;
    const viewportBottom = window.scrollY + window.innerHeight;
    const isAtPageBottom = viewportBottom >= documentBottom - 8;

    let activeId = sections[0].id;

    // Последняя секция получает активное состояние, когда пользователь
    // дошёл до конца страницы, даже если её верх физически нельзя
    // поднять до контрольной линии.
    if (isAtPageBottom) {
      activeId = sections[sections.length - 1].id;
    } else {
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= navBottom + 16) {
          activeId = section.id;
        }
      }
    }

    setActiveSection(activeId);
  }

  window.addEventListener('scroll', updateActiveSectionByScroll, { passive: true });
  window.addEventListener('resize', updateActiveSectionByScroll);

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    const ready = updateRoleBadge();
    if (ready) {
      updateActiveSectionByScroll();
      window.clearInterval(timer);
    } else if (attempts >= 100) {
      window.clearInterval(timer);
    }
  }, 100);
})();
