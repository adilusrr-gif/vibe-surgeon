import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildGraph } from '../src/graph.mjs';
import { guardRepository } from '../src/guard.mjs';
import { makeHtmlReport } from '../src/html.mjs';

const project = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--output')) {
  console.error('Usage: npm run demo -- [--output DIRECTORY]'); process.exit(1);
}
const output = path.resolve(args[1] || path.join(project, '.vibe-surgeon/demo'));
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vibe-surgeon-demo-'));
const git = (...argv) => execFileSync('git', argv, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const write = (name, text) => {
  const file = path.join(root, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text);
};
try {
  write('README.md', '# Synthetic change-impact fixture\n');
  write('package.json', JSON.stringify({ name: 'synthetic-demo', type: 'module' }));
  write('src/auth.mjs', 'export const sessionMinutes = 30;\n');
  write('src/session.mjs', "import { sessionMinutes } from './auth.mjs';\nexport const duration = sessionMinutes;\n");
  write('src/app.mjs', "import { duration } from './session.mjs';\nexport const sessionDuration = duration;\n");
  git('init', '-q'); git('config', 'user.name', 'Vibe Surgeon Demo');
  git('config', 'user.email', 'demo@example.invalid'); git('add', '.'); git('commit', '-qm', 'synthetic baseline');
  write('src/auth.mjs', 'export const sessionMinutes = 60;\n');
  const graph = buildGraph(root);
  const guard = guardRepository(root, 'HEAD');
  const cli = spawnSync(process.execPath, [path.join(project, 'bin/vibe-surgeon.mjs'), 'guard', root, '--base', 'HEAD', '--json'], { encoding: 'utf8' });
  assert.equal(cli.status, 2, cli.stderr || cli.stdout);
  assert.deepEqual(guard.changed, ['src/auth.mjs']);
  assert.deepEqual([...guard.impacted].sort(), ['src/app.mjs', 'src/auth.mjs', 'src/session.mjs']);
  assert.equal(guard.risk, 55); assert.equal(guard.pass, false);
  fs.mkdirSync(output, { recursive: true });
  makeHtmlReport(root, path.join(output, 'report.html'));
  const evidence = { synthetic: true, sourceFiles: graph.nodes.length, dependencyEdges: graph.edges.length, guard, cliExitCode: cli.status };
  fs.writeFileSync(path.join(output, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
  const lines = [
    'VIBE SURGEON — REPRODUCIBLE DEMO',
    'Synthetic fixture; not a customer case or a real-world benchmark.', '',
    'Change: src/auth.mjs (session duration: 30 -> 60)',
    `Mapped: ${graph.nodes.length} source files, ${graph.edges.length} local import edges`,
    `Changed files: ${guard.changed.length}`,
    `Potentially impacted files: ${guard.impacted.length} (includes the changed file)`,
    ...guard.impacted.map((f) => `  ${f}`),
    `Heuristic change risk: ${guard.risk}/100 (${guard.level})`,
    ...guard.reasons.map((reason) => `  + ${reason}`),
    `Guard CLI exit: ${cli.status} (review required)`, '',
    'This does NOT prove that behavior broke. No application tests are run.',
    'The warning comes from local imports, filename rules and missing test files.'
  ];
  fs.writeFileSync(path.join(output, 'transcript.txt'), lines.join('\n') + '\n');
  console.log(lines.join('\n'));
  console.log(`\nReport and evidence: ${output}`);
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
