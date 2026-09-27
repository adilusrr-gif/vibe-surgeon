# GitHub integration

The [workflow template](../templates/github/vibe-surgeon.yml) installs the versioned
GitHub release tarball in a temporary runner directory. It does not depend
on an npm registry publication. Review the release and its published checksum before adopting it. Version tags
are not a guarantee of immutability. For stricter use, vendor a reviewed copy.
Copy the template into `.github/workflows/vibe-surgeon.yml` of a target repo.

It generates SARIF, runs the PR change guard, and uploads SARIF where code scanning
is available. The scanner only emits findings; `scan` does not fail on findings.
`guard` returns 2 for high heuristic risk and 1 if Git cannot determine changes.
Application tests remain a separate required CI step. The graph is heuristic,
not a proof of which tests cover a change.

Code-scanning availability and write permissions depend on repository settings.
Fork PRs do not receive a SARIF upload step in this template.
