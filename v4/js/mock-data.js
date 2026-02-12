export const PROJECTS = [
  {
    id: '01ARYZ6S41TSV4RRFFQ69G5FA1',
    name: 'Command Center v4',
    status: 'active',
    color: 'indigo',
    description: 'Complete rebuild with CRM-style architecture, Cloudflare backend, Jobs/Ive design.',
    progress: 75,
    taskCounts: { active: 3, planned: 2, done: 6, blocked: 0, inReview: 1 },
    startDate: '2026-02-01',
    targetDate: '2026-03-15',
    priority: 'high',
    lastActivity: '2m ago'
  },
  {
    id: '01ARYZ6S41TSV4RRFFQ69G5FA2',
    name: 'CoachFinder Core',
    status: 'active',
    color: 'emerald',
    description: 'Scrape 130K+ US schools for wrestling coaches, import to HubSpot CRM.',
    progress: 67,
    taskCounts: { active: 2, planned: 1, done: 4, blocked: 1, inReview: 0 },
    startDate: '2026-01-15',
    targetDate: '2026-03-01',
    priority: 'high',
    lastActivity: '1h ago'
  },
  {
    id: '01ARYZ6S41TSV4RRFFQ69G5FA3',
    name: 'Watson Tools',
    status: 'paused',
    color: 'amber',
    description: 'Dashboard and utilities for Watson operations.',
    progress: 40,
    taskCounts: { active: 0, planned: 2, done: 3, blocked: 0, inReview: 0 },
    startDate: '2026-01-20',
    targetDate: null,
    priority: 'medium',
    lastActivity: '3d ago'
  },
  {
    id: '01ARYZ6S41TSV4RRFFQ69G5FA4',
    name: 'Lead Intelligence',
    status: 'active',
    color: 'rose',
    description: 'Research tooling for lead enrichment and scoring.',
    progress: 15,
    taskCounts: { active: 1, planned: 3, done: 1, blocked: 0, inReview: 0 },
    startDate: '2026-02-10',
    targetDate: '2026-04-01',
    priority: 'medium',
    lastActivity: '5h ago'
  }
];

export const TASKS = [
  { id: 't1', name: 'Design dashboard view', status: 'active', priority: 'high', projectId: '01ARYZ6S41TSV4RRFFQ69G5FA1', agentId: 'a1', estimate: '4h', dueDate: '2026-02-15', tags: ['design', 'frontend'] },
  { id: 't2', name: 'Build API layer', status: 'planned', priority: 'high', projectId: '01ARYZ6S41TSV4RRFFQ69G5FA1', agentId: 'a2', estimate: '8h', dueDate: '2026-02-20', tags: ['backend'] },
  { id: 't3', name: 'Implement auth flow', status: 'planned', priority: 'medium', projectId: '01ARYZ6S41TSV4RRFFQ69G5FA1', agentId: 'a1', estimate: '3h', dueDate: '2026-02-22', tags: ['backend', 'security'] },
  { id: 't4', name: 'Design system tokens', status: 'done', priority: 'high', projectId: '01ARYZ6S41TSV4RRFFQ69G5FA1', agentId: 'a1', estimate: '2h', dueDate: '2026-02-10', tags: ['design'] },
  { id: 't5', name: 'Write v4 spec suite', status: 'done', priority: 'high', projectId: '01ARYZ6S41TSV4RRFFQ69G5FA1', agentId: 'a1', estimate: '12h', dueDate: '2026-02-12', tags: ['docs'] },
  { id: 't6', name: 'Router + sidebar', status: 'in_review', priority: 'medium', projectId: '01ARYZ6S41TSV4RRFFQ69G5FA1', agentId: 'a2', estimate: '3h', dueDate: '2026-02-14', tags: ['frontend'] },
  { id: 't7', name: 'School scraper fix', status: 'active', priority: 'high', projectId: '01ARYZ6S41TSV4RRFFQ69G5FA2', agentId: 'a2', estimate: '6h', dueDate: '2026-02-16', tags: ['scraping'] },
  { id: 't8', name: 'HubSpot batch import', status: 'active', priority: 'medium', projectId: '01ARYZ6S41TSV4RRFFQ69G5FA2', agentId: 'a1', estimate: '4h', dueDate: '2026-02-18', tags: ['integration'] },
  { id: 't9', name: 'Pipeline optimization', status: 'blocked', priority: 'high', projectId: '01ARYZ6S41TSV4RRFFQ69G5FA2', agentId: 'a2', estimate: '5h', dueDate: '2026-02-17', blockedReason: 'Waiting on HubSpot API rate limit increase', tags: ['pipeline'] },
  { id: 't10', name: 'State validation rules', status: 'done', priority: 'medium', projectId: '01ARYZ6S41TSV4RRFFQ69G5FA2', agentId: 'a1', estimate: '2h', dueDate: '2026-02-08', tags: ['backend'] },
  { id: 't11', name: 'Lead scoring model', status: 'active', priority: 'medium', projectId: '01ARYZ6S41TSV4RRFFQ69G5FA4', agentId: 'a1', estimate: '6h', dueDate: '2026-02-25', tags: ['ml'] },
  { id: 't12', name: 'Data enrichment pipeline', status: 'planned', priority: 'high', projectId: '01ARYZ6S41TSV4RRFFQ69G5FA4', agentId: 'a2', estimate: '8h', dueDate: '2026-03-01', tags: ['pipeline'] },
  { id: 't13', name: 'Dashboard widgets', status: 'done', priority: 'medium', projectId: '01ARYZ6S41TSV4RRFFQ69G5FA3', agentId: 'a1', estimate: '4h', dueDate: '2026-02-05', tags: ['frontend'] },
];

