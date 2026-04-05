# MCP SDK Migration + Downstream Pipeline — Design Spec

**Date:** 2026-04-05
**Version:** listbee-mcp 0.3.0 → 0.4.0
**Status:** Approved

## Problem

The MCP package (`listbee-mcp`) has a hand-written 79-line HTTP client (`src/client.ts`) that duplicates what the TypeScript SDK (`listbee@0.6.1`) already provides — auth, error handling, retries, typed methods. Additionally, the downstream sync pipeline is fragmented: multiple workflows doing similar things, no dependency chain between TS SDK and MCP, and no way to automatically cascade API changes through the stack.

## Goals

1. Replace MCP's internal client with the TypeScript SDK
2. Simplify MCP handler architecture (33 functions across 8 files → 1 handler map)
3. Unify error handling (SDK's typed hierarchy replaces custom `ListBeeApiError`)
4. Wire up the downstream cascade: core → TS SDK → MCP
5. Consolidate core repo's downstream notification workflows

## Architecture

### MCP internal structure (after)

```
src/
├── handlers.ts              ← NEW: one-line-per-operation handler map (30 operations)
├── handlers/
│   ├── upload-file.ts       ← custom: fetches URL → SDK upload
│   └── stripe-connect.ts    ← custom: adds human instruction text
├── types.ts                 ← simplified: jsonResult, errorResult (SDK errors), safeTool
├── utils.ts                 ← moved from tools/shared.ts: autoTitle, buildDescription
├── server.ts                ← simplified: ListBee from SDK, safeTool at registration
├── manifest.ts              ← unchanged
├── index.ts                 ← unchanged
├── generated/
│   ├── meta.ts              ← unchanged (from openapi.json + mcp-tools.yaml)
│   └── schemas.ts           ← unchanged (Zod for runtime LLM input validation)
└── transports/
    ├��─ stdio.ts             ← unchanged
    └── http.ts              ← unchanged
```

**Deleted:** `src/client.ts`, `src/tools/listings.ts`, `src/tools/orders.ts`, `src/tools/customers.ts`, `src/tools/account.ts`, `src/tools/api-keys.ts`, `src/tools/webhooks.ts`, `src/tools/files.ts`, `src/tools/stripe.ts`, `src/tools/shared.ts`

### Handler map pattern

All simple operations (30 of 33) are one-liners in `src/handlers.ts`:

```typescript
import type { ListBee } from 'listbee';

export type Handler = (client: ListBee, args: Record<string, unknown>) => Promise<unknown>;

export const handlers: Record<string, Handler> = {
  create_listing:      (c, a) => c.listings.create(a as any),
  get_listing:         (c, a) => c.listings.get(a.listing_id as string),
  list_listings:       (c, a) => c.listings.list(a as any),
  update_listing:      (c, a) => { const { listing_id, ...p } = a; return c.listings.update(listing_id as string, p as any); },
  delete_listing:      (c, a) => c.listings.delete(a.listing_id as string),
  publish_listing:     (c, a) => c.listings.publish(a.listing_id as string),
  set_deliverables:    (c, a) => c.listings.setDeliverables(a.listing_id as string, a as any),
  remove_deliverables: (c, a) => c.listings.removeDeliverables(a.listing_id as string),

  list_orders:         (c, a) => c.orders.list(a as any),
  get_order:           (c, a) => c.orders.get(a.order_id as string),
  deliver_order:       (c, a) => { const { order_id, ...p } = a; return c.orders.deliver(order_id as string, p as any); },
  ship_order:          (c, a) => { const { order_id, ...p } = a; return c.orders.ship(order_id as string, p as any); },
  refund_order:        (c, a) => c.orders.refund(a.order_id as string),

  list_customers:      (c, a) => c.customers.list(a as any),
  get_customer:        (c, a) => c.customers.get(a.customer_id as string),

  get_account:         (c) => c.account.get(),
  update_account:      (c, a) => c.account.update(a as any),
  delete_account:      (c) => c.account.delete(),
  create_account:      (c, a) => c.signup.create(a as any),
  verify_otp:          (c, a) => c.signup.verify(a as any),

  list_api_keys:       (c) => c.apiKeys.list(),
  create_api_key:      (c, a) => c.apiKeys.create(a as any),
  delete_api_key:      (c, a) => c.apiKeys.delete(a.key_id as string),

  disconnect_stripe:   (c) => c.stripe.disconnect(),

  list_webhooks:       (c) => c.webhooks.list(),
  create_webhook:      (c, a) => c.webhooks.create(a as any),
  update_webhook:      (c, a) => { const { webhook_id, ...p } = a; return c.webhooks.update(webhook_id as string, p as any); },
  delete_webhook:      (c, a) => c.webhooks.delete(a.webhook_id as string),
  list_webhook_events: (c, a) => { const { webhook_id, ...p } = a; return c.webhooks.listEvents(webhook_id as string, p as any); },
  retry_webhook_event: (c, a) => c.webhooks.retryEvent(a.webhook_id as string, a.event_id as string),
  test_webhook:        (c, a) => c.webhooks.test(a.webhook_id as string),
};
```

Three operations have custom logic in separate files:
- `upload_file` — fetches URL, converts to Buffer, calls `client.files.upload()`
- `start_stripe_connect` — calls `client.stripe.connect()`, appends human instruction text
- (These are merged into the allHandlers map in server.ts)

### Error handling

`src/types.ts` uses SDK's typed error hierarchy instead of custom `ListBeeApiError`:

```typescript
import { APIStatusError, APIConnectionError, APITimeoutError } from 'listbee';

export function errorResult(err: unknown): CallToolResult {
  if (err instanceof APIStatusError) {
    return {
      isError: true,
      content: [{ type: "text", text: JSON.stringify({
        status: err.status,
        code: err.code,
        detail: err.detail,
        ...(err.param ? { param: err.param } : {}),
      }, null, 2) }],
    };
  }
  if (err instanceof APIConnectionError) {
    return { isError: true, content: [{ type: "text", text: `Connection error: ${err.message}` }] };
  }
  if (err instanceof APITimeoutError) {
    return { isError: true, content: [{ type: "text", text: `Request timed out: ${err.message}` }] };
  }
  const message = err instanceof Error ? err.message : String(err);
  return { isError: true, content: [{ type: "text", text: message }] };
}
```

Agents now see structured error codes (`code`, `param`) instead of raw JSON blobs.

### safeTool at registration layer

`safeTool()` wrapping moves from each handler into `server.ts` registration:

```typescript
server.registerTool(toolName, config, async (args) => {
  return safeTool(() => allHandlers[toolName](client, args));
});
```

No handler calls `safeTool` directly. Handlers just return data or throw — the registration layer handles error formatting uniformly.

### server.ts changes

```typescript
import { ListBee } from 'listbee';
import { handlers } from './handlers.js';
import { handleUploadFile } from './handlers/upload-file.js';
import { handleStripeConnect } from './handlers/stripe-connect.js';

const allHandlers: Record<string, Handler> = {
  ...handlers,
  upload_file: handleUploadFile,
  start_stripe_connect: handleStripeConnect,
};

export function createServer(options: CreateServerOptions): McpServer {
  const client = new ListBee({
    apiKey: options.apiKey,
    baseUrl: options.baseUrl,
  });
  // ... registration loop uses allHandlers + safeTool at registration
}
```

### Free upgrades from SDK

- Retries with exponential backoff (MCP currently has none)
- Rate limit handling with Retry-After header
- Request timeouts with AbortController
- Idempotency-Key support on POST endpoints

### Transports

No changes. Both stdio and HTTP transports are client-agnostic. They pass `{ apiKey, baseUrl }` to `createServer()`, which now creates a `ListBee` instance instead of `ListBeeClient`.

### Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "1.29.0",
    "listbee": "^0.6.1",
    "yaml": "2.8.3",
    "zod": "3.25.76"
  }
}
```

`listbee` added. No dependencies removed (MCP SDK, yaml, zod all still needed).

### Version

Bump to `0.4.0`. Breaking: error format changed (structured `code`/`detail`/`param` instead of raw body). Non-breaking for MCP consumers — tool outputs are still `CallToolResult`.

## Downstream Pipeline Changes

### Workspace Makefile

```makefile
mcp/sync-spec:
	cp $(TS)/openapi.json $(MCP)/openapi.json
	cd $(MCP) && npm run generate
	cd $(MCP) && npm run build

