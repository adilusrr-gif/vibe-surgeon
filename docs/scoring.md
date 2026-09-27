# Vibe Health Score

The Vibe Health Score is an explainable heuristic, not a proof of correctness.

It starts at 100 and subtracts points for repository-level conditions that make fast AI-generated changes more dangerous to maintain: missing tests, missing lockfiles, secret-like material, tracked environment files, giant source files, missing CI, and missing agent instructions.

The score is designed around three rules:

1. **Explainable:** every deduction maps to a visible finding.
2. **Local:** no source code leaves the machine for the core workflow.
3. **Conservative:** Vibe Surgeon says "risk" rather than pretending to prove safety.

Use `baseline` and `compare` to make the score useful in CI without forcing every repository to reach 100 immediately.

```bash
vibe-surgeon baseline .
# make changes
vibe-surgeon compare .
```

`compare` exits non-zero when the repository regresses or introduces a critical class of finding.
