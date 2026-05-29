/**
 * snowflake-client.js
 * Connects to Snowflake using RSA key-pair authentication and inserts
 * a row into VIBE_SUBMISSIONS after a successful deployment.
 *
 * Required environment variables (set in .env):
 *   SNOWFLAKE_ACCOUNT      — e.g. xy12345.us-east-1
 *   SNOWFLAKE_USER         — VIBE_USER
 *   SNOWFLAKE_ROLE         — VIBE_ROLE
 *   SNOWFLAKE_WAREHOUSE    — VIBE_WH
 *   SNOWFLAKE_DATABASE     — VIBE_DB
 *   SNOWFLAKE_SCHEMA       — APPS
 *   SNOWFLAKE_PRIVATE_KEY_PATH — absolute path to ./rsa_key.p8 in the repo
 *   SNOWFLAKE_PRIVATE_KEY_PASSPHRASE — passphrase for the private key (leave blank if unencrypted)
 */

import { config as loadEnv } from 'dotenv';
import snowflake from 'snowflake-sdk';
import { readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = process.env.PROJECT_DIR
  ? resolve(process.env.PROJECT_DIR)
  : resolve(__dirname, '..', '..');
loadEnv({ path: join(PROJECT_DIR, '.env'), quiet: true });

/**
 * Creates and returns an authenticated Snowflake connection.
 * Uses RSA key-pair authentication.
 * @returns {Promise<snowflake.Connection>}
 */
async function createConnection() {
  const privateKeyPath = resolve(
    process.env.SNOWFLAKE_PRIVATE_KEY_PATH ?? '~/.snowflake/rsa_key.p8'
  );

  let privateKeyFile;
  try {
    privateKeyFile = readFileSync(privateKeyPath, 'utf-8');
  } catch (err) {
    throw new Error(
      `Cannot read Snowflake private key at "${privateKeyPath}": ${err.message}\n` +
      'Set SNOWFLAKE_PRIVATE_KEY_PATH in your .env file.'
    );
  }

  const connectionOptions = {
    account:           process.env.SNOWFLAKE_ACCOUNT,
    username:          process.env.SNOWFLAKE_USER,
    authenticator:     'SNOWFLAKE_JWT',
    privateKey:        privateKeyFile,
    privateKeyPass:    process.env.SNOWFLAKE_PRIVATE_KEY_PASSPHRASE ?? '',
    role:              process.env.SNOWFLAKE_ROLE      ?? 'VIBE_ROLE',
    warehouse:         process.env.SNOWFLAKE_WAREHOUSE ?? 'VIBE_WH',
    database:          process.env.SNOWFLAKE_DATABASE  ?? 'VIBE_DB',
    schema:            process.env.SNOWFLAKE_SCHEMA    ?? 'APPS',
    application:       'VibeCoding2_MCP',
  };

  return new Promise((resolve, reject) => {
    const connection = snowflake.createConnection(connectionOptions);
    connection.connect((err, conn) => {
      if (err) {
        reject(new Error(`Snowflake connection failed: ${err.message}`));
      } else {
        resolve(conn);
      }
    });
  });
}

/**
 * Executes a SQL statement on an open connection.
 * @param {snowflake.Connection} connection
 * @param {string} sql
 * @param {Array} binds — positional bind variables
 * @returns {Promise<Array>}
 */
function executeStatement(connection, sql, binds = []) {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText: sql,
      binds,
      complete: (err, _stmt, rows) => {
        if (err) reject(new Error(`SQL error: ${err.message}\nSQL: ${sql}`));
        else resolve(rows ?? []);
      },
    });
  });
}

/**
 * Destroys a Snowflake connection gracefully.
 * @param {snowflake.Connection} connection
 */
function destroyConnection(connection) {
  return new Promise((resolve) => {
    connection.destroy((err) => {
      if (err) console.error(`Warning: error closing Snowflake connection: ${err.message}`);
      resolve();
    });
  });
}

/**
 * Logs a Vibe Coding submission to the VIBE_SUBMISSIONS table.
 *
 * @param {object} params
 * @param {string} params.displayName — Full attendee name
 * @param {string} params.theme       — Theme constraint
 * @param {string} params.dataset     — Dataset constraint
 * @param {string} params.audience    — Audience constraint
 * @param {string} params.style       — Style constraint
 * @param {string} params.appUrl      — Live Snowflake URL
 * @param {string} params.appCode     — Final app.py source code
 */
export async function logSubmission({ displayName, theme, dataset, audience, style, appUrl, appCode }) {
  let connection;
  try {
    connection = await createConnection();

    const sql = `
      INSERT INTO VIBE_DB.APPS.VIBE_SUBMISSIONS
        (ATTENDEE_NAME, THEME, DATASET, AUDIENCE, STYLE, APP_URL, APP_CODE)
      VALUES
        (?, ?, ?, ?, ?, ?, ?)
    `;

    await executeStatement(connection, sql, [
      displayName,
      theme,
      dataset,
      audience,
      style,
      appUrl,
      appCode.slice(0, 32000), // Guard against column max length
    ]);

    console.error(`✅ Submission logged for "${displayName}" → ${appUrl}`);
  } finally {
    if (connection) await destroyConnection(connection);
  }
}
