import { ACTIVITIES, AGENTS, PROJECTS, TASKS } from '../mock-data.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

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

function sparklineMarkup(segments) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  if (total === 0) {
    return '<div class="kpi-spark"></div>';
  }

  return `
    <div class="kpi-spark">
      ${segments
        .filter((segment) => segment.value > 0)
        .map(
          (segment) =>
            `<span class="kpi-spark-segment" style="width:${(segment.value / total) * 100}%;background:${segment.color};"></span>`
        )
        .join('')}
    </div>
  `;
}

export function render(container) {
  const activeProjects = PROJECTS.filter((project) => project.status === 'active').length;
  const totalProjects = PROJECTS.length;
  const totalTasks = TASKS.length;
  const doneTasks = TASKS.filter((task) => task.status === 'done').length;
  const plannedTasks = TASKS.filter((task) => task.status === 'planned').length;
  const activeTasks = TASKS.filter((task) => task.status === 'active').length;
  const inReviewTasks = TASKS.filter((task) => task.status === 'in_review').length;
  const completion = Math.round((doneTasks / Math.max(1, totalTasks)) * 100);
  const blockedTasks = TASKS.filter((task) => task.status === 'blocked');
  const blockedCount = blockedTasks.length;
  const hasBlocked = blockedCount > 0;

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
        <article class="surface-card kpi-card stack-2 interactive" data-stat-action="projects">
          <div class="subtle">Active Projects</div>
          <div class="kpi-value">${activeProjects}</div>
          <div class="kpi-subtitle">
            of ${totalProjects} total
            <span class="kpi-indicator ${hasBlocked ? 'warning' : 'success'}" aria-hidden="true"></span>
          </div>
          <div class="kpi-arrow">→</div>
          ${sparklineMarkup([
            { value: activeProjects, color: 'var(--color-status-success)' },
            { value: Math.max(0, totalProjects - activeProjects), color: 'var(--color-bg-tertiary)' }
          ])}
        </article>
        <article class="surface-card kpi-card stack-2 interactive" data-stat-action="board">
          <div class="subtle">Total Tasks</div>
          <div class="kpi-value">${totalTasks}</div>
          <div class="kpi-subtitle">✓ ${doneTasks} done · ◆ ${activeTasks} active · ◇ ${plannedTasks} planned</div>
          <div class="kpi-arrow">→</div>
          ${sparklineMarkup([
            { value: plannedTasks, color: 'var(--color-status-neutral)' },
            { value: activeTasks, color: 'var(--color-accent)' },
            { value: inReviewTasks, color: 'var(--color-status-warning)' },
            { value: doneTasks, color: 'var(--color-status-success)' },
            { value: blockedCount, color: 'var(--color-status-danger)' }
          ])}
        </article>
        <article class="surface-card kpi-card stack-2 interactive" data-stat-action="projects">
          <div class="subtle">Completion</div>
          <div class="kpi-value">${completion}%</div>
          <div class="progress"><div class="progress-fill" style="width:${completion}%"></div></div>
          <div class="kpi-arrow">→</div>
          ${sparklineMarkup([
            { value: doneTasks, color: 'var(--color-status-success)' },
            { value: Math.max(0, totalTasks - doneTasks), color: 'var(--color-bg-tertiary)' }
          ])}
        </article>
        <article class="surface-card kpi-card stack-2 interactive" data-stat-action="blocked">
          <div class="subtle">Blocked</div>
          ${hasBlocked
            ? `<div class="kpi-value status-danger">${blockedCount}</div><div class="kpi-subtitle status-danger">needs attention</div>`
            : '<div class="kpi-value status-success">All clear 🎉</div><div class="kpi-subtitle">0 blocked tasks</div>'}
          <div class="kpi-arrow">→</div>
          ${sparklineMarkup([
            { value: blockedCount, color: 'var(--color-status-danger)' },
            { value: Math.max(0, totalTasks - blockedCount), color: 'var(--color-status-success)' }
          ])}
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
                <strong>${escapeHtml(project.name)}</strong>
                <span class="pill ${escapeHtml(project.status)}">${escapeHtml(project.status)}</span>
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
              <div class="project-last-updated">Last updated ${escapeHtml(project.lastActivity)}</div>
            </article>
          `).join('')}
        </div>
      </div>

      <div class="section-stack">
        <h2 class="h-title">Recent Activity</h2>
        <div class="activity-list">
          ${recentActivities.map((activity) => `
            <article class="surface-card activity-item ${activity.objectType === 'task' ? 'interactive' : ''}" ${activity.objectType === 'task' ? `data-task-id="${activity.objectId}"` : ''}>
              <div>${escapeHtml(actorAvatar(activity.actor))} ${escapeHtml(describeActivity(activity))}</div>
              <div class="activity-meta">
                <span>${relativeTime(activity.createdAt)}</span>
                <span>•</span>
                <span class="color-dot" style="background: var(--color-project-${activity.projectColor});"></span>
                <span>${escapeHtml(activity.projectName)}</span>
              </div>
            </article>
          `).join('')}
        </div>
      </div>

      ${blockedTasks.length > 0 ? `
        <div class="section-stack needs-attention">
          <h2 class="h-title">Needs Attention</h2>
          <div class="task-list">
            ${blockedTasks.map((task) => {
              const blockedAt = blockedMap.get(task.id);
              const duration = blockedAt ? relativeTime(blockedAt) : 'unknown';
              return `
                <article class="surface-card task-card interactive priority-high" data-task-id="${task.id}">
                  <div class="task-top">
                    <strong>${escapeHtml(task.name)}</strong>
                    <span class="pill blocked">blocked</span>
                  </div>
                  <div class="subtle">Blocked for ${duration}</div>
                  <div class="subtle">${escapeHtml(task.blockedReason || 'No reason provided')}</div>
                </article>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <button class="fab" id="create-task-fab" title="New Task" aria-label="Create new task">+</button>
    </section>
  `;

  container.addEventListener('click', (event) => {
    const createButton = event.target.closest('#create-task-fab');
    if (createButton) {
      Promise.all([
        import('../components/slide-over.js'),
        import('../components/task-form.js')
      ]).then(([slideOver, taskForm]) => {
        slideOver.openSlideOver({
          title: 'Create Task',
          content: taskForm.renderTaskForm()
        });

        const form = document.getElementById('task-create-form');
        taskForm.initTaskForm(form, (task) => {
          slideOver.closeSlideOver();
          if (task?.projectId) {
            window.location.hash = `#/board/${task.projectId}`;
          }
        });
      });
      return;
    }

    const statCard = event.target.closest('[data-stat-action]');
    if (statCard) {
      const statAction = statCard.dataset.statAction;
      if (statAction === 'projects') {
        window.location.hash = '#/projects';
        return;
      }
      if (statAction === 'board') {
        window.location.hash = '#/board';
        return;
      }
      if (statAction === 'blocked') {
        if (blockedTasks.length === 1) {
          const taskId = blockedTasks[0].id;
          import('../components/slide-over.js').then(({ openSlideOver }) => {
            import('./task-detail.js').then(({ renderTaskDetail }) => {
              const task = TASKS.find((item) => item.id === taskId);
              openSlideOver({ title: task?.name || 'Task', content: renderTaskDetail(taskId) });
            });
          });
        } else {
          document.querySelector('.needs-attention')?.scrollIntoView({ behavior: 'smooth' });
        }
        return;
      }
    }

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