sync-all: ts/sync-spec mcp/sync-spec
	@echo "All downstream repos synced"
```

`mcp/sync-spec` copies spec from TS SDK repo (not core). TS SDK is the spec distribution point.

### TS SDK publish → MCP dispatch

Add to `listbee-typescript/.github/workflows/publish.yml`:

```yaml
- name: Notify MCP to bump SDK dep
  if: success()
  env:
    GH_TOKEN: ${{ secrets.CROSS_REPO_TOKEN }}
  run: |
    gh api repos/listbee-dev/listbee-mcp/dispatches \
      -f event_type=sdk-published \
      -f "client_payload[version]=${{ github.ref_name }}"
```

### MCP spec-sync workflow update

Update `listbee-mcp/.github/workflows/spec-sync.yml` to handle three triggers:

1. `api-spec-changed` — spec in payload (from core push)
2. `api-deployed` — fetch from production (from core deploy)
3. `sdk-published` — bump SDK dep (from TS SDK publish)

```yaml
on:
  repository_dispatch:
    types: [api-spec-changed, api-deployed, sdk-published]
```

For `sdk-published`: create PR that bumps `listbee` version in package.json + runs build.

### Core repo workflow consolidation

Replace `push-spec-to-sdk.yml` + `api-change-notify.yml` with single `api-change-downstream.yml`:

```yaml
name: Downstream Sync
on:
  push:
    branches: [main]
    paths:
      - 'app/src/api/**'
      - 'app/src/domain/**'
      - 'app/mcp-tools.yaml'

