import { ACTIVITIES, AGENTS, TASKS } from '../mock-data.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function describeActivity(activity) {
  if (activity.action === 'status_changed') {
    return `Changed '${activity.objectName}' to ${activity.data?.to || 'updated'}`;
  }
  if (activity.action === 'blocked') {
    return `Blocked '${activity.objectName}'`;
  }
  if (activity.action === 'updated') {
    return `Updated '${activity.objectName}'`;
  }
  return `Created '${activity.objectName}'`;
}

function relativeTime(input) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function actorMatchesAgent(activity, agent) {
  const actor = String(activity.actor || '').toLowerCase();
  const agentName = String(agent.name || '').toLowerCase();
  const agentId = String(agent.id || '').toLowerCase();
  return actor === agentName || actor === agentId;
}

function percent(count, total) {
  if (total === 0) return 0;
  return (count / total) * 100;
}

export function render(container) {
  container.innerHTML = `
    <section class="app-view">
      <h1 class="h-title">Agents</h1>
      <div class="grid-3">
        ${AGENTS.map((agent) => {
          const assignedTasks = TASKS.filter((task) => task.agentId === agent.id);
          const activeTasks = assignedTasks.filter((task) => task.status === 'active');
          const plannedTasks = assignedTasks.filter((task) => task.status === 'planned');
          const reviewTasks = assignedTasks.filter((task) => task.status === 'in_review');
          const doneTasks = assignedTasks.filter((task) => task.status === 'done');
          const blockedTasks = assignedTasks.filter((task) => task.status === 'blocked');
          const totalAssigned = assignedTasks.length;

          const recentActivity = [...ACTIVITIES]
            .filter((activity) => actorMatchesAgent(activity, agent))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3);

          const donePercent = percent(doneTasks.length, totalAssigned);
          const activePercent = percent(activeTasks.length, totalAssigned);
          const reviewPercent = percent(reviewTasks.length, totalAssigned);
          const plannedPercent = percent(plannedTasks.length, totalAssigned);
          const blockedPercent = percent(blockedTasks.length, totalAssigned);

          const lastActive = recentActivity[0] ? relativeTime(recentActivity[0].createdAt) : 'No recent activity';

          return `
          <article class="surface-card agent-card stack-3" data-agent-id="${escapeHtml(agent.id)}">
            <div class="agent-header">
              <span class="agent-avatar">${escapeHtml(agent.avatar)}</span>
              <div>
                <strong>${escapeHtml(agent.name)}</strong>
                <div class="subtle">${escapeHtml(agent.role)}</div>
              </div>
              <span class="pill ${escapeHtml(agent.status)}">${escapeHtml(agent.status)}</span>
            </div>

            <div class="workload-section">
              <div class="workload-label">
                <span>${totalAssigned} tasks assigned</span>
              </div>
              <div class="kpi-spark">
                <div class="kpi-spark-segment" style="width:${donePercent}%; background: var(--color-status-done);"></div>
                <div class="kpi-spark-segment" style="width:${activePercent}%; background: var(--color-accent);"></div>
                <div class="kpi-spark-segment" style="width:${reviewPercent}%; background: var(--color-status-review);"></div>
                <div class="kpi-spark-segment" style="width:${plannedPercent}%; background: var(--color-text-tertiary);"></div>
                <div class="kpi-spark-segment" style="width:${blockedPercent}%; background: var(--color-status-blocked);"></div>
              </div>
              <div class="workload-legend">
                <span class="workload-legend-item"><span class="color-dot" style="background: var(--color-status-done);"></span> ${doneTasks.length} done</span>
                <span class="workload-legend-item"><span class="color-dot" style="background: var(--color-accent);"></span> ${activeTasks.length} active</span>
                ${
                  reviewTasks.length > 0
                    ? `<span class="workload-legend-item"><span class="color-dot" style="background: var(--color-status-review);"></span> ${reviewTasks.length} review</span>`
                    : ''
                }
                ${
                  plannedTasks.length > 0
                    ? `<span class="workload-legend-item"><span class="color-dot" style="background: var(--color-text-tertiary);"></span> ${plannedTasks.length} planned</span>`
                    : ''
                }
                ${
                  blockedTasks.length > 0
                    ? `<span class="workload-legend-item"><span class="color-dot" style="background: var(--color-status-blocked);"></span> ${blockedTasks.length} blocked</span>`
                    : ''
                }
              </div>
            </div>

            <div class="agent-recent">
              <div class="subtle">Recent activity:</div>
              ${
                recentActivity.length > 0
                  ? recentActivity
                    .map((activity) => `<div class="subtle">· ${escapeHtml(describeActivity(activity))}</div>`)
                    .join('')
                  : '<div class="subtle">No recent activity</div>'
              }
            </div>

            <div class="subtle">Last active: ${escapeHtml(lastActive)}</div>
          </article>
        `;
        }).join('')}
      </div>
    </section>
  `;
}
