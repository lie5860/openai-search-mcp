# Grok-with-Tavily「专业 Crawl」特性分析

## 一、上游架构概览

[GrokSearch @ grok-with-tavily](https://github.com/GuDaStudio/GrokSearch/tree/grok-with-tavily) 采用**双引擎**：

```
Claude ──MCP──► Grok Search Server
                  ├─ web_search  ───► Grok API（AI 搜索）
                  ├─ web_fetch   ───► Tavily Extract → Firecrawl Scrape（内容抓取，自动降级）
                  └─ web_map     ───► Tavily Map（站点映射）
```

- **Grok**：只负责「搜索」—— 理解 query、返回答案与信源，不负责真实 HTTP 抓取。
- **Tavily**：负责「抓取」与「站点结构」—— 真实请求 URL、解析 HTML、输出 Markdown 或结构化结果；失败时用 **Firecrawl Scrape** 托底。
- **web_fetch**：Tavily Extract 为主，Firecrawl 为降级，二者都是**专业爬虫/抽取服务**，不是 LLM 生成内容。

---

## 二、Tavily 在「专业 crawl」里做什么

### 2.1 Tavily Extract（对应 web_fetch）

- **定位**：面向 LLM 的网页内容抽取 API，对**指定 URL** 做真实 HTTP 请求并解析 HTML。
- **能力**（据 [Tavily 文档](https://docs.tavily.com/documentation/api-reference/endpoint/extract)）：
  - 单 URL 或批量 URL（最多 20）一次请求
  - 可选 `extract_depth`: basic / advanced（表格、嵌入内容等）
  - 可选按 query 做 chunk 重排、控制 `chunks_per_source`
  - 返回 JSON：`results`（URL + 抽取内容）、`failed_results`、`response_time`
- **计费**：按成功抽取次数（basic/advanced 不同 credit），与 LLM token 解耦。

和「让 LLM 自己说网页内容」相比，这里是**真实抓取 + 专用解析管道**，输出稳定、可复现。

### 2.2 Tavily Map（对应 web_map）

- **定位**：理解**站点结构**—— 从起始 URL 发现链接、生成站点地图，不侧重全文抽取。
- **用途**：探索文档站、博客、文档目录，便于后续只对「相关页面」做 Extract 或 Crawl，省 token、省时间。
- 本项目当前**没有**站点级探索能力，只有「单 URL 抓取」；若要做「先摸清站点再抓关键页」，就需要类似能力。

### 2.3 Firecrawl 托底

- Tavily 失败（超时、反爬、解析失败等）时，自动改用 **Firecrawl Scrape** 再试一次。
- 双通道降低「抓不到」的概率，提高 web_fetch 可用性。

---

## 三、「专业 crawl」是否有意义？

**有意义，且正是 grok-with-tavily 的差异化点。**

1. **语义清晰**  
   - 搜索 = 理解 query、返回答案与来源（Grok 擅长）。  
   - 抓取 = 对给定 URL 做 HTTP + HTML 解析 + 转 Markdown（Tavily/Firecrawl 擅长）。  
   各做各的，边界清楚，便于维护和扩展。

2. **真实抓取 vs 模型“想象”**  
   - 专业 crawl：真实请求 URL，拿到真实 HTML，再抽取/转 Markdown，结果可验证、可复现。  
   - 若把「抓取」交给 LLM（例如只把 URL 塞进 prompt）：要么依赖模型自带 browse 能力（且受限于该模型），要么模型无法访问外网，只能猜或拒绝。专业 crawl 不依赖模型是否「能上网」，只要服务端能发 HTTP 即可。

3. **质量与一致性**  
   - Tavily/Firecrawl 针对「网页→结构化内容」做了专门优化（表格、列表、代码块等），输出格式统一。  
   - 纯靠 LLM 根据 URL 生成「网页内容」，容易受模型能力、上下文长度和幻觉影响，质量不稳定。

4. **成本与可控性**  
   - Extract 按「成功抽取次数」计费，和 LLM token 分离；可单独限流、监控、降级。  
   - 托底链（Tavily → Firecrawl）提高可用性，不把鸡蛋放在一个篮子里。

---

## 四、优势总结

| 维度 | 专业 Crawl（Tavily + Firecrawl） | 当前本项目（LLM 驱动 fetch） |
|------|----------------------------------|------------------------------|
| **是否真实请求 URL** | 是，服务端 HTTP 抓取 | 依赖模型是否有 browse 能力，否则无真实抓取 |
| **输出一致性** | 专用解析管道，Markdown/JSON 稳定 | 依赖模型，易受 prompt/模型版本影响 |
| **反爬/失败处理** | 可换引擎、重试、托底（如 Firecrawl） | 仅能重试同一模型调用 |
| **站点级探索** | 有（Tavily Map），可先映射再抓 | 无，仅单 URL |
| **成本结构** | 抓取与 LLM 解耦，按抽取次数计费 | 抓取也耗 LLM token |
| **可观测性** | 可单独监控抓取成功率、延迟 | 与普通 completion 混在一起 |

核心优势：**抓取由专业引擎做，真实、稳定、可降级；LLM 专注搜索与理解。**

---

## 五、对本项目（openai-search-mcp）的建议

- **当前实现**：`web_fetch` 把 URL 交给 OpenAI chat/completions + 长 system prompt，由**模型**返回「网页的 Markdown」。若后端模型没有真实 browse 能力，本质上不是 crawl，而是模型根据 URL 的推断或拒绝。
- **若希望「真实抓取」**：引入类似 Tavily Extract（或 Firecrawl/Jina 等）作为独立抓取通道更有意义；可设计为：
  - 优先：Tavily Extract（或自选引擎）对 URL 做 HTTP 抓取 + 转 Markdown
  - 可选：失败时降级到 Firecrawl 或当前 LLM 方案（若模型支持 browse）
- **若暂时不引入第三方 API**：可在文档中明确写清「当前 web_fetch 依赖模型侧能力，非真实 crawl」；后续若加 Tavily/Firecrawl，可再增加一个 `web_fetch_tavily` 或配置切换「引擎」。
- **web_map**：若产品需要「先探索站点再抓取」，再考虑 Tavily Map 或类似站点映射能力；否则可搁置。

**结论**：上游「Tavily 干专业 crawl」的设计有意义，优势在于真实抓取、输出稳定、可托底、与搜索职责分离；本项目若要以「真实网页抓取」为卖点，值得在合适时机引入类似方案（Tavily/Firecrawl 等），并保留与现有 LLM 方案的兼容或降级关系。

---

## 六、延伸 FAQ

以下三个问题已单独写成文档，便于和产品/架构讨论时引用：

- **1. LLM fetch 做不好，search 就做得好了吗？** → 在我们项目里，search 和 fetch 都走同一条 chat 接口，**都依赖模型/后端是否提供真实 search/browse 能力**；上游 GrokSearch 则是 search 用 Grok（真实搜索）、fetch 用 Tavily（真实抓取），两边都不靠模型「幻想」。
- **2. Tavily / Firecrawl 只有 fetch 没有 search？** → **Tavily 有 Search API 也有 Extract API**；Firecrawl 主打抓取/爬取，不做通用搜索。上游用 Grok 做 search、Tavily 做 fetch 是产品选型，不是 Tavily 不能 search。
- **3. 为什么用这些而不是 curl？反爬谁解决？** → **curl 容易触发反爬**（单 IP、无指纹、无 JS）；**LLM 本身不解决反爬**，若模型的 browse 能用，是**提供方**做了请求与基础设施；**Tavily/Firecrawl 是商业抓取服务**，由他们做代理、渲染、抗反爬，你付费用他们的能力。

详细论述见：[faq-why-and-how.md](./faq-why-and-how.md)。
