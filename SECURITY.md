# Security policy

## Reporting a vulnerability

Use [GitHub's private security advisory form](https://github.com/Spacetime-Technology/safehold/security/advisories/new) on this repository. Do not file a public issue for security problems. You'll get an acknowledgement within 72 hours.

If the issue is critical (key exposure, plaintext leak, remote code execution via tool input), mark the advisory as such when you submit it.

## Supported versions

Only the latest minor on the `1.x` line gets security fixes. Older versions will not be backported.

## Threat model

Safehold protects identity documents against the following:

- **AI agents and MCP clients** accessing the host machine. Every retrieval requires explicit purpose and (where the client supports elicitation) per-access user consent. Field-level granularity stops agents from reading more than they need.
- **Data at rest on disk.** All documents and the access log are encrypted with XChaCha20-Poly1305 (`@noble/ciphers`, Cure53 audited). The master key is stored at `~/.safehold/master.key` with mode `0600`. Document files are written atomically (tmp + rename + fsync) so a crash mid-write cannot corrupt them.
- **Casual filesystem snooping.** The vault directory is created with mode `0700`. Other local users without root cannot read the encrypted blobs (though they wouldn't be able to decrypt them anyway).

Safehold does **not** protect against:

- **An attacker who has read access to your unlocked home directory.** They can read `master.key` directly and decrypt everything. Disk encryption (FileVault, LUKS, BitLocker) is the right defense for that — Safehold layers on top of it, not in place of it.
- **A malicious MCP host.** If the host you've connected Safehold to is itself compromised, it can call tools without showing you the consent prompt. Pick MCP clients you trust.
- **A backup or sync tool that uploads `~/.safehold/` somewhere.** The blobs are encrypted but the key sits alongside them. If both leave your machine together, the protection is gone. Exclude `~/.safehold/` from cloud sync.
- **Memory inspection.** The decryption key lives in process memory while the server runs. A user with the privilege to attach a debugger to the process can read it.

## If your `master.key` leaks

1. Move `~/.safehold/` to an offline location immediately.
2. Treat every document in the vault as compromised. Rotate passport numbers, request new visas, etc., the same as if a physical wallet had been stolen.
3. Wipe `~/.safehold/` and let Safehold generate a fresh key. Re-add documents.

There is currently no key-rotation tool that re-encrypts blobs under a new key in place. Adding one is on the roadmap.

## What we do internally

- Releases are published from CI with [npm provenance](https://docs.npmjs.com/generating-provenance-statements) so you can verify the artifact came from this repository.
- The MCP registry publish is gated on the same tag.
- Dependency updates run `npm audit --audit-level=high` on every PR.
- Versions across `package.json`, `server.json`, and the runtime are enforced in sync by CI — there is no way to ship a release where these disagree.
