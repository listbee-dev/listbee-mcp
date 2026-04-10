# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- `get_store` tool — retrieve store brand info and readiness
- `update_store` tool — update display name, bio, avatar, or slug

### Removed
- `list_api_keys` tool
- `create_api_key` tool
- `delete_api_key` tool

## [0.9.0] - 2026-04-10

### Changed
- Remove `content_type` from listing and order schemas
- Remove `handed_off_at` and `processing`/`handed_off` order statuses

### Added
- Add `fulfillment_url` to listing schemas (create and update)
- Add `has_deliverables` and `actions` to order schemas

## [0.8.1] - 2026-04-08

### Changed
- Updated OpenAPI spec (added plans schemas)

## [0.8.0] - 2026-04-08

### Changed
- Regenerate schemas for content-type model (fulfillment→content_type, new order fields)
- Fix schema generator to emit Zod v4-compatible `z.record(z.string(), z.any())` calls

## [0.7.1] - 2026-04-07

### Removed
- Removed `send_otp` and `verify_otp` tools — account creation now handled via the ListBee Console

## [0.7.0] - 2026-04-07

### Changed
- Renamed `deliver_order` tool to `fulfill_order` with optional deliverables

### Removed
- Removed `ship_order` tool

## [0.6.1] - 2026-04-07

### Changed
- Updated schemas to include `sort_order` field on checkout schema fields
- Bumped `listbee` SDK dependency to `^0.10.0`

## [0.6.0] - 2026-04-07

### Changed
- Renamed `create_account` tool to `send_otp` — maps to new `POST /v1/auth/otp` endpoint
- Updated `verify_otp` tool to new path `POST /v1/auth/otp/verify` — response returns `access_token` instead of `api_key`
- Bumped `listbee` SDK dependency to `^0.9.0` (new auth API: `signup.sendOtp()`, `AuthSessionResponse`)
- Regenerated Zod schemas from updated OpenAPI spec — `DeliverableResponse` now includes `id` field (`del_` prefix)

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
