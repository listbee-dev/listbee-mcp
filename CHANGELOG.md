# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.15.0] - 2026-04-18

### Added
- `bootstrap_poll` tool — poll Stripe onboarding readiness after account creation; requires the API key issued by `bootstrap_verify`
- `api_key_self_revoke` tool — self-revoke the calling API key; use when agent detects credential compromise or user requests invalidation
- `order_redeliver` tool (`redeliver_order` operation) — re-queue `order.paid` / `order.fulfilled` to the listing's `agent_callback_url`; rate-limited 10/hour/order
- `agent_callback_url` and `signing_secret` fields on `create_listing` and `update_listing` schemas — listing-level webhook for async agent fulfillment
- `fulfillment_mode` field on listing responses (`STATIC` | `ASYNC` | `EXTERNAL`)
- `deliverable` field on `create_listing` and `update_listing` (single deliverable object, replaces `deliverables` array)
- `metadata` field on `fulfill_order` — free-form dict (max 50 keys) for correlating agent work
- `unlock_url` field on order response schemas
- `events_callback_url` field on `update_account` input schema
- New `bootstrap_verify` parameters: `bootstrap_token` + `otp_code` (replaces `session` + `code`)
- New `bootstrap_start` path: `POST /v1/bootstrap/start` (was `/v1/bootstrap`)

### Removed
- `customer_*` tools: `list_customers`, `get_customer` — Customer entity deleted from API
- `webhook_*` tools: `list_webhooks`, `create_webhook`, `update_webhook`, `delete_webhook`, `list_webhook_events`, `retry_webhook_event`, `test_webhook` — Webhook entity deleted
- `file_*` tools: `upload_file` — file hosting removed; use `deliverable` field directly
- `set_deliverables` / `remove_deliverables` tools — replaced by single `deliverable` field on listing create/update
- `bootstrap_complete` tool — 3-step flow collapsed to 2 steps; `bootstrap_verify` now issues the API key directly
- `create_api_key` tool — API key creation is console-only; only `api_key_self_revoke` is agent-facing
- `fulfillment_url` field from listing schemas (replaced by `agent_callback_url`)
- `stock` field from listing schemas (removed from API)
- `has_deliverables` field from listing and order schemas
- `deliverables` array field from listing and order schemas (replaced by single `deliverable`)
- `stats` field from account response schema

### Changed
- `bootstrap_verify` now takes `bootstrap_token` + `otp_code` (was `session` + `code`) and returns the API key directly — no more `bootstrap_complete` step
- `fulfill_order` now takes a single `deliverable` object (not `deliverables` array); accepts optional `metadata`
- Listing status set simplified: `draft | published | archived` (removed `paused`)
- Order status set simplified: `pending | paid | fulfilled` (removed intermediate states)
- Startup validation updated — bootstrap tools (start, verify, poll) all handled correctly without SDK client requirement
- `listbee` SDK dependency updated to `^0.19.0` (new `apiKeys`, `orders.redeliver`, updated bootstrap flow)
- Tool count: 28 → 20

## [0.14.0] - 2026-04-17

### Added
- Bootstrap tools: `bootstrap_start`, `bootstrap_verify`, `bootstrap_complete` — agents can now create a ListBee account without an API key. Start `npx listbee-mcp` with no key to get bootstrap-only mode.
- Per-session auth mode in HTTP transport: sessions initialized without a Bearer token become bootstrap-only (only bootstrap tools registered); sessions initialized with a Bearer require auth on subsequent calls.
- Richer SERVER_INSTRUCTIONS covering readiness actions and the human-handoff pattern (presenting URLs, polling for completion).

### Changed
- `apiKey` is now optional in `CreateServerOptions`. Stdio transport no longer requires `--api-key` or `LISTBEE_API_KEY` to start — without a key, only bootstrap tools are exposed.
- HTTP transport auth moved from blanket middleware to per-session inline checks.
- Bumped `listbee` dependency to `^0.19.0` (brings `BootstrapCompleteResponse` typing).

## [0.13.0] - 2026-04-16

### Removed
- `get_store` and `update_store` MCP tools — Store entity removed from ListBee
- `StoreResponse`, `StoreReadiness`, `StoreUpdateRequest`, `BootstrapStoreRequest` schemas
- `bootstrap_store` operation (`POST /v1/bootstrap/store`)
- `slug` field from `UpdateListingRequest`, `ListingResponse`, and `ListingSummary` schemas

### Added
- `short_code` field on `ListingResponse` and `ListingSummary` — replaces `slug` as the listing identifier in responses
- `BootstrapCompleteRequest` schema (for `POST /v1/bootstrap/complete`)
- Pinned `openapi.json` updated to current API spec

### Changed
- Listing responses now use `short_code` instead of `slug`
- `update_account` description updated — brand settings (display_name, bio, avatar) now on Account directly, not Store
- `update_listing` description updated — slug field removed

## [0.12.0] - 2026-04-12

### Changed
- `list_plans` response now includes `cursor` and `has_more` pagination fields
- `list_webhooks` tool now accepts optional `cursor` and `limit` parameters for pagination
- `list_listings` and `list_orders` tools now return slim summary objects (`ListingSummary`, `OrderSummary`)

### Removed
- `totalCount` field from listing and order list responses

## [0.11.0] - 2026-04-10

### Changed
- `upload_file` tool: added `purpose` parameter (`deliverable` | `cover` | `avatar`) — controls file size and MIME limits enforced by the API
- `update_store` tool: `avatar_url` parameter renamed to `avatar` — now accepts a file token from `upload_file` (with `purpose=avatar`) instead of a URL
- `StoreResponse`: `avatar_url` field replaced by `has_avatar` boolean

## [0.10.0] - 2026-04-10

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
