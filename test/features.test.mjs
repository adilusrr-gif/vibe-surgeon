import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { makeSarif } from '../src/sarif.mjs';
import { saveBaseline, compareBaseline } from '../src/snapshot.mjs';

function tempRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vibe-surgeon-feature-'));
  fs.writeFileSync(path.join(root, 'README.md'), '# demo\n');
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'demo' }));
  fs.writeFileSync(path.join(root, 'package-lock.json'), '{}');
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# rules\n');
  fs.mkdirSync(path.join(root, 'src'));
  fs.mkdirSync(path.join(root, 'test'));
  fs.writeFileSync(path.join(root, 'src', 'a.js'), 'export const a = 1;\n');
  fs.writeFileSync(path.join(root, 'test', 'a.test.js'), 'export const ok = true;\n');
  return root;
}

test('SARIF uses 2.1.0 and emits scan findings', () => {
  const root = tempRepo();
  fs.writeFileSync(path.join(root, '.env'), 'SHOULD_NOT_BE_COMMITTED=true\n');
  const sarif = makeSarif(root);
  assert.equal(sarif.version, '2.1.0');
  assert.equal(sarif.runs[0].tool.driver.name, 'Vibe Surgeon');
  assert.ok(sarif.runs[0].results.some((r) => r.ruleId === 'ENV_IN_REPO'));
  assert.ok(sarif.runs[0].results.every((r) => Array.isArray(r.locations) && r.locations.length > 0));
});

test('baseline detects a repository health regression', () => {
  const root = tempRepo();
  saveBaseline(root);
  fs.writeFileSync(path.join(root, '.env'), 'REAL_ENV_FILE=1\n');
  const result = compareBaseline(root);
  assert.equal(result.exists, true);
  assert.equal(result.regressed, true);
  assert.ok(result.introduced.includes('ENV_IN_REPO'));
});

test('MCP server initializes and lists tools over newline-delimited JSON-RPC', async () => {
  const root = tempRepo();
  const bin = path.resolve('bin/vibe-surgeon.mjs');
  const child = spawn(process.execPath, [bin, 'mcp', root], { stdio: ['pipe', 'pipe', 'pipe'] });
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'test', version: '1' } } }) + '\n');
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }) + '\n');

  const messages = [];
  let buffer = '';
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('MCP test timeout')), 3000);
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      buffer += chunk;
      let idx;
      while ((idx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (line) messages.push(JSON.parse(line));
      }
      if (messages.some((m) => m.id === 2)) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.on('error', reject);
  });
  child.kill();

  const init = messages.find((m) => m.id === 1);
  const list = messages.find((m) => m.id === 2);
  assert.equal(init.result.protocolVersion, '2025-11-25');
  assert.ok(list.result.tools.some((t) => t.name === 'vibe_guard'));
  assert.ok(list.result.tools.some((t) => t.name === 'vibe_blast_radius'));
});

test('HTML report is self-contained and includes repository health data', async () => {
  const { makeHtmlReport } = await import('../src/html.mjs');
  const root = tempRepo();
  const result = makeHtmlReport(root);
  assert.ok(fs.existsSync(result.out));
  const html = fs.readFileSync(result.out, 'utf8');
  assert.match(html, /VIBE SURGEON/);
  assert.match(html, /Repository safety for AI-written code/);
  assert.match(html, /Dependency hotspots/);
});
