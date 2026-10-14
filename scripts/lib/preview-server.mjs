import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const getBuiltEntry = (root = process.cwd()) => {
  const html = readFileSync(join(root, 'dist', 'index.html'), 'utf8');
  const match = html.match(/assets\/index-[^"]*\.js/);
  if (!match) {
    throw new Error('built entry chunk not found in dist/index.html');
  }
  return match[0];
};

export const waitForServer = async (target, timeoutMs = 30000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(target);
      if (res.ok) return;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  throw new Error(`server at ${target} did not start`);
};

export const verifyServedBuild = async (target, expectedEntry, timeoutMs = 10000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(target);
      if (res.ok) {
        const body = await res.text();
        if (body.includes(expectedEntry)) {
          return;
        }
      }
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  throw new Error(`served build at ${target} does not match just-built entry ${expectedEntry}`);
};

export const stopPreviewServer = async (server) => {
  if (!server) {
    return;
  }
  try {
    if (server.pid) {
      process.kill(-server.pid, 'SIGTERM');
    }
  } catch {
    try {
      server.kill('SIGTERM');
    } catch {
      return;
    }
  }
  const start = Date.now();
  while (server.exitCode === null && server.signalCode === null && Date.now() - start < 5000) {
    await new Promise((r) => setTimeout(r, 100));
  }
  if (server.exitCode === null && server.signalCode === null) {
    try {
      if (server.pid) {
        process.kill(-server.pid, 'SIGKILL');
      }
    } catch {
      try {
        server.kill('SIGKILL');
      } catch {
        return;
      }
    }
  }
};

export const startPreviewServer = async (options = {}) => {
  const root = options.root ?? process.cwd();
  const port = options.port ?? 4173;
  const expectedEntry = options.expectedEntry ?? getBuiltEntry(root);
  const viteBin = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'node_modules', 'vite', 'bin', 'vite.js');
  const server = spawn(process.execPath, [viteBin, 'preview', '--port', String(port), '--strictPort'], {
    detached: true,
    stdio: 'ignore',
    cwd: root,
  });
  server.unref?.();
  const target = `http://localhost:${port}/`;
  try {
    await waitForServer(target);
    await verifyServedBuild(target, expectedEntry);
  } catch (error) {
    await stopPreviewServer(server);
    throw error;
  }
  return server;
};
