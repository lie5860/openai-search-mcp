import fetch from "node-fetch";

/**
 * 使用 Tavily Extract API 抓取单 URL，返回 Markdown 内容。
 * 参考：https://docs.tavily.com/documentation/api-reference/endpoint/extract
 */
export async function fetchWithTavily(
  url: string,
  apiUrl: string,
  apiKey: string
): Promise<string | null> {
  const endpoint = `${apiUrl.replace(/\/$/, "")}/extract`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      urls: [url],
      format: "markdown",
      extract_depth: "advanced",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Tavily Extract API error: ${response.status} - ${text}`);
  }

  const data = (await response.json()) as {
    results?: Array<Record<string, unknown> & { raw_content?: string; content?: string; markdown?: string }>;
    failed_results?: Array<{ url: string; error: string }>;
  };

  if (data.failed_results && data.failed_results.length > 0) {
    const fail = data.failed_results[0];
    throw new Error(`Tavily Extract failed for ${fail.url}: ${fail.error}`);
  }

  if (!data.results || data.results.length === 0) {
    return null;
  }

  const first = data.results[0];
  const content =
    (first.raw_content ?? first.content ?? first.markdown ?? "") as string;
  const trimmed = content.trim();
  return trimmed || null;
}
