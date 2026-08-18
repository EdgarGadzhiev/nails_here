(() => {
  const roleNames = {
    super_admin: 'Супер админ',
    salon_owner: 'Владелец',
    salon_admin: 'Админ'
  };

  const roleBadge = document.getElementById('adminRole');
  const dashboardNav = document.getElementById('dashboardNav');
  const navButtons = dashboardNav?.querySelectorAll('[data-target]') || [];
  const salonManagement = document.getElementById('salonManagement');
  const peopleManagement = document.getElementById('peopleManagement');
  const appointmentsPanel = document.getElementById('appointmentsPanel');
  const salonFilter = document.getElementById('salonFilter');
  const adminSalonField = document.getElementById('adminSalonField');
  const addAdminBtn = document.getElementById('addAdminBtn');

  let syncVersion = 0;

  function setActiveSection(id) {
    navButtons.forEach(button => {
      button.classList.toggle('is-active', button.dataset.target === id);
    });
  }

  function resetRoleUI() {
    if (roleBadge) {
      roleBadge.textContent = '';
      roleBadge.hidden = true;
    }

    if (dashboardNav) {
      dashboardNav.hidden = true;
      dashboardNav.style.display = 'none';
    }

    navButtons.forEach(button => {
      button.hidden = true;
      button.style.display = 'none';
      button.classList.remove('is-active');
    });

    if (salonManagement) salonManagement.hidden = true;
    if (peopleManagement) peopleManagement.hidden = true;
    if (salonFilter) salonFilter.hidden = true;
    if (adminSalonField) adminSalonField.hidden = true;
    if (addAdminBtn) addAdminBtn.hidden = true;
  }

  function applyRoleUI(role) {
    const visibleTargets = {
      super_admin: ['salonManagement', 'peopleManagement', 'appointmentsPanel'],
      salon_owner: ['peopleManagement', 'appointmentsPanel'],
      salon_admin: []
    }[role] || [];

    if (roleBadge) {
      roleBadge.textContent = roleNames[role] || role;
      roleBadge.hidden = false;
    }

    if (salonManagement) salonManagement.hidden = role !== 'super_admin';
    if (peopleManagement) peopleManagement.hidden = !(role === 'super_admin' || role === 'salon_owner');
    if (salonFilter) salonFilter.hidden = role !== 'super_admin';
    if (adminSalonField) adminSalonField.hidden = role !== 'super_admin';
    if (addAdminBtn) addAdminBtn.hidden = !(role === 'super_admin' || role === 'salon_owner');

    navButtons.forEach(button => {
      const visible = visibleTargets.includes(button.dataset.target);
      button.hidden = !visible;
      button.style.display = visible ? '' : 'none';
      if (!visible) button.classList.remove('is-active');
    });

    if (dashboardNav) {
      const hasNavigation = visibleTargets.length > 0;
      dashboardNav.hidden = !hasNavigation;
      dashboardNav.style.display = hasNavigation ? '' : 'none';
    }

    if (role === 'salon_admin') {
      setActiveSection('');
      return;
    }

    updateActiveSectionByScroll();
  }

  async function syncRoleUI() {
    const version = ++syncVersion;

    try {
      const { data: userData } = await supabaseClient.auth.getUser();
      const user = userData?.user;

      if (!user) {
        resetRoleUI();
        return;
      }

      const { data: profile, error } = await supabaseClient.rpc('get_my_profile');
      if (error) throw error;
      if (version !== syncVersion) return;

      // Синхронизируем глобальный профиль с тем же пользователем,
      // которого сейчас вернул Supabase Auth.
      currentProfile = profile || null;

      if (!profile?.role) {
        resetRoleUI();
        return;
      }

      applyRoleUI(profile.role);
    } catch (error) {
      console.error('Не удалось определить роль пользователя:', error);
    }
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
    if (!dashboardNav || dashboardNav.hidden || dashboardNav.style.display === 'none') return;

    const sections = [...navButtons]
      .filter(button => !button.hidden && button.style.display !== 'none')
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

  // Не доверяем старому состоянию currentProfile при переключении аккаунтов.
  // Всегда заново читаем роль у текущего auth.uid().
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session?.user) {
      syncVersion += 1;
      currentProfile = null;
      resetRoleUI();
      return;
    }

    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
      window.setTimeout(syncRoleUI, 0);
    }
  });

  window.setTimeout(syncRoleUI, 50);
})();