jobs:
  dispatch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - name: Install deps
        run: cd app && pip install -e .
      - name: Extract spec
        run: |
          cd app && python -c "from src.main import app; import json; print(json.dumps(app.openapi(), indent=2))" > /tmp/openapi.json

      - name: Dispatch to TS SDK
        env: { GH_TOKEN: '${{ secrets.CROSS_REPO_TOKEN }}' }
        run: |
          gh api repos/listbee-dev/listbee-typescript/dispatches \
            -f event_type=api-spec-changed \
            -f "client_payload[spec]=$(base64 -w0 /tmp/openapi.json)"

      - name: Dispatch to MCP
        env: { GH_TOKEN: '${{ secrets.CROSS_REPO_TOKEN }}' }
        run: |
          gh api repos/listbee-dev/listbee-mcp/dispatches \
            -f event_type=api-spec-changed \
            -f "client_payload[spec]=$(base64 -w0 /tmp/openapi.json)"

      - name: Open Python SDK issue
        env: { GH_TOKEN: '${{ secrets.CROSS_REPO_TOKEN }}' }
        continue-on-error: true
        run: |
          DIFF=$(git diff HEAD~1 -- app/src/api/ app/src/domain/ | head -500)
          gh issue create --repo listbee-dev/listbee-python \
            --title "API changed — update SDK" --label api-sync \
            --body "API source files changed. Review and update.\n\n\`\`\`diff\n${DIFF}\n\`\`\`"

      - name: Open n8n issue
        env: { GH_TOKEN: '${{ secrets.CROSS_REPO_TOKEN }}' }
        continue-on-error: true
        run: |
          DIFF=$(git diff HEAD~1 -- app/src/api/ app/src/domain/ | head -500)
          gh issue create --repo listbee-dev/n8n-nodes-listbee \
            --title "API changed — update n8n node" --label api-sync \
            --body "API source files changed. Review and update.\n\n\`\`\`diff\n${DIFF}\n\`\`\`"
```

The existing `api-change-notify.yml` and `push-spec-to-sdk.yml` are deleted — this replaces both.

### post-deploy.yml updates

Already has TS SDK dispatch. Add MCP dispatch:

```yaml
- name: Trigger MCP spec-sync (production)
  env:
    GH_TOKEN: ${{ secrets.CROSS_REPO_TOKEN }}
  run: |
    gh api repos/listbee-dev/listbee-mcp/dispatches \
      -f event_type=api-deployed
```

## The Full Cascade

```
Core API push to main
  ↓ api-change-downstream.yml
  ├── TS SDK: spec-sync PR (types regenerated)
  │     ↓ merge + tag → publishes to npm
  │     ↓ publish.yml dispatches to MCP
  │     └── MCP: SDK dep bump PR
  │
  ├── MCP: spec-sync PR (Zod schemas regenerated)
  │     ↓ merge + tag → publishes to npm + Docker deploys
  │
  ├── Python SDK: issue opened (manual)
  └── n8n: issue opened (manual)

Core API deploy
  ↓ post-deploy.yml
  ├��─ TS SDK: spec-sync from production (safety net)
  ���── MCP: spec-sync from production (safety net)
  └── Docs: auto-rebuild

Local development
  ↓ make sync-all
  ├── ts/sync-spec (extract spec from core → generate TS types)
  └── mcp/sync-spec (copy spec from TS SDK → generate Zod schemas)
```

## Testing

MCP's existing CI (`ci.yml`) runs build + transport parity test. After migration:
- Build validates types match (SDK methods used correctly)
- Parity test validates both transports register identical tools
- No new test files needed — tool registration is the test surface

Manual verification after migration:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}
{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | LISTBEE_API_KEY=lb_test node dist/index.js 2>/dev/null
```

## CHANGELOG entry

```markdown
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
```
