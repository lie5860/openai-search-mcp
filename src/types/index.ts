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
 * OpenAI 配置
 */
export interface OpenAIConfig {
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
  status: "success" | "error";
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

/**
 * OpenAI API 聊天消息
 */
export interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * OpenAI API 请求负载
 */
export interface OpenAIPayload {
  model: string;
  messages: OpenAIMessage[];
  stream: boolean;
  [key: string]: unknown; // 允许其他动态字段
}

/**
 * OpenAI API 流式响应选择
 */
export interface OpenAIChoice {
  delta: {
    content?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * OpenAI API 流式响应解析
 */
export interface OpenAIStreamResponse {
  choices: OpenAIChoice[];
  [key: string]: unknown;
}

/**
 * 通用配置对象类型
 */
export type ConfigObject = Record<string, unknown>;

/**
 * 通用错误类型
 */
export type ErrorLike = Error | { message: string };

/**
 * web_search 工具参数
 */
export interface WebSearchParams {
  query: string;
  platform?: string;
  min_results?: number;
  max_results?: number;
}

/**
 * web_fetch 可选引擎：默认 llm，可通过参数指定 tavily / firecrawl
 */
export type FetchEngine = "llm" | "tavily" | "firecrawl";

/**
 * web_fetch 工具参数
 */
export interface WebFetchParams {
  url: string;
  /** 本次抓取使用的引擎，默认 "llm"；可选 "tavily" / "firecrawl"（需配置对应 API Key） */
  fetch_engine?: FetchEngine;
}

/**
 * switch_model 工具参数
 */
export interface SwitchModelParams {
  model: string;
}

/**
 * toggle_builtin_tools 工具参数
 */
export interface ToggleBuiltinToolsParams {
  action?: string;
}

/**
 * 测试结果类型
 */
export interface TestResult {
  success: boolean;
  response_time?: number;
  model_count?: number;
  error?: string;
}
