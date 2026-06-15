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
      const title = (body.match(/-\s*(?:\*\*)?大标题(?:\*\*)?\s*[:：]\s*(.+)/) || [])[1] || `AI Hot Page ${m[1]}`;
      const bulletBlock = (body.match(/-\s*(?:\*\*)?要点(?:\*\*)?\s*[:：]\s*([\s\S]*?)(?=\n-\s*(?:\*\*)?画面建议(?:\*\*)?\s*[:：]|$)/) || [])[1] || '';
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
  fs.readdirSync(out)
    .filter((file) => /^xhs-.*\.(png|svg)$/i.test(file) || file.startsWith('tmp-'))
    .forEach((file) => {
      try { fs.unlinkSync(path.join(out, file)); } catch (_) {}
    });
  const files = [];
  const cardSpecPath = path.join(out, 'cards.json');
  fs.writeFileSync(cardSpecPath, JSON.stringify(cards.map((card, index) => ({ ...card, page: index + 1, total: cards.length })), null, 2), 'utf8');
  cards.forEach((card, index) => {
    const svgPath = path.join(out, `xhs-${String(index + 1).padStart(2, '0')}.svg`);
    fs.writeFileSync(svgPath, svgCard({ ...card, page: index + 1 }, cards.length), 'utf8');
    files.push(svgPath);
  });
  const renderer = path.join(__dirname, 'render-png-cards.ps1');
  const renderStep = run('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', renderer, '-CardsJson', cardSpecPath, '-OutputDir', out], { timeout: 120000 });
  if (renderStep.status === 'ok') {
    fs.readdirSync(out)
      .filter((file) => /^xhs-\d{2}\.png$/i.test(file))
      .sort()
      .forEach((file) => {
        const pngPath = path.join(out, file);
        if (!files.includes(pngPath)) files.push(pngPath);
      });
  }
  return files;
}

function makeSlideList(packDir) {
  const outDir = path.join(packDir, 'materials', '02-douyin-video');
  fs.mkdirSync(outDir, { recursive: true });
  const imageDir = path.join(packDir, 'materials', '01-xiaohongshu-images');
  const images = fs.readdirSync(imageDir)
    .filter((file) => /^xhs-\d{2}\.png$/i.test(file))
    .sort()
    .map((file) => path.join(imageDir, file));
  const listPath = path.join(outDir, 'douyin-slides.txt');
  const lines = [];
  images.forEach((file, index) => {
    lines.push(`file '${file.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`);
    lines.push(index === 0 ? 'duration 3.6' : 'duration 3.2');
  });
  if (images.length) lines.push(`file '${images[images.length - 1].replace(/\\/g, '/').replace(/'/g, "'\\''")}'`);
  fs.writeFileSync(listPath, `${lines.join('\n')}\n`, 'utf8');
  return { listPath, images };
}

function renderVideo(packDir) {
  const outDir = path.join(packDir, 'materials', '02-douyin-video');
  const { listPath, images } = makeSlideList(packDir);
  const out = path.join(outDir, 'douyin-auto-v1.mp4');
  if (images.length < 7) {
    return { out, step: { command: 'render card slideshow', status: 'failed', exitCode: 1, stdout: '', stderr: `Expected at least 7 PNG cards, got ${images.length}` } };
  }
  const vf = 'scale=1080:-2,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=f8fafc,fps=30,fade=t=in:st=0:d=0.25,fade=t=out:st=30.8:d=0.5,format=yuv420p';
  const step = run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-vf', vf, '-c:v', 'libx264', '-r', '30', '-pix_fmt', 'yuv420p', out], { timeout: 180000 });
  return { out, step };
}

function renderEnhancedVideo(packDir) {
  const outDir = path.join(packDir, 'materials', '02-douyin-video');
  const { listPath, images } = makeSlideList(packDir);
  const out = path.join(outDir, 'douyin-enhanced-v1.mp4');
  if (images.length < 7) {
    return { out, step: { command: 'render enhanced slideshow', status: 'failed', exitCode: 1, stdout: '', stderr: `Expected at least 7 PNG cards, got ${images.length}` } };
  }
  const duration = 32.4;
  const vf = [
    'scale=1000:-2',
    'pad=1080:1920:(ow-iw)/2:210:color=111827',
    'drawbox=x=0:y=0:w=iw:h=170:color=0f172a@0.96:t=fill',
    'drawbox=x=54:y=48:w=280:h=44:color=38bdf8@1:t=fill',
    'drawbox=x=54:y=108:w=520:h=22:color=64748b@1:t=fill',
    'drawbox=x=54:y=142:w=972:h=10:color=334155@1:t=fill',
    `drawbox=x=54:y=142:w='min(972,972*t/${duration})':h=10:color=38bdf8@1:t=fill`,
    'drawbox=x=0:y=1770:w=iw:h=150:color=0f172a@0.92:t=fill',
    'drawbox=x=54:y=1815:w=650:h=34:color=ffffff@1:t=fill',
    'drawbox=x=54:y=1866:w=430:h=20:color=38bdf8@1:t=fill',
    'fade=t=out:st=30.8:d=0.5',
    'fps=30',
    'format=yuv420p',
  ].join(',');
  const step = run('ffmpeg', [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', listPath,
    '-f', 'lavfi',
    '-i', 'sine=frequency=220:sample_rate=44100',
    '-vf', vf,
    '-af', 'volume=0.08',
    '-shortest',
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-b:a', '96k',
    '-r', '30',
    '-pix_fmt', 'yuv420p',
    out,
  ], { timeout: 180000 });
  return { out, step };
}

function main() {
  const date = today();
  const packDir = process.argv.find((arg) => arg.startsWith('--pack='))?.slice(7) || latestDir(path.join(dataDir, 'content-packs'));
  if (!packDir) throw new Error('No content pack found. Run B writer first.');
  const cards = writeCards(packDir);
  const video = renderVideo(packDir);
  const enhanced = video.step.status === 'ok' ? renderEnhancedVideo(packDir) : null;
  const pngCards = cards.filter((file) => /\\xhs-\d{2}\.png$/i.test(file));
  const status = video.step.status === 'ok' && pngCards.length >= 7 ? 'ok' : 'failed';
  const steps = enhanced ? [video.step, enhanced.step] : [video.step];
  const manifest = { agent: 'C-media', date, status, contentPackDir: packDir, cards, pngCards, video: video.out, enhancedVideo: enhanced?.out || '', steps };
  writeJson(path.join(dataDir, 'agent-runs', `${date}-c-media.json`), manifest);
  console.log(`C Media: ${manifest.status}`);
  console.log(`Cards: ${pngCards.length}`);
  console.log(`Video: ${video.out}`);
  if (enhanced) console.log(`Enhanced video: ${enhanced.out}`);
  if (manifest.status !== 'ok') process.exitCode = 1;
}
main();

