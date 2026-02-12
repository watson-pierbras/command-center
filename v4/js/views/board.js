import { AGENTS, PROJECTS, TASKS } from '../mock-data.js';

const COLUMNS = [
  { key: 'planned', label: 'Planned' },
  { key: 'active', label: 'Active' },
  { key: 'in_review', label: 'In Review' },
  { key: 'done', label: 'Done' }
];

function listForColumn(tasks, key) {
  if (key === 'active') {
    return tasks.filter((task) => task.status === 'active' || task.status === 'blocked');
  }
  return tasks.filter((task) => task.status === key);
}

function renderBoardBody(host, projectId) {
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
                <article class="surface-card task-card priority-${task.priority}">
                  <strong>${task.name}</strong>
                  <div class="activity-meta">
                    <span class="color-dot" style="background: var(--color-project-${project?.color || 'slate'});"></span>
                    <span>${project?.name || 'Unknown project'}</span>
                  </div>
                  <div class="activity-meta">
                    <span>${agent?.avatar || '👤'}</span>
                    <span>${agent?.name || 'Unassigned'}</span>
                    ${task.status === 'blocked' ? '<span class="pill blocked">blocked</span>' : ''}
                  </div>
                </article>
              `;
            }).join('') || '<div class="subtle">No tasks</div>'}
          </section>
        `;
      }).join('')}
    </div>
  `;
}

export function render(container) {
  container.innerHTML = `
    <section class="app-view">
      <div class="heading-row">
        <h1 class="h-title">Board</h1>
        <select class="select" id="board-project-filter">
          <option value="all">All Projects</option>
          ${PROJECTS.map((project) => `<option value="${project.id}">${project.name}</option>`).join('')}
        </select>
      </div>
      <div class="board-wrap" id="board-content"></div>
    </section>
  `;

  const filter = container.querySelector('#board-project-filter');
  const host = container.querySelector('#board-content');

  renderBoardBody(host, 'all');

  filter.addEventListener('change', () => {
    renderBoardBody(host, filter.value);
  });
}
