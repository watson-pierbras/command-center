import { AGENTS, PROJECTS, TASKS, updateTaskStatus } from '../mock-data.js';

export const COLUMNS = [
  { key: 'planned', label: 'Planned' },
  { key: 'active', label: 'Active' },
  { key: 'in_review', label: 'In Review' },
  { key: 'done', label: 'Done' }
];
const BOARD_PROJECT_STORAGE_KEY = 'cc-board-project';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function listForColumn(tasks, key) {
  if (key === 'active') {
    return tasks.filter((task) => task.status === 'active' || task.status === 'blocked');
  }
  return tasks.filter((task) => task.status === key);
}

export function showStatusDropdown(pill, taskId, currentStatus, onUpdated) {
  document.querySelector('.status-dropdown')?.remove();

  const statuses = ['planned', 'active', 'in_review', 'done', 'blocked'];
  const dropdown = document.createElement('div');
  dropdown.className = 'status-dropdown';
  dropdown.innerHTML = statuses
    .map((status) => `<button type="button" class="status-dropdown-item ${status === currentStatus ? 'current' : ''}" data-new-status="${status}">${status.replace('_', ' ')}</button>`)
    .join('');

  const rect = pill.getBoundingClientRect();
  dropdown.style.position = 'fixed';
  dropdown.style.top = `${rect.bottom + 4}px`;
  dropdown.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 156))}px`;

  document.body.append(dropdown);

  dropdown.addEventListener('click', (event) => {
    const option = event.target.closest('[data-new-status]');
    if (option) {
      const nextStatus = option.dataset.newStatus;
      if (nextStatus && nextStatus !== currentStatus) {
        updateTaskStatus(taskId, nextStatus);
        if (typeof onUpdated === 'function') {
          onUpdated();
        }
      }
    }
    dropdown.remove();
  });

  setTimeout(() => {
    document.addEventListener('click', function close(event) {
      if (!dropdown.contains(event.target) && event.target !== pill) {
        dropdown.remove();
        document.removeEventListener('click', close);
      }
    });
  }, 0);
}

export function renderBoardBody(host, projectId) {
  const scopedTasks = projectId === 'all' ? TASKS : TASKS.filter((task) => task.projectId === projectId);

  host.innerHTML = `
    <div class="board-grid">
      ${COLUMNS.map((column) => {
        const items = listForColumn(scopedTasks, column.key);
        return `
          <section class="board-col">
            <div class="board-col-title">
              <span>${column.label}</span>
              <div class="board-col-meta">
                <span class="pill">${items.length}</span>
                <button type="button" class="btn board-col-add" data-column-add="${column.key}" aria-label="Create task in ${column.label}">+</button>
              </div>
            </div>
            ${items.map((task) => {
              const project = PROJECTS.find((item) => item.id === task.projectId);
              const agent = AGENTS.find((item) => item.id === task.agentId);
              return `
                <article class="surface-card task-card interactive priority-${escapeHtml(task.priority)}" data-task-id="${escapeHtml(task.id)}">
                  <strong>${escapeHtml(task.name)}</strong>
                  ${projectId === 'all' ? `
                    <div class="activity-meta">
                      <span class="color-dot" style="background: var(--color-project-${escapeHtml(project?.color || 'slate')});"></span>
                      <span>${escapeHtml(project?.name || 'Unknown project')}</span>
                    </div>
                  ` : ''}
                  <div class="activity-meta">
                    <span>${escapeHtml(agent?.avatar || '👤')}</span>
                    <span>${escapeHtml(agent?.name || 'Unassigned')}</span>
                    <span class="pill ${escapeHtml(task.status)} status-editable" data-task-status data-task-id="${escapeHtml(task.id)}" data-current-status="${escapeHtml(task.status)}">${escapeHtml(task.status.replace('_', ' '))}</span>
                  </div>
                  ${Array.isArray(task.subtasks) && task.subtasks.length > 0 ? `
                    <div class="activity-meta">
                      <span>☐ ${task.subtasks.filter((subtask) => subtask.status === 'done').length}/${task.subtasks.length} subtasks</span>
                    </div>
                  ` : ''}
                </article>
              `;
            }).join('') || `
              <div class="empty-state-mini">
                <span class="empty-state-icon">📋</span>
                <span>No tasks yet</span>
              </div>
            `}
          </section>
        `;
      }).join('')}
    </div>
  `;
}

function renderProjectPills(host, selectedProjectId) {
  host.innerHTML = `
    ${PROJECTS.map((project) => `
      <button class="board-project-pill ${selectedProjectId === project.id ? 'active' : ''}" data-board-project="${project.id}">
        <span class="color-dot" style="background: var(--color-project-${project.color});"></span>
        ${escapeHtml(project.name)}
      </button>
    `).join('')}
    <button class="board-project-pill ${selectedProjectId === 'all' ? 'active' : ''}" data-board-project="all">All</button>
  `;
}

function isValidProjectSelection(projectId) {
  return projectId === 'all' || PROJECTS.some((project) => project.id === projectId);
}

function defaultProjectSelection() {
  const firstActiveProject = PROJECTS.find((project) => project.status === 'active');
  return firstActiveProject?.id || PROJECTS[0]?.id || 'all';
}

function openCreateTaskForm(projectId) {
  Promise.all([
    import('../components/slide-over.js'),
    import('../components/task-form.js')
  ]).then(([slideOver, taskForm]) => {
    slideOver.openSlideOver({
      title: 'Create Task',
      content: taskForm.renderTaskForm({ projectId: projectId === 'all' ? undefined : projectId })
    });

    const form = document.getElementById('task-create-form');
    taskForm.initTaskForm(form, (task) => {
      slideOver.closeSlideOver();
      if (task?.projectId) {
        window.location.hash = `#/board/${task.projectId}`;
      }
    });
  });
}

