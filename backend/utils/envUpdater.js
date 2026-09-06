const fs = require('fs');
const path = require('path');

function updateEnvFile(key, value) {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  let content = fs.readFileSync(envPath, 'utf8');
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${key}="${value}"`);
  } else {
    content += `\n${key}="${value}"`;
  }
  fs.writeFileSync(envPath, content, 'utf8');
}

module.exports = updateEnvFile;
