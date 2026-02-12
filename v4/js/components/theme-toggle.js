const THEME_KEY = 'cc-theme';
const DARK_BG = '#0F1117';
const LIGHT_BG = '#FFFFFF';

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

export function getThemePreference() {
  return localStorage.getItem(THEME_KEY) || 'system';
}

function getEffectiveTheme(mode) {
  if (mode === 'dark') {
    return 'dark';
  }
  if (mode === 'light') {
    return 'light';
  }
  return mediaQuery.matches ? 'dark' : 'light';
}

function updateThemeColorMeta(effectiveTheme) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', effectiveTheme === 'dark' ? DARK_BG : LIGHT_BG);
  }
}

export function applyTheme(mode = getThemePreference()) {
  const effectiveTheme = getEffectiveTheme(mode);
  if (effectiveTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  updateThemeColorMeta(effectiveTheme);
}

export function setThemePreference(mode) {
  localStorage.setItem(THEME_KEY, mode);
  applyTheme(mode);
  window.dispatchEvent(new CustomEvent('cc:theme-change', { detail: { mode } }));
}

export function initTheme() {
  applyTheme();
  mediaQuery.addEventListener('change', () => {
    if (getThemePreference() === 'system') {
      applyTheme('system');
      window.dispatchEvent(new CustomEvent('cc:theme-change', { detail: { mode: 'system' } }));
    }
  });
}

export function renderThemeToggle(container) {
  if (!container) {
    return;
  }

  const current = getThemePreference();
  const options = [
    { key: 'light', icon: '☀', label: 'Light' },
    { key: 'dark', icon: '🌙', label: 'Dark' },
    { key: 'system', icon: '💻', label: 'System' }
  ];

  container.innerHTML = `
    <div class="theme-switch">
      ${options
        .map(
          (option) => `
          <button class="theme-option ${current === option.key ? 'active' : ''}" data-theme-mode="${option.key}" type="button">
            <span>${option.icon}</span>
            <span class="theme-label">${option.label}</span>
          </button>
        `
        )
        .join('')}
    </div>
  `;

  container.querySelectorAll('[data-theme-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      setThemePreference(button.dataset.themeMode);
      renderThemeToggle(container);
    });
  });
}
