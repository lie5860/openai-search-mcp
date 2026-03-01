# FAQ：LLM 与专业工具的关系

针对三个问题的澄清。

---

## 1. LLM fetch 做不好，search 就做得好了吗？是否同样依赖模型有没有 search 能力？

**结论：是的。若「搜索」和「抓取」都只靠同一条 chat/completions 接口，两者都依赖后端模型是否具备对应能力。**

- **在我们项目（openai-search-mcp）里**：  
  - `web_search` 和 `web_fetch` 都走 **OpenAI 兼容的 chat/completions**，只是 prompt 不同（一个是「搜 X」，一个是「抓 URL Y」）。  
  - 若后端模型**没有**内置的 search 或 browse 工具，那它既做不好「真实搜索」，也做不好「真实抓取」——要么靠训练数据推断（不可靠），要么直接说做不到。  
  - 所以：**fetch 依赖模型，search 同样依赖模型**；不存在「fetch 做不好但 search 能做得好」的必然关系，两者同源。

- **在 GrokSearch（grok-with-tavily）里**：  
  - **web_search** 调用的是 **Grok API**。Grok 产品本身带**实时网页搜索**（类似 Bing 集成），所以这里的「搜索」是**真实搜索服务**，不是模型从参数里「猜」结果。  
  - **web_fetch** 调用 **Tavily Extract**（+ Firecrawl 托底），是**真实 HTTP 抓取 + 解析**。  
  - 因此上游是「搜索 = 真实搜索（Grok），抓取 = 真实抓取（Tavily）」；**两边都不依赖「模型有没有 search/fetch 能力」**，而是依赖**产品/API 是否提供这些能力**。

**小结**：  
- 我们：search 和 fetch 都依赖**同一个 chat 接口** → 都依赖模型/后端是否暴露 search/browse。  
- 上游：search 和 fetch 分别用**不同后端**（Grok vs Tavily）→ 都是「真实能力」，不靠模型幻想。

---

## 2. Tavily 和 Firecrawl 只有 fetch 没有 search 吗？

**不是。Tavily 既有 Search 也有 Extract；Firecrawl 主打抓取/爬取，不做通用网页搜索。**

| 服务 | Search（根据 query 找网页） | Fetch / Extract（根据 URL 拿内容） | 其他 |
|------|-----------------------------|-------------------------------------|------|
| **Tavily** | ✅ [Search API](https://docs.tavily.com)：根据 query 返回链接、摘要等 | ✅ [Extract API](https://docs.tavily.com/documentation/api-reference/endpoint/extract)：从给定 URL 抽取内容 | Map、Crawl 等 |
| **Firecrawl** | ❌ 不做通用搜索 | ✅ Scrape：抓取 URL 内容；Crawl：站内遍历 | 站点级爬取 |

GrokSearch 用 **Grok 做 search、Tavily 做 fetch** 是**产品选型**（例如更看重 Grok 的实时搜索质量或品牌），而不是因为「Tavily 没有 search」。  
若愿意，完全可以设计成：search 用 Tavily Search，fetch 用 Tavily Extract，这样「搜索 + 抓取」都只依赖 Tavily 一家。

---

## 3. 为什么要用这些（Tavily/Firecrawl/LLM），而不是直接 curl？反爬、拦截怎么办？LLM 和这些工具是怎么「解决」的？

### 3.1 直接用 curl 会怎样？

- 典型情况：**单 IP、简单 User-Agent、无 JS 执行、无浏览器指纹**。  
- 很多站点会：  
  - 识别机器人 → 返回验证码、空白页、403  
  - 限速、封 IP  
  - 关键内容由 JS 渲染 → curl 拿到的 HTML 里没有正文  

所以「直接 curl」在复杂站点上**很容易被反爬或拿不到有效内容**，不是「技术上行不行」的问题，而是**站点明确不希望你这样抓**。

### 3.2 LLM 会「解决」反爬吗？

**不会。LLM 本身既不发 HTTP 也不绕反爬。**

- 若模型能「搜」或「抓」，通常是因为**提供方**（如 OpenAI、Anthropic）在后台接了**自己的搜索/浏览工具**：  
  - 用他们的服务器发请求、可能用代理/浏览器/无头渲染等  
  - 反爬、封禁、JS 渲染等问题由**他们**的基础设施处理，不是模型「变聪明」就解决了  

所以：  
- **我们项目**：若后端只是纯 chat（没有挂 search/browse 工具），那模型既不会真正去搜，也不会真正去抓；你看到的是模型根据 prompt 的**推断或拒绝**。  
- **能解决反爬的是「谁在发请求、用什么基础设施」**，不是「是不是 LLM」。

### 3.3 Tavily / Firecrawl 为什么比 curl 好用？

这类服务是**专门做网页抓取/抽取的商业 API**，通常包括：

- **基础设施**：代理、IP 轮换、请求频率控制、有时带浏览器/无头渲染  
- **反反爬**：处理常见反爬策略、验证码策略（在 ToS 允许范围内）  
- **解析与清洗**：HTML → 正文、Markdown、结构化 JSON，去广告/导航等  
- **合规与 ToS**：以「可抓取」为前提的商务与合规设计  

你**调用他们的 API**，相当于把「发请求 + 抗反爬 + 解析」外包给他们；**你付钱买的是这部分能力**，而不是「LLM 魔法」。

### 3.4 总结对比

| 方式 | 谁在发请求 | 反爬/拦截 | 典型结果 |
|------|------------|-----------|----------|
| **你直接 curl** | 你的机器、你的 IP | 容易触发反爬、限速、空白页 | 不稳定，很多站抓不到 |
| **LLM（带 browse 的模型）** | 模型提供方的服务器与基础设施 | 由提供方处理（代理、浏览器等） | 取决于提供方，模型本身不「解决」反爬 |
| **Tavily / Firecrawl** | 他们的服务器与抓取集群 | 他们负责代理、渲染、策略 | 按次/按量计费，拿到清洗后的内容 |

**一句话**：  
- **反爬不是被 LLM 解决的，而是被「谁在发请求、用什么基础设施」决定的。**  
- **curl = 你自己扛反爬；Tavily/Firecrawl = 他们扛；LLM 能抓 = 模型提供方在后台扛。**

---

如需把上述结论合并进主分析文档，可在 `analysis.md` 末尾加一节「FAQ」并引用本文件，或把本文件内容摘要粘贴进去。
