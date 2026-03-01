# Error Handling

> How errors are handled in this project.

---

## Overview

- Errors are propagated with standard `Error` or `throw new Error(...)`. No custom error classes.
- Async entry points use `.catch()` to log and exit (e.g. `main().catch(...)` in `server.ts`).
- Tool handlers do not wrap in try/catch for normal flow; provider/utils throw and MCP SDK handles.
- API calls use `retryWithContext()` from `src/utils/retry.ts` for transient failures (network, 429/5xx).

---

## Error Types

- **Runtime**: `Error` with message; optional `error instanceof Error` when rethrowing (see `src/server.ts` get_config_info and `src/utils/retry.ts`).
- **API**: `throw new Error(\`OpenAI API error: ${response.status} - ${errorText}\`)` in `src/providers/openai.ts` after non-ok response.
- **Config**: `config.validate()` returns `{ valid: boolean, error?: string }`; missing env throws in config getters (e.g. `OPENAI_API_KEY`).

---

## Error Handling Patterns

1. **Top-level**: `main().catch((error) => { console.error("Fatal error:", error); process.exit(1); });` — see `src/server.ts`.
2. **Retriable calls**: Use `retryWithContext(() => provider.search(...), { maxAttempts: 3, ... })`; optional `onRetry` to log — see `src/providers/openai.ts`.
3. **Optional catch**: Use `_error` for intentionally ignored errors (e.g. log write failure in `src/utils/logger.ts`, JSON parse in stream loop in `openai.ts`).
4. **Normalizing unknown**: `error instanceof Error ? error : new Error(String(error))` when rethrowing — see `src/utils/retry.ts` and get_config_info in `server.ts`.

---

## API / Tool Error Responses

- MCP tools return success as `{ content: [{ type: "text", text: string }] }`. Errors are not returned as structured JSON; the MCP SDK and runtime handle thrown errors.
- For user-facing status (e.g. get_config_info), return a JSON string in `text` with fields like `status`, `test_result: { success, error? }` — see `src/server.ts` get_config_info.

---

## Common Mistakes

- Forgetting to use `retryWithContext` for external HTTP calls (search, fetch) can cause flaky behavior on network blips.
- Catching and swallowing errors without at least logging (or rethrowing) makes debugging hard; use `_error` only when ignore is intentional.
- Returning error details in tool `text` is fine for diagnostics (e.g. config status); do not log or expose raw API keys.
