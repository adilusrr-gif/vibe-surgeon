const supportsColor = () => Boolean(process.stdout.isTTY && !process.env.NO_COLOR && process.env.TERM !== 'dumb');

const wrap = (open, close) => (value) => supportsColor() ? `\x1b[${open}m${value}\x1b[${close}m` : String(value);

export const ui = {
  bold: wrap('1', '22'),
  dim: wrap('2', '22'),
  cyan: wrap('36', '39'),
  green: wrap('32', '39'),
  yellow: wrap('33', '39'),
  red: wrap('31', '39'),
  magenta: wrap('35', '39'),
  gray: wrap('90', '39')
};

export function scoreColor(score, value) {
  if (score >= 90) return ui.green(value);
  if (score >= 75) return ui.cyan(value);
  if (score >= 55) return ui.yellow(value);
  return ui.red(value);
}

export function severityColor(severity, value) {
  if (severity === 'critical' || severity === 'high') return ui.red(value);
  if (severity === 'medium') return ui.yellow(value);
  return ui.gray(value);
}

export function progressBar(value, width = 24) {
  const normalized = Math.max(0, Math.min(100, value));
  const filled = Math.round((normalized / 100) * width);
  return `${'█'.repeat(filled)}${'░'.repeat(width - filled)}`;
}

export function logo() {
  return [
    `${ui.cyan('◆')} ${ui.bold('VIBE SURGEON')}`,
    ui.dim('  Repository safety for AI-written code')
  ].join('\n');
}

export function box(title, rows) {
  const clean = rows.map((x) => String(x));
  const width = Math.max(title.length + 2, ...clean.map((x) => stripAnsi(x).length), 20);
  const top = `┌─ ${title} ${'─'.repeat(Math.max(0, width - title.length - 1))}┐`;
  const body = clean.map((row) => `│ ${row}${' '.repeat(Math.max(0, width - stripAnsi(row).length))} │`);
  const bottom = `└${'─'.repeat(width + 2)}┘`;
  return [top, ...body, bottom].join('\n');
}

export function stripAnsi(value) {
  return String(value).replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
}
