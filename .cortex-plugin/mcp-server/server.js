/**
 * Vibe Coding 2.0 — MCP Server
 * Provides 4 tools to the Cortex AI agent:
 *   1. roll_challenge        — randomise (or map) the 4 challenge constraints
 *   2. start_local_streamlit — launch `streamlit run app.py` in the background
 *   3. validate_app          — python3 -m py_compile app.py
 *   4. deploy_to_snowflake   — snow streamlit deploy + QR code + DB log
 */

import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { spawn, execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import open from 'open';
import qrcode from 'qrcode-terminal';
import { logSubmission } from './snowflake-client.js';

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
  'Desert Solitude',
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
        style:    z.number().int().min(1).max(21).optional(),
      })
      .optional()
      .describe('Optional manual rolls from physical dice. Omit for a digital roll.'),
  },
  async ({ manualRolls }) => {
    const themeIdx    = (manualRolls?.theme    ?? roll(6))  - 1;
    const datasetIdx  = (manualRolls?.dataset  ?? roll(6))  - 1;
    const audienceIdx = (manualRolls?.audience ?? roll(20)) - 1;
    const styleIdx    = (manualRolls?.style    ?? roll(21)) - 1;

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
  'Runs `python3 -m py_compile app.py` to check for syntax errors before deploying.',
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
            text: '✅ Validation passed! app.py has no syntax errors. Ready to deploy.',
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
// Tool 4: deploy_to_snowflake
// ---------------------------------------------------------------------------
server.tool(
  'deploy_to_snowflake',
  'Deploys app.py to Snowflake Streamlit via the Snow CLI, prints a QR code, and logs the submission.',
  {
    attendeeName: z
      .string()
      .describe('Attendee name formatted as first_last (e.g. grace_hopper). Used as the Streamlit app name.'),
    displayName: z
      .string()
      .describe('Full display name of the attendee for logging (e.g. "Grace Hopper").'),
    theme:    z.string().describe('Theme constraint (e.g. Sentiment Analyzer)'),
    dataset:  z.string().describe('Dataset constraint (e.g. Stock Market / Crypto Prices)'),
    audience: z.string().describe('Audience constraint (e.g. Quantitative Analysts)'),
    style:    z.string().describe('Style constraint (e.g. Retro 80s Synthwave)'),
  },
  async ({ attendeeName, displayName, theme, dataset, audience, style }) => {
    const appPath = path.resolve(process.cwd(), 'app.py');

    // Read app code for logging
    let appCode = '';
    try {
      appCode = readFileSync(appPath, 'utf-8');
    } catch (_) {
      appCode = '(could not read app.py)';
    }

    // Sanitise app name: lowercase, replace spaces/special chars with underscore
    const safeName = attendeeName
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 50);

    // Dynamically write/overwrite snowflake.yml to ensure the correct warehouse and entity definition exist
    const ymlPath = path.resolve(process.cwd(), 'snowflake.yml');
    const ymlContent = [
      'definition_version: "2"',
      'entities:',
      `  ${safeName}:`,
      '    type: streamlit',
      '    identifier:',
      `      name: ${safeName}`,
      `    title: "Vibe Coding — ${displayName.replace(/"/g, '\\"')}"`,
      '    query_warehouse: VIBE_WH',
      '    main_file: app.py',
      '    artifacts:',
      '      - app.py',
      '',
    ].join('\n');

    try {
      writeFileSync(ymlPath, ymlContent, 'utf-8');
    } catch (ymlErr) {
      console.error(`Warning: could not write snowflake.yml: ${ymlErr.message}`);
    }

    // Deploy via Snow CLI
    let deployOutput = '';
    let appUrl = '';

    try {
      deployOutput = execSync(
        `snow streamlit deploy "${safeName}" --connection vibecoding --replace`,
        { cwd: process.cwd(), stdio: 'pipe', encoding: 'utf-8' }
      );

      // Extract URL from output (Snow CLI prints something like: App available at https://...)
      const urlMatch = deployOutput.match(/https?:\/\/[^\s]+/);
      appUrl = urlMatch ? urlMatch[0] : `https://app.snowflake.com/streamlit/${safeName}`;
    } catch (err) {
      const stderr = err.stderr?.toString() ?? err.message;
      return {
        content: [
          {
            type: 'text',
            text: `❌ Deployment failed:\n\n${stderr}\n\nFull output:\n${err.stdout?.toString() ?? ''}`,
          },
        ],
        isError: true,
      };
    }

    // Print QR code to terminal (stdout of the MCP process, visible in Cortex CLI terminal)
    console.error('\n📱 Scan to open your live app:\n');
    await new Promise((resolve) => {
      qrcode.generate(appUrl, { small: true }, (qr) => {
        console.error(qr);
        resolve();
      });
    });

    // Log to Snowflake VIBE_SUBMISSIONS table (best-effort — don't fail deploy if logging fails)
    try {
      await logSubmission({ displayName, theme, dataset, audience, style, appUrl, appCode });
    } catch (logErr) {
      console.error(`⚠️  Could not log to VIBE_SUBMISSIONS: ${logErr.message}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: [
            '🎉 DEPLOYED TO SNOWFLAKE! 🎉',
            '',
            `👤 Attendee:   ${displayName}`,
            `🌐 Live URL:   ${appUrl}`,
            `📱 QR code printed to terminal — scan to open on your phone!`,
            '',
            '🚀 You just Vibe Coded your way to production in under 5 minutes.',
            '📸 Snap a photo of the QR code and share with #VibeCode2025 #SnowflakeSummit',
          ].join('\n'),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------------
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('🎲 Vibe Coding 2.0 MCP server running on stdio');
