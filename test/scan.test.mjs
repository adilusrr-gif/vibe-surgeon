import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { scanRepository } from '../src/scan.mjs';
import { buildGraph, computeBlastRadius } from '../src/graph.mjs';

function tempRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vibe-surgeon-'));
  fs.writeFileSync(path.join(root, 'README.md'), '# demo\n');
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'demo' }));
  fs.writeFileSync(path.join(root, 'package-lock.json'), '{}');
  fs.mkdirSync(path.join(root, 'src'));
  return root;
}

test('scan detects missing tests', () => {
  const root = tempRepo();
  for (let i = 0; i < 6; i++) fs.writeFileSync(path.join(root, 'src', `f${i}.js`), `export const x${i} = ${i};\n`);
  const result = scanRepository(root);
  assert.equal(result.metrics.codeFiles, 6);
  assert.ok(result.findings.some((x) => x.code === 'NO_TESTS'));
});

test('graph computes reverse blast radius', () => {
  const root = tempRepo();
  fs.writeFileSync(path.join(root, 'src', 'a.js'), `export const a = 1;\n`);
  fs.writeFileSync(path.join(root, 'src', 'b.js'), `import { a } from './a.js'; export const b = a;\n`);
  fs.writeFileSync(path.join(root, 'src', 'c.js'), `import { b } from './b.js'; export const c = b;\n`);
  const graph = buildGraph(root);
  const blast = computeBlastRadius(graph, ['src/a.js'], 2);
  assert.ok(blast.impacted.includes('src/b.js'));
  assert.ok(blast.impacted.includes('src/c.js'));
});
