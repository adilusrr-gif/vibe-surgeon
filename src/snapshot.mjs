import fs from 'node:fs';
import path from 'node:path';
import { scanRepository } from './scan.mjs';
import { ensureDir, writeText } from './fs.mjs';

const FILE = 'baseline.json';

export function saveBaseline(rootInput = '.') {
  const root = path.resolve(rootInput);
  const scan = scanRepository(root);
  const dir = path.join(root, '.vibe-surgeon');
  ensureDir(dir);
  const baseline = {
    version: 1,
    createdAt: new Date().toISOString(),
    score: scan.score,
    metrics: scan.metrics,
    findingCodes: scan.findings.map((f) => f.code).sort()
  };
  const out = path.join(dir, FILE);
  writeText(out, JSON.stringify(baseline, null, 2) + '\n');
  return { out, baseline };
}

export function compareBaseline(rootInput = '.') {
  const root = path.resolve(rootInput);
  const baselinePath = path.join(root, '.vibe-surgeon', FILE);
  if (!fs.existsSync(baselinePath)) return { exists: false, message: 'No baseline found. Run `vibe-surgeon baseline .` first.' };
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  const scan = scanRepository(root);
  const oldCodes = new Set(baseline.findingCodes || []);
  const nowCodes = new Set(scan.findings.map((f) => f.code));
  const introduced = [...nowCodes].filter((x) => !oldCodes.has(x));
  const resolved = [...oldCodes].filter((x) => !nowCodes.has(x));
  const scoreDelta = scan.score - baseline.score;
  return {
    exists: true,
    baseline,
    scan,
    scoreDelta,
    introduced,
    resolved,
    regressed: scoreDelta < 0 || introduced.some((x) => ['ENV_IN_REPO', 'POSSIBLE_SECRETS', 'NO_TESTS'].includes(x))
  };
}
