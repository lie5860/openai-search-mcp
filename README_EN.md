<div align="center">

# Grok Search MCP

English | [简体中文](./README.md)

**🚀 Integrate Grok AI's powerful search capabilities into Claude via MCP protocol, break through knowledge limitations, and access real-time information**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js 18+](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.0.0+-purple.svg)](https://modelcontextprotocol.io/)
[![npm version](https://badge.fury.io/js/grok-search-mcp.svg)](https://www.npmjs.com/package/grok-search-mcp)

[Features](#-key-features) • [Quick Start](#-quick-start) • [Usage](#-usage) • [Troubleshooting](#-troubleshooting)

</div>

---

## 📖 Overview

Grok Search MCP is a high-performance Node.js/TypeScript implementation of an MCP (Model Context Protocol) server that integrates Grok AI's powerful capabilities to provide real-time web search and web content extraction for Claude, Claude Code, and other AI assistants.

### ✨ Key Features

- 🌐 **Real-time Web Search** - Break through AI knowledge cutoff and access the latest information
- 🔍 **Smart Web Fetching** - Extract complete web content and convert to structured Markdown
- 🔄 **Auto Retry Mechanism** - Intelligently handle network fluctuations and temporary errors
- 📦 **Plug & Play** - Run with single `npx` command, no complex configuration needed
- ⚡ **High Performance** - Cold start < 1 second, memory footprint < 30MB
- 🔒 **Type Safety** - Complete TypeScript type definitions
- 🛠️ **Fetch Polyfill** - Compatible with all Node.js 18+ environments

---

## 🎯 Why Choose Grok Search MCP?

| Feature | Official WebSearch | Grok Search MCP |
|---------|-------------------|-----------------|
| **Search Quality** | Generic | **Grok AI Enhanced** 🧠 |
| **Web Fetching** | Basic | **Deep Extraction** 📄 |
| **Startup Speed** | Slower | **< 1 second** ⚡ |
| **Customization** | Fixed | **Highly Configurable** ⚙️ |
| **Cost** | Paid | **Use Your Own API Key** 💰 |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (with fetch API and ES Modules support)
- **Grok API Key** - Get it from [x.ai](https://x.ai/)
- **Claude Desktop** (optional, for GUI integration)

### Option 1: Using npx (Recommended)

**No installation required**, run the latest version directly:

```bash
npx grok-search-mcp
```

### Option 2: Global Installation

```bash
npm install -g grok-search-mcp
grok-search
```

---

## ⚙️ Configure Claude Desktop

### Step 1: Get API Key

1. Visit [x.ai](https://x.ai/)
2. Sign up/Login to your account
3. Get your API Key

### Step 2: Configure Environment Variables

Edit `~/.config/claude/claude_desktop_config.json` (macOS/Linux) or `%APPDATA%\claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "grok-search": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "grok-search-mcp"],
      "env": {
        "GROK_API_URL": "https://api.x.ai/v1",
        "GROK_API_KEY": "your-api-key-here",
        "GROK_MODEL": "grok-beta"
      }
    }
  }
}
```

### Step 3: Restart Claude Desktop

After configuration, **completely quit and restart** Claude Desktop.

### Step 4: Verify Installation

In Claude conversation, type:

```
Show grok-search config info
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
Search for grok projects on GitHub
```

### 2️⃣ `web_fetch` - Web Fetching

Extract complete content from specified URL and convert to Markdown format.

**Parameters:**
- `url` (required) - Web page URL to fetch

**Usage Examples:**
```
Fetch README content from https://github.com/lie5860/grok-search-npm
Get complete documentation from https://www.typescriptlang.org/docs
```

### 3️⃣ `get_config_info` - Configuration Diagnostics

Get current configuration and connection status.

**Returns:**
- API URL and model configuration
- Connection test results
- Response time and available model information

**Usage Examples:**
```
Show grok-search config info
```

### 4️⃣ `switch_model` - Model Switching

Dynamically switch Grok models.

**Parameters:**
- `model` (required) - Model ID (e.g., "grok-beta", "grok-vision-beta")

**Usage Examples:**
```
Switch to grok-vision-beta model
Switch model to grok-beta
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
git clone https://github.com/lie5860/grok-search-npm.git
cd grok-search-npm

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run development server
npm run dev

# Run tests
npm test
```

### Project Structure

```
grok-search-npm/
├── src/
│   ├── server.ts          # MCP server main entry
│   ├── config/            # Configuration management
│   ├── providers/         # Grok API provider
│   ├── utils/             # Utilities (fetch polyfill, retry, logger)
│   └── types/             # TypeScript type definitions
├── bin/
│   └── grok-search.js     # CLI command entry
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
| `GROK_API_URL` | Grok API endpoint | Yes | - |
| `GROK_API_KEY` | API key | Yes | - |
| `GROK_MODEL` | Default model | No | `grok-beta` |
| `DEBUG` | Debug mode | No | `false` |
| `GROK_LOG_LEVEL` | Log level | No | `INFO` |

---

## 🔥 Troubleshooting

### ❌ Issue 1: Connection Failed

**Error**: `❌ Connection failed` or `Grok API error`

**Solutions:**
1. Check if `GROK_API_URL` is correct (should be `https://api.x.ai/v1`)
2. Verify if `GROK_API_KEY` is valid
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
sudo npm install -g grok-search-mcp

# Or recommend using npx (no permissions needed)
npx grok-search-mcp
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
npm update grok-search-mcp
# Or use npx directly
npx grok-search-mcp
```

3. **If problem persists**, please file an issue:
   [https://github.com/lie5860/grok-search-npm/issues](https://github.com/lie5860/grok-search-npm/issues)

---

## 📝 Advanced Configuration

### Claude Desktop Prompt Optimization

Edit `~/.claude/CLAUDE.md` and add the following for better experience:

```markdown
# Grok Search MCP Usage Guide

## Activation
- Prioritize Grok Search for web search needs
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
- [Grok AI](https://x.ai/) - Powerful search and reasoning capabilities
- [Claude](https://claude.ai/) - Excellent AI assistant by Anthropic

---

## 📮 Contact

- **GitHub**: [https://github.com/lie5860/grok-search-npm](https://github.com/lie5860/grok-search-npm)
- **Issues**: [https://github.com/lie5860/grok-search-npm/issues](https://github.com/lie5860/grok-search-npm/issues)
- **NPM**: [https://www.npmjs.com/package/grok-search-mcp](https://www.npmjs.com/package/grok-search-mcp)

---

<div align="center">

**If this project helps you, please give it a ⭐️ Star!**

Made with ❤️ by [lie5860](https://github.com/lie5860)

</div>
