/**
 * Task Relationships Validation Functions
 * Command Center v3.1
 * 
 * These functions validate task relationships to ensure data integrity:
 * - detectCycle: Detects if adding a dependency would create a circular reference
 * - validateRelationships: Full validation of a task's relationships
 * 
 * Usage: Include this file in index.html or import as needed.
 */

// ============================================================================
// CYCLE DETECTION
// ============================================================================

/**
 * Detects if adding a new dependency would create a cycle.
 * 
 * @param {string} taskId - The ID of the task being modified
 * @param {Object} dependencies - The dependencies object (blocks, blockedBy, etc.)
 * @param {Map<string, Object>} taskMap - Map of all tasks by ID (id -> task)
 * @param {string} newDependencyId - Optional ID being added for cycle check
 * @param {string} dependencyType - Type of dependency being added ('blocks' or 'blockedBy')
 * @returns {boolean} - true if adding this would create a cycle, false otherwise
 * 
 * @example
 * const wouldCreateCycle = detectCycle(
 *   'task-abc123',
 *   { blocks: ['task-def456'], blockedBy: [] },
 *   taskMap,
 *   'task-ghi789',
 *   'blocks'
 * );
 */
function detectCycle(taskId, dependencies, taskMap, newDependencyId = null, dependencyType = null) {
  // Build a directed graph for cycle detection
  // Edge direction: A -> B means "A blocks B" (B depends on A, B cannot start until A completes)
  
  const visited = new Set();
  const recursionStack = new Set();
  
  /**
   * DFS traversal to detect cycles
   * @param {string} currentId - Current task ID in traversal
   * @param {Set<string>} path - Current path being explored
   * @returns {boolean} - true if cycle detected
   */
  function hasCycle(currentId, path) {
    if (path.has(currentId)) {
      return true; // Cycle detected - we've seen this node in current path
    }
    
    if (visited.has(currentId)) {
      return false; // Already processed, no cycle from this node
    }
    
    visited.add(currentId);
    path.add(currentId);
    
    // Get dependencies for this task
    const task = taskMap.get(currentId);
    if (task && task.relationships && task.relationships.dependencies) {
      const deps = task.relationships.dependencies;
      
      // Follow "blocks" relationships (edges point to tasks this one blocks)
      if (deps.blocks && Array.isArray(deps.blocks)) {
        for (const blockedId of deps.blocks) {
          if (hasCycle(blockedId, path)) {
            return true;
          }
        }
      }
    }
    
    // Check the potential new dependency being added
    if (currentId === taskId && newDependencyId && dependencyType === 'blocks') {
      if (hasCycle(newDependencyId, path)) {
        return true;
      }
    }
    
    path.delete(currentId);
    return false;
  }
  
  // Start cycle detection from the task in question
  return hasCycle(taskId, new Set());
}

/**
 * Simplified cycle detection without a taskMap - works with raw dependencies array.
 * Used for quick validation before full graph check.
 * 
 * @param {string} sourceId - The source task ID
 * @param {string} targetId - The target task ID (dependency being added)
 * @param {Array<{source: string, target: string}>} existingEdges - Array of existing dependency edges
 * @returns {boolean} - true if adding source->target would create a cycle
 */
function detectCycleSimple(sourceId, targetId, existingEdges) {
  // Build adjacency list
  const graph = new Map();
  
  // Add existing edges
  for (const edge of existingEdges) {
    if (!graph.has(edge.source)) {
      graph.set(edge.source, new Set());
    }
    graph.get(edge.source).add(edge.target);
  }
  
  // Add the new edge being tested
  if (!graph.has(sourceId)) {
    graph.set(sourceId, new Set());
  }
  graph.get(sourceId).add(targetId);
  
  // DFS to find if target can reach source (which would create a cycle)
  const visited = new Set();
  const stack = [targetId];
  
  while (stack.length > 0) {
    const current = stack.pop();
    
    if (current === sourceId) {
      return true; // Cycle detected: target can reach source
    }
    
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);
    
    const neighbors = graph.get(current);
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      }
    }
  }
  
  return false;
}

// ============================================================================
// RELATIONSHIPS VALIDATION
// ============================================================================

/**
 * Validates all relationships for a single task.
 * Returns validation result with detailed error messages.
 * 
 * @param {Object} task - The task object to validate
 * @param {Map<string, Object>} allTasks - Map of all tasks by ID for reference checks
 * @param {number} maxHierarchyDepth - Maximum allowed parent-child depth (default: 5)
 * @returns {Object} - { valid: boolean, errors: string[], warnings: string[] }
 * 
 * @example
 * const result = validateRelationships(task, taskMap);
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors);
 * }
 */
