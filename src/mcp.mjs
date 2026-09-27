import path from 'node:path';
import { scanRepository } from './scan.mjs';
import { buildGraph, computeBlastRadius } from './graph.mjs';
import { guardRepository } from './guard.mjs';
import { makeAgentContext } from './context.mjs';

const PROTOCOL_VERSION = '2025-11-25';

const TOOLS = [
  {
    name: 'vibe_scan',
    title: 'Scan repository health',
    description: 'Scan a repository for vibe-coding maintenance risks, test gaps, large files and secret-like material.',
    inputSchema: { type: 'object', properties: { path: { type: 'string', description: 'Repository path. Defaults to server root.' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: 'vibe_map',
    title: 'Map repository dependencies',
    description: 'Build a local dependency map and identify high-impact files.',
    inputSchema: { type: 'object', properties: { path: { type: 'string' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: 'vibe_guard',
    title: 'Estimate change blast radius',
    description: 'Inspect the git diff from a base ref and estimate change risk and impacted files.',
    inputSchema: { type: 'object', properties: { path: { type: 'string' }, base: { type: 'string', default: 'HEAD~1' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: 'vibe_context',
    title: 'Generate compact agent context',
    description: 'Generate compact repository context with safety rules, hotspots and current risks for a coding agent.',
    inputSchema: { type: 'object', properties: { path: { type: 'string' } }, additionalProperties: false },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: 'vibe_blast_radius',
    title: 'Compute blast radius for files',
    description: 'Given a list of changed repository-relative files, return files that depend on them up to a chosen depth.',
    inputSchema: {
      type: 'object',
      required: ['files'],
      properties: {
        path: { type: 'string' },
        files: { type: 'array', items: { type: 'string' }, minItems: 1 },
        depth: { type: 'integer', minimum: 1, maximum: 5, default: 2 }
      },
      additionalProperties: false
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }
];

function textResult(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return { content: [{ type: 'text', text }], structuredContent: typeof value === 'object' ? value : undefined, isError: false };
}

function err(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

export function startMcpServer(rootInput = '.') {
  const serverRoot = path.resolve(rootInput);
  let initialized = false;
  let buffer = '';

  const resolveRoot = (candidate) => path.resolve(serverRoot, candidate || '.');
  const send = (payload) => process.stdout.write(`${JSON.stringify(payload)}\n`);

  async function handle(msg) {
    if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
      if ('id' in (msg || {})) send(err(msg?.id ?? null, -32600, 'Invalid Request'));
      return;
    }

    if (msg.method === 'initialize') {
      initialized = true;
      send({
        jsonrpc: '2.0',
        id: msg.id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: {
            name: 'vibe-surgeon',
            title: 'Vibe Surgeon',
            version: '0.2.0',
            description: 'Repository safety tools for AI coding agents.'
          },
          instructions: 'Use vibe_scan before large changes and vibe_guard before proposing a merge.'
        }
      });
      return;
    }

    if (msg.method === 'notifications/initialized' || msg.method === 'notifications/cancelled') return;
    if (msg.method === 'ping') { send({ jsonrpc: '2.0', id: msg.id, result: {} }); return; }
    if (!initialized) { if ('id' in msg) send(err(msg.id, -32002, 'Server not initialized')); return; }

    if (msg.method === 'tools/list') {
      send({ jsonrpc: '2.0', id: msg.id, result: { tools: TOOLS } });
      return;
    }

    if (msg.method === 'tools/call') {
      const name = msg.params?.name;
      const args = msg.params?.arguments || {};
      try {
        let result;
        if (name === 'vibe_scan') result = scanRepository(resolveRoot(args.path));
        else if (name === 'vibe_map') result = buildGraph(resolveRoot(args.path));
        else if (name === 'vibe_guard') result = guardRepository(resolveRoot(args.path), args.base || 'HEAD~1');
        else if (name === 'vibe_context') {
          const ctx = makeAgentContext(resolveRoot(args.path));
          result = { file: ctx.out, markdown: ctx.markdown };
        } else if (name === 'vibe_blast_radius') {
          if (!Array.isArray(args.files) || !args.files.length) throw new Error('files must be a non-empty array');
          const graph = buildGraph(resolveRoot(args.path));
          result = computeBlastRadius(graph, args.files, Number(args.depth || 2));
        } else {
          send(err(msg.id, -32602, `Unknown tool: ${name}`));
          return;
        }
        send({ jsonrpc: '2.0', id: msg.id, result: textResult(result) });
      } catch (error) {
        send({ jsonrpc: '2.0', id: msg.id, result: { content: [{ type: 'text', text: String(error?.message || error) }], isError: true } });
      }
      return;
    }

    if ('id' in msg) send(err(msg.id, -32601, `Method not found: ${msg.method}`));
  }

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    buffer += chunk;
    let index;
    while ((index = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, index).trim();
      buffer = buffer.slice(index + 1);
      if (!line) continue;
      try { void handle(JSON.parse(line)); }
      catch { send(err(null, -32700, 'Parse error')); }
    }
  });
}
