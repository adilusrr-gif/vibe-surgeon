import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_CONFIG = {
  version: 2,
  maxLargeFileLoc: 800,
  guard: {
    failOnHighRisk: true,
    blastRadiusDepth: 2,
    maxChangedFiles: 20,
    maxImpactedFiles: 30
  },
  criticalAreas: [
    'auth', 'security', 'permission', 'billing', 'payment', 'checkout',
    'migration', 'schema', 'crypto', 'session', 'token'
  ]
};

function merge(base, custom) {
  return {
    ...base,
    ...(custom || {}),
    guard: { ...base.guard, ...(custom?.guard || {}) },
    criticalAreas: Array.isArray(custom?.criticalAreas) ? custom.criticalAreas : base.criticalAreas
  };
}

export function readConfig(root) {
  const file = path.join(root, '.vibe-surgeon', 'config.json');
  try {
    return merge(DEFAULT_CONFIG, JSON.parse(fs.readFileSync(file, 'utf8')));
  } catch {
    return structuredClone(DEFAULT_CONFIG);
  }
}
