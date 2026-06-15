const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { dataDir, today, writeJson, latestDir } = require('./shared');

function exists(file) { return fs.existsSync(file); }
function countFiles(dir, ext) { if (!fs.existsSync(dir)) return 0; return fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(ext)).length; }
function videoDurationSeconds(file) {
  if (!fs.existsSync(file)) return 0;
  const result = spawnSync('ffmpeg', ['-hide_banner', '-i', file], { encoding: 'utf8' });
  const text = `${result.stdout || ''}\n${result.stderr || ''}`;
  const match = text.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}
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
  const videoPath = path.join(packDir, 'materials', '02-douyin-video', 'douyin-auto-v1.mp4');
  const duration = videoDurationSeconds(videoPath);
  checks.push(['MP4 video generated', exists(videoPath)]);
  checks.push([`MP4 duration reasonable (${duration.toFixed(1)}s)`, duration >= 15 && duration <= 90]);
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


