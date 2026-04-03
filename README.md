# listbee-mcp

MCP server for ListBee — commerce API for AI agents.

---

## Golden Path

Four calls to go from zero to a live, selling product page:

```
create_listing    →  set_deliverables  →  get_listing  →  publish_listing
  name, price         file/url/text        check status     go live
```

**1. Create**
```json
{ "name": "50 Cold Outreach Templates", "price": 1900 }
```

**2. Set deliverables** — attach what buyers receive after payment
```json
{ "deliverables": [{ "type": "url", "value": "https://...", "label": "Download" }] }
```

**3. Inspect readiness** — `get_listing` tells you what's missing and how to fix it

**4. Publish** — `publish_listing` makes the product page live

---

## Install

### Claude Desktop

`~/.claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "listbee": {
      "command": "npx",
      "args": ["listbee-mcp", "--api-key", "lb_..."]
    }
  }
}
```

Or with an env var:

```json
{
  "mcpServers": {
    "listbee": {
      "command": "npx",
      "args": ["listbee-mcp"],
      "env": {
        "LISTBEE_API_KEY": "lb_..."
      }
    }
  }
}
```

### Cursor

`.cursor/mcp.json`

```json
{
  "mcpServers": {
    "listbee": {
      "command": "npx",
      "args": ["listbee-mcp", "--api-key", "lb_..."]
    }
  }
}
```

### Claude Code

```bash
claude mcp add listbee -- npx listbee-mcp --api-key lb_...
```

### CLI

```bash
npx listbee-mcp --api-key lb_...
```

---

## Options

| Flag | Env var | Default | Description |
|------|---------|---------|-------------|
| `--api-key <key>` | `LISTBEE_API_KEY` | — | ListBee API key (required) |
| `--base-url <url>` | `LISTBEE_BASE_URL` | `https://api.listbee.so` | API base URL |
| `--tools <list>` | — | all tools | Comma-separated list of tools to load |

**Selective tool loading** — load only what you need:

```bash
npx listbee-mcp --api-key lb_... --tools create_listing,get_listing,publish_listing
```

---

## Tools

### Listings

| Tool | Description |
|------|-------------|
| `create_listing` | Create a new listing. Returns checkout URL and readiness. |
| `get_listing` | Get full listing state including readiness. Call after every change. |
| `update_listing` | Update title, price, or other listing details. |
| `list_listings` | List all listings for the current account. |
| `publish_listing` | Publish a listing so buyers can access the product page. |
| `set_deliverables` | Attach digital content (file, URL, or text) for automatic delivery. |
| `remove_deliverables` | Remove deliverables to switch to external fulfillment. |
| `delete_listing` | Permanently delete a listing. |

### Orders

| Tool | Description |
|------|-------------|
| `list_orders` | See all sales and order status. |
| `get_order` | Get full order details including buyer info and payment. |
| `deliver_order` | Push digital content to a buyer (external fulfillment only). |

### Files

| Tool | Description |
|------|-------------|
| `upload_file` | Upload a file to ListBee. Returns a token to use in `set_deliverables`. |

### Stripe

| Tool | Description |
|------|-------------|
| `start_stripe_connect` | Start Stripe Connect onboarding. Returns a URL — the human must open it in a browser. |

---

## Readiness

Every listing response includes a `readiness` object that tells you exactly what's needed before the listing can go live — and how to fix it.

```json
{
  "readiness": {
    "sellable": false,
    "publishable": false,
    "actions": [
      {
        "code": "stripe_not_connected",
        "kind": "human",
        "message": "Connect a Stripe account to accept payments.",
        "resolve": {
          "method": "POST",
          "endpoint": "/v1/account/stripe/connect"
        }
      }
    ],
    "next": "stripe_not_connected"
  }
}
```

**What to do with it:**

- `readiness.sellable` — `true` means buyers can purchase right now
- `readiness.publishable` — `true` means you can call `publish_listing`
- `readiness.actions` — list of what's blocking, each with `kind: "api"` or `kind: "human"`
  - `api` actions: the agent handles them (call the endpoint in `resolve`)
  - `human` actions: requires human input (show the `message` and `url`)
- `readiness.next` — the highest-priority action code to resolve first

**The pattern:** `create_listing` → `get_listing` → resolve each `api` action → surface `human` actions to the user → `publish_listing` when `publishable` is `true`.

---

## Get an API Key

[console.listbee.so](https://console.listbee.so) — sign in, go to API Keys.

---

## Links

- [API Reference](https://docs.listbee.so/api-reference) — full endpoint docs
- [OpenAPI Spec](https://api.listbee.so/openapi.json) — machine-readable spec
- [Docs](https://docs.listbee.so) — guides and integration examples
- [GitHub](https://github.com/listbee-dev/listbee-mcp) — source

---

## License

Apache-2.0
