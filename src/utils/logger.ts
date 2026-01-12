import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/index.js';
import type { MCPContext } from '../types/index.js';

/**
 * 异步日志工具
 */
export class Logger {
  private logFile!: string;

  constructor() {
    this.ensureLogDir();
  }

  private async ensureLogDir(): Promise<void> {
    await fs.mkdir(config.logDir, { recursive: true });
  }

  private getLogFilePath(): string {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    return path.join(config.logDir, `grok_search_${date}.log`);
  }

  private async writeLog(level: string, message: string): Promise<void> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const logLine = `[${timestamp}] [${level}] ${message}\n`;

    // 写入文件
    try {
      await fs.appendFile(this.getLogFilePath(), logLine, 'utf-8');
    } catch (error) {
      // 忽略日志写入错误
    }
  }

  info(message: string): void {
    this.writeLog('INFO', message);
  }

  error(message: string): void {
    this.writeLog('ERROR', message);
  }

  debug(message: string): void {
    if (config.debugEnabled) {
      this.writeLog('DEBUG', message);
    }
  }
}

const logger = new Logger();

/**
 * 记录信息到 MCP 上下文和日志
 */
export async function logInfo(ctx: MCPContext | undefined, message: string, isDebug: boolean = false): Promise<void> {
  if (isDebug) {
    logger.debug(message);
  }

  if (ctx?.info) {
    await ctx.info(message);
  }
}

export default logger;
