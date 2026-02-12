import { ACTIVITIES, AGENTS, PROJECTS, TASKS } from '../mock-data.js';

function actorLabel(actor) {
  const value = actor.toLowerCase();
  if (value === 'watson') return 'Watson';
  if (value === 'codex') return 'Codex';
  return 'System';
}

function actorAvatar(actor) {
  const value = actor.toLowerCase();
  if (value === 'watson') return '🔍';
  if (value === 'codex') return '⚡';
  return '🧠';
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

function describeActivity(activity) {
  const actor = actorLabel(activity.actor);
  if (activity.action === 'status_changed') {
    return `${actor} changed '${activity.objectName}' to ${activity.data.to}`;
  }
  if (activity.action === 'blocked') {
    return `${actor} blocked '${activity.objectName}'`;
  }
  if (activity.action === 'updated') {
    return `${actor} updated '${activity.objectName}'`;
  }
  return `${actor} created '${activity.objectName}'`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning, Paul';
  if (hour < 18) return 'Good afternoon, Paul';
  return 'Good evening, Paul';
}

export function render(container) {
  const activeProjects = PROJECTS.filter((project) => project.status === 'active').length;
  const totalTasks = TASKS.length;
  const doneTasks = TASKS.filter((task) => task.status === 'done').length;
  const completion = Math.round((doneTasks / Math.max(1, totalTasks)) * 100);
  const blockedTasks = TASKS.filter((task) => task.status === 'blocked');

  const blockedMap = new Map(
    ACTIVITIES.filter((activity) => activity.action === 'blocked').map((activity) => [activity.objectId, activity.createdAt])
  );

  const recentActivities = [...ACTIVITIES]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  container.innerHTML = `
    <section class="app-view">
      <h1 class="h-title">${greeting()}</h1>

      <div class="grid-4">
        <article class="surface-card kpi-card stack-2">
          <div class="subtle">Active Projects</div>
          <div class="kpi-value">${activeProjects}</div>
        </article>
        <article class="surface-card kpi-card stack-2">
          <div class="subtle">Total Tasks</div>
          <div class="kpi-value">${totalTasks}</div>
        </article>
        <article class="surface-card kpi-card stack-2">
          <div class="subtle">Completion</div>
          <div class="kpi-value">${completion}%</div>
        </article>
        <article class="surface-card kpi-card stack-2">
          <div class="subtle">Blocked</div>
          <div class="kpi-value ${blockedTasks.length > 0 ? 'status-danger' : ''}">${blockedTasks.length}</div>
        </article>
      </div>

      <div class="section-stack">
        <div class="heading-row">
          <h2 class="h-title">Projects</h2>
          <a class="link" href="#/projects">View All →</a>
        </div>
        <div class="horizontal-scroll">
          ${PROJECTS.map((project) => `
            <article class="surface-card interactive project-card project-left-border stack-3" style="border-left-color: var(--color-project-${project.color});" data-project-id="${project.id}">
              <div class="card-top">
                <strong>${project.name}</strong>
                <span class="pill ${project.status}">${project.status}</span>
              </div>
              <div class="stack-2">
                <div class="progress"><div class="progress-fill" style="width:${project.progress}%"></div></div>
                <div class="project-summary">
                  <span>Active: ${project.taskCounts.active}</span>
                  <span>Done: ${project.taskCounts.done}</span>
                  <span>Planned: ${project.taskCounts.planned}</span>
                  <span>Review: ${project.taskCounts.inReview}</span>
                </div>
              </div>
              <div class="subtle">Last activity ${project.lastActivity}</div>
            </article>
          `).join('')}
        </div>
      </div>

      <div class="section-stack">
        <h2 class="h-title">Recent Activity</h2>
        <div class="activity-list">
          ${recentActivities.map((activity) => `
            <article class="surface-card activity-item ${activity.objectType === 'task' ? 'interactive' : ''}" ${activity.objectType === 'task' ? `data-task-id="${activity.objectId}"` : ''}>
              <div>${actorAvatar(activity.actor)} ${describeActivity(activity)}</div>
              <div class="activity-meta">
                <span>${relativeTime(activity.createdAt)}</span>
                <span>•</span>
                <span class="color-dot" style="background: var(--color-project-${activity.projectColor});"></span>
                <span>${activity.projectName}</span>
              </div>
            </article>
          `).join('')}
        </div>
      </div>

      ${blockedTasks.length > 0 ? `
        <div class="section-stack">
          <h2 class="h-title">Needs Attention</h2>
          <div class="task-list">
            ${blockedTasks.map((task) => {
              const blockedAt = blockedMap.get(task.id);
              const duration = blockedAt ? relativeTime(blockedAt) : 'unknown';
              return `
                <article class="surface-card task-card interactive priority-high" data-task-id="${task.id}">
                  <div class="task-top">
                    <strong>${task.name}</strong>
                    <span class="pill blocked">blocked</span>
                  </div>
                  <div class="subtle">Blocked for ${duration}</div>
                  <div class="subtle">${task.blockedReason || 'No reason provided'}</div>
                </article>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}
    </section>
  `;

  container.addEventListener('click', (event) => {
    const projectCard = event.target.closest('[data-project-id]');
    if (projectCard) {
      const projectId = projectCard.dataset.projectId;
      if (projectId) {
        window.location.hash = `#/projects/${projectId}`;
      }
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
}
