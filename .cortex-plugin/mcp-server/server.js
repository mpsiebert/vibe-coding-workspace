/**
 * Vibe Coding 2.0 — MCP Server
 * Provides 3 tools to the Cortex AI agent:
 *   1. roll_challenge        — randomise (or map) the 4 challenge constraints
 *   2. start_local_streamlit — launch `streamlit run app.py` in the background
 *   3. validate_app          — python3 -m py_compile app.py
 */

import { config as loadEnv } from 'dotenv';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { spawn, execSync } from 'child_process';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import open from 'open';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = process.env.PROJECT_DIR
  ? path.resolve(process.env.PROJECT_DIR)
  : path.resolve(__dirname, '..', '..');
loadEnv({ path: path.join(PROJECT_DIR, '.env'), quiet: true });

// ---------------------------------------------------------------------------
// Lookup tables
// ---------------------------------------------------------------------------

const THEMES = [
  'Interactive Data Dashboard',
  'AI Chatbot',
  'Geospatial Map',
  'Sentiment Analyzer',
  'Data Story / Pitch Deck',
  'What-If Calculator',
];

const DATASETS = [
  'Global Weather & Climate',
  'Stock Market / Crypto Prices',
  'Customer Support Transcripts',
  'Global Supply Chain & Shipping',
  'Real Estate / Housing Prices',
  'E-Commerce & Retail Orders (TPC-H sample)',
];

const AUDIENCES = [
  'Urban Planners',
  'Venture Capitalists',
  'Chief Risk Officers',
  'Real Estate Developers',
  'Supply Chain Directors',
  'E-commerce Brands',
  'Commodity Traders',
  'City Officials',
  'Quantitative Analysts',
  'Market Research Analysts',
  'Business Intelligence Consultants',
  'Sustainability Officers',
  'Product Managers',
  'Data Scientists',
  'AI Engineers',
  'Industry Bloggers',
  'Short-form Content Creators',
  'Remote Workers',
  'Product Reviewers',
  'Investigative Journalists',
];

const STYLES = [
  'Cyberpunk',
  'Cottagecore',
  'Y2K',
  'Brutalist',
  'Solarpunk',
  'Dark Academia',
  'Scandinavian Minimalism',
  'Retro 80s Synthwave',
  'Mid-Century Modern',
  'Alegria',
  'Art Nouveau',
  'Galactic / Space',
  'Dark Mode',
  'Pastel Pop',
  'Industrial Loft',
  'Glassmorphism',
  'Bauhaus',
  'Art Deco',
  'Sci-fi Futurism',
  'Neon Noir',
];

// ---------------------------------------------------------------------------
// Helper: roll a die (1-indexed result)
// ---------------------------------------------------------------------------
const roll = (sides) => Math.floor(Math.random() * sides) + 1;

// ---------------------------------------------------------------------------
// MCP Server bootstrap
// ---------------------------------------------------------------------------
const server = new McpServer({
  name: 'vibe-coding-mcp',
  version: '2.0.0',
});

// ---------------------------------------------------------------------------
// Tool 1: roll_challenge
// ---------------------------------------------------------------------------
server.tool(
  'roll_challenge',
  'Rolls (or maps) the 4 Vibe Coding constraints: theme, dataset, audience, style.',
  {
    manualRolls: z
      .object({
        theme:    z.number().int().min(1).max(6).optional(),
        dataset:  z.number().int().min(1).max(6).optional(),
        audience: z.number().int().min(1).max(20).optional(),
        style:    z.number().int().min(1).max(20).optional(),
      })
      .optional()
      .describe('Optional manual rolls from physical dice. Omit for a digital roll.'),
  },
  async ({ manualRolls }) => {
    const themeIdx    = (manualRolls?.theme    ?? roll(6))  - 1;
    const datasetIdx  = (manualRolls?.dataset  ?? roll(6))  - 1;
    const audienceIdx = (manualRolls?.audience ?? roll(20)) - 1;
    const styleIdx    = (manualRolls?.style    ?? roll(20)) - 1;

    const result = {
      theme:    THEMES[themeIdx],
      dataset:  DATASETS[datasetIdx],
      audience: AUDIENCES[audienceIdx],
      style:    STYLES[styleIdx],
      rolls: {
        theme:    themeIdx + 1,
        dataset:  datasetIdx + 1,
        audience: audienceIdx + 1,
        style:    styleIdx + 1,
      },
      fullPrompt: `A ${THEMES[themeIdx]} built on ${DATASETS[datasetIdx]} data, tailored for ${AUDIENCES[audienceIdx]} — served in full ${STYLES[styleIdx]} style.`,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool 2: start_local_streamlit
// ---------------------------------------------------------------------------
server.tool(
  'start_local_streamlit',
  'Launches `python3 -m streamlit run app.py` in the background and opens the browser.',
  {},
  async () => {
    try {
      // Kill any existing streamlit process first to avoid port conflicts
      try { execSync('pkill -f "streamlit run"', { stdio: 'ignore' }); } catch (_) {}

      // Resolve app.py relative to cwd (where Cortex CLI is invoked from)
      const appPath = path.resolve(process.cwd(), 'app.py');
      if (!existsSync(appPath)) {
        return {
          content: [{ type: 'text', text: '❌ app.py not found in the current working directory. Please write app.py first.' }],
          isError: true,
        };
      }

      const child = spawn('python3', ['-m', 'streamlit', 'run', appPath, '--server.headless', 'true'], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();

      // Give streamlit a moment to bind the port
      await new Promise((r) => setTimeout(r, 2500));

      // Open browser
      await open('http://localhost:8501');

      return {
        content: [
          {
            type: 'text',
            text: [
              '✅ Streamlit is running!',
              '🌐 URL: http://localhost:8501',
              `🆔 Process detached (PID: ${child.pid})`,
              'ℹ️  Streamlit will hot-reload automatically as app.py changes.',
            ].join('\n'),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `❌ Failed to start Streamlit: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ---------------------------------------------------------------------------
// Tool 3: validate_app
// ---------------------------------------------------------------------------
server.tool(
  'validate_app',
  'Runs `python3 -m py_compile app.py` to check for syntax errors.',
  {},
  async () => {
    const appPath = path.resolve(process.cwd(), 'app.py');
    if (!existsSync(appPath)) {
      return {
        content: [{ type: 'text', text: '❌ app.py not found. Cannot validate.' }],
        isError: true,
      };
    }

    try {
      execSync(`python3 -m py_compile "${appPath}"`, { stdio: 'pipe' });
      return {
        content: [
          {
            type: 'text',
            text: '✅ Validation passed! app.py has no syntax errors.',
          },
        ],
      };
    } catch (err) {
      const stderr = err.stderr?.toString() ?? err.message;
      return {
        content: [
          {
            type: 'text',
            text: `❌ Syntax error detected in app.py:\n\n${stderr}\n\nPlease fix the error and re-run validation.`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ---------------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------------
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('🎲 Vibe Coding 2.0 MCP server running on stdio');
