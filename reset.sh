#!/usr/bin/env bash
# =============================================================================
# reset.sh
# Resets the workspace between attendees at the booth.
# Kills any running Streamlit process, wipes app.py, and creates a fresh one.
# Usage: ./reset.sh
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_FILE="${SCRIPT_DIR}/app.py"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  🔄  Vibe Coding 2.0 — Resetting Workspace           ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ---------------------------------------------------------------------------
# 1. Kill any running Streamlit process
# ---------------------------------------------------------------------------
echo "▶ Stopping Streamlit (if running)..."
if pkill -f "streamlit run" 2>/dev/null; then
  echo "  ✅ Streamlit process stopped"
else
  echo "  ℹ️  No running Streamlit process found"
fi
echo ""

# ---------------------------------------------------------------------------
# 2. Short pause to ensure the port is released
# ---------------------------------------------------------------------------
sleep 1

# ---------------------------------------------------------------------------
# 3. Remove and recreate app.py
# ---------------------------------------------------------------------------
echo "▶ Resetting app.py..."
if [ -f "${APP_FILE}" ]; then
  rm "${APP_FILE}"
  echo "  🗑️  Old app.py deleted"
fi

touch "${APP_FILE}"
echo "  ✅ Fresh empty app.py created at ${APP_FILE}"
echo ""

# ---------------------------------------------------------------------------
# 4. (Optional) Clear __pycache__ to avoid stale compiled files
# ---------------------------------------------------------------------------
if [ -d "${SCRIPT_DIR}/__pycache__" ]; then
  rm -rf "${SCRIPT_DIR}/__pycache__"
  echo "  🗑️  __pycache__ cleared"
fi

# ---------------------------------------------------------------------------
# Done!
# ---------------------------------------------------------------------------
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ Workspace reset! Ready for next attendee 🎉       ║"
echo "║                                                      ║"
echo "║  Next steps:                                         ║"
echo "║  1. Hand the keyboard to the new attendee            ║"
echo "║  2. Run: /vibe-coding                                ║"
echo "║  3. Let the vibes flow 🚀                            ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
