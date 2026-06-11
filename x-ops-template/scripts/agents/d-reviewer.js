const fs = require('fs');
const path = require('path');
const { dataDir, today, writeJson, latestDir } = require('./shared');

function exists(file) { return fs.existsSync(file); }
function countFiles(dir, ext) { if (!fs.existsSync(dir)) return 0; return fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(ext)).length; }
function main() {
  const date = today();
  const packDir = process.argv.find((arg) => arg.startsWith('--pack='))?.slice(7) || latestDir(path.join(dataDir, 'content-packs'));
  if (!packDir) throw new Error('No content pack found.');
  const checks = [];
  const full = exists(path.join(packDir, 'content-pack.md')) ? fs.readFileSync(path.join(packDir, 'content-pack.md'), 'utf8') : '';
  checks.push(['content-pack exists', !!full]);
  checks.push(['Qianxi API mention', /qianxi-api\.com|乾羲 API/.test(full)]);
  checks.push(['source json exists', exists(path.join(packDir, 'source.json'))]);
  checks.push(['xiaohongshu exists', exists(path.join(packDir, 'xiaohongshu.md'))]);
  checks.push(['douyin exists', exists(path.join(packDir, 'douyin.md'))]);
  checks.push(['PNG cards generated', countFiles(path.join(packDir, 'materials', '01-xiaohongshu-images'), '.png') >= 7]);
  checks.push(['MP4 video generated', countFiles(path.join(packDir, 'materials', '02-douyin-video'), '.mp4') >= 1]);
  const ok = checks.every(([, pass]) => pass);
  const report = ['# Review Report', '', `Content pack: ${packDir}`, '', ...checks.map(([name, pass]) => `- [${pass ? 'x' : ' '}] ${name}`), '', ok ? 'Status: PASS' : 'Status: NEEDS FIX', ''].join('\n');
  const reportPath = path.join(packDir, 'review-report.md');
  fs.writeFileSync(reportPath, report, 'utf8');
  const manifest = { agent: 'D-reviewer', date, status: ok ? 'ok' : 'failed', contentPackDir: packDir, reportPath, checks: checks.map(([name, pass]) => ({ name, pass })) };
  writeJson(path.join(dataDir, 'agent-runs', `${date}-d-reviewer.json`), manifest);
  console.log(`D Reviewer: ${manifest.status}`);
  console.log(`Report: ${reportPath}`);
  if (!ok) process.exitCode = 1;
}
main();


