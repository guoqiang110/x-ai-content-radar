// scripts/agent.js
// Orchestrates A/B/C/D agents for the full X AI Content Radar workflow.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const dataDir = process.env.X_OPS_DATA_DIR || path.join(root, 'data');
const runsDir = path.join(dataDir, 'agent-runs');

function today() { return new Date().toISOString().slice(0, 10); }
function nowIso() { return new Date().toISOString(); }

function runAgent(name, args = []) {
  const startedAt = nowIso();
  const result = spawnSync('node', [`scripts/agents/${name}.js`, ...args], {
    cwd: root,
    shell: false,
    encoding: 'utf8',
    timeout: 300000,
  });
  return { name, command: `node scripts/agents/${name}.js ${args.join(' ')}`.trim(), startedAt, finishedAt: nowIso(), status: result.status === 0 ? 'ok' : 'failed', exitCode: result.status, stdout: result.stdout || '', stderr: result.stderr || '' };
}

function extractLastLine(stdout, prefix) {
  return String(stdout || '').split(/\r?\n/).find((line) => line.startsWith(prefix))?.slice(prefix.length).trim() || '';
}

function markdownReport(run) {
  const lines = [
    `# X AI Content Radar Agent Run - ${run.date}`,
    '',
    `- Started: ${run.startedAt}`,
    `- Finished: ${run.finishedAt}`,
    `- Status: ${run.status}`,
    `- Content pack: ${run.contentPackDir || 'not generated'}`,
    `- Materials: ${run.materialsDir || 'not generated'}`,
    `- Review report: ${run.reviewReport || 'not generated'}`,
    '',
    '## Agents',
    '',
  ];
  for (const step of run.steps) {
    lines.push(`### ${step.name}`);
    lines.push(`- Status: ${step.status}`);
    lines.push(`- Command: \`${step.command}\``);
    if (step.stdout.trim()) lines.push('```text\n' + step.stdout.trim().slice(0, 1200) + '\n```');
    if (step.stderr.trim()) lines.push('stderr:\n```text\n' + step.stderr.trim().slice(0, 1200) + '\n```');
    lines.push('');
  }
  return `${lines.join('\n').trim()}\n`;
}

function main() {
  const args = new Set(process.argv.slice(2));
  const date = today();
  const run = { date, startedAt: nowIso(), finishedAt: '', status: 'ok', steps: [], contentPackDir: '', materialsDir: '', reviewReport: '' };
  fs.mkdirSync(runsDir, { recursive: true });

  run.steps.push(runAgent('a-curator', args.has('--full') ? ['--full'] : []));
  if (run.steps.at(-1).status === 'ok') run.steps.push(runAgent('b-writer'));
  if (run.steps.at(-1).status === 'ok') run.steps.push(runAgent('c-media'));
  if (run.steps.at(-1).status === 'ok') run.steps.push(runAgent('d-reviewer'));

  for (const step of run.steps) {
    const pack = extractLastLine(step.stdout, 'Content pack:');
    const materials = extractLastLine(step.stdout, 'Materials:');
    const report = extractLastLine(step.stdout, 'Report:');
    if (pack) run.contentPackDir = pack;
    if (materials) run.materialsDir = materials;
    if (report && step.name === 'd-reviewer') run.reviewReport = report;
  }

  run.finishedAt = nowIso();
  run.status = run.steps.every((step) => step.status === 'ok') ? 'ok' : 'failed';
  fs.writeFileSync(path.join(runsDir, `${date}.json`), `${JSON.stringify(run, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(runsDir, `${date}.md`), markdownReport(run), 'utf8');

  console.log(`Agent collection status: ${run.status}`);
  console.log(`Report: ${path.join(runsDir, `${date}.md`)}`);
  if (run.contentPackDir) console.log(`Content pack: ${run.contentPackDir}`);
  if (run.materialsDir) console.log(`Materials: ${run.materialsDir}`);
  if (run.reviewReport) console.log(`Review: ${run.reviewReport}`);
  if (run.status !== 'ok') process.exitCode = 1;
}

main();
