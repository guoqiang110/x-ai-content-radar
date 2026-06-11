const fs = require('fs');
const path = require('path');
const { dataDir, today, writeJson, run, latestDir } = require('./shared');

function escapeXml(text) {
  return String(text || '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[ch]));
}

function wrap(text, max = 16) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  const chunks = [];
  let buf = '';
  for (const ch of s) {
    const wide = /[\u4e00-\u9fff]/.test(ch) ? 1 : 0.55;
    const len = [...buf].reduce((sum, c) => sum + (/[\u4e00-\u9fff]/.test(c) ? 1 : 0.55), 0);
    if (len + wide > max && buf) { chunks.push(buf); buf = ch; } else { buf += ch; }
  }
  if (buf) chunks.push(buf);
  return chunks.slice(0, 4);
}

function parseCarousel(text) {
  const sections = [...text.matchAll(/\*\*第\s*(\d+)\s*页[^\n]*?\*\*([\s\S]*?)(?=\n\*\*第\s*\d+\s*页|\n---|$)/g)];
  if (sections.length) {
    return sections.map((m) => {
      const body = m[2];
      const title = (body.match(/-\s*(?:\*\*)?大标题：(?:\*\*)?\s*(.+)/) || [])[1] || `AI Hot Page ${m[1]}`;
      const bulletBlock = (body.match(/-\s*(?:\*\*)?要点：(?:\*\*)?\s*([\s\S]*?)(?=\n-\s*(?:\*\*)?画面建议：|$)/) || [])[1] || '';
      const listBullets = [...bulletBlock.matchAll(/-\s+(.+)/g)].map((x) => x[1]);
      const inlineBullets = bulletBlock.split(/\s*\/\s*|[；;]\s*/).filter(Boolean);
      return {
        page: Number(m[1]),
        title: title.replace(/[*#]/g, '').trim(),
        bullets: (listBullets.length ? listBullets : inlineBullets)
          .map((x) => x.replace(/\*\*/g, '').trim())
          .filter(Boolean)
          .slice(0, 3),
      };
    });
  }
  return [
    { page: 1, title: 'AI 热点内容生产线', bullets: ['热点捕捉', '智能选题', '素材生成'] },
    { page: 2, title: '从信号到发布', bullets: ['AI HOT / X / GitHub', '小红书 / 抖音 / 知识星球', '人工审核再发布'] },
  ];
}

function svgCard(card, total) {
  const titleLines = wrap(card.title, 14);
  const bullets = card.bullets || [];
  const titleSvg = titleLines.map((line, i) => `<text x="72" y="${210 + i * 70}" class="title">${escapeXml(line)}</text>`).join('\n');
  const bulletSvg = bullets.map((line, i) => `<g transform="translate(78 ${520 + i * 110})"><circle cx="0" cy="-12" r="12" fill="#22c55e"/><text x="34" y="0" class="bullet">${escapeXml(line)}</text></g>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1440" viewBox="0 0 1080 1440">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f8fafc"/><stop offset="1" stop-color="#e0f2fe"/></linearGradient>
    <style>
      .label{font:700 34px 'Microsoft YaHei',Arial,sans-serif;fill:#0369a1}.title{font:900 62px 'Microsoft YaHei',Arial,sans-serif;fill:#0f172a}.bullet{font:600 38px 'Microsoft YaHei',Arial,sans-serif;fill:#1e293b}.small{font:500 28px 'Microsoft YaHei',Arial,sans-serif;fill:#64748b}.cta{font:700 30px 'Microsoft YaHei',Arial,sans-serif;fill:#075985}
    </style>
  </defs>
  <rect width="1080" height="1440" rx="0" fill="url(#bg)"/>
  <rect x="52" y="54" width="976" height="1332" rx="36" fill="#ffffff" opacity="0.92"/>
  <text x="72" y="132" class="label">X AI Content Radar</text>
  <text x="842" y="132" class="small">${card.page}/${total}</text>
  ${titleSvg}
  <rect x="72" y="440" width="936" height="2" fill="#bae6fd"/>
  ${bulletSvg}
  <rect x="72" y="1125" width="936" height="142" rx="28" fill="#eff6ff"/>
  <text x="112" y="1190" class="cta">需要国内可用模型接口？乾羲 API</text>
  <text x="112" y="1235" class="small">https://qianxi-api.com · OpenAI-compatible</text>
  <text x="72" y="1340" class="small">来源保留 · 人工审核 · 不自动发布</text>
</svg>`;
}

function writeCards(packDir) {
  const carouselPath = path.join(packDir, 'carousel.md');
  const text = fs.existsSync(carouselPath) ? fs.readFileSync(carouselPath, 'utf8') : '';
  const cards = parseCarousel(text).slice(0, 9);
  const out = path.join(packDir, 'materials', '01-xiaohongshu-images');
  fs.mkdirSync(out, { recursive: true });
  const files = [];
  const cardSpecPath = path.join(out, 'cards.json');
  fs.writeFileSync(cardSpecPath, JSON.stringify(cards.map((card, index) => ({ ...card, page: index + 1, total: cards.length })), null, 2), 'utf8');
  cards.forEach((card, index) => {
    const svgPath = path.join(out, `xhs-${String(index + 1).padStart(2, '0')}.svg`);
    fs.writeFileSync(svgPath, svgCard({ ...card, page: index + 1 }, cards.length), 'utf8');
    files.push(svgPath);
    const pngPath = svgPath.replace(/\.svg$/, '.png');
    const converted = run('ffmpeg', ['-y', '-i', svgPath, pngPath], { timeout: 60000 });
    if (converted.status === 'ok') files.push(pngPath);
  });
  const pngCount = fs.readdirSync(out).filter((file) => file.toLowerCase().endsWith('.png')).length;
  if (pngCount < 7) {
    const renderer = path.join(__dirname, 'render-png-cards.ps1');
    const fallback = run('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', renderer, '-CardsJson', cardSpecPath, '-OutputDir', out], { timeout: 120000 });
    if (fallback.status === 'ok') {
      fs.readdirSync(out)
        .filter((file) => file.toLowerCase().endsWith('.png'))
        .forEach((file) => {
          const pngPath = path.join(out, file);
          if (!files.includes(pngPath)) files.push(pngPath);
        });
    }
  }
  return files;
}

function makeAss(packDir) {
  const outDir = path.join(packDir, 'materials', '02-douyin-video');
  fs.mkdirSync(outDir, { recursive: true });
  const source = fs.existsSync(path.join(packDir, 'source.json')) ? JSON.parse(fs.readFileSync(path.join(packDir, 'source.json'), 'utf8')) : {};
  const title = (source.title || 'AI 热点内容生产线').replace(/[{}]/g, '');
  const scenes = [
    ['0:00:00.00', '0:00:05.00', '今天这个 AI 热点，值得做成内容'],
    ['0:00:05.00', '0:00:11.00', title.slice(0, 28)],
    ['0:00:11.00', '0:00:18.00', '流程：热点捕捉 → 智能选题 → 素材生成'],
    ['0:00:18.00', '0:00:25.00', '小红书、抖音、知识星球都能拆出来'],
    ['0:00:25.00', '0:00:32.00', '需要模型接口？国内可看乾羲 API'],
    ['0:00:32.00', '0:00:40.00', 'https://qianxi-api.com'],
  ];
  const ass = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Main,Microsoft YaHei,72,&H00FFFFFF,&H000000FF,&H0010273A,&H80000000,1,0,0,0,100,100,0,0,1,4,2,5,70,70,120,1
Style: Small,Microsoft YaHei,42,&H00DDF7FF,&H000000FF,&H0010273A,&H80000000,0,0,0,0,100,100,0,0,1,3,1,2,70,70,120,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${scenes.map((s) => `Dialogue: 0,${s[0]},${s[1]},Main,,0,0,0,,${s[2]}`).join('\n')}
Dialogue: 0,0:00:35.00,0:00:40.00,Small,,0,0,0,,OpenAI-compatible API · 人工审核后发布
`;
  const assPath = path.join(outDir, 'douyin-subtitles.ass');
  fs.writeFileSync(assPath, ass, 'utf8');
  return assPath;
}

function renderVideo(packDir) {
  const outDir = path.join(packDir, 'materials', '02-douyin-video');
  const assPath = makeAss(packDir);
  const out = path.join(outDir, 'douyin-auto-v1.mp4');
  const vf = `subtitles='${assPath.replace(/\\/g, '/').replace(/:/, '\\:')}'`;
  const step = run('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'color=c=0b1220:s=1080x1920:d=40:r=30', '-vf', vf, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', out], { timeout: 120000 });
  return { out, step };
}

function main() {
  const date = today();
  const packDir = process.argv.find((arg) => arg.startsWith('--pack='))?.slice(7) || latestDir(path.join(dataDir, 'content-packs'));
  if (!packDir) throw new Error('No content pack found. Run B writer first.');
  const cards = writeCards(packDir);
  const video = renderVideo(packDir);
  const pngCards = cards.filter((file) => file.toLowerCase().endsWith('.png'));
  const status = video.step.status === 'ok' && pngCards.length >= 7 ? 'ok' : 'failed';
  const manifest = { agent: 'C-media', date, status, contentPackDir: packDir, cards, pngCards, video: video.out, steps: [video.step] };
  writeJson(path.join(dataDir, 'agent-runs', `${date}-c-media.json`), manifest);
  console.log(`C Media: ${manifest.status}`);
  console.log(`Cards: ${pngCards.length}`);
  console.log(`Video: ${video.out}`);
  if (manifest.status !== 'ok') process.exitCode = 1;
}
main();

