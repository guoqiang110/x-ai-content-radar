---
name: x-ai-content-radar
description: X/AI 内容雷达。用于每天抓取和整理 X 平台、AI HOT、GitHub、YouTube、Hacker News 上的 AI 工具、AI Agent、编程工具、开源项目、教程热点，并生成适合小红书、抖音/视频号、知识星球、公众号发布的中文自媒体素材包。触发词包括“X AI 热点”“X 运营”“AI 内容雷达”“今天做选题”“小红书/抖音素材包”“AI HOT 转内容”“抓 X 热点”“把 AI 热点改写成国内自媒体内容”。
---

# X AI Content Radar

Use this skill to run a daily AI content-operation workflow: collect fresh AI signals, rank publishable topics, and generate a reviewable Chinese content pack for Xiaohongshu, Douyin/Video Account, Zhishi Xingqiu, or WeChat Official Account.

## Setup

1. Copy `x-ops-template/` to a working project folder, for example `D:\x-ops`.
2. Run `npm install` inside that folder.
3. Copy `.env.example` to `.env` and configure an OpenAI-compatible API endpoint.
4. X API is optional. Without X credentials, start from AI HOT and manual X notes.

## Daily Workflow

Default daily run:

```powershell
cd D:\x-ops
npm run daily-aihot-pack
```

Candidate-only run:

```powershell
cd D:\x-ops
npm run aihot
npm run rank
```

Generate a content pack from ranked item 1:

```powershell
cd D:\x-ops
npm run pack -- --rank=1
```

## Source Strategy

- AI HOT: stable Chinese AI news baseline, no API key required.
- X: first-hand builder and product signals, via X API or manual paste.
- GitHub/HN/YouTube: optional supporting signals.

## Output

- Raw data: `data/raw/YYYY-MM-DD.json`
- Ranked candidates: `data/ranked/YYYY-MM-DD.md`
- Content pack: `data/content-packs/YYYY-MM-DD-*/content-pack.md`
- Split assets: Xiaohongshu, Douyin, longform, image prompts, and review checklist.

## Quality Bar

- Keep source links.
- Mark uncertain facts as pending verification.
- Do not auto-post. Generate reviewable drafts only.
- Avoid exaggerated marketing claims.

