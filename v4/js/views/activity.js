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

const ONE_HOUR_MS = 3600000;
const ONE_DAY_MS = 86400000;

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

function sectionDateLabel(input) {
  const date = new Date(input);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const item = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  if (item === start) return 'Today';
  if (item === start - ONE_DAY_MS) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
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

export function groupActivities(activities) {
  const sorted = [...activities].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const groups = [];

  sorted.forEach((entry) => {
    const actor = ACTOR_LABELS[entry.actor] ? entry.actor : 'system';
    const entryTime = new Date(entry.createdAt).getTime();
    const lastGroup = groups[groups.length - 1];

    if (lastGroup) {
      const lastItem = lastGroup.items[lastGroup.items.length - 1];
      const lastTime = new Date(lastItem.createdAt).getTime();
      const withinHour = lastTime - entryTime <= ONE_HOUR_MS;
      if (lastGroup.actor === actor && withinHour) {
        lastGroup.items.push(entry);
        return;
      }
    }

    groups.push({
      actor,
      items: [entry],
      latestTime: entry.createdAt
    });
  });

  return groups;
}

function renderActivityItem(entry) {
  const actor = ACTOR_LABELS[entry.actor] ? entry.actor : 'system';
  return `
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
}

function renderActivityGroup(group) {
  if (group.items.length === 1) {
    return renderActivityItem(group.items[0]);
  }

  const actor = ACTOR_LABELS[group.actor] ? group.actor : 'system';
  return `
    <div class="activity-group">
      <div class="activity-group-header interactive" data-toggle-group>
        <span>${ACTOR_EMOJI[actor]} ${ACTOR_LABELS[actor]} made ${group.items.length} changes</span>
        <span class="activity-meta"><span>${relTime(group.latestTime)}</span><span>·</span><span data-toggle-indicator>▾</span></span>
      </div>
      <div class="activity-group-items" hidden>
        ${group.items.map((entry) => renderActivityItem(entry)).join('')}
      </div>
    </div>
  `;
}

function renderFeed(host, actorFilter, actionFilter) {
  const filtered = ACTIVITIES
    .filter((entry) => {
      if (actorFilter !== 'all') {
        return entry.actor === actorFilter;
      }
      return true;
    })
    .filter((entry) => (actionFilter === 'all' ? true : entry.action === actionFilter));

  const groups = groupActivities(filtered);
  if (groups.length === 0) {
    host.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🕐</div>
        <div class="empty-state-title">No activity recorded</div>
        <div class="empty-state-desc">Changes to tasks and projects will show up here.</div>
      </div>
    `;
    return;
  }

  let lastLabel = '';
  host.innerHTML = groups.map((group) => {
    const label = sectionDateLabel(group.latestTime);
    const separator = label !== lastLabel ? `<h3 class="activity-date-header">${label}</h3>` : '';
    lastLabel = label;
    return `${separator}${renderActivityGroup(group)}`;
  }).join('');
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
    const groupHeader = event.target.closest('[data-toggle-group]');
    if (groupHeader) {
      const items = groupHeader.nextElementSibling;
      if (items) {
        items.hidden = !items.hidden;
        const indicator = groupHeader.querySelector('[data-toggle-indicator]');
        if (indicator) {
          indicator.textContent = items.hidden ? '▾' : '▴';
        }
      }
      return;
    }

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
