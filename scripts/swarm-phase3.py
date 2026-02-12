#!/usr/bin/env python3
"""
Command Center Phase 3 - Swarm Orchestrator
Multi-agent workflow for task relationships implementation
"""

import os
import sys
import json
from swarm import Agent, Swarm

# Configuration
WORKSPACE = "/Users/Watson/.openclaw/workspace/command-center"
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

def read_file(path):
    """Read file content"""
    try:
        with open(path, 'r') as f:
            return f.read()
    except Exception as e:
        return f"Error reading {path}: {e}"

# Context gathering
print("📚 Gathering context...")
board_json = read_file(f"{WORKSPACE}/board.json")
projects_json = read_file(f"{WORKSPACE}/projects.json")
agents_json = read_file(f"{WORKSPACE}/agents.json")
schema_spec = read_file(f"{WORKSPACE}/docs/SCHEMA-V3.1-SPEC.md")
index_html = read_file(f"{WORKSPACE}/index.html")

# Initialize Swarm client
client = Swarm()

# Agent 1: Architect - Designs the data structure
architect = Agent(
    name="Phase3-Architect",
    instructions="""You are an expert schema architect. Your job is to design the task relationships data structure.

Given the current board.json structure and the v3.1 schema spec, design:
1. How to add relationships to tasks (dependencies, subtasks, parent)
2. The data format for each relationship type
3. Validation rules (no cycles, valid references)
4. UI implications (how this displays in the kanban board)

Output your design as a clear JSON schema and migration plan. Be specific about field names and types.""",
    model="gpt-4o"
)

# Agent 2: Data Engineer - Implements the data layer
data_engineer = Agent(
    name="Phase3-DataEngineer", 
    instructions="""You are a data engineer. Your job is to implement the task relationships in board.json.

Take the architect's design and:
1. Update board.json to include relationship fields on existing tasks
2. Create example task relationships for testing
3. Ensure backward compatibility (v3.0 clients still work)
4. Write validation logic (check for circular dependencies)

Output the actual JSON changes and any JavaScript validation functions.""",
    model="gpt-4o"
)

# Agent 3: UI Developer - Implements the frontend
ui_developer = Agent(
    name="Phase3-UIDeveloper",
    instructions="""You are a frontend developer. Your job is to implement the UI for task relationships.

Given the data structure and existing index.html, implement:
1. Visual indicators for blocked/blocked-by tasks
2. Subtask display in task detail view
3. Dependency graph visualization (simple list or tree)
4. Drag-and-drop or buttons to create relationships

Output the HTML/CSS/JS changes needed. Follow existing code patterns in index.html.""",
    model="gpt-4o"
)

# Agent 4: Integrator - Combines everything
integrator = Agent(
    name="Phase3-Integrator",
    instructions="""You are a technical lead. Your job is to review and integrate all outputs.

Review the architect's design, data engineer's implementation, and UI developer's code:
1. Check for consistency across all components
2. Identify any gaps or issues
3. Create a final implementation plan
4. Write the actual files to disk

Output a summary of changes and any warnings or recommendations.""",
    model="gpt-4o"
)

# Workflow execution
print("🚀 Starting Swarm workflow...")

# Step 1: Architect designs the structure
print("\n👤 Architect designing data structure...")
architect_result = client.run(
    agent=architect,
    messages=[{
        "role": "user",
        "content": f"""Design the task relationships structure for Command Center v3.1.

CURRENT board.json structure:
```json
{board_json[:2000]}...
```

SCHEMA SPEC (relevant section):
{schema_spec[:3000]}...

Requirements:
1. Add relationships object to tasks with: parent, subtasks list, dependencies dict
2. Dependencies need types: blocks, blockedBy, related, duplicates, supersedes
3. Must support cyclic dependency detection
4. Must be backward compatible with v3.0

Output:
1. JSON schema for task relationships
2. Example task with full relationships
3. Migration plan from current tasks"""
    }]
)

architect_design = architect_result.messages[-1]["content"]
print(f"✅ Architect complete. Design length: {len(architect_design)} chars")

# Step 2: Data Engineer implements
print("\n👤 Data Engineer implementing data layer...")
engineer_result = client.run(
    agent=data_engineer,
    messages=[{
        "role": "user", 
        "content": f"""Implement the task relationships based on this design:

{architect_design}

CURRENT board.json:
```json
{board_json[:1500]}...
```

Requirements:
1. Update existing tasks with relationship fields
2. Create 2-3 example relationships between existing tasks
3. Write JavaScript validation function for circular dependencies
4. Ensure backward compatibility

Output:
1. Updated board.json snippet showing relationship fields
2. Example task with full relationships
3. Validation function code"""
    }]
)

data_implementation = engineer_result.messages[-1]["content"]
print(f"✅ Data Engineer complete. Implementation length: {len(data_implementation)} chars")

# Step 3: UI Developer implements frontend
print("\n👤 UI Developer implementing frontend...")
ui_result = client.run(
    agent=ui_developer,
    messages=[{
        "role": "user",
        "content": f"""Implement UI for task relationships.

DATA STRUCTURE:
{architect_design}

CURRENT index.html (relevant sections):
```html
{index_html[:2000]}...
```

Requirements:
1. Show blocked status on kanban cards (visual indicator)
2. In task detail view, show:
   - Parent task (if subtask)
   - List of subtasks
   - Dependencies (what this blocks, what's blocking it)
   - Related tasks
3. Simple way to add dependencies (dropdown or search)

Follow existing CSS patterns. Output HTML/CSS/JS changes."""
    }]
)

ui_implementation = ui_result.messages[-1]["content"]
print(f"✅ UI Developer complete. Implementation length: {len(ui_implementation)} chars")

# Step 4: Integrator reviews and combines
print("\n👤 Integrator reviewing and combining...")
integrator_result = client.run(
    agent=integrator,
    messages=[{
        "role": "user",
        "content": f"""Review and integrate all components for Phase 3.

ARCHITECT DESIGN:
{architect_design}

DATA ENGINEER IMPLEMENTATION:
{data_implementation}

UI DEVELOPER IMPLEMENTATION:
{ui_implementation}

Your task:
1. Check for consistency across all three outputs
2. Identify any missing pieces or issues
3. Create final file change summary
4. Write the actual implementation files

Output:
1. Integration summary (what's good, what needs fixing)
2. List of files to modify
3. Final implementation code for each file
4. Any warnings or recommendations"""
    }]
)

final_output = integrator_result.messages[-1]["content"]
print(f"✅ Integrator complete. Final output length: {len(final_output)} chars")

# Save outputs
output_dir = f"{WORKSPACE}/.codex-tasks/phase3-swarm"
os.makedirs(output_dir, exist_ok=True)

with open(f"{output_dir}/01-architect-design.md", "w") as f:
    f.write(architect_design)
    
with open(f"{output_dir}/02-data-engineer.md", "w") as f:
    f.write(data_implementation)
    
with open(f"{output_dir}/03-ui-developer.md", "w") as f:
    f.write(ui_implementation)
    
with open(f"{output_dir}/04-integrator-final.md", "w") as f:
    f.write(final_output)

print(f"\n💾 All outputs saved to {output_dir}/")
print("\n" + "="*60)
print("SWARM WORKFLOW COMPLETE")
print("="*60)
print("\nReview the outputs and apply the changes manually,")
print("or delegate specific file updates to Codex CLI.")
