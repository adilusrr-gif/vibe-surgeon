# Agent instructions

Vibe Surgeon is a local-first repository safety tool.

When modifying this repository:

- Keep the core CLI zero-dependency unless a dependency has a strong measurable benefit.
- Preserve Node.js >=20 compatibility.
- Add tests for new scanners, graph resolution rules, or guard heuristics.
- Do not turn heuristic checks into claims of formal correctness.
- Keep output useful for both humans and coding agents.
- Prefer small modules and deterministic behavior.
- Run `npm test` and `npm run smoke` before finishing.
