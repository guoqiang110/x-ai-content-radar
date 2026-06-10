// scripts/collect-aihot.js
// Pulls selected AI HOT items into data/raw so x-ops has a stable Chinese AI news baseline.

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const root = path.join(__dirname, '..');
const rawDir = path.join(root, 'data', 'raw');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const BASE_URL = 'https://aihot.virxact.com';

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function parseArgs(argv) {
  const args = {};
  argv.forEach((arg) => {
    const match = arg.match(/^--(.+?)=(.*)$/);
    if (match) args[match[1]] = match[2];
  });
  return args;
}

function sinceHours(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function normalizeItem(item) {
  return {
    source: 'aihot_selected',
    platform: 'aihot',
    id: item.id,
    title: item.title,
    titleEn: item.title_en || undefined,
    text: item.summary || '',
    summary: item.summary || '',
    url: item.url,
    sourceName: item.source,
    category: item.category || undefined,
    publishedAt: item.publishedAt || undefined,
  };
}

async function fetchItems({ mode, category, q, take, hours }) {
  const params = {
    mode,
    take,
    since: sinceHours(hours),
  };
  if (category) params.category = category;
  if (q) params.q = q;

  const resp = await axios.get(`${BASE_URL}/api/public/items`, {
    params,
    headers: { 'User-Agent': UA },
    timeout: 20000,
  });

  return (resp.data.items || []).map(normalizeItem);
}

function mergeToday(items, date) {
  const file = path.join(rawDir, `${date}.json`);
  let existing = [];
  if (fs.existsSync(file)) existing = JSON.parse(fs.readFileSync(file, 'utf8'));

  const seen = new Set(existing.map((item) => item.url || item.id || JSON.stringify(item).slice(0, 120)));
  const merged = [...existing];
  for (const item of items) {
    const key = item.url || item.id || item.title;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  fs.mkdirSync(rawDir, { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  return { file, added: merged.length - existing.length, total: merged.length };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const date = args.date || getToday();
  const mode = args.mode || 'selected';
  const take = Number(args.take || 50);
  const hours = Number(args.hours || 24);
  const category = args.category || '';
  const q = args.q || '';

  const items = await fetchItems({ mode, category, q, take, hours });
  const result = mergeToday(items, date);
  console.log(`AI HOT 已采集：新增 ${result.added} 条，总计 ${result.total} 条`);
  console.log(`保存到：${result.file}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
