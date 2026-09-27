import fs from 'node:fs';
import path from 'node:path';
import { walkFiles, safeRead, relative, exists } from './fs.mjs';
import { readConfig } from './config.mjs';

const CODE_EXTS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py', '.go', '.rs', '.java',
  '.kt', '.kts', '.cs', '.php', '.rb', '.swift', '.c', '.h', '.cpp', '.hpp',
  '.vue', '.svelte'
]);

const SECRET_SCAN_EXTS = new Set([...CODE_EXTS, '.json', '.yaml', '.yml', '.toml', '.ini', '.conf', '.properties']);

const SECRET_PATTERNS = [
  { name: 'private key', re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: 'AWS access key', re: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'generic API secret', re: /\b(?:api[_-]?key|secret|token|password)\s*[:=]\s*["'][^"'\n]{12,}["']/gi },
  { name: 'GitHub token', re: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g }
];

function detectStack(root, files) {
  const stack = [];
  const names = new Set(files.map((f) => relative(root, f)));

  if (names.has('package.json')) stack.push('Node.js');
  if (names.has('next.config.js') || names.has('next.config.mjs') || names.has('next.config.ts')) stack.push('Next.js');
  if (names.has('vite.config.ts') || names.has('vite.config.js') || names.has('vite.config.mjs')) stack.push('Vite');
  if (names.has('pyproject.toml') || names.has('requirements.txt')) stack.push('Python');
  if (names.has('go.mod')) stack.push('Go');
  if (names.has('Cargo.toml')) stack.push('Rust');
  if (names.has('pom.xml') || names.has('build.gradle') || names.has('build.gradle.kts')) stack.push('JVM');
  if (names.has('docker-compose.yml') || names.has('docker-compose.yaml') || names.has('compose.yml') || names.has('Dockerfile')) stack.push('Docker');

  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    if (deps.react) stack.push('React');
    if (deps.vue) stack.push('Vue');
    if (deps.svelte) stack.push('Svelte');
    if (deps.express) stack.push('Express');
    if (deps.fastify) stack.push('Fastify');
    if (deps['@nestjs/core']) stack.push('NestJS');
  } catch {}

  return [...new Set(stack)];
}

function isTestFile(rel) {
  return /(^|\/)(__tests__|tests?|spec)(\/|$)/i.test(rel) || /\.(test|spec)\.[^.]+$/i.test(rel);
}

function scoreLabel(score) {
  if (score >= 90) return 'healthy';
  if (score >= 75) return 'watch';
  if (score >= 55) return 'fragile';
  return 'danger';
}

