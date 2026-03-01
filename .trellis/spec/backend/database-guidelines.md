# Database Guidelines

> Database patterns and conventions for this project.

---

## Overview

**This project does not use a database.** It is an MCP server that calls external APIs (OpenAI-compatible) and uses only:

- Environment variables
- A small JSON config file under `~/.config/openai-search/config.json` (e.g. for `model` preference)

No ORM, migrations, or query patterns apply. If you add a database later, create a new spec document and link it from `spec/backend/index.md`.
