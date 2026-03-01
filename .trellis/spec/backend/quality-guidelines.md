# Quality Guidelines

> Code quality standards for backend development.

---

## Overview

The project uses **ESLint 9 (flat config)** and **Prettier**. TypeScript is strict enough to avoid `any` where possible; some warnings are accepted by design. See `LINT.md` and `eslint.config.js` for full details.

---

## Forbidden Patterns

- **No `console.log`** for normal flow; use `console.error` only where needed (e.g. MCP progress) or use the logger.
- **No unignored unused variables/params** — use `_` prefix (e.g. `_ctx`, `_error`) or remove; lint enforces `argsIgnorePattern: "^_"`.
- **Avoid `any`** unless justified (e.g. dynamic API payloads); rule is `warn`, not error.
- **Avoid non-null assertion `!`**; prefer optional chaining `?.`; rule is `warn`.
- **No `@ts-ignore`** without good reason; prefer `@ts-expect-error` with a short comment.

---

## Required Patterns

- **ESM**: Use `import`/`export`; import paths must use `.js` extension for TypeScript files (e.g. `from "./config/index.js"`).
- **Import order**: Enforced by `eslint-plugin-import`: builtin → external → internal → parent/sibling → index → type; groups separated by newlines; alphabetized within group. Run `npm run lint:fix` to fix.
- **Format**: Prettier (semicolons, double quotes, 100 line width, 2 spaces, LF). Run `npm run format` or rely on format-on-save.

---

## Testing Requirements

- No automated tests are currently in the repo. Before commit: run `npm run build`, `npm run type-check`, `npm run lint` (and fix with `lint:fix`/`format` as needed). Manual smoke test of MCP tools is expected.

---

## Code Review Checklist

- [ ] New code under `src/` follows `directory-structure.md` (e.g. providers in `providers/`, types in `types/index.ts`).
- [ ] No secrets or API keys in code or logs; config from env and optional config file.
- [ ] External calls (e.g. OpenAI) use `retryWithContext` where appropriate; errors normalized with `Error`.
- [ ] `npm run type-check` and `npm run lint` pass; Prettier applied.
- [ ] New tool handlers return MCP shape `{ content: [{ type: "text", text: string }] }`; use zod `inputSchema` for tool args.
