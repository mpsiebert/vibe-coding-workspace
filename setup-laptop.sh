#!/usr/bin/env bash
# =============================================================================
# setup-laptop.sh
# Run once on the facilitator/booth laptop BEFORE the event starts.
# Sets up the MCP server and pre-approves all Cortex tool security prompts.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_DIR="${SCRIPT_DIR}/.cortex-plugin/mcp-server"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  🏔️  Snowflake Vibe Coding 2.0 — Laptop Setup        ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ---------------------------------------------------------------------------
# 1. Check prerequisites
# ---------------------------------------------------------------------------
echo "▶ Checking prerequisites..."

command -v node   >/dev/null 2>&1 || { echo "❌ node not found. Install Node.js >= 18."; exit 1; }
command -v npm    >/dev/null 2>&1 || { echo "❌ npm not found."; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ python3 not found."; exit 1; }
command -v snow   >/dev/null 2>&1 || { echo "❌ snow CLI not found. Install: pip install snowflake-cli-labs"; exit 1; }
command -v streamlit >/dev/null 2>&1 || { echo "❌ streamlit not found. Install: pip install streamlit"; exit 1; }

echo "  ✅ node   $(node --version)"
echo "  ✅ npm    $(npm --version)"
echo "  ✅ python3 $(python3 --version)"
echo "  ✅ snow   $(snow --version 2>/dev/null || echo 'installed')"
echo "  ✅ streamlit $(streamlit --version 2>/dev/null | head -1 || echo 'installed')"
echo ""

# ---------------------------------------------------------------------------
# 2. Install MCP server Node dependencies
# ---------------------------------------------------------------------------
echo "▶ Installing MCP server dependencies..."
cd "${MCP_DIR}"
npm install --silent
echo "  ✅ npm packages installed"
echo ""
cd "${SCRIPT_DIR}"

# ---------------------------------------------------------------------------
# 3. Create .env template (only if it doesn't already exist)
# ---------------------------------------------------------------------------
ENV_FILE="${SCRIPT_DIR}/.env"
if [ ! -f "${ENV_FILE}" ]; then
  echo "▶ Creating .env template..."
  cat > "${ENV_FILE}" << 'EOF'
# Snowflake connection settings for the MCP server (snowflake-client.js)
# Fill in all values before running the booth.

SNOWFLAKE_ACCOUNT=your_account.region
SNOWFLAKE_USER=your_username
SNOWFLAKE_ROLE=SYSADMIN
SNOWFLAKE_WAREHOUSE=VIBE_WH
SNOWFLAKE_DATABASE=DATA_BIRDS_DB
SNOWFLAKE_SCHEMA=PUBLIC

# RSA key-pair auth — path to your private key file
SNOWFLAKE_PRIVATE_KEY_PATH=/Users/your_username/.snowflake/rsa_key.p8
SNOWFLAKE_PRIVATE_KEY_PASSPHRASE=
EOF
  echo "  ✅ .env template created at ${ENV_FILE}"
  echo "  ⚠️  Fill in your Snowflake credentials before the event!"
else
  echo "  ℹ️  .env already exists — skipping creation"
fi
echo ""

# ---------------------------------------------------------------------------
# 4. Pre-approve Cortex MCP tool security prompts
#    Ensures attendees aren't blocked by security dialogs during the demo.
# ---------------------------------------------------------------------------
echo "▶ Pre-approving Cortex MCP tool permissions..."

MCP_TOOLS=(
  "roll_challenge"
  "start_local_streamlit"
  "validate_app"
  "deploy_to_snowflake"
)

for tool in "${MCP_TOOLS[@]}"; do
  echo "  Approving: ${tool}..."
  cortex tool approve "${tool}" --always 2>/dev/null || echo "  ⚠️  Could not approve ${tool} (cortex CLI may not support this command — check manually)"
done
echo "  ✅ Tool approvals complete"
echo ""

# ---------------------------------------------------------------------------
# 5. Ensure Snowflake config directory exists
# ---------------------------------------------------------------------------
mkdir -p ~/.snowflake/cortex/skills/vibe-coding

# ---------------------------------------------------------------------------
# 6. Install Skill & MCP Server in local Cortex folder
# ---------------------------------------------------------------------------
echo "▶ Registering Vibe Coding skill and MCP server locally..."
cp "${SCRIPT_DIR}/.cortex-plugin/skills/vibe-coding/SKILL.md" ~/.snowflake/cortex/skills/vibe-coding/SKILL.md
echo "  ✅ Skill copied to ~/.snowflake/cortex/skills/vibe-coding/SKILL.md"

# Register in ~/.snowflake/cortex/mcp.json
MCP_JSON_FILE="$HOME/.snowflake/cortex/mcp.json"

if [ -f "${MCP_JSON_FILE}" ]; then
  # Use node to merge or add the server to existing mcp.json to avoid overwriting other tools
  node -e '
    const fs = require("fs");
    const file = process.argv[1];
    const serverPath = process.argv[2];
    let data = { mcpServers: {} };
    try {
      data = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (e) {}
    if (!data.mcpServers) data.mcpServers = {};
    data.mcpServers["vibe-coding-mcp"] = {
      type: "stdio",
      command: "node",
      args: [serverPath]
    };
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  ' "${MCP_JSON_FILE}" "${SCRIPT_DIR}/.cortex-plugin/mcp-server/server.js"
  echo "  ✅ Registered vibe-coding-mcp in existing mcp.json"
else
  # Create a new mcp.json
  cat > "${MCP_JSON_FILE}" <<EOF
{
  "mcpServers": {
    "vibe-coding-mcp": {
      "type": "stdio",
      "command": "node",
      "args": [
        "${SCRIPT_DIR}/.cortex-plugin/mcp-server/server.js"
      ]
    }
  }
}
EOF
  echo "  ✅ Created new mcp.json and registered vibe-coding-mcp"
fi
echo ""

# ---------------------------------------------------------------------------
# Done!
# ---------------------------------------------------------------------------
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ Setup complete! Pre-event checklist:              ║"
echo "║                                                      ║"
echo "║  1. Fill in credentials in .env                      ║"
echo "║  2. Add RSA private key to ~/.snowflake/rsa_key.p8   ║"
echo "║  3. Run setup.sql in Snowflake (snow sql -f setup.sql)║"
echo "║  4. Verify 'snow connection test -c databirds'        ║"
echo "║  5. Run './booth.sh' to launch the agent session      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

