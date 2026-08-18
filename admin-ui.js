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

  function updateRoleUI() {
    if (typeof currentProfile === 'undefined') return false;

    const role = currentProfile?.role;
    if (!role) {
      if (roleBadge) roleBadge.hidden = true;
      if (dashboardNav) dashboardNav.hidden = true;
      return false;
    }

    if (roleBadge) {
      roleBadge.textContent = roleNames[role] || role;
      roleBadge.hidden = false;
    }

    // Показываем только те разделы, которыми реально обладает роль.
    const visibleTargets = {
      super_admin: ['salonManagement', 'peopleManagement', 'appointmentsPanel'],
      salon_owner: ['peopleManagement', 'appointmentsPanel'],
      salon_admin: []
    }[role] || [];

    navButtons.forEach(button => {
      button.hidden = !visibleTargets.includes(button.dataset.target);
    });

    if (dashboardNav) {
      dashboardNav.hidden = visibleTargets.length === 0;
    }

    return true;
  }

  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      const target = document.getElementById(button.dataset.target);
      if (!target || target.hidden || button.hidden) return;

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
      .filter(button => !button.hidden)
      .map(button => document.getElementById(button.dataset.target))
      .filter(section => section && !section.hidden);

    if (!sections.length) return;

    const navBottom = dashboardNav.getBoundingClientRect().bottom;
    const documentBottom = document.documentElement.scrollHeight;
    const viewportBottom = window.scrollY + window.innerHeight;
    const isAtPageBottom = viewportBottom >= documentBottom - 8;

    let activeId = sections[0].id;

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
    if (updateRoleUI()) {
      updateActiveSectionByScroll();
      window.clearInterval(timer);
    } else if (attempts >= 100) {
      window.clearInterval(timer);
    }
  }, 100);
})();
