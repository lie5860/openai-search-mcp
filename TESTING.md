# 自测链条

本地开发完成后，按下面顺序自测（无需人工介入时可脚本化）。

## 1. 编译与代码质量（必做）

在项目根目录执行：

```bash
npm run build
npm run lint:fix
npm run type-check
```

- 若修改了代码，**先执行上述命令**再提交；AI 协助时也会优先跑这些。
- `lint:fix` 可自动修大部分 ESLint 报错。

## 2. 服务器能力自测（配置 + 搜索 + LLM fetch）

快速检查配置、fetch 引擎状态，并跑一次搜索和 LLM 抓取：

```bash
npm run build
npm run test-server
```

## 3. Fetch 三引擎自测（推荐）

验证 `web_fetch` 的三种引擎（llm / tavily / firecrawl）是否可用：

```bash
npm run build
npm run test-fetch
```

脚本会：

- 校验 `OPENAI_API_URL`、`OPENAI_API_KEY`
- 打印当前可用的 fetch 引擎（tavily/firecrawl 是否已配置）
- 依次尝试：**llm**（当前 OpenAI 兼容模型）、**tavily**（若设置了 `TAVILY_API_KEY`）、**firecrawl**（若设置了 `FIRECRAWL_API_KEY`）
- 对测试 URL（默认 `https://example.com`）做一次抓取并打印短预览

可选：在项目根建 `.env`，或导出环境变量后再运行上述命令。

## 4. 搜索 + 抓取（与现有 example 一致）

```bash
npm run test-search
```

会调用当前配置下的 **search** 与 **fetch（LLM）**，用于确认搜索链路和默认 LLM fetch 正常。

## 5. 完整 MCP 服务器（端到端）

启动 MCP 服务后，用 Claude Code / Cursor / 其他 MCP 客户端连接，在对话里触发：

- `web_search`（传 query 等）
- `web_fetch`（传 url，可选 `fetch_engine: "llm" | "tavily" | "firecrawl"`）
- `get_config_info`（查看配置与 `fetch_engines` 状态）

启动方式示例：

```bash
node dist/server.js
# 或
npx openai-search-mcp
```

客户端配置为 stdio、command 指向上述之一即可。

---

**小结**：日常自测至少跑 **1 + 2**（或 **1 + 3**）；改 search/fetch 逻辑后建议再跑 **4**；要验证真实 MCP 调用再跑 **5**。

实测对比（耗时与内容一致性）见 `test-results/_comparison.md`：LLM fetch 通常更慢，且可能含缓存/推断或无关内容；Tavily/Firecrawl 更快且返回真实页面正文。
