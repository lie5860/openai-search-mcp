<div align="center">

# OpenAI Search MCP

English | [简体中文](./README_ZH.md)

**🚀 Integrate OpenAI-compatible API's powerful search capabilities into Claude via MCP protocol, break through knowledge limitations, and access real-time information**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js 18+](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.0.0+-purple.svg)](https://modelcontextprotocol.io/)
[![npm version](https://badge.fury.io/js/openai-search-mcp.svg)](https://www.npmjs.com/package/openai-search-mcp)

[Features](#-key-features) • [Quick Start](#-quick-start) • [Usage](#-usage) • [Troubleshooting](#-troubleshooting)

</div>

---

## 📖 Overview

OpenAI Search MCP is a high-performance Node.js/TypeScript MCP server that connects **your OpenAI-compatible API** to Claude, Claude Code, and other AI assistants. The backend model **must provide search capability** (search is always performed by your configured endpoint). Web fetching supports three engines: **LLM** (default, uses the same model’s browse capability), **Tavily**, and **Firecrawl**—selectable via the `fetch_engine` parameter when you need dedicated crawl services.

### ✨ Key Features

- 🌐 **Real-time Web Search** - Powered by your OpenAI-compatible model (must have search)
- 🔍 **Configurable Web Fetch** - Default LLM; optionally use **Tavily** or **Firecrawl** via `fetch_engine` for real HTTP crawl and anti-bot handling
- 📄 **Structured Markdown** - Full-page extraction and conversion to Markdown

**Why offer multiple fetch engines?** In practice, (1) **LLM fetch is often slower** than dedicated crawl APIs (e.g. ~14s vs ~1s for Tavily/Firecrawl). (2) **LLM may use cached or inferred content** and can **add irrelevant text**, so the result may not match the live page. When you need **fast, faithful, unmodified** content, use `fetch_engine=tavily` or `fetch_engine=firecrawl`.
- 🔄 **Auto Retry** - Handles network and transient API errors
- 📦 **Plug & Play** - Single `npx` command, minimal config
- ⚡ **High Performance** - Cold start < 1 s, low memory footprint
- 🔒 **Type Safety** - Full TypeScript definitions

---

## 🎯 Why Choose OpenAI Search MCP?

| Feature | Official WebSearch | OpenAI Search MCP |
|---------|-------------------|-----------------|
| **Search Quality** | Generic | **AI Enhanced** 🧠 |
| **Web Fetching** | Basic | **Deep Extraction** 📄 |
| **Startup Speed** | Slower | **< 1 second** ⚡ |
| **Customization** | Fixed | **Highly Configurable** ⚙️ |
| **Cost** | Paid | **Use Your Own API Key** 💰 |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (with fetch API and ES Modules support)
- **OpenAI-compatible API** - This project uses the OpenAI API format. You need:
  - An API endpoint (e.g., OpenAI-compatible service)
  - An API key for that endpoint
- **Claude Desktop** (optional, for GUI integration)

### Option 1: Using npx (Recommended)

**No installation required**, run the latest version directly:

```bash
npx openai-search-mcp
```

### Option 2: Global Installation

```bash
npm install -g openai-search-mcp
openai-search
```

---

## ⚙️ Configure Claude Desktop

### Step 1: Get API Endpoint and Key

This project uses the **OpenAI API format**. You need an API endpoint that is compatible with OpenAI's API specification.

**Options:**
1. **OpenAI-compatible API**: Use any service that provides OpenAI-compatible endpoints
2. **Other OpenAI-compatible APIs**: Any service that follows the OpenAI API format

You will need:
- `OPENAI_API_URL`: Your API endpoint URL (e.g., `https://api.openai.com/v1`)
- `OPENAI_API_KEY`: Your API key for that endpoint
- `OPENAI_MODEL`: The model identifier (default: `gpt-4o`)

### Step 2: Configure Environment Variables

Edit `~/.config/claude/claude_desktop_config.json` (macOS/Linux) or `%APPDATA%\claude\claude_desktop_config.json` (Windows). Pick one of the three scenarios below and copy the matching config.

**Scenario 1: Use LLM for fetch only (default)**  
No Tavily/Firecrawl; `web_fetch` uses your OpenAI-compatible model. Only required vars.

```json
{
  "mcpServers": {
    "openai-search": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "openai-search-mcp"],
      "env": {
        "OPENAI_API_URL": "https://api.openai.com/v1",
        "OPENAI_API_KEY": "your-api-key-here",
        "OPENAI_MODEL": "gpt-4o"
      }
    }
  }
}
```

**Scenario 2: Use Tavily as default fetch engine**  
Set `FETCH_ENGINE=tavily` and Tavily keys so that when `fetch_engine` is not passed, Tavily is used.

```json
{
  "mcpServers": {
    "openai-search": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "openai-search-mcp"],
      "env": {
        "OPENAI_API_URL": "https://api.openai.com/v1",
        "OPENAI_API_KEY": "your-api-key-here",
        "OPENAI_MODEL": "gpt-4o",
        "FETCH_ENGINE": "tavily",
        "TAVILY_API_KEY": "tvly-your-tavily-key",
        "TAVILY_API_URL": "https://api.tavily.com"
      }
    }
  }
}
```

**Scenario 3: Use Firecrawl as default fetch engine**  
Set `FETCH_ENGINE=firecrawl` and Firecrawl keys so that when `fetch_engine` is not passed, Firecrawl is used.

```json
{
  "mcpServers": {
    "openai-search": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "openai-search-mcp"],
      "env": {
        "OPENAI_API_URL": "https://api.openai.com/v1",
        "OPENAI_API_KEY": "your-api-key-here",
        "OPENAI_MODEL": "gpt-4o",
        "FETCH_ENGINE": "firecrawl",
        "FIRECRAWL_API_KEY": "your-firecrawl-api-key",
        "FIRECRAWL_API_URL": "https://api.firecrawl.dev/v2"
      }
    }
  }
}
```

- **Required** (all scenarios): `OPENAI_API_URL`, `OPENAI_API_KEY`; `OPENAI_MODEL` is optional (default `gpt-4o`).
- **Default fetch engine**: `FETCH_ENGINE=llm|tavily|firecrawl`; when unset, defaults to `llm`. You can still pass `fetch_engine` per call to override.
- **Scenario 2** requires `TAVILY_API_KEY`; **Scenario 3** requires `FIRECRAWL_API_KEY`. The `*_API_URL` values usually need not be changed.

**Important**:
- Replace `https://your-api-endpoint.com/v1` with your actual API endpoint
- Replace `your-api-key-here` with your actual API key
- The endpoint must be **OpenAI-compatible**

### Step 3: Restart Claude Desktop

After configuration, **completely quit and restart** Claude Desktop.

### Step 4: Verify Installation

In Claude conversation, type:

```
Show openai-search config info
```

Or

```
Search for latest TypeScript 5.5 features
```

---

## 🛠️ Available Tools

### 1️⃣ `web_search` - Web Search

Execute intelligent search and return structured results.

**Parameters:**
- `query` (required) - Search keywords
- `platform` (optional) - Specify platform like "github", "stackoverflow"
- `min_results` (optional) - Minimum results, default 3
- `max_results` (optional) - Maximum results, default 10

**Usage Examples:**
```
Search for latest Next.js 15 updates
Search TypeScript 5.5 new features, return 5 results
Search for openai-search projects on GitHub
```

### 2️⃣ `web_fetch` - Web Fetching

Extract complete content from a URL and return it as Markdown. You can choose which engine performs the fetch:

**Parameters:**
- `url` (required) - Web page URL to fetch
- `fetch_engine` (optional) - `"llm"` | `"tavily"` | `"firecrawl"`. When omitted, the server default is used (env `FETCH_ENGINE`, default `llm`).
  - **llm** – Uses your OpenAI-compatible model (requires model browse capability). Often slower; may return cached or model-inferred content and sometimes adds extra text.
  - **tavily** – [Tavily Extract API](https://docs.tavily.com) (set `TAVILY_API_KEY`). Typically faster and returns real page content.
  - **firecrawl** – [Firecrawl Scrape API](https://docs.firecrawl.dev) (set `FIRECRAWL_API_KEY`). Typically faster and returns real page content.

**Usage Examples:**
```
Fetch README from https://github.com/lie5860/openai-search-mcp
Fetch https://example.com using Tavily (fetch_engine=tavily)
Get full doc from https://www.typescriptlang.org/docs (default LLM)
```

### 3️⃣ `get_config_info` - Configuration Diagnostics

Get current configuration and connection status.

**Returns:**
- API URL, model, and connection test (response time, available models)
- **fetch_engines** – `default` (current default fetch engine from `FETCH_ENGINE`), and whether Tavily/Firecrawl are configured

**Usage Examples:**
```
Show openai-search config info
```

### 4️⃣ `switch_model` - Model Switching

Dynamically switch AI models.

**Parameters:**
- `model` (required) - Model ID (e.g., "gpt-4o", "gpt-4o-mini")

**Usage Examples:**
```
Switch to gpt-4o-mini model
Switch model to gpt-4o
```

### 5️⃣ `toggle_builtin_tools` - Tool Management

Disable/Enable Claude's built-in search tools.

**Parameters:**
- `action` (optional) - "on" disable built-in tools, "off" enable built-in tools, "status" view status

**Usage Examples:**
```
Disable official WebSearch tool
View current tool status
```

---

## 💻 Development Guide

### Building from Source

```bash
# Clone repository
git clone https://github.com/lie5860/openai-search-mcp.git
cd openai-search-mcp

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run development server
npm run dev

# Self-test (run after build)
npm run test-server    # Config + search + LLM fetch
npm run test-search    # Search + LLM fetch
npm run test-fetch     # All fetch engines (llm / tavily / firecrawl)
```

### Project Structure

```
openai-search-mcp/
├── src/
│   ├── server.ts          # MCP server main entry
│   ├── config/            # Configuration management
│   ├── providers/         # OpenAI-compatible API provider
│   ├── utils/             # Utilities (fetch polyfill, retry, logger)
│   └── types/             # TypeScript type definitions
├── bin/
│   └── openai-search.js   # CLI command entry
├── dist/                  # Build output directory
├── package.json
├── tsconfig.json
└── README.md
```

### Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.5+
- **MCP SDK**: @modelcontextprotocol/sdk ^1.0.4
- **HTTP Client**: Fetch API + Undici (auto polyfill)
- **Config Management**: dotenv
- **Module System**: ES Modules (ESM)

---

## 🔧 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENAI_API_URL` | OpenAI-compatible API endpoint (must support search) | Yes | - |
| `OPENAI_API_KEY` | API key for your endpoint | Yes | - |
| `OPENAI_MODEL` | Model identifier | No | `gpt-4o` |
| `DEBUG` | Debug mode | No | `false` |
| `OPENAI_LOG_LEVEL` | Log level | No | `INFO` |
| `TAVILY_API_KEY` | Tavily API key (for `web_fetch` with `fetch_engine=tavily`) | No | - |
| `TAVILY_API_URL` | Tavily API base URL | No | `https://api.tavily.com` |
| `FIRECRAWL_API_KEY` | Firecrawl API key (when using firecrawl as default or per call) | No | - |
| `FIRECRAWL_API_URL` | Firecrawl API base URL | No | `https://api.firecrawl.dev/v2` |
| `FETCH_ENGINE` | Default fetch engine when `fetch_engine` is not passed | No | `llm` |

---

## 🔥 Troubleshooting

### ❌ Issue 1: Connection Failed

**Error**: `❌ Connection failed` or `API error`

**Solutions:**
1. Check if `OPENAI_API_URL` is correct and points to an OpenAI-compatible endpoint
2. Verify if `OPENAI_API_KEY` is valid for your API provider
3. Confirm network connection is working
4. Use `get_config_info` tool for diagnostics

### ❌ Issue 2: Module Not Found

**Error**: `Cannot find module`

**Solutions:**
```bash
# Reinstall dependencies
npm install

# Rebuild
npm run build
```

### ❌ Issue 3: Permission Error

**Error**: `EACCES`

**Solutions:**
```bash
# Linux/macOS use sudo
sudo npm install -g openai-search-mcp

# Or recommend using npx (no permissions needed)
npx openai-search-mcp
```

### ❌ Issue 4: fetch is not defined

**Error**: `ReferenceError: fetch is not defined`

**Cause**: fetch API not properly initialized in Node.js environment

**Solutions:**
1. **Check Node.js version**:
```bash
node --version  # Should be >= 18.0.0
```

2. **Ensure using latest version** (v1.0.1+ includes fetch polyfill):
```bash
npm update openai-search-mcp
# Or use npx directly
npx openai-search-mcp
```

3. **If problem persists**, please file an issue:
   [https://github.com/lie5860/openai-search-mcp/issues](https://github.com/lie5860/openai-search-mcp/issues)

---

## 📝 Advanced Configuration

### Claude Desktop Prompt Optimization

Edit `~/.claude/CLAUDE.md` and add the following for better experience:

```markdown
# OpenAI Search MCP Usage Guide

## Activation
- Prioritize OpenAI Search for web search needs
- Auto-activate when latest information is needed
- Use web_fetch for web content extraction

## Tool Selection Strategy
| Scenario | Recommended Tool | Parameters |
|----------|-----------------|------------|
| Quick search | web_search | min_results=3, max_results=5 |
| Deep research | web_search + web_fetch | Search first, then fetch key pages |
| Specific platform | web_search | Set platform parameter |
| Complete docs | web_fetch | Fetch URL directly |

## Output Guidelines
- **Must cite sources**: `[Title](URL)`
- **Time-sensitive info**: Note retrieval date
- **Multi-source validation**: Cross-validate important info
- **No fabrication**: Clearly state when no results found

## Error Handling
- No results → Relax query or change keywords
- Connection failed → Use get_config_info to diagnose
- Timeout → Reduce max_results or retry
```

---

## 📊 Performance Comparison

| Metric | Python Version | Node.js Version (This Project) |
|--------|---------------|-------------------------------|
| **Cold Start** | ~2-3 seconds | **< 1 second** ⚡ |
| **Memory Usage** | ~50MB | **< 30MB** 💾 |
| **Package Size** | ~15MB | **~5MB** 📦 |
| **Type Safety** | Type hints | **Full TypeScript** 🔒 |
| **Deployment** | Needs virtual env | **npx one-click run** 🚀 |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](../LICENSE).

---

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) - Powerful AI context protocol
- [Claude](https://claude.ai/) - Excellent AI assistant by Anthropic

### 🌟 Tribute to Original Project

This project is based on [GuDaStudio/GrokSearch](https://github.com/GuDaStudio/GrokSearch) (MIT License). Big thanks to the original author for the excellent work!

**Key Changes**:
- ✅ Migrated from Python to TypeScript/Node.js
- ✅ Added Fetch Polyfill for better environment compatibility
- ✅ Optimized project structure and modular design
- ✅ Complete TypeScript type definitions
- ✅ Faster startup speed and smaller package size

**Important Note**: This project uses the **OpenAI API format** and requires an OpenAI-compatible API endpoint.

The original project (Python version) is equally excellent. If you're more familiar with the Python ecosystem, we recommend using the original version:
- 🔗 [GuDaStudio/GrokSearch](https://github.com/GuDaStudio/GrokSearch)

---

## 📮 Contact

- **GitHub**: [https://github.com/lie5860/openai-search-mcp](https://github.com/lie5860/openai-search-mcp)
- **Issues**: [https://github.com/lie5860/openai-search-mcp/issues](https://github.com/lie5860/openai-search-mcp/issues)
- **NPM**: [https://www.npmjs.com/package/openai-search-mcp](https://www.npmjs.com/package/openai-search-mcp)

---

<div align="center">

**If this project helps you, please give it a ⭐️ Star!**

Made with ❤️ by [lie5860](https://github.com/lie5860)

</div>
