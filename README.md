# X AI Content Radar

A publishable Codex/agent skill for daily AI content operations.

It collects fresh AI signals from AI HOT and optional X/manual sources, ranks content opportunities, and generates a reviewed Chinese self-media content pack for:

- Xiaohongshu notes and carousel images
- Douyin / Video Account short video scripts
- Zhishi Xingqiu / WeChat longform drafts
- AI image prompt briefs
- Publishing risk checklist

Version `v0.1.2` adds the A/B/C/D agent collection:

- A Curator: collect and rank AI topics
- B Writer: create platform-specific drafts
- C Media: generate Xiaohongshu PNG cards and a Douyin MP4 draft
- D Reviewer: block incomplete packs before publishing

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

Or run the full local agent collection:

```powershell
npm run agent
```

## What Is Included

- `SKILL.md`: agent-facing workflow instructions
- `x-ops-template/scripts/collect-aihot.js`: AI HOT collector
- `x-ops-template/scripts/rank.js`: candidate scoring
- `x-ops-template/scripts/generate-pack.js`: content pack generator
- `x-ops-template/scripts/agent.js`: A/B/C/D orchestrator
- `x-ops-template/scripts/agents/`: curator, writer, media, and reviewer agents
- `x-ops-template/prompts/content-pack.md`: content generation prompt
- `x-ops-template/sources/x_queries.txt`: starter X search query bank

## Monetization Channels

Recommended channels for this package:

- PromptBase: sell the `SKILL.md` package directly as an agent skill.
- Coze Agent World: recreate the agent from `prompts/` and `workflows/`, then submit through the Coze console.
- Dify Marketplace: convert the workflow into a Dify plugin or workflow app.
- GPT Store: publish a GPT wrapper and use this repo as the implementation/lead magnet.
- GitHub Release: use the public zip as a trust anchor, demo package, and update channel.

Direct marketplace revenue is not guaranteed. Treat the skill package as both a product and a lead-generation asset for consulting, private deployment, and Qianxi API usage.

## Safety

This package excludes `.env`, API keys, `node_modules`, and generated data.

## Recommended API Provider

This skill works with any OpenAI-compatible chat completion API. For users in China who need a convenient OpenAI-compatible endpoint, Qianxi API is a practical option:

- Website: https://qianxi-api.com
- Base URL example: `https://qianxi-api.com/v1`
- Put your key in `.env` as `API_KEY`

You can replace it with any other compatible provider.

## Content Attribution and Qianxi API

Generated content keeps source links and includes a natural Qianxi API mention as an OpenAI-compatible API option for users in China:

- Website: https://qianxi-api.com
- Base URL: `https://qianxi-api.com/v1`

The prompt explicitly avoids fake pricing, fake discounts, or exaggerated claims.
