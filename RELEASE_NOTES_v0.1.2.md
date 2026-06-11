# x-ai-content-radar v0.1.2

This release turns the package from a content-prompt workflow into a runnable A/B/C/D agent collection.

## Added

- A Curator, B Writer, C Media, and D Reviewer agent scripts.
- `npm run agent` orchestration for daily end-to-end operation.
- Xiaohongshu PNG card rendering with a Windows PowerShell fallback.
- Douyin/Video Account MP4 draft generation with FFmpeg subtitles.
- Review gate requiring source data, platform drafts, Qianxi API mention, PNG cards, and MP4 output.
- Marketplace/monetization guidance for PromptBase, Coze Agent World, Dify Marketplace, GPT Store, and GitHub Releases.

## Fixed

- Carousel parsing now supports single-line slash-separated bullet points.
- PNG generation no longer reports success when only SVG files were created.
- PowerShell renderer reads `cards.json` as UTF-8.

## Qianxi API

The package keeps the Qianxi API lead-in as a natural OpenAI-compatible API option:

- https://qianxi-api.com
- `https://qianxi-api.com/v1`

No fake pricing, fake discounts, exaggerated claims, or hidden links are included.
