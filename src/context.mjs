import path from 'node:path';
import { writeText } from './fs.mjs';
import { scanRepository } from './scan.mjs';
import { buildGraph } from './graph.mjs';

export function makeAgentContext(rootInput = '.') {
  const root = path.resolve(rootInput);
  const scan = scanRepository(root);
  const graph = buildGraph(root);
  const critical = scan.findings.filter((f) => ['critical', 'high'].includes(f.severity));
  const hotspots = graph.hotspots.slice(0, 12);

  const markdown = `# Vibe Surgeon Agent Context\n\nGenerated orientation for coding agents. Read this before modifying the repository.\n\n## Project state\n\n- Health score: **${scan.score}/100 (${scan.label})**\n- Stack: ${scan.stack.join(', ') || 'unknown'}\n- Source files: ${scan.metrics.codeFiles}\n- Source LOC: ${scan.metrics.loc}\n- Tests: ${scan.metrics.testFiles}\n\n## Non-negotiable safety rules\n\n- Preserve unrelated behavior.\n- Never remove a feature only to simplify a requested change.\n- Before changing a hotspot, inspect dependents and nearby tests.\n- Treat auth, permissions, billing, migrations, schemas and CI as high-risk.\n- Prefer small diffs and reversible steps.\n- Add or update tests for changed behavior.\n- Run \`vibe-surgeon guard . --base <base-ref>\` before merge.\n\n## Current high-priority risks\n\n${critical.map((f) => `- **${f.code}** — ${f.message}`).join('\n') || '- No critical/high findings detected.'}\n\n## Dependency hotspots\n\n${hotspots.map((h) => `- \`${h.file}\` — ${h.inbound} inbound / ${h.outbound} outbound`).join('\n') || '- No hotspots detected.'}\n\n## Recommended agent workflow\n\n1. Restate the requested behavior and assumptions.\n2. Inspect the files directly involved plus dependents from the map.\n3. Make the smallest complete change.\n4. Run relevant tests.\n5. Run Vibe Surgeon guard and report remaining risk.\n`;

  const out = path.join(root, '.vibe-surgeon', 'context.md');
  writeText(out, markdown);
  return { out, markdown, scan, graph };
}