export const AGENTS = [
  { id: 'a1', name: 'Watson', status: 'active', role: 'architect', model: 'claude-opus-4-6', avatar: '🔍', currentTask: 't1', tasksCompleted: 14, tasksAssigned: 6 },
  { id: 'a2', name: 'Codex', status: 'active', role: 'coder', model: 'gpt-5.3-codex', avatar: '⚡', currentTask: 't7', tasksCompleted: 8, tasksAssigned: 5 },
  { id: 'a3', name: 'Ollama', status: 'idle', role: 'local', model: 'llama3.2:3b', avatar: '🦙', currentTask: null, tasksCompleted: 2, tasksAssigned: 0 },
];

export const ACTIVITIES = [
  { id: 'act1', objectId: 't1', objectName: 'Design dashboard view', objectType: 'task', actor: 'watson', action: 'status_changed', data: { from: 'planned', to: 'active' }, projectName: 'Command Center v4', projectColor: 'indigo', createdAt: '2026-02-12T16:30:00Z' },
  { id: 'act2', objectId: 't5', objectName: 'Write v4 spec suite', objectType: 'task', actor: 'watson', action: 'status_changed', data: { from: 'active', to: 'done' }, projectName: 'Command Center v4', projectColor: 'indigo', createdAt: '2026-02-12T15:00:00Z' },
  { id: 'act3', objectId: 't9', objectName: 'Pipeline optimization', objectType: 'task', actor: 'codex', action: 'blocked', data: { reason: 'Waiting on HubSpot API rate limit increase' }, projectName: 'CoachFinder Core', projectColor: 'emerald', createdAt: '2026-02-12T14:20:00Z' },
  { id: 'act4', objectId: 't7', objectName: 'School scraper fix', objectType: 'task', actor: 'codex', action: 'status_changed', data: { from: 'planned', to: 'active' }, projectName: 'CoachFinder Core', projectColor: 'emerald', createdAt: '2026-02-12T12:00:00Z' },
  { id: 'act5', objectId: '01ARYZ6S41TSV4RRFFQ69G5FA1', objectName: 'Command Center v4', objectType: 'project', actor: 'watson', action: 'updated', data: { changes: [{ field: 'progress', from: 70, to: 75 }] }, projectName: 'Command Center v4', projectColor: 'indigo', createdAt: '2026-02-12T11:00:00Z' },
  { id: 'act6', objectId: 't6', objectName: 'Router + sidebar', objectType: 'task', actor: 'codex', action: 'status_changed', data: { from: 'active', to: 'in_review' }, projectName: 'Command Center v4', projectColor: 'indigo', createdAt: '2026-02-12T10:30:00Z' },
  { id: 'act7', objectId: 't4', objectName: 'Design system tokens', objectType: 'task', actor: 'watson', action: 'status_changed', data: { from: 'active', to: 'done' }, projectName: 'Command Center v4', projectColor: 'indigo', createdAt: '2026-02-11T18:00:00Z' },
  { id: 'act8', objectId: 't10', objectName: 'State validation rules', objectType: 'task', actor: 'watson', action: 'status_changed', data: { from: 'in_review', to: 'done' }, projectName: 'CoachFinder Core', projectColor: 'emerald', createdAt: '2026-02-11T14:00:00Z' },
  { id: 'act9', objectId: 't11', objectName: 'Lead scoring model', objectType: 'task', actor: 'watson', action: 'created', data: {}, projectName: 'Lead Intelligence', projectColor: 'rose', createdAt: '2026-02-10T10:00:00Z' },
  { id: 'act10', objectId: 't13', objectName: 'Dashboard widgets', objectType: 'task', actor: 'watson', action: 'status_changed', data: { from: 'active', to: 'done' }, projectName: 'Watson Tools', projectColor: 'amber', createdAt: '2026-02-09T16:00:00Z' },
];
