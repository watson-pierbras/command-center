import * as dashboardView from './views/dashboard.js';
import * as projectsView from './views/projects.js';
import * as projectDetailView from './views/project-detail.js';
import * as boardView from './views/board.js';
import * as activityView from './views/activity.js';
import * as agentsView from './views/agents.js';
import * as settingsView from './views/settings.js';

let appContainer;

function parseHash() {
  const hash = window.location.hash || '#/';
  const body = hash.startsWith('#') ? hash.slice(1) : hash;
  const [pathRaw, queryRaw = ''] = body.split('?');
  const path = pathRaw || '/';
  const query = Object.fromEntries(new URLSearchParams(queryRaw));
  return { path, query };
}

function resolveRoute(path) {
  if (path === '/' || path === '') return { view: dashboardView, params: {} };
  if (path === '/projects') return { view: projectsView, params: {} };
  if (path.startsWith('/projects/')) {
    const [, , id] = path.split('/');
    if (id) return { view: projectDetailView, params: { id } };
  }
  if (path === '/board') return { view: boardView, params: {} };
  if (path.startsWith('/board/')) {
    const [, , projectId] = path.split('/');
    if (projectId) return { view: boardView, params: { projectId } };
  }
  if (path === '/activity') return { view: activityView, params: {} };
  if (path === '/agents') return { view: agentsView, params: {} };
  if (path === '/settings') return { view: settingsView, params: {} };
  return { view: dashboardView, params: {} };
}

function renderCurrentRoute() {
  if (!appContainer) {
    return;
  }
  const { path, query } = parseHash();
  const route = resolveRoute(path);
  appContainer.classList.add('view-entering');
  route.view.render(appContainer, route.params, query);
  window.requestAnimationFrame(() => {
    if (appContainer) {
      appContainer.classList.remove('view-entering');
    }
  });
  window.dispatchEvent(new CustomEvent('cc:route-change', { detail: { path } }));
}

export function navigate(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  window.location.hash = `#${normalized}`;
}

export function initRouter(container) {
  appContainer = container;
  window.addEventListener('hashchange', renderCurrentRoute);
  if (!window.location.hash) {
    navigate('/');
    return;
  }
  renderCurrentRoute();
}
