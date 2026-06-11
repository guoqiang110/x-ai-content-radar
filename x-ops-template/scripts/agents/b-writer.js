const path = require('path');
const { dataDir, today, writeJson, run, latestDir } = require('./shared');

function main() {
  const date = today();
  const before = latestDir(path.join(dataDir, 'content-packs'));
  const step = { name: 'generate-pack', ...run('node', ['scripts/generate-pack.js', '--rank=1'], { timeout: 240000 }) };
  const after = latestDir(path.join(dataDir, 'content-packs')) || before;
  const manifest = { agent: 'B-writer', date, status: step.status, steps: [step], contentPackDir: after };
  writeJson(path.join(dataDir, 'agent-runs', `${date}-b-writer.json`), manifest);
  console.log(`B Writer: ${manifest.status}`);
  console.log(`Content pack: ${after}`);
  if (manifest.status !== 'ok') process.exitCode = 1;
}
main();
