# Directory Structure

> How backend code is organized in this project.

---

## Overview

This project is a **Node.js TypeScript MCP (Model Context Protocol) server**. There is no database layer and no HTTP API surface; the server runs on stdio and exposes MCP tools (e.g. `web_search`, `web_fetch`). All application code lives under `src/`.

---

## Directory Layout

```
src/
├── server.ts           # Entry: MCP server setup, tool registration, main()
├── config/
│   └── index.ts        # Config singleton: env, file config, validation
├── providers/
│   └── openai.ts       # OpenAI-compatible API client (search, fetch, stream)
├── utils/
│   ├── logger.ts       # File logger + logInfo(ctx, message, isDebug)
│   ├── retry.ts        # retryWithContext(), isRetriableError()
│   ├── format.ts       # formatSearchResults(), parseSearchResults(), formatJson()
│   └── prompt.ts       # searchPrompt, fetchPrompt (prompt strings)
└── types/
    └── index.ts        # Shared interfaces and types

bin/                    # CLI entry (openai-search.js)
examples/               # Example scripts (JS), not part of build
```

- **Entry**: `src/server.ts` registers tools and connects stdio transport. Use `bin/openai-search.js` or `dist/server.js` to run.
- **Business logic**: Tool handlers in `server.ts` delegate to `OpenAISearchProvider` in `src/providers/openai.ts`.
- **Configuration**: Single source in `src/config/index.ts` (singleton); reads env and optional `~/.config/openai-search/config.json`.
- **Utilities**: Pure helpers in `src/utils/`; no business logic in utils.

---

## Module Organization

- **New MCP tools**: Add `server.registerTool(...)` in `src/server.ts`; keep handler thin and call providers or utils.
- **New providers**: Add under `src/providers/` (e.g. another API client); depend on `config` and `utils` only.
- **New shared types**: Add to `src/types/index.ts` (e.g. tool params, API payloads).
- **New utils**: Add under `src/utils/` with a single default export or named exports; use `import type` for types.

---

## Naming Conventions

| Item | Convention | Example |
|------|-------------|--------|
| Files | kebab-case for multi-word utils; PascalCase for class-heavy modules | `directory-structure.md` vs `openai.ts` |
| TypeScript | PascalCase for classes/interfaces/types; camelCase for functions/variables | `OpenAISearchProvider`, `logInfo` |
| Imports | ESM with `.js` extension in path (for Node ESM resolution) | `from "./config/index.js"` |
| Unused params/vars | Prefix with `_` to satisfy lint | `_ctx`, `_error` |

---

## Examples

- **Well-organized module**: `src/config/index.ts` — single responsibility, singleton export `config`, async `getConfig()` / `validate()`.
- **Tool registration**: `src/server.ts` — each tool: zod `inputSchema`, handler calling `config.getConfig()`, provider, and `logInfo`; returns `{ content: [{ type: "text", text }] }`.
- **Provider pattern**: `src/providers/openai.ts` — constructor takes apiUrl/apiKey/model; public methods `search()`, `fetch()`; uses `retryWithContext` and `logInfo(ctx, ...)`.
