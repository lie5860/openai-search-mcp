# Logging Guidelines

> How logging is done in this project.

---

## Overview

- **No third-party log library.** Custom file logger in `src/utils/logger.ts` and a small helper `logInfo(ctx, message, isDebug)` for MCP context + optional file log.
- Logs are written to **files** under `config.logDir` (e.g. `~/.config/openai-search/logs/`) with daily rotation: `openai_search_YYYYMMDD.log`.
- **stderr**: Progress/info can be sent to MCP client via `ctx.info(message)`; `console.error` is used in `MCPCtx` for that. Do not use `console.log` for normal operation.

---

## Log Levels

| Level | When to use | Where |
|-------|-------------|--------|
| INFO | Normal operation milestones (e.g. "Begin Search", "Search Finished!") | `logger.info()` or `logInfo(ctx, msg, false)` |
| ERROR | Log file write uses "ERROR" for error-level lines; currently used sparingly | `logger.error()` |
| DEBUG | Detailed info (e.g. full prompt, retry attempts); only when `config.debugEnabled` | `logInfo(ctx, msg, true)` which calls `logger.debug()` |

Debug is gated by `DEBUG=true` or `OPENAI_DEBUG=true`. See `src/utils/logger.ts` and usage in `src/server.ts` / `src/providers/openai.ts`.

---

## Structured Logging

- **Format**: `[YYYY-MM-DD HH:mm:ss] [LEVEL] message` per line; no JSON. Example: `[2026-03-01 12:00:00] [INFO] Begin Search: foo`.
- **Required**: Timestamp and level; message is free-form. No mandatory fields beyond that.

---

## What to Log

- Start/end of tool operations (e.g. Begin Search/Fetch, Finished).
- When `debugEnabled`: full prompts, retry attempts with error message.
- Fatal errors in `main().catch()` to stderr.

---

## What NOT to Log

- **API keys** or full tokens; masking is done only when returning config info to client (e.g. prefix + "...").
- **Full response bodies** from OpenAI (can be large); log only status or short summaries if needed.
- **PII** or user content beyond what’s needed for debugging (and only when debug is on).
