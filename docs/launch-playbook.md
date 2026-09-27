# Launch playbook

## Objective

Earn the first useful external feedback before optimizing a star count.
Success in this preview means someone can install it, understand the warning,
and decide whether it belongs in their workflow.

## Release gates

- Unit and integration checks pass; report their actual scope.
- The tarball installs in a clean directory and the installed CLI runs.
- The synthetic demo reproduces its asserted result.
- Invalid Git comparisons never turn into an empty successful diff.
- README contains a working source quickstart and visible limitations.
- A score of 100/100 is **not** a release gate or a security claim.

## Proposed first two weeks (not a background automation)

First: publish the tested GitHub preview and invite first-run feedback.
Next: one reviewed post from an owned developer-facing account. Use the demo,
not a list of hypothetical features. Reply substantively to actual questions.
Then: collect 10 voluntary trial reports. Ask what was useful, noisy or missing;
include people who stopped using the tool. Do not ask for private source.
Finally: prioritize the most repeated concrete defect. Publish a before/after
reproduction, including any remaining miss. Do not manufacture testimonials.

The numbers above are experiment targets, not a growth forecast or user counts.
[Launch copy and channel restrictions](launch-kit.md).

## Measurements

Record GitHub stars/forks at each review, release downloads, actionable feedback,
and opt-in reports of repeat use. Traffic views/clones need repository-owner
analytics access. A local-first tool cannot measure installations or retention
without telemetry or voluntary user feedback; no silent telemetry is added here.

Separate exposure, trial, useful result and repeat use. A click, download or star
does not establish that a developer used the product successfully.
