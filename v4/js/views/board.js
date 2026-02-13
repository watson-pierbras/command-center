import { AGENTS, PROJECTS, TASKS } from '../mock-data.js';

export const COLUMNS = [
  { key: 'planned', label: 'Planned' },
  { key: 'active', label: 'Active' },
  { key: 'in_review', label: 'In Review' },
  { key: 'done', label: 'Done' }
];
const BOARD_PROJECT_STORAGE_KEY = 'cc-board-project';

function listForColumn(tasks, key) {
  if (key === 'active') {
    return tasks.filter((task) => task.status === 'active' || task.status === 'blocked');
  }
  return tasks.filter((task) => task.status === key);
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
              <span class="pill">${items.length}</span>
            </div>
            ${items.map((task) => {
              const project = PROJECTS.find((item) => item.id === task.projectId);
              const agent = AGENTS.find((item) => item.id === task.agentId);
              return `
                <article class="surface-card task-card interactive priority-${task.priority}" data-task-id="${task.id}">
                  <strong>${task.name}</strong>
                  ${projectId === 'all' ? `
                    <div class="activity-meta">
                      <span class="color-dot" style="background: var(--color-project-${project?.color || 'slate'});"></span>
                      <span>${project?.name || 'Unknown project'}</span>
                    </div>
                  ` : ''}
                  <div class="activity-meta">
                    <span>${agent?.avatar || '👤'}</span>
                    <span>${agent?.name || 'Unassigned'}</span>
                    ${task.status === 'blocked' ? '<span class="pill blocked">blocked</span>' : ''}
                  </div>
                  ${Array.isArray(task.subtasks) && task.subtasks.length > 0 ? `
                    <div class="activity-meta">
                      <span>☐ ${task.subtasks.filter((subtask) => subtask.status === 'done').length}/${task.subtasks.length} subtasks</span>
                    </div>
                  ` : ''}
                </article>
              `;
            }).join('') || '<div class="subtle">No tasks</div>'}
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
        ${project.name}
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

export function render(container, params) {
  container.innerHTML = `
    <section class="app-view">
      <h1 class="h-title">Board</h1>
      <div class="board-project-bar" id="board-project-bar"></div>
      <div class="board-wrap" id="board-content"></div>
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

  renderProjectPills(bar, selectedProjectId);
  renderBoardBody(host, selectedProjectId);

  bar.addEventListener('click', (event) => {
    const pill = event.target.closest('[data-board-project]');
    if (!pill) return;

    const projectId = pill.dataset.boardProject;
    if (!projectId || !isValidProjectSelection(projectId) || projectId === selectedProjectId) return;

    selectedProjectId = projectId;
    localStorage.setItem(BOARD_PROJECT_STORAGE_KEY, projectId);
    renderProjectPills(bar, selectedProjectId);
    renderBoardBody(host, selectedProjectId);
  });

  host.addEventListener('click', (event) => {
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
}
