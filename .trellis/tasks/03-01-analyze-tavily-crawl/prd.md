# 分析上游 GrokSearch grok-with-tavily 的 Tavily 抓取特性

## Goal

了解 [GrokSearch grok-with-tavily](https://github.com/GuDaStudio/GrokSearch/tree/grok-with-tavily) 分支中「Tavily 做专业 crawl」的设计，评估该特性是否有意义、优势在哪里，以及对本项目（openai-search-mcp）的借鉴价值。

## Requirements

- 梳理 Grok-with-Tavily 的架构：Grok 搜索 + Tavily 抓取/映射 + Firecrawl 托底
- 说明 Tavily Extract / Tavily Map 的定位与能力
- 对比本项目当前 web_fetch 实现（LLM 驱动）与「专业 crawl 引擎」的差异
- 结论：是否有意义、优势、是否值得在本项目中引入类似方案

## Acceptance Criteria

- [x] 任务目录与 PRD 已创建
- [x] 分析文档完成，包含：架构梳理、Tavily 能力、优劣势、对本项目的建议（见 `analysis.md`）

## Technical Notes

- 上游仓库：Python + FastMCP，双引擎（Grok API + Tavily API）
- 本项目：Node/TS + MCP SDK，当前 web_fetch 依赖 OpenAI chat/completions（模型侧“抓取”）
- 分析产出以文档为主，不要求改代码
