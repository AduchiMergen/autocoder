# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an autonomous coding agent system with a React-based UI. It uses the Claude Agent SDK to build complete applications over multiple sessions using a two-agent pattern:

1. **Initializer Agent** - First session reads an app spec and creates features in a SQLite database
2. **Coding Agent** - Subsequent sessions implement features one by one, marking them as passing

## Commands

### Python Backend

```bash
# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run the main CLI launcher
python start.py

# Run agent directly for a specific project
python autonomous_agent_demo.py --project-dir PROJECT_NAME
```

### React UI (in ui/ directory)

```bash
cd ui
npm install
npm run dev      # Development server
npm run build    # Production build
npm run lint     # Run ESLint
```

## Architecture

### Core Python Modules

- `start.py` - CLI launcher with project creation/selection menu
- `autonomous_agent_demo.py` - Entry point for running the agent
- `agent.py` - Agent session loop using Claude Agent SDK
- `client.py` - ClaudeSDKClient configuration with security hooks and MCP servers
- `security.py` - Bash command allowlist validation (ALLOWED_COMMANDS whitelist)
- `prompts.py` - Prompt template loading with project-specific fallback
- `progress.py` - Progress tracking, database queries, webhook notifications

### Feature Management

Features are stored in SQLite (`features.db`) via SQLAlchemy. The agent interacts with features through an MCP server:

- `mcp_server/feature_mcp.py` - MCP server exposing feature management tools
- `api/database.py` - SQLAlchemy models (Feature table with priority, category, name, description, steps, passes)

MCP tools available to the agent:
- `feature_get_stats` - Progress statistics
- `feature_get_next` - Get highest-priority pending feature
- `feature_get_for_regression` - Random passing features for regression testing
- `feature_mark_passing` - Mark feature complete
- `feature_skip` - Move feature to end of queue
- `feature_create_bulk` - Initialize all features (used by initializer)

### React UI (ui/)

- Tech stack: React 18, TypeScript, TanStack Query, Tailwind CSS v4, Radix UI
- `src/App.tsx` - Main app with project selection, kanban board, agent controls
- `src/hooks/useWebSocket.ts` - Real-time updates via WebSocket
- `src/hooks/useProjects.ts` - React Query hooks for API calls
- `src/lib/api.ts` - REST API client
- `src/lib/types.ts` - TypeScript type definitions

### Project Structure for Generated Apps

Generated projects are stored in `generations/PROJECT_NAME/` with:
- `prompts/app_spec.txt` - Application specification (XML format)
- `prompts/initializer_prompt.md` - First session prompt
- `prompts/coding_prompt.md` - Continuation session prompt
- `features.db` - SQLite database with feature test cases

### Security Model

Defense-in-depth approach configured in `client.py`:
1. OS-level sandbox for bash commands
2. Filesystem restricted to project directory only
3. Bash commands validated against `ALLOWED_COMMANDS` in `security.py`

## Claude Code Integration

- `.claude/commands/create-spec.md` - `/create-spec` slash command for interactive spec creation
- `.claude/skills/frontend-design/SKILL.md` - Skill for distinctive UI design
- `.claude/templates/` - Prompt templates copied to new projects

## Key Patterns

### Prompt Loading Fallback Chain

1. Project-specific: `generations/{project}/prompts/{name}.md`
2. Base template: `.claude/templates/{name}.template.md`

### Agent Session Flow

1. Check if `features.db` has features (determines initializer vs coding agent)
2. Create ClaudeSDKClient with security settings
3. Send prompt and stream response
4. Auto-continue with 3-second delay between sessions
