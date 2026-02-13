import { AGENTS, PROJECTS, TASKS } from '../mock-data.js';

let initialized = false;
let isOpen = false;
let previousBodyOverflow = '';
let debounceTimer = null;
let selectedIndex = -1;
let pendingPrefix = null;
let prefixTimer = null;

let backdropEl;
let inputEl;
let resultsEl;
let resultEls = [];
let shortcutsOverlayEl;
let shortcutsCloseEl;

function isMacPlatform() {
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || '');
}

function matches(text, query) {
  const lower = String(text || '').toLowerCase();
  const q = String(query || '').toLowerCase().trim();
  return lower.includes(q);
}

function createSearchIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'cmd-palette-icon');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');

  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '11');
  circle.setAttribute('cy', '11');
  circle.setAttribute('r', '7');
  circle.setAttribute('fill', 'none');
  circle.setAttribute('stroke', 'currentColor');
  circle.setAttribute('stroke-width', '2');

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', '16.65');
  line.setAttribute('y1', '16.65');
  line.setAttribute('x2', '21');
  line.setAttribute('y2', '21');
  line.setAttribute('stroke', 'currentColor');
  line.setAttribute('stroke-width', '2');
  line.setAttribute('stroke-linecap', 'round');

  svg.append(circle, line);
  return svg;
}

function ensureElements() {
  if (backdropEl) return;

  backdropEl = document.createElement('div');
  backdropEl.className = 'cmd-palette-backdrop';

  const paletteEl = document.createElement('div');
  paletteEl.className = 'cmd-palette';
  paletteEl.setAttribute('role', 'dialog');
  paletteEl.setAttribute('aria-modal', 'true');
  paletteEl.setAttribute('aria-label', 'Command palette');

  const searchWrap = document.createElement('div');
  searchWrap.className = 'cmd-palette-search';

  inputEl = document.createElement('input');
  inputEl.type = 'text';
  inputEl.placeholder = 'Search tasks, projects, agents...';
  inputEl.setAttribute('autofocus', 'autofocus');

  const escHint = document.createElement('kbd');
  escHint.className = 'cmd-palette-shortcut';
  escHint.textContent = 'ESC';

  resultsEl = document.createElement('div');
  resultsEl.className = 'cmd-palette-results';

  searchWrap.append(createSearchIcon(), inputEl, escHint);
  paletteEl.append(searchWrap, resultsEl);
  backdropEl.append(paletteEl);
  document.body.append(backdropEl);

  backdropEl.addEventListener('click', (event) => {
    if (event.target === backdropEl) {
      closePalette();
    }
  });

  inputEl.addEventListener('input', () => {
    if (debounceTimer) window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      renderResults();
    }, 150);
  });

  inputEl.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveSelection(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveSelection(-1);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (selectedIndex >= 0 && resultEls[selectedIndex]) {
        triggerResult(resultEls[selectedIndex]);
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closePalette();
    }
  });

  resultsEl.addEventListener('click', (event) => {
    const item = event.target.closest('.cmd-result');
    if (!item) return;
    triggerResult(item);
  });

  resultsEl.addEventListener('mousemove', (event) => {
    const item = event.target.closest('.cmd-result');
    if (!item) return;
    const nextIndex = resultEls.indexOf(item);
    if (nextIndex >= 0 && nextIndex !== selectedIndex) {
      setSelection(nextIndex);
    }
  });

  ensureShortcutsOverlay();
  window.addEventListener('hashchange', () => {
    closePalette();
    closeShortcutsOverlay();
    clearPendingPrefix();
  });
}

function ensureShortcutsOverlay() {
  if (shortcutsOverlayEl) return;

  shortcutsOverlayEl = document.createElement('div');
  shortcutsOverlayEl.className = 'shortcuts-overlay';
  shortcutsOverlayEl.id = 'shortcuts-overlay';
  shortcutsOverlayEl.hidden = true;

  const shortcutsPanelEl = document.createElement('div');
  shortcutsPanelEl.className = 'shortcuts-panel';

  const headerEl = document.createElement('div');
  headerEl.className = 'shortcuts-header';

  const headingEl = document.createElement('h2');
  headingEl.textContent = 'Keyboard Shortcuts';

  shortcutsCloseEl = document.createElement('button');
  shortcutsCloseEl.type = 'button';
  shortcutsCloseEl.className = 'slide-over-close';
  shortcutsCloseEl.id = 'shortcuts-close';
  shortcutsCloseEl.textContent = '\u00D7';

  const gridEl = document.createElement('div');
  gridEl.className = 'shortcuts-grid';

  const rows = [
    { keys: ['\u2318K'], label: 'Command palette' },
    { keys: ['g', 'd'], label: 'Go to Dashboard' },
    { keys: ['g', 'p'], label: 'Go to Projects' },
    { keys: ['g', 'b'], label: 'Go to Board' },
    { keys: ['g', 'a'], label: 'Go to Activity' },
    { keys: ['g', 's'], label: 'Go to Settings' },
    { keys: ['n'], label: 'New task' },
    { keys: ['?'], label: 'Show this help' },
    { keys: ['Esc'], label: 'Close overlay' }
  ];

  rows.forEach((row) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'shortcut-row';

    row.keys.forEach((key) => {
      const keyEl = document.createElement('kbd');
      keyEl.textContent = key;
      rowEl.append(keyEl);
    });

    const textEl = document.createElement('span');
    textEl.textContent = row.label;
    rowEl.append(textEl);
    gridEl.append(rowEl);
  });

  headerEl.append(headingEl, shortcutsCloseEl);
  shortcutsPanelEl.append(headerEl, gridEl);
  shortcutsOverlayEl.append(shortcutsPanelEl);
  document.body.append(shortcutsOverlayEl);

  shortcutsCloseEl.addEventListener('click', closeShortcutsOverlay);
  shortcutsOverlayEl.addEventListener('click', (event) => {
    if (event.target === shortcutsOverlayEl) {
      closeShortcutsOverlay();
    }
  });
}

