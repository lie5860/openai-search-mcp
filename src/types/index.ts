/**
 * 搜索结果类型
 */
export interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
  source?: string;
  published_date?: string;
}

/**
 * MCP 工具上下文
 */
export interface MCPContext {
  info?: (message: string) => Promise<void>;
  reportProgress?: (progress: number, total?: number) => Promise<void>;
}

/**
 * Grok 配置
 */
export interface GrokConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  debug?: boolean;
}

/**
 * 搜索参数
 */
export interface SearchParams {
  query: string;
  platform?: string;
  minResults?: number;
  maxResults?: number;
}

/**
 * 模型切换结果
 */
export interface ModelSwitchResult {
  status: 'success' | 'error';
  previous_model?: string;
  current_model: string;
  message: string;
  config_file?: string;
}

/**
 * 配置信息
 */
export interface ConfigInfo {
  api_url?: string;
  api_key_prefix?: string;
  model?: string;
  status?: string;
  test_result?: {
    success: boolean;
    response_time?: number;
    model_count?: number;
    error?: string;
  };
}

/**
 * 内置工具切换结果
 */
export interface BuiltinToolsToggleResult {
  blocked: boolean;
  deny_list: string[];
  file: string;
  message: string;
}
