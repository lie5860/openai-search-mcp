import type { SearchResult, MCPContext } from '../types/index.js';
import { retryWithContext, isRetriableError } from '../utils/retry.js';
import { logInfo } from '../utils/logger.js';
import { config } from '../config/index.js';
import { fetchWithPolyfill } from '../utils/fetch.js';

/**
 * Grok API 提供者
 */
export class GrokSearchProvider {
  private apiUrl: string;
  private apiKey: string;
  private model: string;

  constructor(apiUrl: string, apiKey: string, model: string = 'grok-4-fast') {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.model = model;
  }

  /**
   * 执行搜索
   */
  async search(
    query: string,
    platform: string = '',
    minResults: number = 3,
    maxResults: number = 10,
    ctx?: MCPContext
  ): Promise<string> {
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };

    let platformPrompt = '';
    let returnPrompt = '';

    if (platform) {
      platformPrompt = `\n\nYou should search the web for the information you need, and focus on these platform: ${platform}`;
    }

    if (maxResults) {
      returnPrompt = `\n\nYou should return the results in a JSON format, and the results should at least be ${minResults} and at most be ${maxResults} results.`;
    }

    const searchPrompt = this.getSearchPrompt();

    const payload = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: searchPrompt
        },
        {
          role: 'user',
          content: query + platformPrompt + returnPrompt
        }
      ],
      stream: true
    };

    await logInfo(ctx, `platform_prompt: ${query + platformPrompt + returnPrompt}`, config.debugEnabled);

    return retryWithContext(
      () => this.executeStream(headers, payload, ctx),
      {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        onRetry: (attempt, error) => {
          logInfo(ctx, `Retry attempt ${attempt}: ${error.message}`, config.debugEnabled);
        }
      }
    );
  }

  /**
   * 抓取网页内容
   */
  async fetch(url: string, ctx?: MCPContext): Promise<string> {
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };

    const fetchPrompt = this.getFetchPrompt();

    const payload = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: fetchPrompt
        },
        {
          role: 'user',
          content: `${url}\n获取该网页内容并返回其结构化Markdown格式`
        }
      ],
      stream: true
    };

    return retryWithContext(
      () => this.executeStream(headers, payload, ctx),
      {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        onRetry: (attempt, error) => {
          logInfo(ctx, `Retry attempt ${attempt}: ${error.message}`, config.debugEnabled);
        }
      }
    );
  }

  /**
   * 切换模型
   */
  switchModel(newModel: string): void {
    this.model = newModel;
  }

  /**
   * 获取当前模型
   */
  getModel(): string {
    return this.model;
  }

  /**
   * 执行流式请求
   */
  private async executeStream(headers: Record<string, string>, payload: any, ctx?: MCPContext): Promise<string> {
    const response = await fetchWithPolyfill(`${this.apiUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Grok API error: ${response.status} - ${errorText}`);
    }

    // 处理流式响应
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let content = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const choices = parsed.choices || [];
          if (choices.length > 0) {
            const delta = choices[0].delta || {};
            if (delta.content) {
              content += delta.content;
            }
          }
        } catch (e) {
          // 忽略 JSON 解析错误
        }
      }
    }

    return content;
  }

  /**
   * 获取搜索提示词
   */
  private getSearchPrompt(): string {
    return `# Role
你是一个专业的搜索助手，负责执行网络搜索任务并返回结构化的搜索结果。

## Objective
根据用户的查询，执行网络搜索，并以标准 JSON 格式返回搜索结果。

## Skills
1. 网络搜索与信息检索
2. JSON 格式化能力
3. 信息精炼与提取
4. 多源检索策略
5. 结果呈现能力

## Workflow
1. 理解查询意图: 分析用户搜索需求，识别关键信息点
2. 构建搜索策略: 确定搜索维度、关键词组合、目标信息源
3. 执行多源检索: 并行或顺序调用多个信息源进行深度搜索
4. 信息质量评估: 对检索结果进行相关性、可信度、时效性评分
5. 内容提炼整合: 提取核心信息，去重合并，生成结构化摘要
6. JSON格式输出: 严格按照标准格式转换所有结果，确保可解析性
7. 验证与输出: 验证JSON格式正确性后输出最终结果

## Rules
### JSON格式化强制规范
- 语法正确性: 输出必须是可直接解析的合法JSON，禁止任何语法错误
- 标准结构: 必须以数组形式返回，每个元素为包含三个字段的对象
- 字段定义:
  {
    "title": "string, 必填, 结果标题",
    "url": "string, 必填, 有效访问链接",
    "description": "string, 必填, 20-50字核心描述"
  }
- 引号规范: 所有键名和字符串值必须使用双引号，禁止单引号
- 逗号规范: 数组最后一个元素后禁止添加逗号
- 编码规范: 使用UTF-8编码，中文直接显示不转义为Unicode
- 缩进格式: 使用2空格缩进，保持结构清晰
- 纯净输出: JSON前后不添加\`\`\`json\`\`\`标记或任何其他文字

## Output Format
返回标准的 JSON 数组，每个结果包含 title、url、description 字段。`;
  }

  /**
   * 获取网页抓取提示词
   */
  private getFetchPrompt(): string {
    return `# Role
你是一个专业的网页内容提取器，负责将网页内容转换为结构化的 Markdown 文档。

## Objective
访问指定 URL，提取完整的网页内容，并转换为结构化的 Markdown 格式。

## Skills
1. 网页内容抓取与解析
2. HTML 到 Markdown 的格式转换
3. 内容结构识别与重组
4. 多媒体元素处理
5. 代码片段提取

## Rules
### 内容一致性原则（核心）
- 返回内容必须与原网页内容完全一致，不能有信息缺失
- 保持原网页的所有文本、结构和语义信息
- 不进行内容摘要、精简、改写或总结
- 保留原始的段落划分、换行、空格等格式细节

### 格式转换优化
- HTML 转 Markdown：保持 100% 内容一致性
- 表格处理：使用 Markdown 表格语法（|---|---|）
- 代码片段：用 三重反引号语言标识三重反引号 包裹，保留原始缩进
- 图片处理：转换为 感叹号方括号alt方括号圆括号url圆括号 格式，保留所有属性
- 链接处理：转换为 方括号文本右方括号圆括号URL圆括号 格式，保持完整路径
- 强调样式：<strong> → **粗体**，<em> → *斜体*

### 内容完整性保障
- 零删减原则：不删减任何原网页文本内容
- 元数据保留：保留时间戳、作者信息、标签等关键信息
- 多媒体标注：视频、音频以链接或占位符标注（[视频: 标题](URL)）
- 动态内容处理：尽可能抓取完整内容

## Output Format
直接输出 Markdown 格式的网页内容，不添加任何额外的说明文字。`;
  }
}