function isShortcutsOverlayOpen() {
  return Boolean(shortcutsOverlayEl && !shortcutsOverlayEl.hidden);
}

function openShortcutsOverlay() {
  ensureShortcutsOverlay();
  shortcutsOverlayEl.hidden = false;
  shortcutsCloseEl.focus();
}

function closeShortcutsOverlay() {
  if (!shortcutsOverlayEl) return;
  shortcutsOverlayEl.hidden = true;
}

function toggleShortcutsOverlay() {
  if (isShortcutsOverlayOpen()) {
    closeShortcutsOverlay();
    return;
  }
  openShortcutsOverlay();
}

function clearPendingPrefix() {
  pendingPrefix = null;
  if (prefixTimer) {
    window.clearTimeout(prefixTimer);
    prefixTimer = null;
  }
}

function setPendingPrefix(prefix) {
  clearPendingPrefix();
  pendingPrefix = prefix;
  prefixTimer = window.setTimeout(() => {
    pendingPrefix = null;
    prefixTimer = null;
  }, 1000);
}

function isTypingInField() {
  const activeEl = document.activeElement;
  if (!activeEl) return false;
  if (activeEl.matches('input, textarea, select')) return true;
  if (activeEl.closest('[contenteditable]')) return true;
  return false;
}

function isPaletteOpenForShortcutGuard() {
  return isOpen ||
    Boolean(document.querySelector('.cmd-palette-backdrop.open')) ||
    Boolean(document.querySelector('.cmd-backdrop.open'));
}

function openNewTaskForm() {
  const createTaskTrigger = document.querySelector('#create-task-fab, [data-new-task]');
  if (createTaskTrigger instanceof HTMLElement) {
    createTaskTrigger.click();
    return;
  }
  window.dispatchEvent(new CustomEvent('cc:new-task'));
}

function navigateShortcut(path) {
  window.location.hash = `#${path}`;
}

function handlePrefixShortcut(key) {
  if (pendingPrefix !== 'g') return false;

  const routes = {
    d: '/',
    p: '/projects',
    b: '/board',
    a: '/activity',
    s: '/settings'
  };

  const path = routes[key];
  if (!path) {
    clearPendingPrefix();
    return false;
  }

  navigateShortcut(path);
  clearPendingPrefix();
  return true;
}

function getTaskItem(task) {
  const project = PROJECTS.find((item) => item.id === task.projectId);
  return {
    action: 'task',
    id: task.id,
    icon: '📋',
    name: task.name,
    subtitle: `${project?.name || 'Unknown project'} · ${task.status}`
  };
}

function getProjectItem(project) {
  return {
    action: 'project',
    id: project.id,
    icon: '📁',
    name: project.name,
    subtitle: project.status
  };
}

function getAgentItem(agent) {
  return {
    action: 'agent',
    id: agent.id,
    icon: agent.avatar || '👤',
    name: agent.name,
    subtitle: agent.role
  };
}

function buildGroups(queryRaw) {
  const query = String(queryRaw || '').trim();
  if (!query) {
    return [
      {
        label: 'Quick Actions',
        items: PROJECTS.map(getProjectItem)
      },
      {
        label: 'Recent',
        items: TASKS.slice(0, 5).map(getTaskItem)
      }
    ];
  }

  const taskItems = TASKS
    .filter((task) => matches(task.name, query))
    .slice(0, 5)
    .map(getTaskItem);

  const projectItems = PROJECTS
    .filter((project) => matches(project.name, query))
    .slice(0, 5)
    .map(getProjectItem);

  const agentItems = AGENTS
    .filter((agent) => matches(agent.name, query))
    .slice(0, 5)
    .map(getAgentItem);

  return [
    { label: 'Tasks', items: taskItems },
    { label: 'Projects', items: projectItems },
    { label: 'Agents', items: agentItems }
  ];
}

