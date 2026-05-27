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
  -c databirds \
  --config "${WORKSPACE}/settings.json" \
  --skills "${WORKSPACE}/skills.json" \
  --dangerously-allow-all-tool-calls \
  --session-name "vibe-coding-$(date +%H%M%S)"
