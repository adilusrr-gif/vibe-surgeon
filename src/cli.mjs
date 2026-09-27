import fs from 'node:fs';
import path from 'node:path';
import { scanRepository } from './scan.mjs';
import { buildGraph } from './graph.mjs';
import { formatScan, formatGuard, formatBaseline, doctorMarkdown, architectureMarkdown } from './report.mjs';
import { makeAgentContext } from './context.mjs';
import { guardRepository } from './guard.mjs';
import { initRepository } from './init.mjs';
import { writeText } from './fs.mjs';
import { makeSarif } from './sarif.mjs';
import { saveBaseline, compareBaseline } from './snapshot.mjs';
import { startMcpServer } from './mcp.mjs';
import { ui, logo } from './ui.mjs';
import { makeHtmlReport } from './html.mjs';

const HELP = `${logo()}\n\nUsage:\n  vibe-surgeon init [path]\n  vibe-surgeon scan [path] [--json]\n  vibe-surgeon map [path] [--json]\n  vibe-surgeon context [path]\n  vibe-surgeon doctor [path]\n  vibe-surgeon guard [path] [--base <git-ref>] [--json]\n  vibe-surgeon baseline [path]\n  vibe-surgeon compare [path] [--json]\n  vibe-surgeon sarif [path] [--output <file>]\n  vibe-surgeon report [path] [--output <file>]\n  vibe-surgeon mcp [path]\n  vibe-surgeon all [path]\n\nFast path:\n  vibe-surgeon all .\n  vibe-surgeon guard . --base origin/main\n  vibe-surgeon mcp .\n`;

function argValue(args, flag, fallback) {
  const idx = args.indexOf(flag);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback;
}

function targetPath(args) {
  return args.find((a, i) => i > 0 && !a.startsWith('-') && !['--base', '--output'].includes(args[i - 1])) || '.';
}

function rel(root, file) {
  return path.relative(root, file).split(path.sep).join('/');
}

export async function main(args) {
  const command = args[0] || 'help';
  if (['help', '--help', '-h'].includes(command)) {
    console.log(HELP);
    return;
  }
  if (['--version', '-v', 'version'].includes(command)) {
    const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    console.log(pkg.version);
    return;
  }

  const root = path.resolve(targetPath(args));
  const json = args.includes('--json');

  if (command === 'mcp') {
    startMcpServer(root);
    return;
  }

  if (command === 'init') {
    const result = initRepository(root);
    console.log(`${logo()}\n\n${ui.green('✓')} Initialized ${rel(root, result.dir) || '.vibe-surgeon'}`);
    console.log(`${ui.dim('Created safety constitution and local configuration.')}`);
    return;
  }

  if (command === 'scan') {
    const scan = scanRepository(root);
    console.log(json ? JSON.stringify(scan, null, 2) : formatScan(scan));
    return;
  }

  if (command === 'map') {
    const scan = scanRepository(root);
    const graph = buildGraph(root);
    const dir = path.join(root, '.vibe-surgeon');
    writeText(path.join(dir, 'map.json'), JSON.stringify(graph, null, 2));
    writeText(path.join(dir, 'ARCHITECTURE.md'), architectureMarkdown(scan, graph));
    if (json) console.log(JSON.stringify(graph, null, 2));
    else {
      console.log(`${logo()}\n`);
      console.log(`${ui.green('✓')} Mapped ${ui.bold(graph.nodes.length)} files and ${ui.bold(graph.edges.length)} dependency edges.`);
      console.log(`${ui.dim('→ .vibe-surgeon/ARCHITECTURE.md')}`);
    }
    return;
  }

  if (command === 'context') {
    const result = makeAgentContext(root);
    console.log(`${logo()}\n\n${ui.green('✓')} Agent context generated\n${ui.dim(`→ ${rel(root, result.out)}`)}`);
    return;
  }

  if (command === 'doctor') {
    const scan = scanRepository(root);
    const graph = buildGraph(root);
    const out = path.join(root, '.vibe-surgeon', 'REPAIR_PLAN.md');
    writeText(out, doctorMarkdown(scan, graph));
    console.log(`${logo()}\n\n${ui.green('✓')} Repair plan generated\n${ui.dim(`→ ${rel(root, out)}`)}`);
    return;
  }

  if (command === 'guard') {
    const base = argValue(args, '--base', 'HEAD~1');
    const result = guardRepository(root, base);
    console.log(json ? JSON.stringify(result, null, 2) : formatGuard(result));
    if (!result.pass) process.exitCode = 2;
    return;
  }

  if (command === 'baseline') {
    const result = saveBaseline(root);
    console.log(`${logo()}\n\n${ui.green('✓')} Baseline saved at ${result.baseline.score}/100\n${ui.dim(`→ ${rel(root, result.out)}`)}`);
    return;
  }

  if (command === 'compare') {
    const result = compareBaseline(root);
    console.log(json ? JSON.stringify(result, null, 2) : `${logo()}\n\n${formatBaseline(result)}`);
    if (result.regressed) process.exitCode = 3;
    return;
  }

  if (command === 'report') {
    const outArg = argValue(args, '--output', '.vibe-surgeon/report.html');
    const result = makeHtmlReport(root, outArg);
    console.log(`${logo()}\n\n${ui.green('✓')} HTML report generated\n${ui.dim(`→ ${rel(root, result.out)}`)}`);
    return;
  }

  if (command === 'sarif') {
    const sarif = makeSarif(root);
    const out = path.resolve(root, argValue(args, '--output', '.vibe-surgeon/results.sarif'));
    writeText(out, JSON.stringify(sarif, null, 2) + '\n');
    console.log(`${logo()}\n\n${ui.green('✓')} SARIF 2.1.0 generated\n${ui.dim(`→ ${rel(root, out)}`)}`);
    return;
  }

  if (command === 'all') {
    initRepository(root);
    const scan = scanRepository(root);
    const graph = buildGraph(root);
    writeText(path.join(root, '.vibe-surgeon', 'map.json'), JSON.stringify(graph, null, 2));
    writeText(path.join(root, '.vibe-surgeon', 'ARCHITECTURE.md'), architectureMarkdown(scan, graph));
    writeText(path.join(root, '.vibe-surgeon', 'REPAIR_PLAN.md'), doctorMarkdown(scan, graph));
    makeAgentContext(root);
    writeText(path.join(root, '.vibe-surgeon', 'results.sarif'), JSON.stringify(makeSarif(root), null, 2) + '\n');
    makeHtmlReport(root);
    console.log(formatScan(scan));
    console.log(`\n${ui.green('✓')} Generated architecture, repair plan, agent context and dependency cache.`);
    console.log(ui.dim('Next: `vibe-surgeon baseline .` once the repository is in an accepted state.'));
    return;
  }

  console.error(`Unknown command: ${command}\n\n${HELP}`);
  process.exitCode = 1;
}
