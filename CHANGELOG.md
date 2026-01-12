# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-12

### Added
- Initial release of Node.js edition
- MCP server implementation using @modelcontextprotocol/sdk
- Full TypeScript support with type definitions
- Five core tools: web_search, web_fetch, get_config_info, switch_model, toggle_builtin_tools
- Streaming response support for Grok API
- Automatic retry with exponential backoff
- Environment variable configuration
- Logging system with file output
- npx support for zero-setup execution
- Complete bilingual documentation (Chinese/English)

### Features
- Faster startup time compared to Python edition (~0.5-1s vs ~2-3s)
- Smaller package size (~5MB vs ~15MB)
- Native Node.js 18+ fetch API support
- Config file persistence (~/.config/grok-search/config.json)
- Claude Desktop integration guide

[1.0.0]: https://github.com/GuDaStudio/GrokSearch/releases/tag/v1.0.0
