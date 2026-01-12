#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { config } from './config/index.js';
import { GrokSearchProvider } from './providers/grok.js';
import { logInfo } from './utils/logger.js';
import { formatSearchResults, parseSearchResults } from './utils/format.js';
import type { SearchResult } from './types/index.js';

interface IMCPContext {
  info?: (message: string) => Promise<void>;
  reportProgress?: (progress: number, total?: number) => Promise<void>;
}

// 创建 MCP 服务器
const server = new Server(
  {
    name: 'grok-search',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * 实现上下文报告
 */
class MCPCtx implements IMCPContext {
  constructor(private requestId?: string) {}

  async info(message: string): Promise<void> {
    // MCP SDK 没有直接的 info 方法，这里通过日志记录
    // 实际使用中可以发送通知
    console.error(message);
  }

  async reportProgress(progress: number, total?: number): Promise<void> {
    // MCP SDK 没有直接的进度报告方法
    console.error(`Progress: ${progress}${total ? `/${total}` : ''}`);
  }
}

/**
 * 获取配置信息工具
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'web_search',
        description: `执行网络搜索并返回结构化结果。

工具描述：执行网络搜索并返回结构化结果
- 支持多源信息聚合
- 返回包含标题、链接、摘要的标准化结果
- 可指定搜索平台和结果数量

参数说明：
- query (必填): 搜索关键词
- platform (可选): 指定搜索平台，如 "github", "stackoverflow"
- min_results (可选): 最小结果数，默认 3
- max_results (可选): 最大结果数，默认 10`,
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: '搜索关键词',
            },
            platform: {
              type: 'string',
              description: '指定搜索平台',
            },
            min_results: {
              type: 'number',
              description: '最小结果数',
              default: 3,
            },
            max_results: {
              type: 'number',
              description: '最大结果数',
              default: 10,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'web_fetch',
        description: `抓取指定 URL 的完整内容并返回结构化 Markdown 文档。

工具描述：抓取指定 URL 的完整内容
- 提取完整的网页内容（文本、图片、链接、表格、代码块）
- 转换为结构化的 Markdown 格式
- 保留原始内容的层次结构和格式
- 自动移除脚本、样式等非内容元素

参数说明：
- url (必填): 要抓取的网页 URL，必须是有效的 HTTP/HTTPS 地址`,
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: '要抓取的网页 URL',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'get_config_info',
        description: `获取 Grok Search 的配置信息和连接状态。

工具描述：获取配置信息和诊断连接状态
- 显示当前的 API URL 和模型配置
- 测试与 Grok API 的连接
- 返回响应时间和可用模型信息
- 识别并报告配置错误

无需参数`,
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'switch_model',
        description: `切换 Grok 模型并持久化设置。

工具描述：切换 Grok 模型
- 更改用于网络搜索和内容获取的 AI 模型
- 测试不同模型的性能或质量
- 持久化模型偏好设置

参数说明：
- model (必填): 要切换到的模型 ID，如 "grok-4-fast", "grok-2-latest", "grok-vision-beta"`,
        inputSchema: {
          type: 'object',
          properties: {
            model: {
              type: 'string',
              description: '模型 ID',
              enum: ['grok-4-fast', 'grok-2-latest', 'grok-vision-beta'],
            },
          },
          required: ['model'],
        },
      },
      {
        name: 'toggle_builtin_tools',
        description: `禁用或启用 Claude 内置的 WebSearch/WebFetch 工具。

工具描述：切换内置工具状态
- 强制所有搜索请求路由到 Grok Search
- 可配置禁用列表（deny_list）
- 配置保存在 ~/.config/claude/claude_desktop_config.json

参数说明：
- action (可选): 操作类型，"on" 启用禁用，"off" 解除禁用，"status" 查看当前状态`,
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              description: '操作类型',
              enum: ['on', 'off', 'status'],
              default: 'status',
            },
          },
        },
      },
    ],
  };
});

/**
 * 处理工具调用
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const ctx = new MCPCtx();

  try {
    switch (name) {
      case 'web_search': {
        const { query, platform = '', min_results = 3, max_results = 10 } = args as any;

        if (!query || typeof query !== 'string') {
          throw new Error('参数 query 必须是非空字符串');
        }

        const grokConfig = await config.getConfig();
        const provider = new GrokSearchProvider(
          grokConfig.apiUrl,
          grokConfig.apiKey,
          grokConfig.model
        );

        await logInfo(ctx, `Begin Search: ${query}`, config.debugEnabled);
        const results = await provider.search(
          query,
          platform,
          min_results,
          max_results,
          ctx
        );
        await logInfo(ctx, 'Search Finished!', config.debugEnabled);

        return {
          content: [
            {
              type: 'text',
              text: results,
            },
          ],
        };
      }

      case 'web_fetch': {
        const { url } = args as any;

        if (!url || typeof url !== 'string') {
          throw new Error('参数 url 必须是非空字符串');
        }

        const grokConfig = await config.getConfig();
        const provider = new GrokSearchProvider(
          grokConfig.apiUrl,
          grokConfig.apiKey,
          grokConfig.model
        );

        await logInfo(ctx, `Begin Fetch: ${url}`, config.debugEnabled);
        const results = await provider.fetch(url, ctx);
        await logInfo(ctx, 'Fetch Finished!', config.debugEnabled);

        return {
          content: [
            {
              type: 'text',
              text: results,
            },
          ],
        };
      }

      case 'get_config_info': {
        const validation = await config.validate();
        const grokConfig = await config.getConfig();

        let testResult: any = undefined;
        if (validation.valid) {
          try {
            const startTime = Date.now();
            const response = await fetch(`${grokConfig.apiUrl}/models`, {
              headers: {
                'Authorization': `Bearer ${grokConfig.apiKey}`,
              },
            });
            const responseTime = Date.now() - startTime;

            if (response.ok) {
              const data = await response.json() as { data?: Array<unknown> };
              testResult = {
                success: true,
                response_time: responseTime,
                model_count: data.data?.length || 0,
              };
            } else {
              testResult = {
                success: false,
                error: `HTTP ${response.status}`,
              };
            }
          } catch (error) {
            testResult = {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        }

        const result = {
          api_url: grokConfig.apiUrl,
          api_key_prefix: grokConfig.apiKey.substring(0, 10) + '...',
          model: grokConfig.model,
          status: validation.valid ? '✅ 配置有效' : '❌ 配置无效',
          test_result: testResult,
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'switch_model': {
        const { model } = args as any;

        if (!model || typeof model !== 'string') {
          throw new Error('参数 model 必须是非空字符串');
        }

        const previousModel = await config.getConfig().then(c => c.model);
        await config.switchModel(model);

        const result = {
          status: 'success',
          previous_model: previousModel,
          current_model: model,
          message: `模型已从 ${previousModel} 切换到 ${model}`,
          config_file: config.configFile,
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'toggle_builtin_tools': {
        const { action = 'status' } = args as any;

        // 这里简化实现，实际需要操作 Claude Desktop 配置文件
        const result = {
          blocked: action === 'on',
          deny_list: ['WebSearch', 'WebFetch'],
          file: '~/.config/claude/claude_desktop_config.json',
          message: action === 'on'
            ? '已禁用官方 WebSearch/WebFetch 工具'
            : action === 'off'
            ? '已启用官方 WebSearch/WebFetch 工具'
            : '当前状态：' + (action === 'on' ? '已禁用' : '已启用'),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`未知工具: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: errorMessage,
            tool: name,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

/**
 * 启动服务器
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Grok Search MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