function lineAt(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

export function scanRepository(rootInput = '.') {
  const root = path.resolve(rootInput);
  const config = readConfig(root);
  const files = walkFiles(root);
  const rels = files.map((f) => relative(root, f));
  const codeFiles = files.filter((f) => CODE_EXTS.has(path.extname(f).toLowerCase()));
  const tests = rels.filter(isTestFile);
  const findings = [];
  const secretFindings = [];
  let totalLoc = 0;
  let todoCount = 0;
  const largeFiles = [];

  for (const file of codeFiles) {
    const text = safeRead(file);
    if (text == null) continue;
    const loc = text.split(/\r?\n/).length;
    totalLoc += loc;
    if (loc > config.maxLargeFileLoc) largeFiles.push({ file: relative(root, file), loc });
    todoCount += (text.match(/\b(?:TODO|FIXME|HACK|XXX)\b/g) || []).length;
  }

  for (const file of files) {
    const rel = relative(root, file);
    const ext = path.extname(file).toLowerCase();
    if (!SECRET_SCAN_EXTS.has(ext) || isTestFile(rel) || /(^|\/)(fixtures?|examples?|docs?)\//i.test(rel)) continue;
    const text = safeRead(file);
    if (text == null) continue;
    for (const pattern of SECRET_PATTERNS) {
      for (const match of text.matchAll(pattern.re)) {
        secretFindings.push({ file: rel, type: pattern.name, line: lineAt(text, match.index || 0), count: 1 });
        if (secretFindings.length >= 50) break;
      }
      if (secretFindings.length >= 50) break;
    }
    if (secretFindings.length >= 50) break;
  }

  const envFiles = rels.filter((r) => /(^|\/)\.env(?:\.|$)/.test(r) && !/\.env\.(example|sample|template)$/.test(r));
  const hasPackageManifest = rels.some((r) => ['package.json', 'pyproject.toml', 'requirements.txt', 'go.mod', 'Cargo.toml', 'pom.xml', 'build.gradle', 'build.gradle.kts'].includes(r));
  const hasLock = rels.some((r) => ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lock', 'bun.lockb', 'uv.lock', 'poetry.lock', 'Cargo.lock', 'go.sum', 'gradle.lockfile'].includes(r));
  const hasReadme = rels.some((r) => /^readme(?:\.[^.]+)?$/i.test(r));
  const hasCI = rels.some((r) => r.startsWith('.github/workflows/')) || exists(root, '.gitlab-ci.yml');
  const hasAgentGuide = rels.some((r) => /(^|\/)(AGENTS\.md|CLAUDE\.md|GEMINI\.md|\.cursorrules)$/i.test(r));

  let score = 100;
  if (!hasReadme) { score -= 6; findings.push({ severity: 'medium', code: 'NO_README', message: 'No README found.' }); }
  if (tests.length === 0 && codeFiles.length > 5) { score -= 12; findings.push({ severity: 'high', code: 'NO_TESTS', message: 'No test files detected.' }); }
  if (hasPackageManifest && !hasLock) { score -= 6; findings.push({ severity: 'medium', code: 'NO_LOCKFILE', message: 'Dependency manifest exists but no lockfile was detected.' }); }
  if (!hasCI && codeFiles.length > 10) { score -= 5; findings.push({ severity: 'medium', code: 'NO_CI', message: 'No CI workflow detected.' }); }
  if (!hasAgentGuide) { score -= 3; findings.push({ severity: 'low', code: 'NO_AGENT_GUIDE', message: 'No AGENTS.md / CLAUDE.md style instructions detected.' }); }
  if (envFiles.length) { score -= 15; findings.push({ severity: 'critical', code: 'ENV_IN_REPO', message: `Potential environment files tracked: ${envFiles.slice(0, 4).join(', ')}` }); }
  if (secretFindings.length) { score -= Math.min(30, 15 + secretFindings.length * 3); findings.push({ severity: 'critical', code: 'POSSIBLE_SECRETS', message: `${new Set(secretFindings.map((x) => x.file)).size} file(s) contain secret-like material.` }); }
  if (largeFiles.length) { score -= Math.min(18, largeFiles.length * 3); findings.push({ severity: 'medium', code: 'GIANT_FILES', message: `${largeFiles.length} source file(s) exceed ${config.maxLargeFileLoc} LOC.` }); }
  if (todoCount > 20) { score -= Math.min(8, Math.floor(todoCount / 20) * 2); findings.push({ severity: 'low', code: 'TODO_LOAD', message: `${todoCount} TODO/FIXME/HACK markers found.` }); }

  score = Math.max(0, score);

  return {
    root,
    generatedAt: new Date().toISOString(),
    score,
    label: scoreLabel(score),
    stack: detectStack(root, files),
    metrics: {
      files: files.length,
      codeFiles: codeFiles.length,
      testFiles: tests.length,
      loc: totalLoc,
      todoCount,
      largeFiles: largeFiles.length,
      possibleSecretFiles: new Set(secretFindings.map((x) => x.file)).size
    },
    envFiles,
    largeFiles: largeFiles.sort((a, b) => b.loc - a.loc).slice(0, 25),
    possibleSecrets: secretFindings.slice(0, 25),
    findings
  };
}
