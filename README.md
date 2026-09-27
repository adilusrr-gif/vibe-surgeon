<p align="center">
  <img src="assets/banner.svg" alt="Vibe Surgeon — Know what to review after AI edits" width="100%" />
</p>

<p align="center"><strong>Know what to review after your AI edits the repo.</strong></p>
<p align="center">
  <a href="https://github.com/adilusrr-gif/vibe-surgeon/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/adilusrr-gif/vibe-surgeon/actions/workflows/ci.yml/badge.svg" /></a>
  <img alt="Zero runtime dependencies" src="https://img.shields.io/badge/runtime_dependencies-0-0F172A" />
  <img alt="MIT license" src="https://img.shields.io/badge/license-MIT-334155" />
</p>
<p align="center">
  <a href="#try-it">Try it</a> · <a href="docs/demo.md">Reproducible demo</a> ·
  <a href="docs/mcp.md">MCP</a> · <a href="docs/README.ru.md">Русский</a> ·
  <a href="https://github.com/adilusrr-gif/vibe-surgeon/issues/new?template=feedback.yml">Give feedback</a>
</p>

**Vibe Surgeon is a local review companion for AI-assisted repositories.**
It maps recognizable file imports, flags change-risk signals, and creates a compact
handoff for your next coding session. No account, no API key, no LLM calls.

**Public preview.** It helps you decide where to look, not whether your code is
correct. It does not run your application tests, prove security, or fix code.

## Try it

You need Git and Node.js 20 or newer. Use the source checkout; an npm registry
publication is **not** required or claimed.

```bash
git clone https://github.com/adilusrr-gif/vibe-surgeon.git
cd vibe-surgeon
npm ci --ignore-scripts
npm run demo
```

The demo creates and cleans up an isolated temporary Git repository. It writes
its report and evidence to `.vibe-surgeon/demo/`; your application is not modified.

Then analyze your own project (replace the path):

```bash
node bin/vibe-surgeon.mjs all /absolute/path/to/your-repository
```

Open `/absolute/path/to/your-repository/.vibe-surgeon/report.html` locally.
`all` writes local metadata under `.vibe-surgeon/`; `scan` only prints its result.
Review reports before sharing: filenames and findings can expose private details.

Versioned packages and source archives are listed under
[GitHub Releases](https://github.com/adilusrr-gif/vibe-surgeon/releases).
A `.tgz` release asset is not an npm registry publication. Do not use
`npx vibe-surgeon@latest` based on this README.

## One changed file. Three places to review.

This output comes from `npm run demo`, not a customer case or a benchmark:

```text
Change: src/auth.mjs (session duration: 30 -> 60)
Mapped: 3 source files, 2 local import edges
Changed files: 1
Potentially impacted files: 3 (includes the changed file)
  src/auth.mjs
  src/session.mjs
  src/app.mjs
Heuristic change risk: 55/100 (high)
Guard CLI exit: 2 (review required)
```

The warning combines an import hotspot, an auth-related filename and no detected
test files. **It does not claim that changing 30 to 60 broke anything.** Inspect
the [fixture, evidence and scoring explanation](docs/demo.md).

## Where it fits

Your coding agent writes a patch. Vibe Surgeon adds a review checklist:

| Your question | Command | What it actually provides |
|---|---|---|
| Where should I start reviewing? | `guard` | Tracked Git changes, heuristic risk and reverse-import impact |
| Which files are connected? | `map` | Recognized local import edges and file hotspots |
| What maintenance signals changed? | `baseline` / `compare` | Differences in score and finding categories |
| What should the next agent know? | `context` | A generated repository summary, not a full semantic model |
| What needs attention? | `scan` / `doctor` | Rule-based findings and a prioritized Markdown checklist |
| How do I share the result? | `report` / `sarif` | Local HTML or SARIF 2.1.0 output |

A suggested workflow, from the Vibe Surgeon checkout:

```bash
# Before editing: inspect and record the current state.
node bin/vibe-surgeon.mjs scan /path/to/repo
node bin/vibe-surgeon.mjs baseline /path/to/repo
node bin/vibe-surgeon.mjs context /path/to/repo

# After editing tracked files, before committing:
node bin/vibe-surgeon.mjs guard /path/to/repo --base HEAD
node bin/vibe-surgeon.mjs compare /path/to/repo
```

Choose the Git base deliberately. `HEAD` compares tracked working-tree changes
against the current commit. To review committed changes, supply an earlier commit
or your intended branch base. Run application tests separately.

`guard`: exit **0** means below the configured heuristic threshold, **2** means
high risk, and **1** means an execution/Git error. None means “the patch is correct.”
Untracked files are outside its current scope. Run at the Git repository root.
`compare` exits 3 for detected regression; without a baseline it reports that one
is missing and is not a fail-closed gate.

## Use it beside your coding agent

The CLI is editor-neutral. The local MCP server exposes `vibe_scan`, `vibe_map`,
`vibe_guard`, `vibe_context` and `vibe_blast_radius`.

```bash
node /path/to/vibe-surgeon/bin/vibe-surgeon.mjs mcp /path/to/repo
```

See [MCP setup and trust boundaries](docs/mcp.md) and the
[generic client template](templates/mcp/server.json). The stdio handshake is tested;
every host/version combination is not. A connected agent is not forced to run or
obey the checks. Only connect trusted local clients: this server is not a sandbox.

For CI, see [GitHub integration](docs/github.md). Keep your real tests, linters,
type checks, secret scanning and human review. Vibe Surgeon complements them.

## Honest boundaries

- **Heuristics, not semantics.** Local JS/TS relative imports are recognized with
  text patterns. Aliases such as `@/`, dynamic wiring, monorepos and Python imports
  are incomplete. Graph misses are possible.
- **A score is not a certificate.** 100/100 only means no deductions under these
  rules. Test files are recognized by path/name; tests and coverage are not run.
- **The scanner is not Git-aware.** A present `.env` is not proof it was committed.
  Some file types/directories are skipped; large files and file-count limits apply.
- **Source-derived output is sensitive.** Vibe Surgeon makes no LLM calls, but an
  MCP host can send its results to that host's provider. Review before sharing.

[Scoring rules](docs/scoring.md) · [Security notes](SECURITY.md) · [Changelog](CHANGELOG.md)

## Help make it useful

Try it on a public or sanitized repository. Then tell us **one useful warning, one
false positive, or one important miss** through the
[first-run feedback form](https://github.com/adilusrr-gif/vibe-surgeon/issues/new?template=feedback.yml).
No private code or credentials are needed.

The next priorities are import-resolution correctness, fewer false positives and
real repository fixtures. Semantic graphs and test-impact selection are future
work, not features of this preview. See [CONTRIBUTING.md](CONTRIBUTING.md).

If the tool is useful to you, a GitHub star helps you find it again. Feedback and
repeat use matter more than a star count. MIT licensed.
