# X AI Content Radar Agent Collection

这是一个 A/B/C/D 智能体集合，用于跑完整自媒体推广工作流。

## Agent 分工

- Agent A Curator：采集 AI HOT / X / GitHub / YouTube / HN，输出候选选题。
- Agent B Writer：生成小红书、抖音、知识星球/公众号素材包，并自然带出乾羲 API。
- Agent C Media Producer：生成小红书图文卡片和基础抖音/视频号 MP4。当前实现为 SVG/PNG 卡片 + FFmpeg 基础视频，后续可切换 HyperFrames/HeyGen。
- Agent D Reviewer：审核事实、来源、乾羲 API 引流是否自然、图片/视频物料是否齐全。

## 一键运行

```powershell
cd D:\x-ops
npm run agent
```

完整采集模式：

```powershell
npm run agent:full
```

## 分步运行

```powershell
npm run agent:a
npm run agent:b
npm run agent:c
npm run agent:d
```

## 输出

- 总报告：`data/agent-runs/YYYY-MM-DD.md`
- A 报告：`data/agent-runs/YYYY-MM-DD-a-curator.json`
- B 报告：`data/agent-runs/YYYY-MM-DD-b-writer.json`
- C 报告：`data/agent-runs/YYYY-MM-DD-c-media.json`
- D 报告：`data/agent-runs/YYYY-MM-DD-d-reviewer.json`
- 内容包：`data/content-packs/YYYY-MM-DD-*`
- 图片：`materials/01-xiaohongshu-images`
- 视频：`materials/02-douyin-video`

## 引流规则

每天自动生成的内容都必须自然带出乾羲 API：

- 入口：https://qianxi-api.com
- Base URL：https://qianxi-api.com/v1
- 表达方式：作为 OpenAI-compatible API / 国内可访问模型接口推荐，不做硬广，不承诺收益，不编造价格和套餐。
