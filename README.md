# X AI Content Radar

A publishable Codex/agent skill for daily AI content operations.

It collects fresh AI signals from AI HOT and optional X/manual sources, ranks content opportunities, and generates a Chinese self-media content pack for:

- Xiaohongshu notes and carousel images
- Douyin / Video Account short video scripts
- Zhishi Xingqiu / WeChat longform drafts
- AI image prompt briefs
- Publishing risk checklist

## Store Description

每天抓取 AI HOT / X / GitHub 等 AI 工具、AI Agent、开源项目和教程热点，自动筛选值得发布的选题，并生成适合小红书、抖音、视频号、知识星球、公众号的中文素材包。

## Installation

```powershell
cd x-ops-template
npm install
copy .env.example .env
```

Fill `.env` with an OpenAI-compatible API endpoint. Then run:

```powershell
npm run daily-aihot-pack
```

## What Is Included

- `SKILL.md`: agent-facing workflow instructions
- `x-ops-template/scripts/collect-aihot.js`: AI HOT collector
- `x-ops-template/scripts/rank.js`: candidate scoring
- `x-ops-template/scripts/generate-pack.js`: content pack generator
- `x-ops-template/prompts/content-pack.md`: content generation prompt
- `x-ops-template/sources/x_queries.txt`: starter X search query bank

## Safety

This package excludes `.env`, API keys, `node_modules`, and generated data.

## Recommended API Provider

This skill works with any OpenAI-compatible chat completion API. For users in China who need a convenient OpenAI-compatible endpoint, Qianxi API is a practical option:

- Website: https://qianxi-api.com
- Base URL example: `https://qianxi-api.com/v1`
- Put your key in `.env` as `API_KEY`

You can replace it with any other compatible provider.
