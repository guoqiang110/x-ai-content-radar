// scripts/generate-pack.js
// Generates a reviewable Xiaohongshu/Douyin content package from a ranked item or manual topic.

const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const root = path.join(__dirname, '..');
const promptsDir = path.join(root, 'prompts');
const dataDir = path.join(root, 'data');
const packsDir = path.join(dataDir, 'content-packs');

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function slugify(text) {
  return String(text || 'untitled')
    .toLowerCase()
    .replace(/[^\w一-龥]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'untitled';
}

function parseArgs(argv) {
  const args = {};
  argv.forEach((arg) => {
    const match = arg.match(/^--(.+?)=(.*)$/);
    if (match) args[match[1]] = match[2];
  });
  return args;
}

function assertEnv() {
  const missing = ['API_BASE_URL', 'API_KEY'].filter((name) => !process.env[name]);
  if (missing.length > 0) throw new Error(`缺少环境变量：${missing.join(', ')}。请先配置 .env。`);
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function pickRanked(args) {
  const date = args.date || getToday();
  const ranked = readJson(path.join(dataDir, 'ranked', `${date}.json`), []);
  if (!ranked.length) return null;
  const rank = Number(args.rank || 1);
  return ranked.find((item) => item.rank === rank) || ranked[0];
}

async function fetchSourceText(url) {
  if (!url) return '';
  try {
    const resp = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000,
      responseType: 'text',
    });
    return String(resp.data)
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000);
  } catch {
    return '';
  }
}

function buildUserMessage(topic, sourceText) {
  const lines = [
    `今天日期：${getToday()}`,
    '',
    '请基于下面这个 X/AI 热点，生成可人工审核后发布的自媒体素材包。',
    '',
    `标题：${topic.title}`,
  ];
  if (topic.url) lines.push(`链接：${topic.url}`);
  if (topic.platform) lines.push(`来源：${topic.platform} / ${topic.source || ''}`);
  if (topic.why) lines.push(`推荐理由：${topic.why}`);
  if (topic.text) lines.push(`原始文本：${topic.text}`);
  if (sourceText) lines.push('', `补充抓取内容：${sourceText}`);
  return lines.join('\n');
}

function splitSections(content) {
  const sections = {
    full: content,
    xiaohongshu: extract(content, '小红书'),
    douyin: extract(content, '抖音'),
    carousel: extract(content, '轮播'),
    imagePrompts: extract(content, '图片'),
    risk: extract(content, '审核'),
  };
  return sections;
}

function extract(content, keyword) {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((line) => line.includes(keyword));
  if (start === -1) return '';
  const heading = lines[start].match(/^(#{1,6})\s+/);
  const level = heading ? heading[1].length : 2;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    const match = lines[i].match(/^(#{1,6})\s+/);
    if (match && match[1].length <= level) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join('\n').trim();
}

async function main() {
  assertEnv();
  const args = parseArgs(process.argv.slice(2));
  const rankedTopic = pickRanked(args);
  const topic = {
    ...(rankedTopic || {}),
    title: args.title || rankedTopic?.title || '未命名热点',
    url: args.url || rankedTopic?.url || '',
    text: args.text || rankedTopic?.text || '',
  };

  const prompt = fs.readFileSync(path.join(promptsDir, 'content-pack.md'), 'utf8');
  const sourceText = await fetchSourceText(topic.url);
  const userMessage = buildUserMessage(topic, sourceText);

  console.log(`生成素材包：${topic.title}`);
  const resp = await axios.post(
    `${process.env.API_BASE_URL.replace(/\/$/, '')}/chat/completions`,
    {
      model: process.env.MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.65,
      max_tokens: 5000,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 90000,
    }
  );

  const content = resp.data.choices[0].message.content;
  const dir = path.join(packsDir, `${getToday()}-${slugify(topic.title)}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'source.json'), `${JSON.stringify(topic, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(dir, 'content-pack.md'), `${content.trim()}\n`, 'utf8');

  const sections = splitSections(content);
  for (const [name, text] of Object.entries(sections)) {
    if (name === 'full' || !text) continue;
    fs.writeFileSync(path.join(dir, `${name}.md`), `${text}\n`, 'utf8');
  }

  console.log(`素材包已保存: ${dir}`);
  console.log(content);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});

