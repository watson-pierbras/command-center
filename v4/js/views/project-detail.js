import { ACTIVITIES, AGENTS, PROJECTS, TASKS } from '../mock-data.js';
import { renderBoardBody, showStatusDropdown } from './board.js';
import { groupActivities } from './activity.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDate(date) {
  if (!date) return 'None';
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function relativeTime(input) {
  const date = new Date(input);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function actorName(actor) {
  if (actor === 'watson') return 'Watson';
  if (actor === 'codex') return 'Codex';
  return 'System';
}

function actorAvatar(actor) {
  if (actor === 'watson') return '🔍';
  if (actor === 'codex') return '⚡';
  return '🧠';
}

function activityText(activity) {
  if (activity.action === 'status_changed') return `${actorName(activity.actor)} changed status to ${activity.data.to}`;
  if (activity.action === 'blocked') return `${actorName(activity.actor)} blocked task`;
  if (activity.action === 'updated') return `${actorName(activity.actor)} updated project`;
  return `${actorName(activity.actor)} created item`;
}

function renderProjectActivityItem(item) {
  return `
    <article class="surface-card activity-item">
      <div>${escapeHtml(activityText(item))}</div>
      <div class="activity-meta">
        <span>${relativeTime(item.createdAt)}</span>
        <span>•</span>
        <span>${escapeHtml(item.objectName)}</span>
      </div>
    </article>
  `;
}

function renderOverview(project, projectTasks) {
  const assignedAgentIds = [...new Set(projectTasks.map((task) => task.agentId))];
  const team = assignedAgentIds
    .map((id) => AGENTS.find((agent) => agent.id === id))
    .filter(Boolean)
    .map((agent) => `${agent.avatar} ${agent.name}`)
    .join(' · ');

  return `
    <div class="surface-card task-card stack-3">
      <p>${escapeHtml(project.description)}</p>
      <div class="subtle">Team: ${escapeHtml(team || 'Unassigned')}</div>
      <div class="subtle">Start: ${formatDate(project.startDate)} · Target: ${formatDate(project.targetDate)}</div>
      <div class="subtle">Priority: ${escapeHtml(project.priority)}</div>
    </div>
  `;
}

function renderTasks(project, projectTasks, selectedFilter = 'all', viewMode = 'list') {
  const filters = ['all', 'planned', 'active', 'in_review', 'done', 'blocked'];
  const filtered = selectedFilter === 'all' ? projectTasks : projectTasks.filter((task) => task.status === selectedFilter);
  const viewToggle = `
    <div class="view-toggle">
      <button type="button" class="view-toggle-btn ${viewMode === 'list' ? 'active' : ''}" data-view-mode="list">☰ List</button>
      <button type="button" class="view-toggle-btn ${viewMode === 'board' ? 'active' : ''}" data-view-mode="board">▦ Board</button>
    </div>
  `;

  if (viewMode === 'board') {
    return `
      <div class="stack-3">
        <div class="heading-row">
          <a class="link" href="#/board/${project.id}">View on Board →</a>
          <div class="heading-row">
            <button type="button" class="btn btn-primary" data-new-task>New Task</button>
            ${viewToggle}
          </div>
        </div>
        <div class="board-wrap" data-project-board></div>
      </div>
    `;
  }

  return `
    <div class="stack-3">
      <div class="heading-row">
        <div class="stack-2" style="grid-auto-flow: column; grid-auto-columns: max-content; display: grid; gap: var(--space-2); overflow-x: auto;">
          ${filters.map((filter) => `
            <button type="button" class="btn ${filter === selectedFilter ? 'btn-primary' : ''}" data-task-filter="${filter}">${filter.replace('_', ' ')}</button>
          `).join('')}
        </div>
        <div class="heading-row">
          <button type="button" class="btn btn-primary" data-new-task>New Task</button>
          ${viewToggle}
        </div>
      </div>
      <div class="task-list">
        ${filtered.map((task) => {
          const agent = AGENTS.find((item) => item.id === task.agentId);
          return `
            <article class="surface-card interactive task-card priority-${task.priority}" data-task-id="${task.id}">
              <div class="task-top">
                <strong>${escapeHtml(task.name)}</strong>
                <span class="pill ${escapeHtml(task.status)} status-editable" data-task-status data-task-id="${escapeHtml(task.id)}" data-current-status="${escapeHtml(task.status)}">${escapeHtml(task.status.replace('_', ' '))}</span>
              </div>
              <div class="subtle">Assigned: ${escapeHtml(agent ? `${agent.avatar} ${agent.name}` : 'Unassigned')}</div>
              <div class="subtle">Due ${formatDate(task.dueDate)}</div>
            </article>
          `;
        }).join('') || `
          <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <div class="empty-state-title">No tasks match this filter</div>
            <div class="empty-state-desc">Try selecting a different filter or create a new task.</div>
          </div>
        `}
      </div>
    </div>
  `;
}

function renderActivity(projectActivity) {
  const groups = groupActivities(projectActivity);
  return `
    <div class="activity-list">
      ${groups.map((group) => {
        if (group.items.length === 1) {
          return renderProjectActivityItem(group.items[0]);
        }

        return `
          <div class="activity-group">
            <div class="activity-group-header interactive" data-toggle-group>
              <span>${actorAvatar(group.actor)} ${actorName(group.actor)} made ${group.items.length} changes</span>
              <span class="activity-meta"><span>${relativeTime(group.latestTime)}</span><span>·</span><span data-toggle-indicator>▾</span></span>
            </div>
            <div class="activity-group-items" hidden>
              ${group.items.map((item) => renderProjectActivityItem(item)).join('')}
            </div>
          </div>
        `;
      }).join('') || `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <div class="empty-state-title">No activity yet</div>
          <div class="empty-state-desc">Activity will appear here as tasks are created and updated.</div>
        </div>
      `}
    </div>
  `;
}

export function render(container, params, query = {}) {
  const project = PROJECTS.find((item) => item.id === params.id);
  if (!project) {
    container.innerHTML = `
      <section class="app-view">
        <a class="link" href="#/projects">← Projects</a>
        <div class="surface-card task-card">Project not found.</div>
      </section>
    `;
    return;
  }

  const tabs = ['overview', 'tasks', 'activity'];
  const currentTab = tabs.includes(query.tab) ? query.tab : 'overview';
  const projectTasks = TASKS.filter((task) => task.projectId === project.id);
  const projectActivity = ACTIVITIES
    .filter((item) => item.projectName === project.name)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const doneCount = projectTasks.filter((task) => task.status === 'done').length;
  const completion = Math.round((doneCount / Math.max(1, projectTasks.length)) * 100);

  container.innerHTML = `
    <section class="app-view">
      <a class="link" href="#/projects">← Projects</a>

      <article class="surface-card task-card stack-3 project-left-border" style="border-left-color: var(--color-project-${project.color});">
        <div class="task-top">
          <h1 class="h-title">${escapeHtml(project.name)}</h1>
          <span class="pill ${escapeHtml(project.status)}">${escapeHtml(project.status)}</span>
        </div>
        <div class="progress"><div class="progress-fill" style="width:${project.progress}%"></div></div>
        <div class="project-summary">
          <span>Tasks: ${projectTasks.length}</span>
          <span>Completion: ${completion}%</span>
          <span>Target: ${formatDate(project.targetDate)}</span>
          <span>Priority: ${escapeHtml(project.priority)}</span>
        </div>
      </article>

      <div class="heading-row">
        ${tabs.map((tab) => `
          <button type="button" class="btn ${currentTab === tab ? 'btn-primary' : ''}" data-project-tab="${tab}">${tab[0].toUpperCase() + tab.slice(1)}</button>
        `).join('')}
      </div>

      <div id="project-tab-content" class="stack-4">
        ${currentTab === 'overview' ? renderOverview(project, projectTasks) : ''}
        ${currentTab === 'tasks' ? renderTasks(project, projectTasks, 'all', 'list') : ''}
        ${currentTab === 'activity' ? renderActivity(projectActivity) : ''}
      </div>
    </section>
  `;

  container.querySelectorAll('[data-project-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      window.location.hash = `#/projects/${project.id}?tab=${button.dataset.projectTab}`;
    });
  });

  container.addEventListener('click', (event) => {
    const groupHeader = event.target.closest('[data-toggle-group]');
    if (!groupHeader) return;
    const items = groupHeader.nextElementSibling;
    if (items) {
      items.hidden = !items.hidden;
      const indicator = groupHeader.querySelector('[data-toggle-indicator]');
      if (indicator) {
        indicator.textContent = items.hidden ? '▾' : '▴';
      }
    }
  });

  if (currentTab === 'tasks') {
    const content = container.querySelector('#project-tab-content');
    let selectedFilter = 'all';
    let viewMode = 'list';

    function openCreateTaskForm() {
      Promise.all([
        import('../components/slide-over.js'),
        import('../components/task-form.js')
      ]).then(([slideOver, taskForm]) => {
        slideOver.openSlideOver({
          title: 'Create Task',
          content: taskForm.renderTaskForm({ projectId: project.id })
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

    function renderTaskTabContent() {
      content.innerHTML = renderTasks(project, projectTasks, selectedFilter, viewMode);
      if (viewMode === 'board') {
        const boardContainer = content.querySelector('[data-project-board]');
        if (boardContainer) {
          renderBoardBody(boardContainer, project.id);
        }
      }
    }

    content.addEventListener('click', (event) => {
      const createTaskButton = event.target.closest('[data-new-task]');
      if (createTaskButton) {
        openCreateTaskForm();
        return;
      }

      const statusPill = event.target.closest('[data-task-status]');
      if (statusPill) {
        event.preventDefault();
        event.stopPropagation();
        const taskId = statusPill.dataset.taskId;
        const currentStatus = statusPill.dataset.currentStatus;
        if (!taskId || !currentStatus) return;
        showStatusDropdown(statusPill, taskId, currentStatus, () => {
          renderTaskTabContent();
        });
        return;
      }

      const viewButton = event.target.closest('[data-view-mode]');
      if (viewButton) {
        const nextMode = viewButton.dataset.viewMode;
        if (nextMode && nextMode !== viewMode) {
          viewMode = nextMode;
          renderTaskTabContent();
        }
        return;
      }

      const filterButton = event.target.closest('[data-task-filter]');
      if (filterButton) {
        selectedFilter = filterButton.dataset.taskFilter || 'all';
        renderTaskTabContent();
        return;
      }

      const taskCard = event.target.closest('[data-task-id]');
      if (!taskCard) return;

      const taskId = taskCard.dataset.taskId;
      import('../components/slide-over.js').then(({ openSlideOver }) => {
        import('./task-detail.js').then(({ renderTaskDetail }) => {
          const task = TASKS.find((item) => item.id === taskId);
          openSlideOver({ title: task?.name || 'Task', content: renderTaskDetail(taskId) });
        });
      });
    });

    renderTaskTabContent();
  }
}
