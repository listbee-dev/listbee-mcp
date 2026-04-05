# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.4.0] - 2026-04-05

### Changed
- HTTP client replaced with `listbee` TypeScript SDK — gets retries, timeouts, typed errors for free
- Error responses now include structured `code`, `detail`, `param` fields (was raw JSON body)
- Handler architecture simplified: 8 tool files collapsed into single handler map

### Removed
- Internal `client.ts` HTTP wrapper
- `ListBeeApiError` custom error class (replaced by SDK's `APIStatusError`)

### Added
- `listbee@^0.6.1` as runtime dependency
- Automatic retries with exponential backoff on 429/5xx responses
- Rate limit handling with Retry-After header

### Added
- Initial MCP server with 13 tools: listings, orders, files, Stripe
- stdio transport for Claude Desktop, Cursor, Cline
- CLI with `--api-key` and `--base-url` options
