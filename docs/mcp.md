# MCP integration

Use a reviewed local checkout, not an unpublished npm package:

```bash
node /absolute/path/to/vibe-surgeon/bin/vibe-surgeon.mjs mcp /absolute/path/to/your-repository
```

The server offers `vibe_scan`, `vibe_map`, `vibe_guard`, `vibe_context` and
`vibe_blast_radius`. See the [generic configuration](../templates/mcp/server.json).
Replace both absolute paths; host-specific configuration wrappers can differ.

The bundled tests exercise the stdio handshake and tool listing. They do not
certify compatibility with every release of every coding-agent host.

The server has the filesystem permissions of its process. **It is not a sandbox**;
only connect trusted local clients. `vibe_context` writes a context file. A client
can send returned source-derived information to its own model/provider even
though Vibe Surgeon itself makes no LLM API calls. Connecting MCP does not force
an agent to run checks or obey warnings.
