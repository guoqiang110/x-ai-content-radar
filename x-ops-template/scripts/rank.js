// scripts/rank.js
// Scores today's collected items and writes a short candidate list for content creation.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'data');
const rawDir = path.join(dataDir, 'raw');
const rankedDir = path.join(dataDir, 'ranked');

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function textOf(item) {
  return [item.title, item.text, item.summary, item.description, item.content, item.sourceName, item.category, item.url]
    .filter(Boolean)
    .join(' ');
}

function metricScore(metrics = {}) {
  const likes = Number(metrics.like_count || metrics.likes || 0);
  const reposts = Number(metrics.retweet_count || metrics.reposts || 0);
  const replies = Number(metrics.reply_count || metrics.replies || 0);
  const quotes = Number(metrics.quote_count || metrics.quotes || 0);
  return Math.min(30, likes / 20 + reposts / 10 + replies / 20 + quotes / 10);
}

function keywordScore(text) {
  const rules = [
    [/\b(agent|agents|workflow|mcp|browser use|computer use)\b/i, 12],
    [/\b(cursor|claude code|codex|windsurf|cline|roo code|devin)\b/i, 12],
    [/\b(open source|github|repo|开源|源码)\b/i, 12],
    [/\b(tutorial|guide|how to|step by step|教程|实战|指南)\b/i, 10],
    [/\b(ai tool|tool|工具|效率|自动化)\b/i, 8],
    [/\b(video|image|multimodal|voice|图片|视频|多模态)\b/i, 6],
    [/\b(launch|released|new|刚刚|发布|上线)\b/i, 6],
  ];
  return rules.reduce((sum, [regex, value]) => sum + (regex.test(text) ? value : 0), 0);
}

function sourceScore(item) {
  if (item.platform === 'x') return 20;
  if (item.platform === 'aihot') return 18;
  if (item.source === 'github_trending' || item.platform === 'github') return 16;
  if (item.platform === 'youtube') return 10;
  if (item.platform === 'hackernews') return 8;
  return 4;
}

function hasUsefulLink(text) {
  return /https?:\/\/|github\.com|x\.com|youtube\.com/i.test(text);
}

function normalizeCandidate(item, index) {
  const text = textOf(item);
  const title = item.title || item.text?.slice(0, 80) || item.description?.slice(0, 80) || `candidate-${index + 1}`;
  const score = Math.round(
    sourceScore(item) +
    keywordScore(text) +
    metricScore(item.metrics) +
    (hasUsefulLink(text) ? 8 : 0)
  );

  return {
    rank: 0,
    score,
    source: item.source || 'unknown',
    platform: item.platform || 'unknown',
    title,
    url: item.url || '',
    text: item.text || item.summary || item.description || item.content || '',
    category: item.category || undefined,
    sourceName: item.sourceName || undefined,
    metrics: item.metrics || undefined,
    why: buildWhy(text, item),
    raw: item,
  };
}

function buildWhy(text, item) {
  const reasons = [];
  if (item.platform === 'x') reasons.push('X 实时信号');
  if (item.platform === 'aihot') reasons.push('AI HOT 精选中文信号');
  if (/github\.com|开源|open source/i.test(text)) reasons.push('可能关联开源项目');
  if (/tutorial|guide|教程|实战|指南|how to/i.test(text)) reasons.push('适合做教程型内容');
  if (/agent|cursor|claude code|codex|mcp|自动化/i.test(text)) reasons.push('贴合 AI Agent/编程工具定位');
  if (item.metrics) reasons.push('带互动数据可参考');
  return reasons.join('；') || '与 AI/工具/开发者内容有关';
}

function markdown(candidates, date) {
  const lines = [`# ${date} X/AI 内容候选`, ''];
  for (const item of candidates) {
    lines.push(`## ${item.rank}. ${item.title}`);
    lines.push(`- 分数：${item.score}`);
    lines.push(`- 来源：${item.platform} / ${item.source}`);
    if (item.url) lines.push(`- 链接：${item.url}`);
    lines.push(`- 推荐理由：${item.why}`);
    if (item.text) lines.push(`- 摘要：${String(item.text).replace(/\s+/g, ' ').slice(0, 240)}`);
    lines.push('');
  }
  return `${lines.join('\n').trim()}\n`;
}

function main() {
  const date = process.argv.find((arg) => arg.startsWith('--date='))?.slice(7) || getToday();
  const limit = Number(process.argv.find((arg) => arg.startsWith('--limit='))?.slice(8) || 10);
  const rawFile = path.join(rawDir, `${date}.json`);
  const raw = readJson(rawFile, []);

  if (!raw.length) {
    console.log(`没有原始数据：${rawFile}`);
    process.exitCode = 1;
    return;
  }

  const seen = new Set();
  const candidates = raw
    .map(normalizeCandidate)
    .filter((item) => {
      const key = item.url || `${item.title}-${item.text.slice(0, 80)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return item.score >= 20;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  fs.mkdirSync(rankedDir, { recursive: true });
  const jsonFile = path.join(rankedDir, `${date}.json`);
  const mdFile = path.join(rankedDir, `${date}.md`);
  fs.writeFileSync(jsonFile, `${JSON.stringify(candidates, null, 2)}\n`, 'utf8');
  fs.writeFileSync(mdFile, markdown(candidates, date), 'utf8');

  console.log(`候选已保存: ${mdFile}`);
  console.log(markdown(candidates, date));
}

main();


