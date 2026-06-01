# 🏔️ Snowflake Vibe Coding 2.0 — Booth Experience

Welcome to **Vibe Coding 2.0**, an interactive, AI-guided agent experience designed for Snowflake events and summit booths. This repository contains the complete package to run the guided 4-phase vibe coding challenge where attendees build and run a Streamlit application locally.

---

## 🏗️ Architecture & Component Overview

This project bundles everything required to run the booth experience seamlessly:

*   **`SKILL.md`**: The declarative instructions defining the Vibe Coding AI Agent's persona, knowledge base, phases, and rules.
*   **MCP Server (`.cortex-plugin/mcp-server`)**: A Model Context Protocol server exposing custom tools to the Cortex Agent:
    *   `roll_challenge`: Generates the random theme and requirements.
    *   `start_local_streamlit`: Runs the local Streamlit application.
    *   `validate_app`: Verifies code correctness and logic.
*   **`app.py`**: The dynamic workspace file where the agent writes the Streamlit app.
*   **Automation Scripts**: Helper shell scripts to manage the booth laptop lifecycle.

---

## 🚀 Laptop Setup & Installation (Facilitators Only)

Run these steps once on the booth laptop before the event/session starts.

### 1. Prerequisites
Ensure the laptop has the following installed:
*   **Node.js** (>= 18) & **npm**
*   **Python 3** (>= 3.8)
*   **Snowflake CLI** (`pip install snowflake-cli-labs`)
*   **Streamlit** (`pip install streamlit`)
*   **Cortex CLI**

### 2. Provision Snowflake objects (one-time, ACCOUNTADMIN)
Workshop identity (`VIBE_WH` / `VIBE_DB.APPS` / `VIBE_ROLE` / `VIBE_USER`) must
exist before any booth laptop can authenticate. The provisioning script lives at
`../snowflake-vibecoding/setup.sql` — run it once per Snowflake account.

### 3. Run Setup Script
```bash
./setup-laptop.sh
```
On first run this:
*   Generates a fresh `rsa_key.p8` / `rsa_key.pub` in the repo root. The private
    key is git-ignored and stays on the laptop; the public key is committed so
    operators can audit which key is in use.
*   Prints an `ALTER USER VIBE_USER SET RSA_PUBLIC_KEY = '...'` statement that
    an ACCOUNTADMIN must run to register the key.
*   Writes a `vibecoding` connection to `~/.snowflake/config.toml`.
*   Registers the MCP server, pre-approves its tools, and drops a populated `.env`.
*   Installs a `vibe` shell alias that launches `./booth.sh`.

### 4. Smoke-test
```bash
snow connection test -c vibecoding
```

---

## 🎮 Running the Booth Session

To start a new session for an attendee, run:
```bash
./booth.sh
```
This script will:
1.  Reset `app.py` to a clean slate.
2.  Stop any running Streamlit processes.
3.  Dynamically generate `settings.json` and `skills.json` with correct absolute paths.
4.  Launch the **Cortex CLI** preloaded with the Vibe Coding skill and MCP tools.

### Inside the Cortex CLI
Once the interactive Cortex terminal is open, invoke the skill:
```text
/vibe-coding
```
The agent will greet the attendee with high energy, roll for the challenge theme, and guide them step-by-step through the coding challenge!

---

## 🔄 Resetting the Workspace
If you need to reset the workspace between attendees without relaunching the CLI, run:
```bash
./reset.sh
```
