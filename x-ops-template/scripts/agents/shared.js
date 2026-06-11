const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..', '..');
const dataDir = path.join(root, 'data');

function today() { return new Date().toISOString().slice(0, 10); }
function readJson(filePath, fallback) { if (!fs.existsSync(filePath)) return fallback; return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
function writeJson(filePath, data) { fs.mkdirSync(path.dirname(filePath), { recursive: true }); fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8'); }
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, shell: false, encoding: 'utf8', timeout: options.timeout || 180000 });
  return { command: [command, ...args].join(' '), status: result.status === 0 ? 'ok' : 'failed', exitCode: result.status, stdout: result.stdout || '', stderr: result.stderr || '' };
}
function latestDir(parent) {
  if (!fs.existsSync(parent)) return '';
  return fs.readdirSync(parent, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(parent, entry.name))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0] || '';
}
module.exports = { root, dataDir, today, readJson, writeJson, run, latestDir };
