#!/usr/bin/env node
import { createRequire } from "module";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fetch from "node-fetch";
import { z } from "zod";

import { config } from "./config/index.js";
import { fetchWithFirecrawl } from "./providers/firecrawl.js";
import { OpenAISearchProvider } from "./providers/openai.js";
import { fetchWithTavily } from "./providers/tavily.js";
import { logInfo } from "./utils/logger.js";

import type { TestResult } from "./types/index.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { version: string };

interface IMCPContext {
  info?: (message: string) => Promise<void>;
  reportProgress?: (progress: number, total?: number) => Promise<void>;
}

// 创建 MCP 服务器
const server = new McpServer({
  name: "openai-search",
  version: "1.0.0",
});

/**
 * 实现上下文报告
 */
class MCPCtx implements IMCPContext {
  async info(message: string): Promise<void> {
    console.error(message);
  }

  async reportProgress(progress: number, total?: number): Promise<void> {
    console.error(`Progress: ${progress}${total ? `/${total}` : ""}`);
  }
}

// 注册 web_search 工具
server.registerTool(
  "web_search",
  {
    description: `Performs a third-party web search based on the given query and returns the results as a JSON string.

The \`query\` should be a clear, self-contained natural-language search query.
When helpful, include constraints such as topic, time range, language, or domain.

The \`platform\` should be the platforms which you should focus on searching, such as "Twitter", "GitHub", "Reddit", etc.

The \`min_results\` and \`max_results\` should be the minimum and maximum number of results to return.

Returns
-------
A JSON-encoded string representing a list of search results. Each result includes at least:
- \`url\`: the link to the result
- \`title\`: a short title
- \`summary\`: a brief description or snippet of the page content.`,
    inputSchema: {
      query: z.string().describe("Search query keyword"),
      platform: z.string().optional().describe("Specify search platform"),
      min_results: z.number().optional().default(3).describe("Minimum number of results"),
      max_results: z.number().optional().default(10).describe("Maximum number of results"),
    },
  },
  async ({ query, platform = "", min_results = 3, max_results = 10 }) => {
    const ctx = new MCPCtx();
    const openaiConfig = await config.getConfig();
    const provider = new OpenAISearchProvider(
      openaiConfig.apiUrl,
      openaiConfig.apiKey,
      openaiConfig.model
    );

    await logInfo(ctx, `Begin Search: ${query}`, config.debugEnabled);
    const results = await provider.search(query, platform, min_results, max_results, ctx);
    await logInfo(ctx, "Search Finished!", config.debugEnabled);

    return { content: [{ type: "text", text: results }] };
  }
);

