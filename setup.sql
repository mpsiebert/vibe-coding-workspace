-- =============================================================================
-- Snowflake Vibe Coding 2.0 — Facilitator Setup Script
-- Run this once before the Summit booth opens.
-- Connection: snow sql -c databirds -f setup.sql
-- =============================================================================

-- 1. Database & Schema
-- -----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS DATA_BIRDS_DB
  DATA_RETENTION_TIME_IN_DAYS = 1
  COMMENT = 'Snowflake Summit Vibe Coding 2.0 booth database';

USE DATABASE DATA_BIRDS_DB;

CREATE SCHEMA IF NOT EXISTS PUBLIC
  COMMENT = 'Default public schema for Vibe Coding submissions';

USE SCHEMA PUBLIC;

-- 2. Submissions Tracking Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS VIBE_SUBMISSIONS (
  ID              NUMBER AUTOINCREMENT PRIMARY KEY,
  ATTENDEE_NAME   VARCHAR(100)    NOT NULL COMMENT 'First and last name of the attendee',
  THEME           VARCHAR(100)    NOT NULL COMMENT 'App type rolled (e.g. Sentiment Analyzer)',
  DATASET         VARCHAR(100)    NOT NULL COMMENT 'Dataset rolled (e.g. Stock Market / Crypto)',
  AUDIENCE        VARCHAR(100)    NOT NULL COMMENT 'Target audience rolled (e.g. Quantitative Analysts)',
  STYLE           VARCHAR(100)    NOT NULL COMMENT 'Visual style rolled (e.g. Retro 80s Synthwave)',
  APP_URL         VARCHAR(500)             COMMENT 'Live Snowflake Streamlit URL after deploy',
  APP_CODE        VARCHAR(32000)           COMMENT 'Final app.py source code at time of deploy',
  SUBMITTED_AT    TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT 'UTC timestamp of submission'
);

-- 3. Streamlit App Stage (required by snow streamlit deploy)
-- -----------------------------------------------------------------------------
CREATE STAGE IF NOT EXISTS VIBE_APPS
  DIRECTORY = ( ENABLE = TRUE )
  COMMENT = 'Stage for uploaded Streamlit app files';

-- 4. Warehouse
-- -----------------------------------------------------------------------------
-- Using DATA_BIRDS_WH which already exists and is configured in connections.toml.
-- No warehouse creation needed.

-- 5. Note on privileges
-- -----------------------------------------------------------------------------
-- DATA_BIRDS_ROLE privileges were granted manually via a higher-privileged
-- connection before running this script. SYSADMIN has account-level access
-- by default and does not need explicit grants here.

-- Done!
SELECT 'Vibe Coding 2.0 setup complete ✅' AS STATUS;
