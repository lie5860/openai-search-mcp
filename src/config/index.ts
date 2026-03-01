import fs from "fs/promises";
import os from "os";
import path from "path";

import type { ConfigObject, OpenAIConfig } from "../types/index.js";

/**
 * 配置管理类
 */
export class Config {
  private static instance: Config;
  private _configFile: string | null = null;
  private _cachedModel: string | null = null;

  private constructor() {}

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  /**
   * 获取配置文件路径
   */
  get configFile(): string {
    if (this._configFile === null) {
      const configDir = path.join(os.homedir(), ".config", "openai-search");
      this._configFile = path.join(configDir, "config.json");
    }
    return this._configFile;
  }

  /**
   * 获取日志目录
   */
  get logDir(): string {
    return path.join(os.homedir(), ".config", "openai-search", "logs");
  }

  /**
   * 获取 OpenAI API URL
   */
  get openaiApiUrl(): string {
    return process.env.OPENAI_API_URL || "https://api.openai.com/v1";
  }

  /**
   * 获取 OpenAI API Key
   */
  get openaiApiKey(): string {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY 环境变量未设置");
    }
    return apiKey;
  }

  /**
   * 获取 OpenAI 模型
   */
  get openaiModel(): string {
    if (this._cachedModel) {
      return this._cachedModel;
    }
    return process.env.OPENAI_MODEL || "gpt-4o";
  }

  /**
   * 是否启用调试模式
   */
  get debugEnabled(): boolean {
    return process.env.DEBUG === "true" || process.env.OPENAI_DEBUG === "true";
  }

  /**
   * 获取日志级别
   */
  get logLevel(): string {
    return process.env.OPENAI_LOG_LEVEL || "INFO";
  }

  /**
   * Tavily API URL（可选，用于 web_fetch 的 tavily 引擎）
   */
  get tavilyApiUrl(): string {
    return process.env.TAVILY_API_URL || "https://api.tavily.com";
  }

  /**
   * Tavily API Key（可选；未设置时 fetch_engine=tavily 不可用）
   */
  get tavilyApiKey(): string {
    return process.env.TAVILY_API_KEY || "";
  }

  /**
   * Firecrawl API URL（可选，用于 web_fetch 的 firecrawl 引擎）
   */
  get firecrawlApiUrl(): string {
    return process.env.FIRECRAWL_API_URL || "https://api.firecrawl.dev/v2";
  }

  /**
   * Firecrawl API Key（可选；未设置时 fetch_engine=firecrawl 不可用）
   */
  get firecrawlApiKey(): string {
    return process.env.FIRECRAWL_API_KEY || "";
  }

  /**
   * web_fetch 默认使用的引擎（未传 fetch_engine 时生效）
   * 环境变量 FETCH_ENGINE=llm|tavily|firecrawl，默认 llm
   */
  get defaultFetchEngine(): "llm" | "tavily" | "firecrawl" {
    const v = (process.env.FETCH_ENGINE || "llm").toLowerCase();
    if (v === "tavily" || v === "firecrawl") return v;
    return "llm";
  }

  /**
   * 加载配置文件
   */
  async loadConfig(): Promise<ConfigObject | null> {
    try {
      const content = await fs.readFile(this.configFile, "utf-8");
      return JSON.parse(content);
    } catch (_error) {
      return null;
    }
  }

  /**
   * 保存配置文件
   */
  async saveConfig(data: ConfigObject): Promise<void> {
    const configDir = path.dirname(this.configFile);
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(this.configFile, JSON.stringify(data, null, 2), "utf-8");
  }

  /**
   * 切换模型并持久化
   */
  async switchModel(newModel: string): Promise<void> {
    const config = (await this.loadConfig()) || {};
    config.model = newModel;
    await this.saveConfig(config);
    this._cachedModel = newModel;
  }

  /**
   * 获取完整配置
   */
  async getConfig(): Promise<OpenAIConfig> {
    const fileConfig = await this.loadConfig();
    return {
      apiUrl: this.openaiApiUrl,
      apiKey: this.openaiApiKey,
      model: (fileConfig?.model as string | undefined) || this.openaiModel,
      debug: this.debugEnabled,
    };
  }

  /**
   * 验证配置
   */
  async validate(): Promise<{ valid: boolean; error?: string }> {
    try {
      void this.openaiApiKey;
      void this.openaiApiUrl;
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// 导出单例实例
export const config = Config.getInstance();
