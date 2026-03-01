import fetch from "node-fetch";

import { config } from "../config/index.js";
import { logInfo } from "../utils/logger.js";

import type { MCPContext } from "../types/index.js";

/**
 * Firecrawl Scrape 响应结构（v2）
 * 参考：https://docs.firecrawl.dev/api-reference/endpoint/scrape
 */
interface FirecrawlScrapeResponse {
  data?: {
    markdown?: string;
    [key: string]: unknown;
  };
  success?: boolean;
  error?: string;
}

/**
 * 使用 Firecrawl Scrape API 抓取单 URL，返回 Markdown 内容。
 * 空内容时会重试（递增 waitFor），与上游 GrokSearch 行为一致。
 */
export async function fetchWithFirecrawl(
  url: string,
  apiUrl: string,
  apiKey: string,
  ctx?: MCPContext
): Promise<string | null> {
  const endpoint = `${apiUrl.replace(/\/$/, "")}/scrape`;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const waitFor = attempt * 1500;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        timeout: 60000,
        waitFor,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      await logInfo(ctx, `Firecrawl error: ${response.status} ${text}`, config.debugEnabled);
      return null;
    }

    const data = (await response.json()) as FirecrawlScrapeResponse;
    const markdown = data.data?.markdown ?? "";

    if (markdown.trim()) {
      return markdown;
    }

    await logInfo(
      ctx,
      `Firecrawl: markdown empty, retry ${attempt}/${maxAttempts}`,
      config.debugEnabled
    );
  }

  return null;
}
