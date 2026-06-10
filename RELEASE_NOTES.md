# x-ai-content-radar v0.1.0

First public release of X AI Content Radar.

## What it does

- Collects daily AI signals from AI HOT.
- Scores AI Agent, AI tools, open source, coding workflow, tutorial, and product update topics.
- Generates Chinese self-media content packs for Xiaohongshu, Douyin/Video Account, Zhishi Xingqiu, and WeChat.
- Includes review checklists to avoid hallucinated facts, exaggerated claims, and missing source links.

## Included

- `SKILL.md`: Agent skill workflow.
- `x-ops-template/`: runnable Node.js template.
- `collect-aihot.js`: AI HOT collector.
- `rank.js`: content candidate ranking.
- `generate-pack.js`: content pack generator.
- `content-pack.md`: Chinese content generation prompt.
- `.env.example`: OpenAI-compatible API configuration example, with Qianxi API as a China-friendly endpoint option.

## Safety

This release does not include `.env`, API keys, `node_modules`, generated local data, or user content history.