function validateRelationships(task, allTasks = new Map(), maxHierarchyDepth = 5) {
  const errors = [];
  const warnings = [];
  
  // Ensure task has required structure
  if (!task || typeof task !== 'object') {
    return { valid: false, errors: ['Task must be a valid object'], warnings: [] };
  }
  
  if (!task.id) {
    return { valid: false, errors: ['Task must have an id'], warnings: [] };
  }
  
  // Check if relationships object exists
  if (!task.relationships) {
    return { 
      valid: false, 
      errors: ['Task missing relationships object'], 
      warnings: [] 
    };
  }
  
  const rel = task.relationships;
  const taskId = task.id;
  
  // === Validate parent field ===
  if (!('parent' in rel)) {
    errors.push('Missing relationships.parent field');
  } else if (rel.parent !== null) {
    if (typeof rel.parent !== 'string') {
      errors.push('relationships.parent must be a string or null');
    } else {
      // Check for self-reference
      if (rel.parent === taskId) {
        errors.push('Task cannot be its own parent');
      }
      
      // Check parent exists
      if (allTasks.size > 0 && !allTasks.has(rel.parent)) {
        errors.push(`Parent task '${rel.parent}' does not exist`);
      }
      
      // Check hierarchy depth
      const depth = getHierarchyDepth(taskId, allTasks, rel.parent);
      if (depth > maxHierarchyDepth) {
        errors.push(`Hierarchy depth (${depth}) exceeds maximum (${maxHierarchyDepth})`);
      }
    }
  }
  
  // === Validate subtasks field ===
  if (!('subtasks' in rel)) {
    errors.push('Missing relationships.subtasks field');
  } else if (!Array.isArray(rel.subtasks)) {
    errors.push('relationships.subtasks must be an array');
  } else {
    const seenSubtasks = new Set();
    for (const subtaskId of rel.subtasks) {
      // Check for duplicates
      if (seenSubtasks.has(subtaskId)) {
        errors.push(`Duplicate subtask ID: '${subtaskId}'`);
      }
      seenSubtasks.add(subtaskId);
      
      // Check for self-reference
      if (subtaskId === taskId) {
        errors.push('Task cannot be its own subtask');
      }
      
      // Check subtask exists
      if (allTasks.size > 0 && !allTasks.has(subtaskId)) {
        warnings.push(`Subtask '${subtaskId}' does not exist`);
      }
    }
  }
  
  // === Validate dependencies object ===
  if (!rel.dependencies || typeof rel.dependencies !== 'object') {
    errors.push('Missing or invalid relationships.dependencies object');
  } else {
    const deps = rel.dependencies;
    const depTypes = ['blocks', 'blockedBy', 'related', 'duplicates', 'supersedes'];
    
    // Check all required dependency types exist
    for (const depType of depTypes) {
      if (!(depType in deps)) {
        errors.push(`Missing dependencies.${depType} field`);
        continue;
      }
      
      if (!Array.isArray(deps[depType])) {
        errors.push(`dependencies.${depType} must be an array`);
        continue;
      }
      
      // Validate each dependency ID
      const seenIds = new Set();
      for (const depId of deps[depType]) {
        // Check for duplicates within the array
        if (seenIds.has(depId)) {
          errors.push(`Duplicate ${depType} ID: '${depId}'`);
        }
        seenIds.add(depId);
        
        // Check for self-reference
        if (depId === taskId) {
          errors.push(`Task cannot ${depType} itself`);
        }
        
        // Check dependency exists
        if (allTasks.size > 0 && !allTasks.has(depId)) {
          warnings.push(`${depType} target '${depId}' does not exist`);
        }
      }
    }
    
    // === Check for bidirectional consistency (warning, not error) ===
    if (deps.blocks && deps.blockedBy) {
      // If A.blocks includes B, B.blockedBy should include A
      for (const blockedId of deps.blocks) {
        const blockedTask = allTasks.get(blockedId);
        if (blockedTask && blockedTask.relationships && blockedTask.relationships.dependencies) {
          const theirBlockedBy = blockedTask.relationships.dependencies.blockedBy;
          if (theirBlockedBy && !theirBlockedBy.includes(taskId)) {
            warnings.push(`Inconsistent: '${taskId}' blocks '${blockedId}' but '${blockedId}'.blockedBy doesn't include '${taskId}'`);
          }
        }
      }
      
      // If A.blockedBy includes B, B.blocks should include A
      for (const blockerId of deps.blockedBy) {
        const blockerTask = allTasks.get(blockerId);
        if (blockerTask && blockerTask.relationships && blockerTask.relationships.dependencies) {
          const theirBlocks = blockerTask.relationships.dependencies.blocks;
          if (theirBlocks && !theirBlocks.includes(taskId)) {
            warnings.push(`Inconsistent: '${taskId}' is blockedBy '${blockerId}' but '${blockerId}'.blocks doesn't include '${taskId}'`);
          }
        }
      }
    }
  }
  
  // === Check for parent-child and dependency conflicts ===
  // A task shouldn't block its parent or be blocked by its child
  if (rel.parent && deps && deps.blocks && deps.blocks.includes(rel.parent)) {
    errors.push('Task cannot block its parent task');
  }
  if (rel.parent && deps && deps.blockedBy && deps.blockedBy.includes(rel.parent)) {
    errors.push('Parent-child relationship conflict with blockedBy');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates the entire task graph for global constraints like cycles.
 * 
 * @param {Array<Object>} tasks - Array of all tasks
 * @returns {Object} - { valid: boolean, errors: string[], cycles: Array<string[]> }
 */
function validateTaskGraph(tasks) {
  const errors = [];
  const cycles = [];
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  
  // Build dependency graph for cycle detection
  const graph = new Map();
  for (const task of tasks) {
    if (task.relationships && task.relationships.dependencies) {
      const deps = task.relationships.dependencies;
      if (deps.blocks) {
        graph.set(task.id, new Set(deps.blocks));
      }
    }
  }
  
  // Find all cycles using DFS
  const visited = new Set();
  const recursionStack = new Set();
  const path = [];
  
  function findCycles(node, parentMap) {
    if (recursionStack.has(node)) {
      // Found a cycle - extract it
      const cycleStart = path.indexOf(node);
      const cycle = path.slice(cycleStart).concat([node]);
      cycles.push(cycle);
      return;
    }
    
    if (visited.has(node)) {
      return;
    }
    
    visited.add(node);
    recursionStack.add(node);
    path.push(node);
    
    const neighbors = graph.get(node) || new Set();
    for (const neighbor of neighbors) {
      findCycles(neighbor, parentMap);
    }
    
    path.pop();
    recursionStack.delete(node);
  }
  
  // Check cycles from each node
  for (const taskId of taskMap.keys()) {
    if (!visited.has(taskId)) {
      findCycles(taskId, new Map());
    }
  }
  
  if (cycles.length > 0) {
    errors.push(`Found ${cycles.length} dependency cycle(s):`);
    for (const cycle of cycles) {
      errors.push(`  ${cycle.join(' → ')}`);
    }
  }
  
  // Check for orphaned subtasks (parent doesn't list them as subtasks)
  for (const task of tasks) {
    if (task.relationships && task.relationships.parent) {
      const parent = taskMap.get(task.relationships.parent);
      if (parent && parent.relationships && parent.relationships.subtasks) {
        if (!parent.relationships.subtasks.includes(task.id)) {
          errors.push(`Orphaned subtask: '${task.id}' has parent '${parent.id}' but parent doesn't include it in subtasks`);
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    cycles
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate the hierarchy depth of a task (number of parent levels up to root).
 * 
 * @param {string} taskId - Task ID to check
 * @param {Map<string, Object>} taskMap - Map of all tasks
 * @param {string} parentId - Optional parent to start from (for checking new parent)
 * @returns {number} - Depth (0 = root, 1 = child of root, etc.)
 */
function getHierarchyDepth(taskId, taskMap, parentId = null) {
  let depth = 0;
  let currentId = parentId || taskMap.get(taskId)?.relationships?.parent;
  const visited = new Set();
  
  while (currentId) {
    if (visited.has(currentId)) {
      return Infinity; // Cycle in parent chain
    }
    visited.add(currentId);
    depth++;
    
    const parent = taskMap.get(currentId);
    if (!parent || !parent.relationships) {
      break;
    }
    currentId = parent.relationships.parent;
  }
  
  return depth;
}

/**
 * Gets default relationships object for new tasks.
 * @returns {Object} - Default relationships structure
 */
function getDefaultRelationships() {
  return {
    parent: null,
    subtasks: [],
    dependencies: {
      blocks: [],
      blockedBy: [],
      related: [],
      duplicates: [],
      supersedes: []
    }
  };
}

/**
 * Safely gets relationships from a task, returning defaults if missing.
 * Backward compatibility helper for v3.0 tasks.
 * 
 * @param {Object} task - The task object
 * @returns {Object} - Relationships object (with defaults if missing)
 */
function getTaskRelationships(task) {
  if (!task || !task.relationships) {
    return getDefaultRelationships();
  }
  return task.relationships;
}

/**
 * Checks if a task is currently blocked by incomplete dependencies.
 * 
 * @param {Object} task - The task to check
 * @param {Map<string, Object>} taskMap - Map of all tasks
 * @returns {Object} - { blocked: boolean, blockers: string[], reason: string }
 */
function getTaskBlockStatus(task, taskMap) {
  const rel = getTaskRelationships(task);
  const blockedBy = rel.dependencies?.blockedBy || [];
  
  const incompleteBlockers = [];
  
  for (const blockerId of blockedBy) {
    const blocker = taskMap.get(blockerId);
    if (!blocker) {
      incompleteBlockers.push({ id: blockerId, reason: 'not found' });
    } else if (blocker.column !== 'done' && blocker.status?.state !== 'completed') {
      incompleteBlockers.push({ 
        id: blockerId, 
        title: blocker.title || blockerId,
        reason: 'not completed',
        column: blocker.column || blocker.status?.column
      });
    }
  }
  
  return {
    blocked: incompleteBlockers.length > 0,
    blockers: incompleteBlockers,
    reason: incompleteBlockers.length > 0 
      ? `Blocked by ${incompleteBlockers.length} incomplete task(s)` 
      : null
  };
}

// ============================================================================
// EXPORT (for module systems)
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    detectCycle,
    detectCycleSimple,
    validateRelationships,
    validateTaskGraph,
    getHierarchyDepth,
    getDefaultRelationships,
    getTaskRelationships,
    getTaskBlockStatus
  };
}
