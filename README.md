# 🏔️ Snowflake Vibe Coding 2.0 — Booth Experience

Welcome to **Vibe Coding 2.0**, an interactive, AI-guided agent experience designed for Snowflake events and summit booths. This repository contains the complete package to run the guided 5-phase vibe coding challenge where attendees build and deploy a Streamlit application on Snowflake.

---

## 🏗️ Architecture & Component Overview

This project bundles everything required to run the booth experience seamlessly:

*   **`SKILL.md`**: The declarative instructions defining the Vibe Coding AI Agent's persona, knowledge base, phases, and rules.
*   **MCP Server (`.cortex-plugin/mcp-server`)**: A Model Context Protocol server exposing custom tools to the Cortex Agent:
    *   `roll_challenge`: Generates the random theme and requirements.
    *   `start_local_streamlit`: Runs the local Streamlit application.
    *   `validate_app`: Verifies code correctness and logic.
    *   `deploy_to_snowflake`: Deploys the completed app to Snowflake.
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

### 2. Run Setup Script
Execute the setup script to install dependencies, generate configuration templates, and pre-approve Cortex MCP security prompts:
```bash
./setup-laptop.sh
```

### 3. Configure Connection
1.  Open the newly created `.env` file and populate it with your Snowflake credentials.
2.  Ensure your RSA private key is configured (typically at `~/.snowflake/rsa_key.p8`).
3.  Execute the database preparation script in your Snowflake account:
    ```bash
    snow sql -f setup.sql
    ```
4.  Test the connection:
    ```bash
    snow connection test -c databirds
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