function renderResultItem(item) {
  const row = document.createElement('div');
  row.className = 'cmd-result';
  row.dataset.action = item.action;
  row.dataset.id = item.id;

  const icon = document.createElement('span');
  icon.className = 'cmd-result-icon';
  icon.textContent = item.icon;

  const textWrap = document.createElement('div');
  textWrap.className = 'cmd-result-text';

  const name = document.createElement('div');
  name.className = 'cmd-result-name';
  name.textContent = item.name;

  const subtitle = document.createElement('div');
  subtitle.className = 'cmd-result-sub';
  subtitle.textContent = item.subtitle;

  textWrap.append(name, subtitle);
  row.append(icon, textWrap);
  return row;
}

function renderResults() {
  const groups = buildGroups(inputEl.value);
  const allItems = groups.flatMap((group) => group.items);

  resultsEl.textContent = '';
  resultEls = [];
  selectedIndex = -1;

  if (allItems.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'cmd-palette-empty';
    empty.textContent = 'No results found';
    resultsEl.append(empty);
    return;
  }

  groups.forEach((group) => {
    if (group.items.length === 0) return;

    const groupEl = document.createElement('div');
    groupEl.className = 'cmd-results-group';

    const labelEl = document.createElement('div');
    labelEl.className = 'cmd-results-label';
    labelEl.textContent = group.label;

    groupEl.append(labelEl);
    group.items.forEach((item) => {
      const row = renderResultItem(item);
      resultEls.push(row);
      groupEl.append(row);
    });

    resultsEl.append(groupEl);
  });

  if (resultEls.length > 0) {
    setSelection(0);
  }
}

function setSelection(index) {
  if (resultEls.length === 0) return;
  const bounded = ((index % resultEls.length) + resultEls.length) % resultEls.length;
  selectedIndex = bounded;
  resultEls.forEach((item, i) => {
    item.classList.toggle('selected', i === bounded);
  });
  resultEls[bounded].scrollIntoView({ block: 'nearest' });
}

function moveSelection(direction) {
  if (resultEls.length === 0) return;
  if (selectedIndex < 0) {
    setSelection(0);
    return;
  }
  setSelection(selectedIndex + direction);
}

function triggerResult(itemEl) {
  const action = itemEl.dataset.action;
  const id = itemEl.dataset.id;
  if (!action || !id) return;
  selectResult(action, id);
}

function selectResult(action, id) {
  if (action === 'task') {
    Promise.all([
      import('./slide-over.js'),
      import('../views/task-detail.js')
    ]).then(([{ openSlideOver }, { renderTaskDetail }]) => {
      const task = TASKS.find((item) => item.id === id);
      openSlideOver({ title: task?.name || 'Task', content: renderTaskDetail(id) });
    });
    closePalette();
    return;
  }

  if (action === 'project') {
    window.location.hash = `#/projects/${id}`;
    closePalette();
    return;
  }

  if (action === 'agent') {
    window.location.hash = '#/agents';
    closePalette();
  }
}

function openPalette() {
  ensureElements();

  if (!isOpen) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  isOpen = true;
  backdropEl.classList.add('open');
  inputEl.value = '';
  renderResults();
  window.setTimeout(() => {
    inputEl.focus();
    inputEl.select();
  }, 0);
}

function closePalette() {
  if (!backdropEl || !isOpen) return;

  isOpen = false;
  backdropEl.classList.remove('open');
  document.body.style.overflow = previousBodyOverflow;
  if (debounceTimer) {
    window.clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}

function onGlobalKeydown(event) {
  const key = String(event.key || '').toLowerCase();
  const openCombo = key === 'k' && (isMacPlatform() ? event.metaKey : event.ctrlKey);

  if (openCombo) {
    event.preventDefault();
    clearPendingPrefix();
    openPalette();
    return;
  }

  if (isOpen && event.key === 'Escape') {
    event.preventDefault();
    closePalette();
    clearPendingPrefix();
    return;
  }

  if (isShortcutsOverlayOpen() && event.key === 'Escape') {
    event.preventDefault();
    closeShortcutsOverlay();
    clearPendingPrefix();
    return;
  }

  if (event.metaKey || event.ctrlKey || event.altKey) {
    clearPendingPrefix();
    return;
  }

  if (isTypingInField() || isPaletteOpenForShortcutGuard()) {
    clearPendingPrefix();
    return;
  }

  if (handlePrefixShortcut(key)) {
    event.preventDefault();
    return;
  }

  if (key === 'g') {
    event.preventDefault();
    setPendingPrefix('g');
    return;
  }

  clearPendingPrefix();

  if (key === 'n') {
    event.preventDefault();
    openNewTaskForm();
    return;
  }

  if (event.key === '?') {
    event.preventDefault();
    toggleShortcutsOverlay();
  }
}

export function initCommandPalette() {
  if (initialized) return;
  initialized = true;
  ensureElements();
  document.addEventListener('keydown', onGlobalKeydown);
}
