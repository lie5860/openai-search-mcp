# 项目定位：openai-search-mcp

与项目名称一致的产品边界与 Fetch 引擎策略。

---

## 一、与项目名称对应的定位

**openai-search-mcp** 可明确为：

- 用户提供的是 **符合 OpenAI 请求规范的 LLM 接口**（任意兼容 `/chat/completions` 的后端）。
- 该模型/后端 **必须具备 search 能力**（即「搜索」由用户配置的这台 LLM 完成，而不是由本 MCP 再接一个第三方搜索 API）。
- 本 MCP 的职责：**对接这台「带 search 的 OpenAI 兼容模型」**，通过 MCP 暴露 `web_search` / `web_fetch` 等工具，供 Claude 等客户端调用。

也就是说：**Search = 用户自己的 OpenAI 兼容模型（必须带 search）**；项目名里的 “openai” 指的就是「用你这台 OpenAI 规约的模型来做搜索」。

---

## 二、Fetch 的引擎策略：默认 LLM，参数选引擎

你的结论可以概括为：

- **Fetch 不绑死一种实现**，而是支持多种引擎：**LLM / Tavily / Firecrawl**。
- **默认使用 LLM**（与当前实现一致：把 URL 交给同一台 OpenAI 兼容模型，依赖其 browse 能力）。
- **通过参数显式选择**本次 fetch 用哪个引擎，而不是「只做优先级链」：
  - 例如工具参数：`fetch_engine?: "llm" | "tavily" | "firecrawl"`，默认 `"llm"`。
  - 用户/调用方在需要时明确指定 `tavily` 或 `firecrawl`，获得真实 HTTP 抓取与抗反爬能力。

这样设计是合理的，原因包括：

1. **与项目名一致**：以「用户的 OpenAI 兼容模型」为中心，search 和默认 fetch 都走这台模型；扩展 Tavily/Firecrawl 是**可选增强**，不改变「主入口是用户自己的模型」这一定位。
2. **行为可预期**：默认 LLM 不引入额外 API Key 与计费；需要更高成功率、真实抓取时，由调用方**显式选择**引擎，避免隐式回退带来的不确定性和成本。
3. **实现简单**：引擎选择是「单次请求用谁」，逻辑清晰；若以后需要「失败后自动换引擎」，可以在「选中的引擎」之上再加一层 fallback，与「参数选引擎」正交。

**为何要做多引擎（根本原因）**：实测与验证表明，(1) **LLM fetch 通常比专业抓取慢**（例如约 14s vs Tavily/Firecrawl 约 1s）；(2) **LLM 存在缓存或模型推断**，并可能**自行添加无关信息**，导致返回内容与当前页面不一致。因此提供 Tavily/Firecrawl 选项，在需要「快速、忠实、未篡改」正文时选用。

---

## 三、两种策略的区分（可选实现）

| 策略 | 含义 | 建议 |
|------|------|------|
| **参数选引擎** | 调用时指定本次 fetch 用 `llm` / `tavily` / `firecrawl`，默认 `llm` | ✅ 作为主策略，与「默认 LLM」定位一致 |
| **优先级链** | 例如先 Tavily，失败再 Firecrawl，再失败再 LLM | 可选：作为某一引擎**内部的** fallback（如 Tavily 失败再 Firecrawl），或作为配置项「当引擎 X 失败时是否自动尝试 Y」 |

当前阶段优先做「**默认 LLM + 参数选引擎**」即可；是否做「链式 fallback」可后续按需求再加。

---

## 四、小结

- **Search**：始终由用户提供的、**带 search 能力的 OpenAI 兼容模型**完成；项目名中的 “openai” 指的就是这台模型。
- **Fetch**：默认用 **同一台 LLM**（依赖其 browse）；通过**参数**可选择使用 **Tavily** 或 **Firecrawl**，用于需要真实抓取、抗反爬的场景。
- 你的分析与上述定位一致；实现上建议先落实「默认 LLM + 参数选 fetch 引擎」，再视需要增加 fallback 或更多引擎。
