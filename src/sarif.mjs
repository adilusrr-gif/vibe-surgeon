import path from 'node:path';
import { scanRepository } from './scan.mjs';
import { walkFiles, relative } from './fs.mjs';

const RULES = {
  NO_README: ['warning', 'Repository has no README', 'Add a README that explains setup, architecture and safe development workflow.'],
  NO_TESTS: ['error', 'Repository has no detected tests', 'Add automated tests around behavior before continuing large AI-generated changes.'],
  NO_LOCKFILE: ['warning', 'Dependency lockfile is missing', 'Commit the package manager lockfile to make dependency resolution reproducible.'],
  NO_CI: ['warning', 'Continuous integration is missing', 'Add a CI workflow that runs tests and repository safety checks.'],
  NO_AGENT_GUIDE: ['note', 'Agent instructions are missing', 'Add AGENTS.md, CLAUDE.md or equivalent repository instructions.'],
  ENV_IN_REPO: ['error', 'Environment file may be tracked', 'Remove real environment files from version control and use a sanitized example file.'],
  POSSIBLE_SECRETS: ['error', 'Possible secret material detected', 'Rotate exposed credentials if real, remove them from history and use a secret store.'],
  GIANT_FILES: ['warning', 'Large source files detected', 'Split high-risk modules into smaller units when it improves ownership and testability.'],
  TODO_LOAD: ['note', 'High TODO/FIXME load', 'Review unresolved markers and convert important ones into tracked work.']
};

function ruleDescriptor(code) {
  const [, shortDescription, help] = RULES[code] || ['warning', code, code];
  return {
    id: code,
    name: code,
    shortDescription: { text: shortDescription },
    fullDescription: { text: help },
    help: { text: help }
  };
}

function location(uri, line = 1) {
  return [{
    physicalLocation: {
      artifactLocation: { uri: uri.split(path.sep).join('/') },
      region: { startLine: Math.max(1, line || 1) }
    }
  }];
}

export function makeSarif(rootInput = '.') {
  const scan = scanRepository(rootInput);
  const root = path.resolve(rootInput);
  const files = walkFiles(root);
  const rels = files.map((f) => relative(root, f));
  const anchor = ['README.md', 'package.json', 'pyproject.toml', 'go.mod', 'Cargo.toml', ...rels].find((x) => rels.includes(x)) || rels[0] || '.';
  const results = [];

  for (const finding of scan.findings) {
    const [level] = RULES[finding.code] || ['warning'];
    if (finding.code === 'GIANT_FILES') {
      for (const item of scan.largeFiles) {
        results.push({ ruleId: finding.code, level, message: { text: `${item.file} has ${item.loc} lines.` }, locations: location(item.file) });
      }
      continue;
    }
    if (finding.code === 'POSSIBLE_SECRETS') {
      for (const item of scan.possibleSecrets) {
        results.push({ ruleId: finding.code, level, message: { text: `${item.type} pattern detected in ${item.file}. Review before merging.` }, locations: location(item.file, item.line) });
      }
      continue;
    }
    if (finding.code === 'ENV_IN_REPO') {
      for (const file of scan.envFiles || []) results.push({ ruleId: finding.code, level, message: { text: `Potential environment file tracked: ${file}` }, locations: location(file) });
      continue;
    }
    results.push({ ruleId: finding.code, level, message: { text: finding.message }, locations: location(anchor) });
  }

  const usedRules = [...new Set(results.map((r) => r.ruleId))].map(ruleDescriptor);
  return {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [{
      tool: {
        driver: {
          name: 'Vibe Surgeon',
          informationUri: 'https://github.com/',
          semanticVersion: '0.2.0',
          rules: usedRules
        }
      },
      results
    }]
  };
}
