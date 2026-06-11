const path = require('path');
const { dataDir, today, writeJson, run } = require('./shared');

function main() {
  const date = today();
  const steps = [];
  steps.push({ name: 'collect-aihot', ...run('node', ['scripts/collect-aihot.js']) });
  if (process.argv.includes('--full')) steps.push({ name: 'collect-all', ...run('node', ['scripts/collect.js']) });
  steps.push({ name: 'rank', ...run('node', ['scripts/rank.js']) });
  const manifest = { agent: 'A-curator', date, status: steps.every((s) => s.status === 'ok') ? 'ok' : 'failed', steps, rankedFile: path.join(dataDir, 'ranked', `${date}.md`) };
  writeJson(path.join(dataDir, 'agent-runs', `${date}-a-curator.json`), manifest);
  console.log(`A Curator: ${manifest.status}`);
  console.log(`Ranked: ${manifest.rankedFile}`);
  if (manifest.status !== 'ok') process.exitCode = 1;
}
main();
