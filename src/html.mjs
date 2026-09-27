import path from 'node:path';
import { scanRepository } from './scan.mjs';
import { buildGraph } from './graph.mjs';
import { writeText } from './fs.mjs';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function tone(score) {
  if (score >= 90) return ['#34d399', '#06281f'];
  if (score >= 75) return ['#22d3ee', '#082f49'];
  if (score >= 55) return ['#fbbf24', '#3b2f08'];
  return ['#fb7185', '#3a0d17'];
}

export function makeHtmlReport(rootInput = '.', output = '.vibe-surgeon/report.html') {
  const scan = scanRepository(rootInput);
  const graph = buildGraph(rootInput);
  const [accent, accentBg] = tone(scan.score);
  const findings = scan.findings.length
    ? scan.findings.map((f) => `<tr><td><span class="sev ${esc(f.severity)}">${esc(f.severity)}</span></td><td><strong>${esc(f.code)}</strong></td><td>${esc(f.message)}</td></tr>`).join('')
    : '<tr><td colspan="3"><span class="ok">No major repository-health risks detected.</span></td></tr>';
  const hotspots = graph.hotspots.slice(0, 12).map((h) => `<tr><td><code>${esc(h.file)}</code></td><td>${h.inbound}</td><td>${h.outbound}</td><td>${h.score}</td></tr>`).join('') || '<tr><td colspan="4">No local dependency hotspots found.</td></tr>';
  const stack = scan.stack.map((x) => `<span class="pill">${esc(x)}</span>`).join('') || '<span class="pill">Unknown stack</span>';
  const circumference = 2 * Math.PI * 54;
  const dash = circumference * scan.score / 100;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Vibe Surgeon Report</title>
<style>
:root{--bg:#070b12;--panel:#0d1420;--panel2:#111b29;--line:#1f2c3d;--text:#eaf2ff;--muted:#8fa3b8;--accent:${accent};--accentBg:${accentBg}}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 85% 0,#17213c 0,transparent 30%),radial-gradient(circle at 0 100%,#0c2833 0,transparent 28%),var(--bg);color:var(--text);font:15px/1.5 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;min-height:100vh}
.wrap{max-width:1180px;margin:0 auto;padding:48px 24px 72px}.brand{display:flex;align-items:center;gap:14px;margin-bottom:32px}.mark{width:44px;height:44px;transform:rotate(45deg);border:3px solid #58dcff;border-radius:8px;box-shadow:0 0 30px #58dcff33;position:relative}.mark:before,.mark:after{content:"";position:absolute;background:#8c7cff;border-radius:4px}.mark:before{width:22px;height:3px;left:8px;top:18px}.mark:after{height:22px;width:3px;top:8px;left:18px}.brand h1{font:800 20px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;margin:0}.brand p{margin:5px 0 0;color:var(--muted)}
.hero{display:grid;grid-template-columns:270px 1fr;gap:18px}.card{background:linear-gradient(180deg,#101927dd,#0b121ddd);border:1px solid var(--line);border-radius:20px;padding:22px;box-shadow:0 18px 60px #0006;backdrop-filter:blur(10px)}.score{display:grid;place-items:center;min-height:255px}.ring{width:148px;height:148px;position:relative}.ring svg{transform:rotate(-90deg)}.ring .value{position:absolute;inset:0;display:grid;place-items:center;text-align:center}.ring b{font-size:38px;line-height:1}.ring small{display:block;color:var(--muted);text-transform:uppercase;letter-spacing:.12em;margin-top:7px}.summary h2{font-size:30px;margin:4px 0 8px}.summary>p{color:var(--muted);max-width:720px}.pills{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0}.pill{padding:7px 10px;border-radius:999px;background:#152233;border:1px solid #24364d;color:#c8d8ea;font-size:12px}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:20px}.metric{padding:14px;border-radius:14px;background:#0a111b;border:1px solid #182538}.metric b{display:block;font-size:20px}.metric span{color:var(--muted);font-size:12px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}.wide{grid-column:1/-1}.card h3{margin:0 0 16px;font-size:16px;letter-spacing:.01em}.card .sub{color:var(--muted);margin-top:-10px;margin-bottom:16px;font-size:13px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:12px 10px;border-bottom:1px solid #1b2737;vertical-align:top}th{color:#7890a8;font-size:11px;text-transform:uppercase;letter-spacing:.08em}tr:last-child td{border-bottom:0}code{color:#9bdfff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}.sev{display:inline-block;font-size:10px;text-transform:uppercase;letter-spacing:.08em;padding:4px 7px;border-radius:7px;background:#182536;color:#b9c7d6}.sev.critical,.sev.high{background:#3a121b;color:#ff91a4}.sev.medium{background:#352b0b;color:#ffd76a}.sev.low{background:#172331;color:#a4bad0}.ok{color:#65e6ae}.footer{color:#667d94;text-align:center;margin-top:34px;font-size:12px}
@media(max-width:820px){.hero,.grid{grid-template-columns:1fr}.metrics{grid-template-columns:1fr 1fr}.wide{grid-column:auto}}@media(max-width:520px){.metrics{grid-template-columns:1fr}.wrap{padding:28px 14px}}
</style>
</head>
<body><main class="wrap">
  <header class="brand"><div class="mark"></div><div><h1>VIBE SURGEON</h1><p>Repository safety for AI-written code</p></div></header>
  <section class="hero">
    <article class="card score"><div class="ring"><svg width="148" height="148" viewBox="0 0 128 128"><circle cx="64" cy="64" r="54" fill="none" stroke="#1b2838" stroke-width="10"/><circle cx="64" cy="64" r="54" fill="none" stroke="${accent}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${dash.toFixed(2)} ${(circumference-dash).toFixed(2)}"/></svg><div class="value"><div><b>${scan.score}</b><small>${esc(scan.label)}</small></div></div></div></article>
    <article class="card summary"><h2>${scan.score >= 90 ? 'Repository looks healthy.' : scan.score >= 75 ? 'Healthy enough, with friction to watch.' : scan.score >= 55 ? 'Changes need extra review.' : 'High repository risk detected.'}</h2><p>This report is a deterministic local snapshot. It highlights maintenance and change-risk signals; it does not claim formal verification.</p><div class="pills">${stack}</div><div class="metrics"><div class="metric"><b>${scan.metrics.codeFiles}</b><span>source files</span></div><div class="metric"><b>${scan.metrics.testFiles}</b><span>test files</span></div><div class="metric"><b>${scan.metrics.loc.toLocaleString()}</b><span>source LOC</span></div><div class="metric"><b>${graph.edges.length}</b><span>dependency edges</span></div></div></article>
  </section>
  <section class="grid">
    <article class="card wide"><h3>Findings</h3><p class="sub">Explainable deductions behind the Vibe Health Score.</p><table><thead><tr><th>Severity</th><th>Rule</th><th>Why it matters</th></tr></thead><tbody>${findings}</tbody></table></article>
    <article class="card wide"><h3>Dependency hotspots</h3><p class="sub">Files with high local fan-in/fan-out deserve more care during AI-assisted edits.</p><table><thead><tr><th>File</th><th>Inbound</th><th>Outbound</th><th>Risk score</th></tr></thead><tbody>${hotspots}</tbody></table></article>
  </section>
  <div class="footer">Generated ${esc(scan.generatedAt)} · Vibe Surgeon · local-first, zero API key</div>
</main></body></html>`;

  const root = path.resolve(rootInput);
  const out = path.resolve(root, output);
  writeText(out, html);
  return { out, html, scan, graph };
}
