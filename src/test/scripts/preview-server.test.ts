import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import {
  getBuiltEntry,
  verifyServedBuild,
  startPreviewServer,
  stopPreviewServer,
} from '../../../scripts/lib/preview-server.mjs';
import { PIECE_LABEL_PATTERN } from '../../../scripts/lib/piece-labels.mjs';

const tempDirs: string[] = [];
const servers: Array<ReturnType<typeof createServer>> = [];

const makeDist = (entry: string) => {
  const root = mkdtempSync(join(tmpdir(), 'preview-server-test-'));
  tempDirs.push(root);
  mkdirSync(join(root, 'dist'), { recursive: true });
  writeFileSync(join(root, 'dist', 'index.html'), `<script src="/${entry}"></script>`);
  return root;
};

afterEach(() => {
  for (const server of servers.splice(0)) {
    server.close();
  }
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('getBuiltEntry', () => {
  it('extracts the hashed entry chunk from the built html', () => {
    const root = makeDist('assets/index-AbC123.js');
    expect(getBuiltEntry(root)).toBe('assets/index-AbC123.js');
  });

  it('throws when no entry chunk is present', () => {
    const root = makeDist('assets/other.js');
    expect(() => getBuiltEntry(root)).toThrow('built entry chunk not found');
  });
});

describe('verifyServedBuild', () => {
  it('resolves when the served html contains the just-built entry', async () => {
    const server = createServer((req, res) => {
      res.end('<script src="/assets/index-AbC123.js"></script>');
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as { port: number }).port;
    await expect(verifyServedBuild(`http://localhost:${port}/`, 'assets/index-AbC123.js', 1000)).resolves.toBeUndefined();
  });

  it('rejects when the served html is a stale build', async () => {
    const server = createServer((req, res) => {
      res.end('<script src="/assets/index-OldHash.js"></script>');
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as { port: number }).port;
    await expect(verifyServedBuild(`http://localhost:${port}/`, 'assets/index-AbC123.js', 500)).rejects.toThrow(
      'does not match just-built entry',
    );
  });
});

describe('stopPreviewServer', () => {
  it('kills a detached child process group', async () => {
    const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { detached: true, stdio: 'ignore' });
    child.unref?.();
    await stopPreviewServer(child);
    expect(() => process.kill(child.pid as number, 0)).toThrow();
  });

  it('resolves for a null server', async () => {
    await expect(stopPreviewServer(null)).resolves.toBeUndefined();
  });
});

describe('startPreviewServer', () => {
  it('serves the just-built entry and frees the port on stop', async () => {
    const root = makeDist('assets/index-AbC123.js');
    const port = 44000 + Math.floor(Math.random() * 1000);
    const server = await startPreviewServer({ root, port });
    try {
      const res = await fetch(`http://localhost:${port}/`);
      const body = await res.text();
      expect(body).toContain('assets/index-AbC123.js');
    } finally {
      await stopPreviewServer(server);
    }
    await expect(fetch(`http://localhost:${port}/`)).rejects.toThrow();
  }, 30000);
});

describe('piece labels', () => {
  it('matches baseplate, half-size bin, and spacer labels', () => {
    expect(PIECE_LABEL_PATTERN.test('Baseplate 6x6')).toBe(true);
    expect(PIECE_LABEL_PATTERN.test('Half-size baseplate 3x3')).toBe(true);
    expect(PIECE_LABEL_PATTERN.test('Half-size bin 3x3')).toBe(true);
    expect(PIECE_LABEL_PATTERN.test('Spacer 25.2mm x 25.2mm')).toBe(true);
    expect(PIECE_LABEL_PATTERN.test('Bin 3x3')).toBe(false);
  });
});
