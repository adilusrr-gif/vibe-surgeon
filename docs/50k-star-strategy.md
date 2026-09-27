# 50k-star strategy

50,000 stars is a distribution outcome, not an engineering acceptance criterion. The product has to earn repeat use first.

## Positioning

Do not position Vibe Surgeon as another coding agent.

Position it as the **safety layer underneath every coding agent**:

> Your AI writes fast. Vibe Surgeon keeps the repo safe to change.

The enemy is not Claude Code, Codex, Cursor or OpenCode. Those are distribution surfaces.

## The 30-second wow moment

A user should be able to run one command in a messy repository:

```bash
npx -y vibe-surgeon@latest all .
```

Within seconds they should see:

- an explainable health score;
- secret/environment-file risk;
- giant-file and maintenance signals;
- dependency hotspots;
- compact agent context;
- a dark standalone HTML report;
- MCP tools that the coding agent can call itself.

Then the second wow moment:

```bash
vibe-surgeon guard . --base origin/main
```

A tiny patch is shown to have a concrete blast radius.

## Star-growth stages

### 0 → 1k: prove the wedge

- Launch only after the installation path works from a clean machine.
- Publish a 20–30 second terminal GIF/video: messy repo → score → hotspot → guard.
- Post the same demo to GitHub, Hacker News, Reddit developer communities and X/LinkedIn.
- Ask for *failure modes*, not generic feature requests.
- Benchmark on at least 20 public repositories and publish false-positive notes.

Success signal: developers voluntarily add it to a second repository.

### 1k → 10k: become part of the agent workflow

- MCP integrations for major coding-agent hosts.
- GitHub Action and SARIF.
- PR summary bot.
- Framework packs for Next.js, Python/FastAPI, Go and monorepos.
- `vibe-surgeon explain <finding>` with deterministic remediation guidance.

Success signal: repositories keep the tool in CI after the first week.

### 10k → 25k: create a standard

- Public Vibe Health benchmark.
- Shareable score badge.
- Community rule packs.
- Test-impact analysis.
- Semantic symbol graph with tree-sitter.
- Maintainer dashboard generated from repository history.

Success signal: people compare repository health using the term "Vibe Health Score" without needing an explanation.

### 25k → 50k: ecosystem

- VS Code/Cursor extension.
- GitHub App for zero-config PR reviews.
- Policy packs for teams.
- Plugin SDK.
- Public leaderboard for most improved repositories.
- Optional hosted layer, while the core remains local and open source.

## Viral loops

1. **Shareable report:** every `report.html` can become a screenshot/post.
2. **PR comments:** each pull request exposes Vibe Surgeon to contributors.
3. **MCP:** agents can recommend/run the tool while working.
4. **Badges:** maintainers display health status in README.
5. **Failure-mode issues:** real incidents become new rules and release stories.

## What will kill the project

- requiring an API key for the core scan;
- pretending regex analysis is formal verification;
- noisy false positives;
- building a huge hosted dashboard before the CLI is loved;
- vendor lock-in to one coding agent;
- adding 50 rules that nobody understands;
- measuring success only by stars instead of repeat usage.

## Core metrics

Track weekly:

- successful installs;
- percentage of users who run a second command after `scan`;
- repositories that add CI/MCP integration;
- repeat scans after 7 and 30 days;
- false-positive reports per 100 scans;
- stars per launch impression;
- contributor count and merged external PRs.

Stars are a lagging indicator. Retained repositories are the leading indicator.
