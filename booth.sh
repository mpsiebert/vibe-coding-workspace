#!/usr/bin/env bash
# =============================================================================
# booth.sh — One-command booth launcher for Vibe Coding 2.0
# Run this at the start of each attendee session.
# =============================================================================
set -euo pipefail

WORKSPACE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Reset app.py to a clean slate before each attendee
if [ -f "${WORKSPACE}/app.py" ]; then
  rm "${WORKSPACE}/app.py"
fi
touch "${WORKSPACE}/app.py"

# Kill any lingering Streamlit from the last attendee
pkill -f "streamlit run" 2>/dev/null || true

# Generate settings.json dynamically with current absolute paths
cat > "${WORKSPACE}/settings.json" <<EOF
{
  "allowedTools": [
    "mcp__vibe-coding-mcp__*",
    "mcp__vibe_coding_mcp__*",
    "mcp__vibe-coding-mcp__roll_challenge",
    "mcp__vibe-coding-mcp__start_local_streamlit",
    "mcp__vibe-coding-mcp__validate_app",
    "mcp__vibe-coding-mcp__deploy_to_snowflake",
    "VIBE-CODING-MCP__ROLL_CHALLENGE",
    "VIBE-CODING-MCP__START_LOCAL_STREAMLIT",
    "VIBE-CODING-MCP__VALIDATE_APP",
    "VIBE-CODING-MCP__DEPLOY_TO_SNOWFLAKE",
    "roll_challenge",
    "start_local_streamlit",
    "validate_app",
    "deploy_to_snowflake",
    "Write",
    "WRITE",
    "Bash",
    "BASH",
    "Glob",
    "GLOB",
    "Read",
    "READ",
    "Edit",
    "EDIT",
    "SQL_EXECUTE",
    "sql_execute",
    "SQL_QUERY",
    "sql_query"
  ],
  "allowed-tools": [
    "mcp__vibe-coding-mcp__*",
    "mcp__vibe_coding_mcp__*",
    "mcp__vibe-coding-mcp__roll_challenge",
    "mcp__vibe-coding-mcp__start_local_streamlit",
    "mcp__vibe-coding-mcp__validate_app",
    "mcp__vibe-coding-mcp__deploy_to_snowflake",
    "VIBE-CODING-MCP__ROLL_CHALLENGE",
    "VIBE-CODING-MCP__START_LOCAL_STREAMLIT",
    "VIBE-CODING-MCP__VALIDATE_APP",
    "VIBE-CODING-MCP__DEPLOY_TO_SNOWFLAKE",
    "roll_challenge",
    "start_local_streamlit",
    "validate_app",
    "deploy_to_snowflake",
    "Write",
    "WRITE",
    "Bash",
    "BASH",
    "Glob",
    "GLOB",
    "Read",
    "READ",
    "Edit",
    "EDIT",
    "SQL_EXECUTE",
    "sql_execute",
    "SQL_QUERY",
    "sql_query"
  ],
  "mcpServers": {
    "vibe-coding-mcp": {
      "type": "stdio",
      "command": "node",
      "args": [
        "${WORKSPACE}/.cortex-plugin/mcp-server/server.js"
      ]
    }
  }
}
EOF

# Generate skills.json dynamically with current absolute paths
cat > "${WORKSPACE}/skills.json" <<EOF
{
  "skills": [
    {
      "name": "vibe-coding",
      "path": "${WORKSPACE}/.cortex-plugin/skills/vibe-coding/SKILL.md",
      "description": "Guides booth attendees through the 5-phase Vibe Coding 2.0 Challenge"
    }
  ]
}
EOF

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  🏔️  Vibe Coding 2.0 — Booth Session Starting        ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

cortex \
  -w "${WORKSPACE}" \
  --connection vibecoding \
  --config "${WORKSPACE}/settings.json" \
  --skills "${WORKSPACE}/skills.json" \
  --dangerously-allow-all-tool-calls \
  --allowed-tools \
    "mcp__vibe-coding-mcp__*" \
    "mcp__vibe_coding_mcp__*" \
    "mcp__vibe-coding-mcp__roll_challenge" \
    "mcp__vibe-coding-mcp__start_local_streamlit" \
    "mcp__vibe-coding-mcp__validate_app" \
    "mcp__vibe-coding-mcp__deploy_to_snowflake" \
    "VIBE-CODING-MCP__ROLL_CHALLENGE" \
    "VIBE-CODING-MCP__START_LOCAL_STREAMLIT" \
    "VIBE-CODING-MCP__VALIDATE_APP" \
    "VIBE-CODING-MCP__DEPLOY_TO_SNOWFLAKE" \
    "roll_challenge" \
    "start_local_streamlit" \
    "validate_app" \
    "deploy_to_snowflake" \
    "Write" \
    "WRITE" \
    "Bash" \
    "BASH" \
    "Glob" \
    "GLOB" \
    "Read" \
    "READ" \
    "Edit" \
    "EDIT" \
    "SQL_EXECUTE" \
    "SQL_EXECUTE(*)" \
    "sql_execute" \
    "sql_execute(*)" \
    "SQL_QUERY" \
    "SQL_QUERY(*)" \
    "sql_query" \
    "sql_query(*)" \
    "Write(*)" \
    "WRITE(*)" \
    "Bash(*)" \
    "BASH(*)" \
    "Glob(*)" \
    "GLOB(*)" \
    "Read(*)" \
    "READ(*)" \
    "Edit(*)" \
    "EDIT(*)" \
  --session-name "vibe-coding-$(date +%H%M%S)"





