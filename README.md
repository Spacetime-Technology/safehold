# Safehold

[![npm version](https://img.shields.io/npm/v/safehold)](https://www.npmjs.com/package/safehold)
[![node](https://img.shields.io/node/v/safehold)](https://nodejs.org)

Your identity documents, on your machine, shared only when you say so.


## What it is

Safehold is a local MCP server that stores passports, visas, driving licences, and other identity documents. When an AI agent needs your passport number to book a flight, it asks Safehold. You see what's being requested and why, then approve or deny. Nothing leaves your device.

## Why it exists

Your identity data is scattered across dozens of services you don't control: banks, airlines, government portals, SaaS products. Each one holds a copy and decides for itself how to store it, whether to sell it, and how long it'll stick around. AI agents make this worse. Anything an agent can access, every API it touches can reach too.

Safehold is the alternative. The agent gets a field value. You get a consent prompt instead of a privacy policy. Your files stay where they are.

Open source, so none of this requires trust.

## How it works

Safehold runs as a stdio MCP server. Documents go into `~/.safehold/vault/` as individual encrypted files. Every retrieval is logged to `~/.safehold/access-log.enc`.

Encryption is XChaCha20-Poly1305 via [`@noble/ciphers`](https://github.com/paulmillr/noble-ciphers), audited by Cure53, no external dependencies. On first run a 32-byte key is written to `~/.safehold/master.key` (mode 0600).

Other MCP clients can request specific fields from your documents. You control what gets shared, every time.

## Tools (v1)

| Tool | Description |
|------|-------------|
| `add_document` | Add a document to the vault |
| `list_documents` | List stored documents (metadata only) |
| `update_document` | Update fields on an existing document |
| `delete_document` | Permanently delete a document |
| `get_passport` | Retrieve specific fields from a passport |
| `get_national_id` | Retrieve specific fields from a national ID |
| `get_driving_license` | Retrieve specific fields from a driving licence |
| `get_visa` | Retrieve specific fields from a visa |
| `get_photo` | Retrieve a stored photo (passport style, selfie, or signature) |
| `get_document` | Retrieve fields from any document type |
| `get_access_log` | View what was accessed, by which client, and when |

Every retrieval tool accepts a `purpose` parameter. That purpose is shown to you at consent time so you always know why a field is being requested.

## Quick Install

Requires Node.js >=20. No build step.

Most clients use the same JSON config — just the file path differs:

```json
{
  "mcpServers": {
    "safehold": {
      "command": "npx",
      "args": ["-y", "safehold@latest"]
    }
  }
}
```

| Client | Config file |
|--------|-------------|
| Claude Desktop (macOS) | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Claude Desktop (Windows) | `%APPDATA%\Claude\claude_desktop_config.json` |
| Cursor (project) | `.cursor/mcp.json` |
| Cursor (global) | `~/.cursor/mcp.json` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |
| Amazon Q Developer (global) | `~/.aws/amazonq/mcp.json` |
| Amazon Q Developer (project) | `.amazonq/mcp.json` |

Clients with slightly different config formats:

**Claude Code (CLI)**
```bash
claude mcp add safehold npx -- -y safehold@latest
```

**VS Code (GitHub Copilot)** — uses `"servers"` key, enable Agent mode in Copilot Chat. Edit `.vscode/mcp.json` (project) or `~/Library/Application Support/Code/User/mcp.json` (global, macOS):
```json
{
  "servers": {
    "safehold": {
      "command": "npx",
      "args": ["-y", "safehold@latest"]
    }
  }
}
```

**Zed** — uses `"context_servers"` key in `~/.config/zed/settings.json`:
```json
{
  "context_servers": {
    "safehold": {
      "command": "npx",
      "args": ["-y", "safehold@latest"]
    }
  }
}
```

**OpenAI Codex CLI** — TOML format in `~/.codex/config.toml`:
```toml
[mcp_servers.safehold]
command = "npx"
args = ["-y", "safehold@latest"]
```

**Continue.dev** — create `.continue/mcpServers/safehold.json` (enable Agent mode):
```json
{
  "command": "npx",
  "args": ["-y", "safehold@latest"]
}
```

**Hermes (Nous Research)** — YAML format in `~/.hermes/config.yaml`:
```yaml
mcp_servers:
  safehold:
    command: npx
    args: ["-y", "safehold@latest"]
```

**OpenClaw** — uses `"servers"` key in `~/.openclaw/mcp.json`:
```json
{
  "servers": {
    "safehold": {
      "command": "npx",
      "args": ["-y", "safehold@latest"]
    }
  }
}
```

---

## Roadmap

- `get_travel_authorization` - ESTA, eTA, UK ETA, and similar
- `get_vaccination_certificate` - international vaccination records
- `get_residency_permit` - BRP, Green Card, and equivalents
- `get_birth_certificate`
- `get_tax_id` - NI number, SSN, TFN, and equivalents
- `get_proof_of_address` - utility bills, bank letters
- `get_travel_insurance`

## Development

```bash
npm install
npm test          # run tests
npm run typecheck # type check
npm run build     # compile to dist/
npm run dev       # run directly with tsx (no build step)
```

## Releasing

```bash
npm version patch   # bug fix  (0.1.0 → 0.1.1)
npm version minor   # feature  (0.1.0 → 0.2.0)
npm version major   # breaking (0.1.0 → 1.0.0)
```

Checks that you're on a clean, up-to-date main branch, bumps the version, commits, tags, and pushes. CI publishes to npm.

## Built by

[Spacetime Technology](https://github.com/spacetime-technology)
