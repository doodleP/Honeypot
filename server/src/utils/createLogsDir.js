const fs = require('fs');
const path = require('path');

// Function to ensure logs directory exists and return its path
function createLogsDir() {
  const logsDir = path.join(__dirname, '../../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  return logsDir;
}

module.exports = createLogsDir;
