import path from 'node:path';
import { scanRepository } from './scan.mjs';
import { buildGraph, changedFiles, computeBlastRadius } from './graph.mjs';
import { readConfig } from './config.mjs';

export function guardRepository(rootInput = '.', base = 'HEAD~1') {
  const root = path.resolve(rootInput);
  const config = readConfig(root);
  const scan = scanRepository(root);
  const graph = buildGraph(root);
  const changed = changedFiles(root, base);
  const blast = computeBlastRadius(graph, changed, config.guard.blastRadiusDepth);

  let risk = 0;
  const reasons = [];
  if (scan.possibleSecrets.length) { risk += 50; reasons.push('secret-like material detected'); }
  if (changed.length > config.guard.maxChangedFiles) { risk += 15; reasons.push(`large change set (${changed.length} files)`); }
  if (blast.impacted.length > config.guard.maxImpactedFiles) { risk += 25; reasons.push(`large dependency blast radius (${blast.impacted.length} files)`); }
  if (changed.some((f) => graph.hotspots.slice(0, 10).some((h) => h.file === f))) { risk += 20; reasons.push('a top dependency hotspot changed'); }
  if (scan.metrics.testFiles === 0 && changed.length) { risk += 20; reasons.push('changes exist but no tests were detected'); }
  if (changed.some((f) => config.criticalAreas.some((area) => f.toLowerCase().includes(area)))) { risk += 15; reasons.push('security/business-critical area changed'); }
  if (changed.some((f) => /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|uv\.lock|poetry\.lock|Cargo\.lock|go\.sum)$/.test(f))) { risk += 5; reasons.push('dependency lockfile changed'); }
  if (changed.some((f) => f.startsWith('.github/workflows/'))) { risk += 10; reasons.push('CI workflow changed'); }

  risk = Math.min(100, risk);
  const level = risk >= 50 ? 'high' : risk >= 25 ? 'medium' : 'low';
  return {
    base,
    risk,
    level,
    reasons,
    changed,
    impacted: blast.impacted,
    impactedTests: blast.impactedTests,
    pass: !(config.guard.failOnHighRisk && level === 'high')
  };
}
