import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { changedFiles } from '../src/graph.mjs';

const bin = fileURLToPath(new URL('../bin/vibe-surgeon.mjs', import.meta.url));
function fixture(t, withGit = true) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vs-guard-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  if (withGit) {
    git(root, 'init', '-q');
    git(root, 'config', 'user.email', 'test@example.invalid');
    git(root, 'config', 'user.name', 'Fixture');
    fs.writeFileSync(path.join(root, 'a.js'), 'export const a = 1;\n');
    git(root, 'add', '.'); git(root, 'commit', '-qm', 'fixture');
  }
  return root;
}
function git(root, ...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}
function rejectsDiff(fn) { assert.throws(fn, { code: 'GIT_DIFF_FAILED' }); }

test('guard errors instead of returning an empty diff outside Git', (t) => {
  rejectsDiff(() => changedFiles(fixture(t, false), 'HEAD'));
});
test('guard errors for missing base history', (t) => {
  rejectsDiff(() => changedFiles(fixture(t), 'origin/missing'));
});
test('guard rejects Git options supplied as a base', (t) => {
  rejectsDiff(() => changedFiles(fixture(t), '--help'));
});
test('guard returns an empty diff only for a valid unchanged tree', (t) => {
  assert.deepEqual(changedFiles(fixture(t), 'HEAD'), []);
});
test('guard sees both staged and unstaged tracked changes', (t) => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'b.js'), 'export const b = 1;\n');
  git(root, 'add', '.'); git(root, 'commit', '-qm', 'second file');
  fs.appendFileSync(path.join(root, 'a.js'), '// staged\n'); git(root, 'add', 'a.js');
  fs.appendFileSync(path.join(root, 'b.js'), '// unstaged\n');
  assert.deepEqual(changedFiles(root, 'HEAD').sort(), ['a.js', 'b.js']);
});
test('guard preserves whitespace, Unicode and newline filenames', (t) => {
  const root = fixture(t);
  const name = ' файл\nwith spaces .js';
  fs.writeFileSync(path.join(root, name), 'export const a = 1;\n');
  git(root, 'add', '.'); git(root, 'commit', '-qm', 'unusual filename');
  fs.appendFileSync(path.join(root, name), '// changed\n');
  assert.deepEqual(changedFiles(root, 'HEAD'), [name]);
});
test('guard rejects subdirectory roots rather than mixing path namespaces', (t) => {
  const root = fixture(t); fs.mkdirSync(path.join(root, 'src'));
  rejectsDiff(() => changedFiles(path.join(root, 'src'), 'HEAD'));
});
test('guard CLI exits 1 without a pass verdict when Git fails', (t) => {
  const result = spawnSync(process.execPath, [bin, 'guard', fixture(t), '--base', 'missing', '--json'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /No safe-change verdict/);
  assert.equal(result.stdout.trim(), '');
});
