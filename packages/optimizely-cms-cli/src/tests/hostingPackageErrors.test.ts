import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPackage } from '../service/hosting/package.js';

// A zip that fails while reading a file, the way yazl reports an unreadable file or broken symlink
vi.mock('yazl', () => ({
  default: {
    ZipFile: class extends EventEmitter {
      outputStream = new PassThrough();
      addFile() {}
      end() {
        setImmediate(() => this.emit('error', new Error('ENOENT: broken-link.txt')));
      }
    },
  },
}));

let projectDir: string;

beforeEach(async () => {
  projectDir = await mkdtemp(join(tmpdir(), 'cli-hosting-errors-'));
  await writeFile(join(projectDir, 'package.json'), '{}');
});

afterEach(() => rm(projectDir, { recursive: true, force: true }));

describe('createPackage', () => {
  it('rejects when a file cannot be read', async () => {
    await expect(
      createPackage(projectDir, 'site.zip', join(projectDir, 'out')),
    ).rejects.toThrow('ENOENT: broken-link.txt');
  });
});
