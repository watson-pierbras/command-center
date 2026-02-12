import { ACTIVITIES, AGENTS, PROJECTS, TASKS } from '../mock-data.js';

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

function activityText(activity) {
  if (activity.action === 'status_changed') return `${actorName(activity.actor)} changed status to ${activity.data.to}`;
  if (activity.action === 'blocked') return `${actorName(activity.actor)} blocked task`;
  if (activity.action === 'updated') return `${actorName(activity.actor)} updated project`;
  return `${actorName(activity.actor)} created item`;
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
      <p>${project.description}</p>
      <div class="subtle">Team: ${team || 'Unassigned'}</div>
      <div class="subtle">Start: ${formatDate(project.startDate)} · Target: ${formatDate(project.targetDate)}</div>
      <div class="subtle">Priority: ${project.priority}</div>
    </div>
  `;
}

function renderTasks(projectTasks, selectedFilter = 'all') {
  const filters = ['all', 'planned', 'active', 'in_review', 'done', 'blocked'];
  const filtered = selectedFilter === 'all' ? projectTasks : projectTasks.filter((task) => task.status === selectedFilter);

  return `
    <div class="stack-3">
      <div class="heading-row">
        <div class="stack-2" style="grid-auto-flow: column; grid-auto-columns: max-content; display: grid; gap: var(--space-2); overflow-x: auto;">
          ${filters.map((filter) => `
            <button type="button" class="btn ${filter === selectedFilter ? 'btn-primary' : ''}" data-task-filter="${filter}">${filter.replace('_', ' ')}</button>
          `).join('')}
        </div>
      </div>
      <div class="task-list">
        ${filtered.map((task) => {
          const agent = AGENTS.find((item) => item.id === task.agentId);
          return `
            <article class="surface-card interactive task-card priority-${task.priority}" data-open-task="${task.id}">
              <div class="task-top">
                <strong>${task.name}</strong>
                <span class="pill ${task.status}">${task.status.replace('_', ' ')}</span>
              </div>
              <div class="subtle">Assigned: ${agent ? `${agent.avatar} ${agent.name}` : 'Unassigned'}</div>
              <div class="subtle">Due ${formatDate(task.dueDate)}</div>
            </article>
          `;
        }).join('') || '<div class="subtle">No tasks for this filter.</div>'}
      </div>
    </div>
  `;
}

function renderActivity(projectActivity) {
  return `
    <div class="activity-list">
      ${projectActivity.map((item) => `
        <article class="surface-card activity-item">
          <div>${activityText(item)}</div>
          <div class="activity-meta">
            <span>${relativeTime(item.createdAt)}</span>
            <span>•</span>
            <span>${item.objectName}</span>
          </div>
        </article>
      `).join('') || '<div class="subtle">No project activity yet.</div>'}
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
          <h1 class="h-title">${project.name}</h1>
          <span class="pill ${project.status}">${project.status}</span>
        </div>
        <div class="progress"><div class="progress-fill" style="width:${project.progress}%"></div></div>
        <div class="project-summary">
          <span>Tasks: ${projectTasks.length}</span>
          <span>Completion: ${completion}%</span>
          <span>Target: ${formatDate(project.targetDate)}</span>
          <span>Priority: ${project.priority}</span>
        </div>
      </article>

      <div class="heading-row">
        ${tabs.map((tab) => `
          <button type="button" class="btn ${currentTab === tab ? 'btn-primary' : ''}" data-project-tab="${tab}">${tab[0].toUpperCase() + tab.slice(1)}</button>
        `).join('')}
      </div>

      <div id="project-tab-content" class="stack-4">
        ${currentTab === 'overview' ? renderOverview(project, projectTasks) : ''}
        ${currentTab === 'tasks' ? renderTasks(projectTasks, 'all') : ''}
        ${currentTab === 'activity' ? renderActivity(projectActivity) : ''}
      </div>
    </section>
  `;

  container.querySelectorAll('[data-project-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      window.location.hash = `#/projects/${project.id}?tab=${button.dataset.projectTab}`;
    });
  });

  if (currentTab === 'tasks') {
    const content = container.querySelector('#project-tab-content');
    const bindTaskHandlers = () => {
      content.querySelectorAll('[data-task-filter]').forEach((button) => {
        button.addEventListener('click', () => {
          content.innerHTML = renderTasks(projectTasks, button.dataset.taskFilter);
          bindTaskHandlers();
        });
      });

      content.querySelectorAll('[data-open-task]').forEach((taskCard) => {
        taskCard.addEventListener('click', () => {
          taskCard.style.borderColor = 'var(--color-accent)';
        });
      });
    };

    bindTaskHandlers();
  }
}
