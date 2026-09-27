import fs from 'node:fs';
import path from 'node:path';
import { ensureDir, writeText } from './fs.mjs';
import { DEFAULT_CONFIG } from './config.mjs';

const CONSTITUTION = `# Vibe Surgeon Constitution\n\nRepository invariants for AI coding agents and humans.\n\n1. Preserve existing behavior unless the task explicitly changes it.\n2. Do not delete unrelated functionality to make a task easier.\n3. Prefer small, reviewable diffs over broad rewrites.\n4. For behavior changes, add or update tests.\n5. Never commit credentials, tokens, private keys, or real .env files.\n6. Before changing a dependency hotspot, inspect its callers and consumers.\n7. Run project checks plus Vibe Surgeon guard before commit.\n8. Record assumptions instead of silently inventing requirements.\n9. Treat auth, permissions, billing, migrations and CI as high-risk areas.\n10. If a requested change expands blast radius unexpectedly, stop and inspect before editing further.\n`;

export function initRepository(rootInput = '.') {
  const root = path.resolve(rootInput);
  const dir = path.join(root, '.vibe-surgeon');
  ensureDir(dir);
  const configPath = path.join(dir, 'config.json');
  const constitutionPath = path.join(dir, 'CONSTITUTION.md');
  if (!fs.existsSync(configPath)) writeText(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2) + '\n');
  if (!fs.existsSync(constitutionPath)) writeText(constitutionPath, CONSTITUTION);

  const gitignore = path.join(root, '.gitignore');
  let current = '';
  try { current = fs.readFileSync(gitignore, 'utf8'); } catch {}
  const generatedIgnores = [
    '.vibe-surgeon/map.json',
    '.vibe-surgeon/results.sarif',
    '.vibe-surgeon/report.html'
  ];
  const missingIgnores = generatedIgnores.filter((entry) => !current.includes(entry));
  if (missingIgnores.length) {
    const prefix = current && !current.endsWith('\n') ? '\n' : '';
    fs.appendFileSync(gitignore, `${prefix}\n# Vibe Surgeon generated cache/reports\n${missingIgnores.join('\n')}\n`);
  }

  return { dir, configPath, constitutionPath };
}