// 注册 web_fetch 工具
server.registerTool(
  "web_fetch",
  {
    description: `Fetches and extracts the complete content from a specified URL and returns it as a structured Markdown document.

The \`url\` should be a valid HTTP/HTTPS web address pointing to the target page.
Ensure the URL is complete and accessible (not behind authentication or paywalls).

\`fetch_engine\` (optional): Which engine to use. When omitted, the server uses the \`FETCH_ENGINE\` env (default \`llm\`). \`llm\` = OpenAI-compatible model; \`tavily\` / \`firecrawl\` = dedicated crawl (set TAVILY_API_KEY or FIRECRAWL_API_KEY).

Returns
-------
A Markdown-formatted string containing:
- Metadata header (source URL, title, fetch timestamp)
- Table of Contents (if applicable)
- Complete page content with preserved structure
- All text, links, images, tables, and code blocks from the original page

Notes
-----
- Does NOT summarize or modify content - returns complete original text
- \`tavily\` / \`firecrawl\` perform real HTTP fetch and handle anti-bot; \`llm\` depends on the model's browse capability.`,
    inputSchema: {
      url: z.string().describe("The URL of the web page to fetch"),
      fetch_engine: z
        .enum(["llm", "tavily", "firecrawl"])
        .optional()
        .describe(
          "Engine for fetch: llm (model), tavily (Tavily API), firecrawl (Firecrawl API). When omitted, server uses FETCH_ENGINE env."
        ),
    },
  },
  async ({ url, fetch_engine }) => {
    const ctx = new MCPCtx();
    const engine = fetch_engine ?? config.defaultFetchEngine;

    if (engine === "llm") {
      const openaiConfig = await config.getConfig();
      const provider = new OpenAISearchProvider(
        openaiConfig.apiUrl,
        openaiConfig.apiKey,
        openaiConfig.model
      );
      await logInfo(ctx, `Begin Fetch (LLM): ${url}`, config.debugEnabled);
      const results = await provider.fetch(url, ctx);
      await logInfo(ctx, "Fetch Finished!", config.debugEnabled);
      return { content: [{ type: "text", text: results }] };
    }

    if (engine === "tavily") {
      const apiKey = config.tavilyApiKey;
      if (!apiKey) {
        return {
          content: [
            {
              type: "text" as const,
              text: "TAVILY_API_KEY is not set. Set the environment variable to use fetch_engine=tavily.",
            },
          ],
        };
      }
      await logInfo(ctx, `Begin Fetch (Tavily): ${url}`, config.debugEnabled);
      try {
        const result = await fetchWithTavily(url, config.tavilyApiUrl, apiKey);
        await logInfo(
          ctx,
          result ? "Fetch Finished (Tavily)!" : "Tavily returned no content.",
          config.debugEnabled
        );
        return {
          content: [
            {
              type: "text" as const,
              text: result ?? "Tavily Extract returned no content for this URL.",
            },
          ],
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Tavily fetch failed: ${msg}` }] };
      }
    }

    if (engine === "firecrawl") {
      const apiKey = config.firecrawlApiKey;
      if (!apiKey) {
        return {
          content: [
            {
              type: "text" as const,
              text: "FIRECRAWL_API_KEY is not set. Set the environment variable to use fetch_engine=firecrawl.",
            },
          ],
        };
      }
      await logInfo(ctx, `Begin Fetch (Firecrawl): ${url}`, config.debugEnabled);
      const result = await fetchWithFirecrawl(url, config.firecrawlApiUrl, apiKey, ctx);
      await logInfo(
        ctx,
        result ? "Fetch Finished (Firecrawl)!" : "Firecrawl returned no content.",
        config.debugEnabled
      );
      return {
        content: [
          {
            type: "text" as const,
            text: result ?? "Firecrawl Scrape returned no content for this URL.",
          },
        ],
      };
    }

    return { content: [{ type: "text" as const, text: `Unknown fetch_engine: ${engine}` }] };
  }
);

// 注册 get_config_info 工具
server.registerTool(
  "get_config_info",
  {
    description: `Returns the current OpenAI Search MCP server configuration information and tests the connection.

This tool is useful for:
- Verifying that environment variables are correctly configured
- Testing API connectivity by sending a request to /models endpoint
- Debugging configuration issues
- Checking the current API endpoint and settings

Returns
-------
A JSON-encoded string containing configuration details:
- \`api_url\`: The configured OpenAI-compatible API endpoint
- \`api_key\`: The API key (masked for security, showing only first and last 4 characters)
- \`model\`: The currently selected model for search and fetch operations
- \`debug_enabled\`: Whether debug mode is enabled
- \`log_level\`: Current logging level
- \`log_dir\`: Directory where logs are stored
- \`config_status\`: Overall configuration status (✅ complete or ❌ error)
- \`connection_test\`: Result of testing API connectivity to /models endpoint
  - \`status\`: Connection status
  - \`message\`: Status message with model count
  - \`response_time_ms\`: API response time in milliseconds
  - \`available_models\`: List of available model IDs (only present on successful connection)

Notes
-----
- API keys are automatically masked for security
- This tool does not require any parameters
- Useful for troubleshooting before making actual search requests
- Automatically tests API connectivity during execution`,
  },
  async () => {
    const validation = await config.validate();
    const openaiConfig = await config.getConfig();

    let testResult: TestResult | undefined;
    if (validation.valid) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${openaiConfig.apiUrl}/models`, {
          headers: { Authorization: `Bearer ${openaiConfig.apiKey}` },
        });
        const responseTime = Date.now() - startTime;

        if (response.ok) {
          const data = (await response.json()) as { data?: Array<unknown> };
          testResult = {
            success: true,
            response_time: responseTime,
            model_count: data.data?.length || 0,
          };
        } else {
          testResult = { success: false, error: `HTTP ${response.status}` };
        }
      } catch (error) {
        testResult = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    const result = {
      version: pkg.version,
      api_url: openaiConfig.apiUrl,
      api_key_prefix: openaiConfig.apiKey.substring(0, 10) + "...",
      model: openaiConfig.model,
      status: validation.valid ? "✅ Configuration valid" : "❌ Configuration invalid",
      test_result: testResult,
      fetch_engines: {
        default: config.defaultFetchEngine,
        tavily_configured: Boolean(config.tavilyApiKey),
        firecrawl_configured: Boolean(config.firecrawlApiKey),
      },
    };

    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// 注册 switch_model 工具
server.registerTool(
  "switch_model",
  {
    description: `Switches the default AI model used for search and fetch operations, and persists the setting.

This tool is useful for:
- Changing the AI model used for web search and content fetching
- Testing different models for performance or quality comparison
- Persisting model preference across sessions

Parameters
----------
model : str
    The model ID to switch to (e.g., "gpt-4o", "gpt-4o-mini")

Returns
-------
A JSON-encoded string containing:
- \`status\`: Success or error status
- \`previous_model\`: The model that was being used before
- \`current_model\`: The newly selected model
- \`message\`: Status message
- \`config_file\`: Path where the model preference is saved

Notes
-----
- The model setting is persisted to ~/.config/openai-search/config.json
- This setting will be used for all future search and fetch operations
- You can verify available models using the get_config_info tool`,
    inputSchema: {
      model: z
        .union([z.enum(["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"]), z.string()])
        .describe("Model ID"),
    },
  },
  async ({ model }) => {
    const previousModel = await config.getConfig().then((c) => c.model);
    await config.switchModel(model);

    const result = {
      status: "success",
      previous_model: previousModel,
      current_model: model,
      message: `Model switched from ${previousModel} to ${model}`,
      config_file: config.configFile,
    };

    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// 注册 toggle_builtin_tools 工具
server.registerTool(
  "toggle_builtin_tools",
  {
    description: `Toggle Claude Code's built-in WebSearch and WebFetch tools on/off.

Parameters: action - "on" (block built-in), "off" (allow built-in), "status" (check)
Returns: JSON with current status and deny list`,
    inputSchema: {
      action: z.enum(["on", "off", "status"]).optional().default("status").describe("Action type"),
    },
  },
  async ({ action }) => {
    const blocked = action === "on";
    const message =
      action === "on"
        ? "Built-in WebSearch/WebFetch tools have been disabled"
        : action === "off"
          ? "Built-in WebSearch/WebFetch tools have been enabled"
          : "Current status query";

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              blocked,
              deny_list: ["WebSearch", "WebFetch"],
              file: "~/.config/claude/claude_desktop_config.json",
              message,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

/**
 * 启动服务器
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("OpenAI Search MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
