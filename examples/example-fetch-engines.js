#!/usr/bin/env node

/**
 * 自测链条：验证 web_fetch 三种引擎（llm / tavily / firecrawl）
 * 使用方式（在项目根目录）：
 *   npm run build
 *   node examples/example-fetch-engines.js
 * 可选：在项目根创建 .env 或设置环境变量 OPENAI_*、TAVILY_API_KEY、FIRECRAWL_API_KEY
 *
 * 测试完成后会在项目根的 test-results/ 目录生成每个引擎的 Markdown 结果文件，
 * 以及一份汇总对比报告 _comparison.md。
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "../dist/config/index.js";
import { OpenAISearchProvider } from "../dist/providers/openai.js";
import { fetchWithTavily } from "../dist/providers/tavily.js";
import { fetchWithFirecrawl } from "../dist/providers/firecrawl.js";

const TEST_URL = "https://httpbin.org/html";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.resolve(__dirname, "..", "test-results");

function ensureResultsDir() {
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }
}

function saveResult(engine, content, elapsed, error) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${engine}-${ts}.md`;
  const filepath = path.join(RESULTS_DIR, filename);

  let md = `# Fetch 结果 — 引擎: ${engine}\n\n`;
  md += `| 项目 | 值 |\n|---|---|\n`;
  md += `| URL | ${TEST_URL} |\n`;
  md += `| 时间 | ${new Date().toISOString()} |\n`;
  md += `| 耗时 | ${elapsed != null ? elapsed + " ms" : "N/A"} |\n`;
  md += `| 状态 | ${error ? "❌ 失败" : "✅ 成功"} |\n`;
  if (error) {
    md += `| 错误 | ${error} |\n`;
  }
  md += `| 内容长度 | ${content ? content.length + " 字符" : "0 字符"} |\n`;
  md += `\n---\n\n## 抓取内容\n\n`;
  md += content || "（无内容）";
  md += "\n";

  fs.writeFileSync(filepath, md, "utf-8");
  return { filename, filepath };
}

function saveComparison(results) {
  const filepath = path.join(RESULTS_DIR, "_comparison.md");

  let md = `# Fetch 引擎对比报告\n\n`;
  md += `- **测试 URL**: ${TEST_URL}\n`;
  md += `- **测试时间**: ${new Date().toISOString()}\n\n`;
  md += `## 性能对比\n\n`;
  md += `| 引擎 | 状态 | 耗时 (ms) | 内容长度 (字符) | 结果文件 |\n`;
  md += `|------|------|-----------|----------------|----------|\n`;

  for (const r of results) {
    const status = r.error ? "❌ 失败" : "✅ 成功";
    const elapsed = r.elapsed != null ? r.elapsed : "N/A";
    const len = r.content ? r.content.length : 0;
    const file = r.filename || "—";
    md += `| ${r.engine} | ${status} | ${elapsed} | ${len} | ${file} |\n`;
  }

  md += `\n## 各引擎内容预览（前 500 字符）\n\n`;
  for (const r of results) {
    md += `### ${r.engine}\n\n`;
    if (r.error) {
      md += `> 错误: ${r.error}\n\n`;
    } else if (r.content) {
      const preview = r.content.length > 500 ? r.content.slice(0, 500) + "\n\n...(截断)" : r.content;
      md += `${preview}\n\n`;
    } else {
      md += `（无内容）\n\n`;
    }
  }

  fs.writeFileSync(filepath, md, "utf-8");
  return filepath;
}

function formatPreview(text, maxLen = 150) {
  const s = (text || "").trim();
  if (!s) return "（无内容）";
  const oneLine = s.replace(/\n/g, " ");
  return oneLine.length > maxLen ? oneLine.slice(0, maxLen) + "…" : oneLine;
}

function fmtMs(ms) {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

async function main() {
  console.log("=== OpenAI Search MCP · Fetch 引擎自测 ===\n");

  const validation = await config.validate();
  console.log("1. 配置校验:", validation.valid ? "✅ 通过" : "❌ " + (validation.error ?? "未知错误"));

  const fetchEngines = {
    llm: "默认（OpenAI 兼容模型）",
    tavily_configured: Boolean(config.tavilyApiKey),
    firecrawl_configured: Boolean(config.firecrawlApiKey),
  };
  console.log("2. Fetch 引擎状态:", JSON.stringify(fetchEngines, null, 2));
  console.log("");

  if (!validation.valid) {
    console.log("请设置 OPENAI_API_URL 和 OPENAI_API_KEY 后重试。");
    process.exit(1);
  }

  ensureResultsDir();
  const openaiConfig = await config.getConfig();
  const allResults = [];

  // --- 引擎 llm ---
  console.log("3. 测试 fetch_engine=llm ...");
  {
    const t0 = Date.now();
    let content = null, error = null;
    try {
      const provider = new OpenAISearchProvider(
        openaiConfig.apiUrl,
        openaiConfig.apiKey,
        openaiConfig.model
      );
      content = await provider.fetch(TEST_URL);
    } catch (e) {
      error = e.message;
    }
    const elapsed = Date.now() - t0;
    const { filename } = saveResult("llm", content, elapsed, error);
    allResults.push({ engine: "llm", content, elapsed, error, filename });

    if (error) {
      console.log(`   [引擎: llm] ❌ 失败 (${fmtMs(elapsed)}):`, error);
    } else {
      console.log(`   [引擎: llm] ✅ 成功 (${fmtMs(elapsed)}, ${(content || "").length} 字符)`);
      console.log("   预览:", formatPreview(content));
    }
  }
  console.log("");

  // --- 引擎 tavily ---
  if (config.tavilyApiKey) {
    console.log("4. 测试 fetch_engine=tavily ...");
    const t0 = Date.now();
    let content = null, error = null;
    try {
      content = await fetchWithTavily(TEST_URL, config.tavilyApiUrl, config.tavilyApiKey);
    } catch (e) {
      error = e.message;
    }
    const elapsed = Date.now() - t0;
    const { filename } = saveResult("tavily", content, elapsed, error);
    allResults.push({ engine: "tavily", content, elapsed, error, filename });

    if (error) {
      console.log(`   [引擎: tavily] ❌ 失败 (${fmtMs(elapsed)}):`, error);
    } else {
      console.log(`   [引擎: tavily] ✅ 成功 (${fmtMs(elapsed)}, ${(content || "").length} 字符)`);
      console.log("   预览:", formatPreview(content));
    }
  } else {
    console.log("4. 跳过 fetch_engine=tavily（未设置 TAVILY_API_KEY）");
    allResults.push({ engine: "tavily", content: null, elapsed: null, error: "未配置 TAVILY_API_KEY", filename: null });
  }
  console.log("");

  // --- 引擎 firecrawl ---
  if (config.firecrawlApiKey) {
    console.log("5. 测试 fetch_engine=firecrawl ...");
    const t0 = Date.now();
    let content = null, error = null;
    try {
      content = await fetchWithFirecrawl(
        TEST_URL,
        config.firecrawlApiUrl,
        config.firecrawlApiKey
      );
    } catch (e) {
      error = e.message;
    }
    const elapsed = Date.now() - t0;
    const { filename } = saveResult("firecrawl", content, elapsed, error);
    allResults.push({ engine: "firecrawl", content, elapsed, error, filename });

    if (error) {
      console.log(`   [引擎: firecrawl] ❌ 失败 (${fmtMs(elapsed)}):`, error);
    } else {
      console.log(`   [引擎: firecrawl] ✅ 成功 (${fmtMs(elapsed)}, ${(content || "").length} 字符)`);
      console.log("   预览:", formatPreview(content));
    }
  } else {
    console.log("5. 跳过 fetch_engine=firecrawl（未设置 FIRECRAWL_API_KEY）");
    allResults.push({ engine: "firecrawl", content: null, elapsed: null, error: "未配置 FIRECRAWL_API_KEY", filename: null });
  }

  // --- 汇总对比 ---
  console.log("\n--- 耗时对比 ---");
  for (const r of allResults) {
    const bar = r.elapsed != null ? "█".repeat(Math.max(1, Math.round(r.elapsed / 200))) : "";
    const status = r.error ? "❌" : "✅";
    const time = r.elapsed != null ? fmtMs(r.elapsed) : "跳过";
    console.log(`  ${r.engine.padEnd(10)} ${status} ${time.padStart(10)}  ${bar}`);
  }

  const compPath = saveComparison(allResults);
  console.log(`\n📄 对比报告: ${path.relative(process.cwd(), compPath)}`);
  console.log(`📁 详细结果: ${path.relative(process.cwd(), RESULTS_DIR)}/`);
  console.log("\n=== 自测结束 ===");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
