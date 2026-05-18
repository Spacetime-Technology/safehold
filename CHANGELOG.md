# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Server-side consent via MCP `elicitation/create`. When the client advertises the capability, each `get_*` tool prompts the user with the document, fields, requesting client, and purpose. Declines are recorded in the access log.
- `document_id` parameter on every retrieval tool. Required when more than one document of the same type is stored (e.g. dual passports).
- Per-type Zod validation on `add_document` and `update_document` for known types (passport, national ID, driving licence, visa, photo variants). Unknown types still accepted as a passthrough.
- `unavailable_fields` in retrieval responses so callers can distinguish typos from missing data.
- `outcome` field on access log entries (`accepted` | `declined` | `auto`).
- 5MB per-document size cap to prevent abuse via large blobs.
- `SIGTERM` handler for clean shutdown.
- Encryption-at-rest regression test, master-key permission check test, multi-document tests, Zod validation tests, declined-elicitation test.

### Changed
- All writes (vault blobs, master key, access log) now use atomic write (tmp + fsync + rename + dir fsync). Crashes mid-write no longer corrupt files.
- Vault directory is created with mode `0700`. A warning is printed to stderr on startup if the directory has loose permissions.
- The access log throws on decryption or parse failure instead of silently returning an empty list. Audit logs that look empty when corrupted are worse than logs that error loudly.
- Server version advertised over MCP is read from `package.json` at runtime instead of hardcoded.

### Fixed
- Version drift between `package.json`, `server.json`, and the runtime is now structurally impossible: runtime reads `package.json`, `server.json` is auto-synced in the `npm version` lifecycle, and CI fails any PR where the two disagree.

## [1.0.3] — 2026-04-26

### Added
- MCP registry metadata (`server.json`, `smithery.yaml`).
- Repository, homepage, and bugs URLs in `package.json`.

## [1.0.2] — 2026-04-25

### Changed
- Internal release tooling fixes.

## [1.0.1] — 2026-04-25

### Added
- MIT license file.

## [1.0.0] — 2026-04-24

Initial public release.

### Added
- `add_document`, `list_documents`, `update_document`, `delete_document`.
- `get_passport`, `get_national_id`, `get_driving_license`, `get_visa`, `get_photo`, `get_document` retrieval tools, each with a `purpose` parameter logged for audit.
- `get_access_log` for reviewing what was accessed by which client.
- Local encrypted storage with XChaCha20-Poly1305 via `@noble/ciphers`.
- Master key auto-provisioned at `~/.safehold/master.key` (mode `0600`).
- Configurable vault path via `SAFEHOLD_VAULT_DIR`.
