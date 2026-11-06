(() => {
  const themes = [
    { id: 'green', name: 'Forest green', primary: '#167451', dark: '#10583e', swatch: '#167451' },
    { id: 'blue', name: 'Ocean blue', primary: '#2563eb', dark: '#1d4ed8', swatch: '#2563eb' },
    { id: 'purple', name: 'Royal purple', primary: '#7c3aed', dark: '#6d28d9', swatch: '#7c3aed' },
    { id: 'coral', name: 'Coral', primary: '#e05252', dark: '#c83e49', swatch: '#e05252' },
    { id: 'amber', name: 'Golden amber', primary: '#c27a12', dark: '#995b0b', swatch: '#c27a12' }
  ];
  const style = document.createElement('style');
  style.textContent = themes.map(theme => `
    body[data-theme="${theme.id}"] { --blue: ${theme.primary}; --blue2: ${theme.dark}; --ok: ${theme.primary}; --theme-primary: ${theme.primary}; --theme-dark: ${theme.dark}; }
    body[data-theme="${theme.id}"] .btn:not(.red),
    body[data-theme="${theme.id}"] .tabs button.on,
    body[data-theme="${theme.id}"] .nav button.on,
    body[data-theme="${theme.id}"] #v-chat .b.me { background: linear-gradient(120deg, ${theme.primary}, ${theme.dark}); }
    body[data-theme="${theme.id}"] header.top { background: linear-gradient(105deg, ${theme.dark}, ${theme.primary}); }
    body[data-theme="${theme.id}"] .banner { background: linear-gradient(120deg, ${theme.dark}, ${theme.primary}); }
    body[data-theme="${theme.id}"] .sec::before,
    body[data-theme="${theme.id}"] .rcd .tx::before { background: ${theme.primary}; }
    body[data-theme="${theme.id}"] .tg.on { background: ${theme.primary}; }
    body[data-theme="${theme.id}"] .ci.on { box-shadow: inset 3px 0 ${theme.primary}; }
  `).join('');
  document.head.appendChild(style);

  function applyTheme(themeId) {
    const theme = themes.find(item => item.id === themeId) || themes[0];
    document.body.dataset.theme = theme.id;
    if (typeof me !== 'undefined' && me) {
      me.theme = theme.id;
      if (typeof persist === 'function') persist();
    }
    document.querySelectorAll('[data-theme-choice]').forEach(button => {
      const selected = button.dataset.themeChoice === theme.id;
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('selected', selected);
    });
  }

  function addFeatureControls() {
    const settingsCard = document.querySelector('#v-settings .card');
    if (!settingsCard || settingsCard.dataset.accountThemeReady) return;
    settingsCard.dataset.accountThemeReady = 'true';

    const themeSection = document.createElement('section');
    themeSection.className = 'account-theme';
    themeSection.setAttribute('aria-labelledby', 'themeHeading');
    themeSection.innerHTML = `<h3 id="themeHeading">Website color</h3><p>Choose a color for your account. This setting is saved separately for each user and admin.</p><div class="theme-options" role="group" aria-label="Choose a website color">${themes.map(theme => `<button type="button" class="theme-choice" data-theme-choice="${theme.id}" aria-label="${theme.name}" aria-pressed="false"><span style="--swatch:${theme.swatch}"></span><small>${theme.name}</small></button>`).join('')}</div>`;
    const passwordHeading = [...settingsCard.querySelectorAll('h3')].find(heading => heading.textContent.includes('Change password'));
    settingsCard.insertBefore(themeSection, passwordHeading || settingsCard.firstChild);
    themeSection.querySelectorAll('[data-theme-choice]').forEach(button => {
      button.addEventListener('click', () => applyTheme(button.dataset.themeChoice));
    });

    const logout = document.querySelector('#logout');
    if (logout && !document.querySelector('#switchAccount')) {
      const switchButton = document.createElement('button');
      switchButton.type = 'button';
      switchButton.id = 'switchAccount';
      switchButton.className = 'btn sm';
      switchButton.textContent = 'Switch account';
      switchButton.setAttribute('aria-label', 'Switch to another account');
      switchButton.addEventListener('click', () => {
        if (typeof me !== 'undefined' && me) localStorage.setItem('pcc_switch_email', me.email);
        sessionStorage.removeItem('pcc_me');
        location.reload();
      });
      logout.parentNode.insertBefore(switchButton, logout);
    }

    const rememberedEmail = localStorage.getItem('pcc_switch_email');
    if (rememberedEmail) {
      const loginEmail = document.querySelector('#lEmail');
      if (loginEmail) loginEmail.value = rememberedEmail;
      localStorage.removeItem('pcc_switch_email');
    }
  }

  const featureStyle = document.createElement('style');
  featureStyle.textContent = `
    .account-theme { margin: 18px 0; padding: 16px 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
    .account-theme h3 { margin-bottom: 5px; }
    .account-theme p { color: var(--mute); font-size: .86rem; }
    .theme-options { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 9px; margin-top: 12px; }
    .theme-choice { display: grid; justify-items: center; gap: 7px; padding: 10px 6px; border: 1px solid var(--line); border-radius: 12px; background: var(--card); cursor: pointer; }
    .theme-choice:hover, .theme-choice.selected { border-color: var(--blue); box-shadow: 0 0 0 2px color-mix(in srgb, var(--blue) 22%, transparent); }
    .theme-choice span { width: 25px; height: 25px; border-radius: 50%; background: var(--swatch); box-shadow: inset 0 0 0 2px rgba(255,255,255,.55); }
    .theme-choice small { color: var(--ink); font-size: .7rem; font-weight: 700; }
    #switchAccount { color: var(--blue); background: transparent; border: 1px solid var(--blue); box-shadow: none; }
    #switchAccount:hover { color: #fff; background: var(--blue); }
    @media (max-width: 420px) { .theme-options { grid-template-columns: repeat(3, 1fr); } }
  `;
  document.head.appendChild(featureStyle);

  // app.js creates the current-user session after its splash screen; wait for it
  // before applying the per-account preference and adding controls to Settings.
  const timer = setInterval(() => {
    if (typeof me === 'undefined' || !me) return;
    applyTheme(me.theme || 'green');
    addFeatureControls();
    clearInterval(timer);
  }, 100);
})();
