# Safehold

Your identity documents, on your machine, shared only when you say so. That's what self-sovereign identity actually looks like.

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

## Usage

Build and add to your MCP client config (e.g. Claude Desktop):

```bash
npm install
npm run build
```

```json
{
  "mcpServers": {
    "safehold": {
      "command": "node",
      "args": ["/path/to/safehold/dist/index.js"]
    }
  }
}
```

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

## Built by

[Spacetime Technology](https://github.com/spacetime-technology)
