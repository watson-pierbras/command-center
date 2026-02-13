import { AGENTS, PROJECTS, addTask } from '../mock-data.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderTaskForm(options = {}) {
  const { projectId } = options;

  return `
    <form class="task-form stack-3" id="task-create-form">
      <div class="form-group">
        <label class="form-label" for="task-name">Task Name *</label>
        <input class="form-input" type="text" id="task-name" name="name" required placeholder="What needs to be done?" autofocus>
      </div>
      <div class="form-group">
        <label class="form-label" for="task-project">Project</label>
        <select class="form-select" id="task-project" name="projectId">
          ${PROJECTS.map((project) => `<option value="${escapeHtml(project.id)}" ${project.id === projectId ? 'selected' : ''}>${escapeHtml(project.name)}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="task-priority">Priority</label>
          <select class="form-select" id="task-priority" name="priority">
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="task-agent">Assignee</label>
          <select class="form-select" id="task-agent" name="agentId">
            <option value="">Unassigned</option>
            ${AGENTS.map((agent) => `<option value="${escapeHtml(agent.id)}">${escapeHtml(agent.avatar)} ${escapeHtml(agent.name)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="task-due">Due Date</label>
          <input class="form-input" type="date" id="task-due" name="dueDate">
        </div>
        <div class="form-group">
          <label class="form-label" for="task-estimate">Estimate</label>
          <input class="form-input" type="text" id="task-estimate" name="estimate" placeholder="e.g. 4h">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="task-tags">Tags (comma separated)</label>
        <input class="form-input" type="text" id="task-tags" name="tags" placeholder="frontend, design">
      </div>
      <button type="submit" class="btn btn-primary btn-full">Create Task</button>
    </form>
  `;
}

export function initTaskForm(formElement, onCreated) {
  if (!formElement) return;

  formElement.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(formElement);
    const name = String(formData.get('name') || '').trim();
    if (!name) return;

    const tagsRaw = String(formData.get('tags') || '').trim();
    const tags = tagsRaw
      ? tagsRaw.split(',').map((tag) => tag.trim()).filter(Boolean)
      : [];

    const task = addTask({
      name,
      projectId: String(formData.get('projectId') || ''),
      priority: String(formData.get('priority') || 'medium'),
      agentId: String(formData.get('agentId') || '') || undefined,
      dueDate: String(formData.get('dueDate') || '') || undefined,
      estimate: String(formData.get('estimate') || '') || undefined,
      tags
    });

    if (typeof onCreated === 'function') {
      onCreated(task);
    }
  });
}
