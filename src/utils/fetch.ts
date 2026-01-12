/**
 * Fetch polyfill 工具
 * 确保 fetch API 在所有 Node.js 环境中可用
 */

type FetchFunction = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

let _fetch: FetchFunction | undefined;

export async function getFetch(): Promise<FetchFunction> {
  if (_fetch) {
    return _fetch;
  }

  // 优先尝试使用全局 fetch（Node.js 18+）
  if (typeof globalThis.fetch === 'function') {
    _fetch = globalThis.fetch.bind(globalThis);
    return _fetch;
  }

  // 尝试从 undici 导入（Node.js 18+ 内置）
  try {
    // @ts-ignore - undici 是 Node.js 18+ 内置的，可能没有类型定义
    const undici = await import('undici');
    if (typeof undici.fetch === 'function') {
      _fetch = undici.fetch as FetchFunction;
      return _fetch;
    }
  } catch {
    // 忽略错误，继续尝试
  }

  // 如果都失败了，抛出明确的错误
  throw new Error(
    'fetch API 不可用。请确保使用 Node.js 18+ 或安装 node-fetch。\n' +
    '当前 Node.js 版本: ' + process.version
  );
}

/**
 * 执行 fetch 请求的辅助函数
 */
export async function fetchWithPolyfill(
  url: string | URL,
  init?: RequestInit
): Promise<Response> {
  const fetchFn = await getFetch();
  return fetchFn(url, init);
}
