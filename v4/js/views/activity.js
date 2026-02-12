import { ACTIVITIES, TASKS } from '../mock-data.js';

const ACTOR_LABELS = {
  all: 'All',
  watson: 'Watson',
  codex: 'Codex',
  system: 'System'
};

const ACTOR_EMOJI = {
  watson: '🔍',
  codex: '⚡',
  system: '🧠'
};

function relTime(input) {
  const date = new Date(input);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function dateLabel(input) {
  const date = new Date(input);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const item = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const oneDay = 86400000;

  if (item === start) return 'Today';
  if (item === start - oneDay) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function activityText(activity) {
  const actor = ACTOR_LABELS[activity.actor] || 'System';
  if (activity.action === 'status_changed') {
    return `${actor} changed status to ${activity.data.to}`;
  }
  if (activity.action === 'blocked') {
    return `${actor} blocked task`;
  }
  if (activity.action === 'updated') {
    return `${actor} updated item`;
  }
  return `${actor} created item`;
}

function objectLink(activity) {
  if (activity.objectType === 'project') {
    return `#/projects/${activity.objectId}`;
  }
  if (activity.objectType === 'task') {
    const task = TASKS.find((item) => item.id === activity.objectId);
    if (task) {
      return `#/projects/${task.projectId}?tab=tasks`;
    }
    return '#/projects';
  }
  return '#/';
}

function renderFeed(host, actorFilter, actionFilter) {
  const filtered = [...ACTIVITIES]
    .filter((entry) => {
      if (actorFilter !== 'all') {
        return entry.actor === actorFilter;
      }
      return true;
    })
    .filter((entry) => (actionFilter === 'all' ? true : entry.action === actionFilter))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  let lastLabel = '';

  host.innerHTML = filtered
    .map((entry) => {
      const label = dateLabel(entry.createdAt);
      const separator = label !== lastLabel ? `<div class="subtle" style="margin-top: var(--space-2);">${label}</div>` : '';
      lastLabel = label;
      const actor = ACTOR_LABELS[entry.actor] ? entry.actor : 'system';

      return `
        ${separator}
        <article class="surface-card activity-item ${entry.objectType === 'task' ? 'interactive' : ''}" ${entry.objectType === 'task' ? `data-task-id="${entry.objectId}"` : ''}>
          <div class="task-top">
            <div>${ACTOR_EMOJI[actor]} ${activityText(entry)}</div>
            <span class="subtle">${relTime(entry.createdAt)}</span>
          </div>
          <div class="activity-meta">
            <a class="link" href="${objectLink(entry)}">${entry.objectName}</a>
            <span>•</span>
            <span class="color-dot" style="background: var(--color-project-${entry.projectColor});"></span>
            <span>${entry.projectName}</span>
          </div>
        </article>
      `;
    })
    .join('') || '<div class="subtle">No activity for this filter.</div>';
}

export function render(container) {
  container.innerHTML = `
    <section class="app-view">
      <h1 class="h-title">Activity</h1>
      <div class="surface-card task-card stack-3">
        <div class="heading-row" style="flex-wrap: wrap;">
          <div class="stack-2" style="display:flex; gap: var(--space-2); flex-wrap: wrap;">
            ${Object.entries(ACTOR_LABELS).map(([key, label]) => `
              <button type="button" class="btn ${key === 'all' ? 'btn-primary' : ''}" data-actor-filter="${key}">${label}</button>
            `).join('')}
          </div>
          <select class="select" id="activity-action-filter">
            <option value="all">All Actions</option>
            <option value="status_changed">Status Changed</option>
            <option value="blocked">Blocked</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
          </select>
        </div>
        <div id="activity-feed" class="activity-list"></div>
      </div>
    </section>
  `;

  const host = container.querySelector('#activity-feed');
  const actionSelect = container.querySelector('#activity-action-filter');
  let activeActor = 'all';

  renderFeed(host, activeActor, actionSelect.value);

  container.querySelectorAll('[data-actor-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      activeActor = button.dataset.actorFilter;
      container.querySelectorAll('[data-actor-filter]').forEach((item) => item.classList.remove('btn-primary'));
      button.classList.add('btn-primary');
      renderFeed(host, activeActor, actionSelect.value);
    });
  });

  actionSelect.addEventListener('change', () => {
    renderFeed(host, activeActor, actionSelect.value);
  });

  container.addEventListener('click', (event) => {
    const card = event.target.closest('[data-task-id]');
    if (!card || event.target.closest('a')) return;

    const taskId = card.dataset.taskId;
    import('../components/slide-over.js').then(({ openSlideOver }) => {
      import('./task-detail.js').then(({ renderTaskDetail }) => {
        const task = TASKS.find((item) => item.id === taskId);
        openSlideOver({ title: task?.name || 'Task', content: renderTaskDetail(taskId) });
      });
    });
  });
}
