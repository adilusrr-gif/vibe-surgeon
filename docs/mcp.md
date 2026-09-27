# MCP integration

Vibe Surgeon can run as a local MCP server over stdio. It intentionally has zero runtime dependencies.

```bash
npx -y vibe-surgeon@latest mcp .
```

Available tools:

| Tool | Purpose |
|---|---|
| `vibe_scan` | Repository health and risk scan |
| `vibe_map` | Local dependency graph and hotspots |
| `vibe_guard` | Git diff risk and blast radius |
| `vibe_context` | Compact generated context for a coding agent |
| `vibe_blast_radius` | Impact analysis for an explicit list of changed files |

A generic MCP client configuration is available at [`templates/mcp/server.json`](../templates/mcp/server.json). Host products may use a different configuration file location or wrapper format.
