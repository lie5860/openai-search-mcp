import fetch from "node-fetch";

import { config } from "../config/index.js";
import { logInfo } from "../utils/logger.js";
import { fetchPrompt, searchPrompt } from "../utils/prompt.js";
import { retryWithContext } from "../utils/retry.js";

import type { OpenAIPayload, OpenAIStreamResponse, MCPContext } from "../types/index.js";

/**
 * OpenAI API 提供者
 */
export class OpenAISearchProvider {
  private apiUrl: string;
  private apiKey: string;
  private model: string;

  constructor(apiUrl: string, apiKey: string, model: string = "gpt-4o") {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.model = model;
  }

  /**
   * 执行搜索
   */
  async search(
    query: string,
    platform: string = "",
    minResults: number = 3,
    maxResults: number = 10,
    ctx?: MCPContext
  ): Promise<string> {
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    let platformPrompt = "";
    let returnPrompt = "";

    if (platform) {
      platformPrompt = `\n\nYou should search the web for the information you need, and focus on these platform: ${platform}`;
    }

    if (maxResults) {
      returnPrompt = `\n\nYou should return the results in a JSON format, and the results should at least be ${minResults} and at most be ${maxResults} results.`;
    }

    const payload: OpenAIPayload = {
      model: this.model,
      messages: [
        {
          role: "system",
          content: searchPrompt,
        },
        {
          role: "user",
          content: query + platformPrompt + returnPrompt,
        },
      ],
      stream: true,
    };

    await logInfo(
      ctx,
      `platform_prompt: ${query + platformPrompt + returnPrompt}`,
      config.debugEnabled
    );

    return retryWithContext(() => this.executeStream(headers, payload, ctx), {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      onRetry: (attempt, error) => {
        logInfo(ctx, `Retry attempt ${attempt}: ${error.message}`, config.debugEnabled);
      },
    });
  }

  /**
   * 抓取网页内容
   */
  async fetch(url: string, ctx?: MCPContext): Promise<string> {
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    const payload: OpenAIPayload = {
      model: this.model,
      messages: [
        {
          role: "system",
          content: fetchPrompt,
        },
        {
          role: "user",
          content: `${url}\nFetch the content of this webpage and return it in structured Markdown format`,
        },
      ],
      stream: true,
    };

    return retryWithContext(() => this.executeStream(headers, payload, ctx), {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      onRetry: (attempt, error) => {
        logInfo(ctx, `Retry attempt ${attempt}: ${error.message}`, config.debugEnabled);
      },
    });
  }

  /**
   * 执行流式请求
   */
  private async executeStream(
    headers: Record<string, string>,
    payload: OpenAIPayload,
    _ctx?: MCPContext
  ): Promise<string> {
    const response = await fetch(`${this.apiUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    let content = "";
    let buffer = "";

    for await (const chunk of response.body) {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed?.startsWith("data: ")) continue;

        const data = trimmed.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data) as OpenAIStreamResponse;
          const choices = parsed.choices || [];
          if (choices.length > 0) {
            const delta = choices[0].delta || {};
            if (delta.content) {
              content += delta.content;
            }
          }
        } catch (_e) {
          // 忽略 JSON 解析错误
        }
      }
    }

    return content;
  }
}
