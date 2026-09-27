# Launch playbook

## Release gate

Do not launch publicly until all are true:

- `npm test` passes on Node 20, 22 and 24 in CI;
- `npm pack --dry-run` contains README assets/docs/templates;
- install from the packed tarball works in a clean temporary project;
- MCP initialize + `tools/list` works;
- SARIF results include file locations;
- `scan` on Vibe Surgeon's own repository is healthy;
- README first screen explains the value without scrolling.

## Launch asset

Record one short demo. No talking head is required.

Sequence:

1. open an intentionally messy repository;
2. `npx vibe-surgeon scan .`;
3. highlight one hotspot and one risk;
4. change a central file;
5. `vibe-surgeon guard . --base HEAD~1`;
6. open `report.html`;
7. finish on: **Your AI writes fast. Keep the repo safe to change.**

## Launch post

Title options:

- `Vibe Surgeon: a zero-dependency safety layer for AI-written repositories`
- `I built a blast-radius guard for vibe coding`
- `AI writes the patch. This checks what the patch can break.`

The post should contain the problem, one command, one screenshot/GIF, limits, and a direct request for real failure cases.

## First 14 days

Days 1–2: GitHub + npm release, demo asset, Show HN.

Days 3–5: respond to every technical issue; ship small fixes daily if justified.

Days 6–7: publish benchmark results from public repositories, including misses and false positives.

Week 2: ship the first community-driven rule and publish the story behind it.

The goal is not maximum feature count. The goal is proof that users trust the guard enough to keep it in their workflow.
