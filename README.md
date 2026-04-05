# listbee-mcp

[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=listbee&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22listbee-mcp%22%5D%2C%22env%22%3A%7B%22LISTBEE_API_KEY%22%3A%22%24%7Binput%3AapiKey%7D%22%7D%7D)

MCP server for ListBee — commerce API for AI agents.

---

## Connect

**Remote (zero install):** `https://api.listbee.so/mcp` — for ChatGPT Apps, Claude API Connector, remote agents. Each request needs `Authorization: Bearer lb_...` header.

**Local (stdio):** `npx -y listbee-mcp` — for Claude Desktop, Cursor, VS Code, Cline.

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

Requires Node.js 20+.

### Claude Desktop

`~/.claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "listbee": {
      "command": "npx",
      "args": ["-y", "listbee-mcp", "--api-key", "lb_..."]
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
      "args": ["-y", "listbee-mcp"],
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
      "args": ["-y", "listbee-mcp", "--api-key", "lb_..."]
    }
  }
}
```

### Claude Code

```bash
claude mcp add listbee -- npx -y listbee-mcp --api-key lb_...
```

### CLI

```bash
npx -y listbee-mcp --api-key lb_...
```

---

## Remote / HTTP Transport

For hosted deployments (ChatGPT Apps, Claude API Connector, remote agents):

```bash
npx -y listbee-mcp --transport http --port 3000
```

Each connecting agent provides their API key via `Authorization: Bearer` header.

### Docker

```bash
docker build -t listbee-mcp .
docker run -p 8080:8080 listbee-mcp
```

### Health Checks

- `GET /health` — basic liveness
- `GET /ready` — confirms tools are loaded

---

## Options

| Flag | Env var | Default | Description |
|------|---------|---------|-------------|
| `--api-key <key>` | `LISTBEE_API_KEY` | — | ListBee API key (required for stdio) |
| `--base-url <url>` | `LISTBEE_BASE_URL` | `https://api.listbee.so` | API base URL |
| `--transport <stdio\|http>` | — | `stdio` | Transport mode |
| `--port <number>` | `PORT` | `8080` | HTTP port (http mode only) |
| `--tools <list>` | — | all tools | Comma-separated list of tools to load |
| `--help`, `-h` | — | — | Show help |

**Selective tool loading** — load only what you need:

```bash
npx -y listbee-mcp --api-key lb_... --tools create_listing,get_listing,publish_listing
```

---

## Tools

### Account & Auth

| Tool | Description |
|------|-------------|
| `create_account` | Create a new ListBee account. Sends an OTP to the email for verification. |
| `verify_otp` | Verify the OTP sent during signup. Returns an API key on success — store it. |
| `get_account` | Get the account's full state including readiness and billing status. |
| `update_account` | Update display name, bio, or avatar. These appear on product pages. |
| `delete_account` | Permanently delete the account and all data. Irreversible. |
| `create_api_key` | Create a new API key. Full key value returned only once. |
| `list_api_keys` | List all API keys. Shows prefixes and names, not full values. |
| `delete_api_key` | Delete and immediately revoke an API key. |

### Listings

| Tool | Description |
|------|-------------|
| `create_listing` | Create a new listing for sale. Returns checkout URL and readiness. |
| `get_listing` | Get full listing state including readiness. Call after every change. |
| `update_listing` | Update title, price, or other listing details. |
| `list_listings` | List all listings for the current account. |
| `publish_listing` | Publish a listing so buyers can access the product page. |
| `set_deliverables` | Attach digital content (file, URL, or text) for automatic delivery. |
| `remove_deliverables` | Remove deliverables to switch to external fulfillment. Draft only. |
| `delete_listing` | Permanently delete a listing. |

### Orders

| Tool | Description |
|------|-------------|
| `list_orders` | See all sales and order status. |
| `get_order` | Get full order details including buyer info and payment. |
| `deliver_order` | Push digital content to a buyer (external fulfillment only). |
| `ship_order` | Record shipping info and mark order as fulfilled (external fulfillment). |
| `refund_order` | Issue a full refund for an order through Stripe. |

### Customers

| Tool | Description |
|------|-------------|
| `list_customers` | List all buyers who have purchased. Auto-populated from orders. |
| `get_customer` | Get a customer by ID — total orders, total spent, purchase history. |

### Webhooks

| Tool | Description |
|------|-------------|
| `create_webhook` | Create a webhook endpoint. Returns a `whsec_` secret for signature verification. |
| `list_webhooks` | List all webhook endpoints for the account. |
| `update_webhook` | Update a webhook URL or event filter. |
| `delete_webhook` | Delete a webhook endpoint. Irreversible. |
| `test_webhook` | Send a test event to verify webhook configuration before going live. |
| `list_webhook_events` | List recent events for a webhook — delivery status, attempts, errors. |
| `retry_webhook_event` | Retry delivery of a failed webhook event. |

### Files

| Tool | Description |
|------|-------------|
| `upload_file` | Upload a file to ListBee. Returns a token to use in `set_deliverables`. |

### Stripe

| Tool | Description |
|------|-------------|
| `start_stripe_connect` | Start Stripe Connect onboarding. Returns a URL — the human must open it in a browser. |
| `disconnect_stripe` | Disconnect the Stripe account from ListBee. |

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
        "code": "connect_stripe",
        "kind": "human",
        "message": "Connect a Stripe account to accept payments.",
        "resolve": {
          "method": "POST",
          "endpoint": "/v1/account/stripe/connect"
        }
      }
    ],
    "next": "connect_stripe"
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

**Canonical action codes:** `connect_stripe`, `enable_charges`, `update_billing`, `configure_webhook`, `publish_listing`, `webhook_disabled`

**The pattern:** `create_listing` → `get_listing` → resolve each `api` action → surface `human` actions to the user → `publish_listing` when `publishable` is `true`.

---

## Debugging

Use [MCP Inspector](https://github.com/modelcontextprotocol/inspector) for interactive testing:

```bash
npx @modelcontextprotocol/inspector npx -y listbee-mcp
```

---

## Get an API Key

[console.listbee.so](https://console.listbee.so) — sign in, go to API Keys.

---

## Links

- [API Reference](https://docs.listbee.so/api-reference) — full endpoint docs
- [OpenAPI Spec](https://api.listbee.so/openapi.json) — machine-readable spec
- [Docs](https://docs.listbee.so) — guides and integration examples
- [CHANGELOG](https://github.com/listbee-dev/listbee-mcp/blob/main/CHANGELOG.md) — version history
- [npm](https://www.npmjs.com/package/listbee-mcp) — npm package
- [GitHub](https://github.com/listbee-dev/listbee-mcp) — source

---

## License

Apache-2.0
