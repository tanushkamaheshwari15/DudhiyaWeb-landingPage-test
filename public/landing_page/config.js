/**
 * Landing Page Config
 * -------------------
 * All NocoDB connection values are defined here so that
 * the static index.html can read them without a build step.
 *
 * To change the NocoDB server or table, edit this file.
 * The matching values are also kept in the project's .env
 * file (REACT_APP_NOCODB_*) for the React app side.
 */
window.LANDING_CONFIG = {
  // Self-hosted NocoDB base URL (no trailing slash)
  NOCODB_BASE_URL: 'http://management-nocodb-65ef8d-31-97-60-222.sslip.io',

  // Table and Base IDs for the Contact / Newsletter table
  NOCODB_BASE_ID: 'pnfzdrvvw8g1oxn',
  NOCODB_TABLE_ID: 'mwx32ac1ed0ld3r',

  // API token (xc-token)
  NOCODB_TOKEN: 'nc_pat_KKUiaHMxeGbG4wbExS8xk0FRo06UEsgAFImtTzPe',
};
