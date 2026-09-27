# Contributing

The best contributions are real failure modes from AI-assisted repositories.

## Before opening a PR

1. Reproduce the problem in a small fixture or test.
2. Keep the core path local and deterministic.
3. Avoid adding dependencies when the Node standard library is enough.
4. Run:

```bash
npm test
npm run smoke
```

## Good issue examples

- "Agent changed this central file and Vibe Surgeon underestimated the blast radius."
- "This framework stores tests in a layout the scanner misses."
- "This secret pattern produces a false positive on generated code."
- "This import pattern should resolve but does not."

## Product rule

Vibe Surgeon should sit below coding agents, not compete with them. Integrations with Claude Code, Codex, Cursor, OpenCode and others should share the same core model.
