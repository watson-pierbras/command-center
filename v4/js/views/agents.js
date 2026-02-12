import { AGENTS, PROJECTS, TASKS } from '../mock-data.js';

function currentTaskLink(taskId) {
  const task = TASKS.find((item) => item.id === taskId);
  if (!task) {
    return '<span class="subtle">No current task</span>';
  }
  const project = PROJECTS.find((item) => item.id === task.projectId);
  return `<a class="link" href="#/projects/${project?.id || ''}?tab=tasks">${task.name}</a>`;
}

export function render(container) {
  container.innerHTML = `
    <section class="app-view">
      <h1 class="h-title">Agents</h1>
      <div class="grid-3">
        ${AGENTS.map((agent) => `
          <article class="surface-card agent-card stack-3">
            <div class="task-top">
              <div style="font-size: var(--font-size-lg);">${agent.avatar}</div>
              <span class="dot ${agent.status}"></span>
            </div>
            <div class="stack-2">
              <strong>${agent.name}</strong>
              <span class="pill ${agent.role === 'architect' ? 'active' : 'planned'}">${agent.role}</span>
            </div>
            <div class="subtle">${agent.model}</div>
            <div>${currentTaskLink(agent.currentTask)}</div>
            <div class="project-summary">
              <span>Assigned: ${agent.tasksAssigned}</span>
              <span>Completed: ${agent.tasksCompleted}</span>
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}
