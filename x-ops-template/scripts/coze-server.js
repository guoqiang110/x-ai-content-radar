const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.join(__dirname, '..');
const port = Number(process.env.PORT || 5000);
const dataDir = process.env.X_OPS_DATA_DIR || '/tmp/x-ops-data';
const runsDir = path.join(dataDir, 'agent-runs');

let currentRun = null;

function send(res, status, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function latestRun() {
  if (!fs.existsSync(runsDir)) return null;
  const file = fs.readdirSync(runsDir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .at(-1);
  if (!file) return null;
  const fullPath = path.join(runsDir, file);
  return {
    file: fullPath,
    data: JSON.parse(fs.readFileSync(fullPath, 'utf8')),
  };
}

function runAgent() {
  if (currentRun?.status === 'running') return currentRun;

  fs.mkdirSync(dataDir, { recursive: true });
  currentRun = {
    status: 'running',
    startedAt: new Date().toISOString(),
    finishedAt: '',
    exitCode: null,
    stdout: '',
    stderr: '',
  };

  const child = spawn('node', ['scripts/agent.js'], {
    cwd: root,
    env: { ...process.env, X_OPS_DATA_DIR: dataDir },
    shell: false,
  });

  child.stdout.on('data', (chunk) => { currentRun.stdout += chunk.toString(); });
  child.stderr.on('data', (chunk) => { currentRun.stderr += chunk.toString(); });
  child.on('close', (code) => {
    currentRun.status = code === 0 ? 'ok' : 'failed';
    currentRun.exitCode = code;
    currentRun.finishedAt = new Date().toISOString();
  });

  return currentRun;
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    send(res, 200, { ok: true, service: 'x-ai-content-radar', dataDir });
    return;
  }

  if (req.method === 'POST' && req.url === '/run') {
    send(res, 202, runAgent());
    return;
  }

  if (req.method === 'GET' && req.url === '/status') {
    send(res, 200, { currentRun, latest: latestRun() });
    return;
  }

  if (req.method === 'GET' && req.url === '/latest') {
    send(res, 200, latestRun() || { latest: null });
    return;
  }

  send(res, 404, { error: 'not found' });
});

server.listen(port, '0.0.0.0', () => {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`x-ai-content-radar coze server listening on ${port}`);
  console.log(`dataDir=${dataDir}`);
});
