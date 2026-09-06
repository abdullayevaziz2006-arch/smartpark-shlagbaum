const fs = require('fs');
const path = require('path');

function updateEnvFile(key, value) {
  // Directly writing to .env at runtime is unsafe, especially in production environments (like Docker/Render).
  // This function is deprecated and now only updates the process.env variable.
  // The activation workflow should rely on database variables rather than physical file modification.
  process.env[key] = value;
  console.log(`[ENV] Set ${key} for the current session (deprecated file write behavior prevented).`);
}

module.exports = updateEnvFile;
