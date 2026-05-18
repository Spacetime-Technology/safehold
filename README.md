# Safehold

Self-custody KYC document storage, built as a local MCP server.

## What it is

Safehold stores your identity documents — passports, visas, travel credentials — locally on your machine, encrypted. No data leaves your device.

It exposes them via the Model Context Protocol (MCP), so AI agents and other MCP servers can request access to specific document fields without ever handling the raw files.

## How it works

- Documents are encrypted and stored locally
- Safehold runs as a local stdio MCP server
- Other MCPs (flight booking, visa applications, border control integrations) can request access to specific fields
- You control what is shared and with whom, every time

## Why open source

Self-custody only means something if you can verify it. The entire codebase is open so anyone can audit exactly what happens to their documents — nothing is obfuscated, nothing is sent anywhere.

## Built by

[Spacetime Technology](https://github.com/spacetime-technology)
