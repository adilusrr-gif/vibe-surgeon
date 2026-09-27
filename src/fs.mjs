import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_IGNORES = new Set([
  '.git', 'node_modules', 'dist', 'build', '.next', '.nuxt', '.svelte-kit',
  'coverage', '.cache', '.turbo', '.venv', 'venv', '__pycache__', '.idea',
  '.vscode', 'vendor', 'target', 'out', '.output', '.vite', '.parcel-cache'
]);

export function walkFiles(root, options = {}) {
  const ignores = new Set([...(options.ignores || []), ...DEFAULT_IGNORES]);
  const maxFiles = options.maxFiles ?? 20_000;
  const files = [];
  const stack = [root];

  while (stack.length && files.length < maxFiles) {
    const current = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (ignores.has(entry.name)) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile()) files.push(full);
      if (files.length >= maxFiles) break;
    }
  }

  return files;
}

export function safeRead(file, maxBytes = 1_000_000) {
  try {
    const stat = fs.statSync(file);
    if (stat.size > maxBytes) return null;
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

export function relative(root, file) {
  return path.relative(root, file).split(path.sep).join('/');
}

export function exists(root, rel) {
  return fs.existsSync(path.join(root, rel));
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function writeText(file, content) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content, 'utf8');
}
