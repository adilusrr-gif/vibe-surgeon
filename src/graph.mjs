import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { walkFiles, safeRead, relative } from './fs.mjs';

const SOURCE_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.py'];
const SOURCE_SET = new Set(SOURCE_EXTS);

function tryFile(base) {
  const candidates = [base, ...SOURCE_EXTS.map((ext) => base + ext), ...SOURCE_EXTS.map((ext) => path.join(base, `index${ext}`))];
  for (const candidate of candidates) {
    try {
      if (fs.statSync(candidate).isFile()) return candidate;
    } catch {}
  }
  return null;
}

function importsFromText(file, text) {
  const ext = path.extname(file).toLowerCase();
  const imports = [];
  if (ext === '.py') {
    for (const match of text.matchAll(/^\s*from\s+([\w.]+)\s+import\s+/gm)) imports.push(match[1]);
    for (const match of text.matchAll(/^\s*import\s+([\w.]+)/gm)) imports.push(match[1]);
    return imports;
  }

  const patterns = [
    /\bfrom\s+["']([^"']+)["']/g,
    /\bimport\s*["']([^"']+)["']/g,
    /\brequire\(\s*["']([^"']+)["']\s*\)/g,
    /\bimport\(\s*["']([^"']+)["']\s*\)/g
  ];
  for (const re of patterns) for (const match of text.matchAll(re)) imports.push(match[1]);
  return imports;
}

function resolveImport(root, fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  const resolved = tryFile(path.resolve(path.dirname(fromFile), spec));
  if (!resolved || !resolved.startsWith(root)) return null;
  return relative(root, resolved);
}

export function buildGraph(rootInput = '.') {
  const root = path.resolve(rootInput);
  const files = walkFiles(root).filter((f) => SOURCE_SET.has(path.extname(f).toLowerCase()));
  const nodes = files.map((f) => relative(root, f));
  const edges = [];
  const inbound = Object.fromEntries(nodes.map((n) => [n, 0]));
  const outbound = Object.fromEntries(nodes.map((n) => [n, 0]));

  for (const file of files) {
    const text = safeRead(file);
    if (text == null) continue;
    const from = relative(root, file);
    for (const spec of importsFromText(file, text)) {
      const to = resolveImport(root, file, spec);
      if (!to) continue;
      edges.push({ from, to });
      inbound[to] = (inbound[to] || 0) + 1;
      outbound[from] = (outbound[from] || 0) + 1;
    }
  }

  const hotspots = nodes
    .map((file) => ({ file, inbound: inbound[file] || 0, outbound: outbound[file] || 0, score: (inbound[file] || 0) * 2 + (outbound[file] || 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);

  return { root, nodes, edges, hotspots };
}

export function changedFiles(rootInput = '.', base = 'HEAD~1') {
  const root = path.resolve(rootInput);
  try {
    const out = execFileSync('git', ['diff', '--name-only', base, '--'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export function computeBlastRadius(graph, changed, maxDepth = 2) {
  const reverse = new Map();
  for (const edge of graph.edges) {
    if (!reverse.has(edge.to)) reverse.set(edge.to, new Set());
    reverse.get(edge.to).add(edge.from);
  }

  const impacted = new Set(changed);
  let frontier = new Set(changed);
  for (let depth = 0; depth < maxDepth; depth++) {
    const next = new Set();
    for (const file of frontier) {
      for (const parent of reverse.get(file) || []) {
        if (!impacted.has(parent)) {
          impacted.add(parent);
          next.add(parent);
        }
      }
    }
    frontier = next;
    if (!frontier.size) break;
  }

  const impactedTests = [...impacted].filter((f) => /(^|\/)(__tests__|tests?|spec)(\/|$)/i.test(f) || /\.(test|spec)\.[^.]+$/i.test(f));
  return { impacted: [...impacted], impactedTests };
}
