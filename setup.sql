-- =============================================================================
-- Snowflake Vibe Coding 2.0 — Workshop Object Setup
-- Run this once after VIBE_WH / VIBE_DB / VIBE_ROLE / VIBE_USER have been
-- provisioned by an ACCOUNTADMIN. Provisioning script lives at
-- ../snowflake-vibecoding/setup.sql.
--
-- Run as: snow sql -c vibecoding -f setup.sql
--
-- One-time admin prerequisite (predecessor's setup.sql grants STREAMLIT/STAGE
-- creation but not CREATE TABLE). If this script errors with
-- "Insufficient privileges to operate on schema 'APPS'", run as ACCOUNTADMIN:
--
--   GRANT CREATE TABLE ON SCHEMA VIBE_DB.APPS TO ROLE VIBE_ROLE;
--
-- then re-run this script.
-- =============================================================================

USE DATABASE VIBE_DB;
USE SCHEMA APPS;
USE WAREHOUSE VIBE_WH;

-- 1. Submissions tracking table
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

-- 2. Streamlit app stage (required by snow streamlit deploy)
-- -----------------------------------------------------------------------------
CREATE STAGE IF NOT EXISTS VIBE_APPS
  DIRECTORY = ( ENABLE = TRUE )
  COMMENT = 'Stage for uploaded Streamlit app files';

-- 3. Grant write access to VIBE_ROLE
-- -----------------------------------------------------------------------------
GRANT INSERT, SELECT ON TABLE VIBE_SUBMISSIONS TO ROLE VIBE_ROLE;

-- Done!
SELECT 'Vibe Coding 2.0 setup complete ✅' AS STATUS;