export function render(container, params) {
  container.innerHTML = `
    <section class="app-view">
      <h1 class="h-title">Board</h1>
      <div class="board-project-bar" id="board-project-bar"></div>
      <div class="board-wrap" id="board-content"></div>
      <button class="fab" id="create-task-fab" title="New Task" aria-label="Create new task">+</button>
    </section>
  `;

  const bar = container.querySelector('#board-project-bar');
  const host = container.querySelector('#board-content');
  const routeProjectId = params?.projectId;
  const storedProjectId = localStorage.getItem(BOARD_PROJECT_STORAGE_KEY);
  let selectedProjectId = defaultProjectSelection();

  if (isValidProjectSelection(storedProjectId)) {
    selectedProjectId = storedProjectId;
  }
  if (isValidProjectSelection(routeProjectId)) {
    selectedProjectId = routeProjectId;
  }

  const renderCurrentBoard = () => renderBoardBody(host, selectedProjectId);

  renderProjectPills(bar, selectedProjectId);
  renderCurrentBoard();

  bar.addEventListener('click', (event) => {
    const pill = event.target.closest('[data-board-project]');
    if (!pill) return;

    const projectId = pill.dataset.boardProject;
    if (!projectId || !isValidProjectSelection(projectId) || projectId === selectedProjectId) return;

    selectedProjectId = projectId;
    localStorage.setItem(BOARD_PROJECT_STORAGE_KEY, projectId);
    renderProjectPills(bar, selectedProjectId);
    renderCurrentBoard();
  });

  host.addEventListener('click', (event) => {
    const statusPill = event.target.closest('[data-task-status]');
    if (statusPill) {
      event.preventDefault();
      event.stopPropagation();
      const taskId = statusPill.dataset.taskId;
      const currentStatus = statusPill.dataset.currentStatus;
      if (!taskId || !currentStatus) return;
      showStatusDropdown(statusPill, taskId, currentStatus, () => {
        renderCurrentBoard();
      });
      return;
    }

    const addButton = event.target.closest('[data-column-add]');
    if (addButton) {
      event.preventDefault();
      openCreateTaskForm(selectedProjectId === 'all' ? defaultProjectSelection() : selectedProjectId);
      return;
    }

    const card = event.target.closest('[data-task-id]');
    if (!card) return;

    const taskId = card.dataset.taskId;
    import('../components/slide-over.js').then(({ openSlideOver }) => {
      import('./task-detail.js').then(({ renderTaskDetail }) => {
        const task = TASKS.find((item) => item.id === taskId);
        openSlideOver({ title: task?.name || 'Task', content: renderTaskDetail(taskId) });
      });
    });
  });

  container.addEventListener('click', (event) => {
    const fab = event.target.closest('#create-task-fab');
    if (!fab) return;
    openCreateTaskForm(selectedProjectId === 'all' ? defaultProjectSelection() : selectedProjectId);
  });
}
