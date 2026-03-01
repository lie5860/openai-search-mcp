#!/usr/bin/env node

/**
 * 服务器能力自测：配置校验、fetch 引擎状态、搜索 + 一次 fetch（引擎由 FETCH_ENGINE 决定）
 * 使用方式（项目根目录）：npm run build && npm run test-server
 * 环境变量 FETCH_ENGINE=llm|tavily|firecrawl 决定第 5 步用哪个引擎，默认 llm
 */

import "dotenv/config";
import { config } from "../dist/config/index.js";
import { OpenAISearchProvider } from "../dist/providers/openai.js";
import { fetchWithTavily } from "../dist/providers/tavily.js";
import { fetchWithFirecrawl } from "../dist/providers/firecrawl.js";

async function testMCPServer() {
  console.log("🚀 OpenAI Search MCP · 服务器能力自测\n");

  try {
    const validation = await config.validate();
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    console.log("1. 配置校验: ✅ 通过");

    const openaiConfig = await config.getConfig();
    console.log("2. 当前配置:");
    console.log("   API URL:", openaiConfig.apiUrl);
    console.log("   模型:", openaiConfig.model);

    const fetchEngines = {
      llm: "默认",
      tavily_configured: Boolean(config.tavilyApiKey),
      firecrawl_configured: Boolean(config.firecrawlApiKey),
    };
    console.log("3. Fetch 引擎状态:", JSON.stringify(fetchEngines));

    const fetchEngine = (process.env.FETCH_ENGINE || "llm").toLowerCase();
    const allowed = ["llm", "tavily", "firecrawl"];
    const engine = allowed.includes(fetchEngine) ? fetchEngine : "llm";
    console.log("4. 本次 fetch 使用引擎: " + engine + (process.env.FETCH_ENGINE ? " (来自 FETCH_ENGINE)" : " (默认)"));
    console.log("");

    const provider = new OpenAISearchProvider(
      openaiConfig.apiUrl,
      openaiConfig.apiKey,
      openaiConfig.model
    );

    console.log("5. 测试搜索...");
    const searchResult = await provider.search("MCP 协议介绍", "", 2, 3);
    const searchPreview = (searchResult || "").trim();
    const searchStr =
      searchPreview.length > 120
        ? searchPreview.slice(0, 120).replace(/\n/g, " ") + "…"
        : searchPreview.slice(0, 120).replace(/\n/g, " ") || "（无内容）";
    console.log("   预览:", searchStr);
    console.log("   ✅ 搜索正常");

    const testUrl = "https://httpbin.org/html";
    let fetchResult = null;

    if (engine === "tavily") {
      if (!config.tavilyApiKey) {
        throw new Error("FETCH_ENGINE=tavily 但未设置 TAVILY_API_KEY");
      }
      console.log("6. 测试 fetch [引擎: tavily]...");
      fetchResult = await fetchWithTavily(testUrl, config.tavilyApiUrl, config.tavilyApiKey);
    } else if (engine === "firecrawl") {
      if (!config.firecrawlApiKey) {
        throw new Error("FETCH_ENGINE=firecrawl 但未设置 FIRECRAWL_API_KEY");
      }
      console.log("6. 测试 fetch [引擎: firecrawl]...");
      fetchResult = await fetchWithFirecrawl(
        testUrl,
        config.firecrawlApiUrl,
        config.firecrawlApiKey
      );
    } else {
      console.log("6. 测试 fetch [引擎: llm]...");
      fetchResult = await provider.fetch(testUrl);
    }

    const preview = (fetchResult || "").trim();
    const previewStr =
      preview.length > 120
        ? preview.slice(0, 120).replace(/\n/g, " ") + "…"
        : preview.slice(0, 120).replace(/\n/g, " ") || "（无内容）";
    console.log("   预览:", previewStr);
    console.log("   ✅ fetch 成功 [引擎: " + engine + "]");

    console.log("\n✅ 所有检查通过");
    console.log("💡 启动完整 MCP 服务: npm run start 或 npx openai-search-mcp\n");
  } catch (error) {
    console.error("❌ 失败:", error.message);
    console.error("\n💡 请设置 OPENAI_API_URL、OPENAI_API_KEY；若 FETCH_ENGINE=tavily 需 TAVILY_API_KEY，=firecrawl 需 FIRECRAWL_API_KEY");
    console.error("   或在项目根 .env 中配置后重试。\n");
    process.exit(1);
  }
}

testMCPServer();
