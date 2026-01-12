import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import type { GrokConfig } from '../types/index.js';

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
      const configDir = path.join(os.homedir(), '.config', 'grok-search');
      this._configFile = path.join(configDir, 'config.json');
    }
    return this._configFile;
  }

  /**
   * 获取日志目录
   */
  get logDir(): string {
    return path.join(os.homedir(), '.config', 'grok-search', 'logs');
  }

  /**
   * 获取 Grok API URL
   */
  get grokApiUrl(): string {
    return process.env.GROK_API_URL || 'https://api.x.ai/v1';
  }

  /**
   * 获取 Grok API Key
   */
  get grokApiKey(): string {
    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) {
      throw new Error('GROK_API_KEY 环境变量未设置');
    }
    return apiKey;
  }

  /**
   * 获取 Grok 模型
   */
  get grokModel(): string {
    if (this._cachedModel) {
      return this._cachedModel;
    }
    return process.env.GROK_MODEL || 'grok-4-fast';
  }

  /**
   * 是否启用调试模式
   */
  get debugEnabled(): boolean {
    return process.env.DEBUG === 'true' || process.env.GROK_DEBUG === 'true';
  }

  /**
   * 获取日志级别
   */
  get logLevel(): string {
    return process.env.GROK_LOG_LEVEL || 'INFO';
  }

  /**
   * 加载配置文件
   */
  async loadConfig(): Promise<Record<string, any> | null> {
    try {
      const content = await fs.readFile(this.configFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * 保存配置文件
   */
  async saveConfig(data: Record<string, any>): Promise<void> {
    const configDir = path.dirname(this.configFile);
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(this.configFile, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * 切换模型并持久化
   */
  async switchModel(newModel: string): Promise<void> {
    const config = await this.loadConfig() || {};
    config.model = newModel;
    await this.saveConfig(config);
    this._cachedModel = newModel;
  }

  /**
   * 获取完整配置
   */
  async getConfig(): Promise<GrokConfig> {
    const fileConfig = await this.loadConfig();
    return {
      apiUrl: this.grokApiUrl,
      apiKey: this.grokApiKey,
      model: fileConfig?.model || this.grokModel,
      debug: this.debugEnabled
    };
  }

  /**
   * 验证配置
   */
  async validate(): Promise<{ valid: boolean; error?: string }> {
    try {
      this.grokApiKey;
      this.grokApiUrl;
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// 导出单例实例
export const config = Config.getInstance();
