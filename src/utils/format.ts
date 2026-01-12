import type { SearchResult } from '../types/index.js';

/**
 * 格式化搜索结果
 */
export function formatSearchResults(results: SearchResult[]): string {
  if (!results || results.length === 0) {
    return 'No results found.';
  }

  const formatted = results.map((result, index) => {
    const parts = [`## Result ${index + 1}: ${result.title}`];

    if (result.url) {
      parts.push(`**URL:** ${result.url}`);
    }

    if (result.snippet) {
      parts.push(`**Summary:** ${result.snippet}`);
    }

    if (result.source) {
      parts.push(`**Source:** ${result.source}`);
    }

    if (result.published_date) {
      parts.push(`**Published:** ${result.published_date}`);
    }

    return parts.join('\n');
  });

  return formatted.join('\n\n---\n\n');
}

/**
 * 从文本中提取搜索结果 (JSON 格式)
 */
export function parseSearchResults(text: string): SearchResult[] {
  try {
    // 尝试找到 JSON 数组
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    return [];
  }
}

/**
 * 格式化为 JSON 字符串
 */
export function formatJson(data: any): string {
  return JSON.stringify(data, null, 2);
}
