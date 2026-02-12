import { renderThemeToggle } from './theme-toggle.js';
import { navigate } from '../router.js';

const MAIN_ITEMS = [
  { key: 'dashboard', icon: '📊', label: 'Dashboard', path: '/' },
  { key: 'projects', icon: '📁', label: 'Projects', path: '/projects' },
  { key: 'board', icon: '📋', label: 'Board', path: '/board' },
  { key: 'activity', icon: '📡', label: 'Activity', path: '/activity' },
  { key: 'agents', icon: '🤖', label: 'Agents', path: '/agents' }
];

const EXTRA_ITEMS = [{ key: 'settings', icon: '⚙', label: 'Settings', path: '/settings' }];

let tabletCollapsed = true;
let outsideClickBound = false;

function getPath() {
  const hash = window.location.hash || '#/';
  const rawPath = hash.slice(1).split('?')[0] || '/';
  return rawPath;
}

function getActiveKey(pathname) {
  if (pathname.startsWith('/projects/')) {
    return 'projects';
  }
  if (pathname.startsWith('/projects')) {
    return 'projects';
  }
  if (pathname.startsWith('/board')) {
    return 'board';
  }
  if (pathname.startsWith('/activity')) {
    return 'activity';
  }
  if (pathname.startsWith('/agents')) {
    return 'agents';
  }
  if (pathname.startsWith('/settings')) {
    return 'settings';
  }
  return 'dashboard';
}

function syncSidebarState() {
  const width = window.innerWidth;
  if (width < 640) {
    document.body.removeAttribute('data-sidebar-collapsed');
    return;
  }
  if (width >= 1024) {
    tabletCollapsed = false;
    document.body.setAttribute('data-sidebar-collapsed', 'false');
    return;
  }
  document.body.setAttribute('data-sidebar-collapsed', tabletCollapsed ? 'true' : 'false');
}

function buildSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) {
    return;
  }

  const activeKey = getActiveKey(getPath());
  sidebar.innerHTML = `
    <div class="sidebar-shell">
      <div class="side-top">
        <div class="side-title">Command Center</div>
        <button class="btn collapse-toggle" type="button" aria-label="Toggle sidebar">☰</button>
      </div>
      <div class="side-nav">
        ${MAIN_ITEMS.map((item) => `
          <button type="button" class="side-link ${item.key === activeKey ? 'active' : ''}" data-nav-path="${item.path}">
            <span>${item.icon}</span>
            <span class="link-label">${item.label}</span>
          </button>
        `).join('')}
        <div class="side-divider"></div>
        ${EXTRA_ITEMS.map((item) => `
          <button type="button" class="side-link ${item.key === activeKey ? 'active' : ''}" data-nav-path="${item.path}">
            <span>${item.icon}</span>
            <span class="link-label">${item.label}</span>
          </button>
        `).join('')}
      </div>
      <div data-theme-toggle></div>
    </div>
  `;

  sidebar.querySelectorAll('[data-nav-path]').forEach((button) => {
    button.addEventListener('click', () => {
      navigate(button.dataset.navPath);
    });
  });

  const collapse = sidebar.querySelector('.collapse-toggle');
  if (collapse) {
    collapse.addEventListener('click', () => {
      if (window.innerWidth >= 640 && window.innerWidth < 1024) {
        tabletCollapsed = !tabletCollapsed;
        syncSidebarState();
        buildSidebar();
      }
    });
  }

  renderThemeToggle(sidebar.querySelector('[data-theme-toggle]'));
}

function buildBottomTabs() {
  const container = document.getElementById('bottom-tabs');
  if (!container) {
    return;
  }

  const activeKey = getActiveKey(getPath());
  const moreActive = activeKey === 'agents' || activeKey === 'settings';

  container.innerHTML = `
    <div class="bottom-tabs-shell">
      <button type="button" class="bottom-tab ${activeKey === 'dashboard' ? 'active' : ''}" data-bottom-path="/">
        <span>📊</span><span>Dashboard</span>
      </button>
      <button type="button" class="bottom-tab ${activeKey === 'projects' ? 'active' : ''}" data-bottom-path="/projects">
        <span>📁</span><span>Projects</span>
      </button>
      <button type="button" class="bottom-tab ${activeKey === 'board' ? 'active' : ''}" data-bottom-path="/board">
        <span>📋</span><span>Board</span>
      </button>
      <button type="button" class="bottom-tab ${activeKey === 'activity' ? 'active' : ''}" data-bottom-path="/activity">
        <span>📡</span><span>Activity</span>
      </button>
      <button type="button" class="bottom-tab ${moreActive ? 'active' : ''}" data-open-more="true">
        <span>⋯</span><span>More</span>
      </button>
    </div>
    <div class="more-menu" data-more-menu hidden>
      <button type="button" class="more-item" data-bottom-path="/agents">🤖 Agents</button>
      <button type="button" class="more-item" data-bottom-path="/settings">⚙ Settings</button>
    </div>
  `;

  container.querySelectorAll('[data-bottom-path]').forEach((button) => {
    button.addEventListener('click', () => {
      navigate(button.dataset.bottomPath);
      const menu = container.querySelector('[data-more-menu]');
      if (menu) {
        menu.hidden = true;
      }
    });
  });

  const more = container.querySelector('[data-open-more]');
  const menu = container.querySelector('[data-more-menu]');
  if (more && menu) {
    more.addEventListener('click', () => {
      menu.hidden = !menu.hidden;
    });

    if (!outsideClickBound) {
      document.addEventListener('click', (event) => {
        const activeMenu = document.querySelector('#bottom-tabs [data-more-menu]');
        const tabs = document.getElementById('bottom-tabs');
        if (activeMenu && tabs && !tabs.contains(event.target)) {
          activeMenu.hidden = true;
        }
      });
      outsideClickBound = true;
    }
  }
}

function renderNavigation() {
  syncSidebarState();
  buildSidebar();
  buildBottomTabs();
}

export function initNavigation() {
  renderNavigation();
  window.addEventListener('hashchange', renderNavigation);
  window.addEventListener('resize', renderNavigation);
  window.addEventListener('cc:theme-change', renderNavigation);
}
