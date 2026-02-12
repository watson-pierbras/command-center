import { PROJECTS } from '../mock-data.js';
import { navigate } from '../router.js';

export function render(container) {
  container.innerHTML = `
    <section class="app-view">
      <div class="heading-row">
        <h1 class="h-title">Projects</h1>
        <button type="button" class="btn btn-primary" disabled>New Project</button>
      </div>
      <div class="grid-3">
        ${PROJECTS.map((project) => `
          <article class="surface-card interactive project-card project-left-border stack-3" style="border-left-color: var(--color-project-${project.color});" data-project-id="${project.id}">
            <div class="task-top">
              <strong>${project.name}</strong>
              <span class="pill ${project.status}">${project.status}</span>
            </div>
            <div class="stack-2">
              <div class="progress"><div class="progress-fill" style="width:${project.progress}%"></div></div>
              <div class="subtle">${project.progress}% complete</div>
            </div>
            <div class="project-summary">
              <span>Active: ${project.taskCounts.active}</span>
              <span>Planned: ${project.taskCounts.planned}</span>
              <span>Done: ${project.taskCounts.done}</span>
              <span>Blocked: ${project.taskCounts.blocked}</span>
            </div>
            <div class="subtle">Last activity ${project.lastActivity}</div>
          </article>
        `).join('')}
      </div>
    </section>
  `;

  container.querySelectorAll('[data-project-id]').forEach((card) => {
    card.addEventListener('click', () => {
      navigate(`/projects/${card.dataset.projectId}`);
    });
  });
}
