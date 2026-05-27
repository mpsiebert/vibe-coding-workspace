/**
 * snowflake-client.js
 * Connects to Snowflake using RSA key-pair authentication and inserts
 * a row into VIBE_SUBMISSIONS after a successful deployment.
 *
 * Required environment variables (set in .env):
 *   SNOWFLAKE_ACCOUNT      — e.g. xy12345.us-east-1
 *   SNOWFLAKE_USER         — your Snowflake username
 *   SNOWFLAKE_ROLE         — e.g. SYSADMIN
 *   SNOWFLAKE_WAREHOUSE    — e.g. VIBE_WH
 *   SNOWFLAKE_DATABASE     — DATA_BIRDS_DB
 *   SNOWFLAKE_SCHEMA       — PUBLIC
 *   SNOWFLAKE_PRIVATE_KEY_PATH — absolute path to ~/.snowflake/rsa_key.p8
 *   SNOWFLAKE_PRIVATE_KEY_PASSPHRASE — passphrase for the private key (leave blank if unencrypted)
 */

import 'dotenv/config';
import snowflake from 'snowflake-sdk';
import { readFileSync } from 'fs';
import { resolve } from 'path';

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
    role:              process.env.SNOWFLAKE_ROLE      ?? 'SYSADMIN',
    warehouse:         process.env.SNOWFLAKE_WAREHOUSE ?? 'VIBE_WH',
    database:          process.env.SNOWFLAKE_DATABASE  ?? 'DATA_BIRDS_DB',
    schema:            process.env.SNOWFLAKE_SCHEMA    ?? 'PUBLIC',
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
      INSERT INTO DATA_BIRDS_DB.PUBLIC.VIBE_SUBMISSIONS
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
