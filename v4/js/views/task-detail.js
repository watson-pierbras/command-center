import { ACTIVITIES, AGENTS, PROJECTS, TASKS } from '../mock-data.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function titleCase(input) {
  const value = String(input || '');
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(input) {
  if (!input) return 'None';
  return new Date(`${input}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function isOverdue(input) {
  if (!input) return false;
  const date = new Date(`${input}T00:00:00`);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return date.getTime() < startOfToday.getTime();
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

function actorLabel(actor) {
  if (actor === 'watson') return 'Watson';
  if (actor === 'codex') return 'Codex';
  return 'System';
}

function actorAvatar(actor) {
  if (actor === 'watson') return '\ud83d\udd0d';
  if (actor === 'codex') return '\u26a1';
  return '\ud83e\udde0';
}

function activityDescription(activity) {
  const actor = actorLabel(activity.actor);
  if (activity.action === 'status_changed') {
    return `${actor} changed status to ${activity.data?.to || 'unknown'}`;
  }
  if (activity.action === 'blocked') {
    return `${actor} blocked this task`;
  }
  if (activity.action === 'updated') {
    return `${actor} updated this task`;
  }
  return `${actor} created this task`;
}

export function renderTaskDetail(taskId) {
  const task = TASKS.find((item) => item.id === taskId);
  if (!task) {
    return '<div class="subtle">Task not found.</div>';
  }

  const project = PROJECTS.find((item) => item.id === task.projectId);
  const agent = AGENTS.find((item) => item.id === task.agentId);
  const timeline = ACTIVITIES
    .filter((item) => item.objectType === 'task' && item.objectId === task.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const dueLabel = formatDate(task.dueDate);
  const overdue = isOverdue(task.dueDate);

  return `
    <div class="task-detail-status priority-${escapeHtml(task.priority)}">
      <span class="pill ${escapeHtml(task.status)}">${escapeHtml(task.status.replace('_', ' '))}</span>
      <span class="subtle">\u00B7 ${escapeHtml(titleCase(task.priority))} priority</span>
    </div>

    <dl class="task-detail-meta">
      <div>
        <dt>Project</dt>
        <dd>
          <a href="#/projects/${escapeHtml(task.projectId)}" class="link" data-project-id="${escapeHtml(task.projectId)}">
            <span class="color-dot" style="display:inline-block; margin-right: var(--space-1); background: var(--color-project-${escapeHtml(project?.color || 'slate')});"></span>
            ${escapeHtml(project?.name || 'Unknown project')}
          </a>
        </dd>
      </div>
      <div>
        <dt>Assignee</dt>
        <dd>${escapeHtml(agent?.avatar || '\ud83d\udc64')} ${escapeHtml(agent?.name || 'Unassigned')}</dd>
      </div>
      <div>
        <dt>Due date</dt>
        <dd>
          ${escapeHtml(dueLabel)}
          ${overdue ? '<span class="status-danger" style="margin-left: var(--space-2);">Overdue</span>' : ''}
        </dd>
      </div>
      <div>
        <dt>Estimate</dt>
        <dd>${escapeHtml(task.estimate || 'None')}</dd>
      </div>
      <div>
        <dt>Tags</dt>
        <dd>
          <div class="task-detail-tags">
            ${(task.tags || []).map((tag) => `<span class="task-detail-tag">${escapeHtml(tag)}</span>`).join('') || '<span class="subtle">No tags</span>'}
          </div>
        </dd>
      </div>
    </dl>

    ${task.status === 'blocked' ? `<div class="task-detail-blocked">${escapeHtml(task.blockedReason || 'Blocked with no reason provided')}</div>` : ''}

    <section class="task-detail-timeline">
      <h3>Activity</h3>
      ${timeline.length > 0
        ? timeline
          .map((item) => `
            <article class="timeline-item">
              <div class="timeline-actor">${escapeHtml(actorAvatar(item.actor))}</div>
              <div class="timeline-text">${escapeHtml(activityDescription(item))}</div>
              <div class="timeline-time">${escapeHtml(relativeTime(item.createdAt))}</div>
            </article>
          `)
          .join('')
        : '<div class="subtle">No activity yet</div>'}
    </section>
  `;
}
