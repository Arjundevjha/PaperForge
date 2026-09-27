import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import * as path from 'node:path';
import { StorageProvider, StorageItem, StorageUploadResult } from './types';

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = path.resolve(
      /*turbopackIgnore: true*/
      baseDir || process.env.STORAGE_LOCAL_DIR || path.join(process.cwd(), 'scratch', 'storage')
    );
    if (!fsSync.existsSync(this.baseDir)) {
      fsSync.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private resolvePath(relativePath: string): string {
    const clean = relativePath.replace(/^(\.\.[\/\\])+/, '').replace(/^[\/\\]+/, '');
    return path.join(this.baseDir, clean);
  }

  async upload(
    storagePath: string,
    buffer: Buffer,
    _contentType?: string
  ): Promise<StorageUploadResult> {
    const targetFile = this.resolvePath(storagePath);
    await fs.mkdir(path.dirname(targetFile), { recursive: true });
    await fs.writeFile(targetFile, buffer);

    return {
      storageKey: storagePath,
      publicUrl: `/storage/${storagePath.replace(/\\/g, '/')}`,
    };
  }

  async download(storagePath: string): Promise<Buffer> {
    const targetFile = this.resolvePath(storagePath);
    try {
      return await fs.readFile(targetFile);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'File read error';
      throw new Error(`LocalStorageProvider download failed for "${storagePath}": ${msg}`);
    }
  }

  async exists(storagePath: string): Promise<boolean> {
    const targetFile = this.resolvePath(storagePath);
    try {
      await fs.access(targetFile);
      return true;
    } catch {
      return false;
    }
  }

  async delete(storagePath: string): Promise<void> {
    const targetFile = this.resolvePath(storagePath);
    try {
      await fs.unlink(targetFile);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  async list(prefix: string): Promise<StorageItem[]> {
    const targetDir = this.resolvePath(prefix);
    try {
      const entries = await fs.readdir(targetDir, { withFileTypes: true });
      const items: StorageItem[] = [];

      for (const entry of entries) {
        if (entry.isFile()) {
          const fullFilePath = path.join(targetDir, entry.name);
          const stat = await fs.stat(fullFilePath);
          items.push({
            name: entry.name,
            path: `${prefix.replace(/\/+$/, '')}/${entry.name}`,
            size: stat.size,
            updatedAt: stat.mtime.toISOString(),
          });
        }
      }

      return items;
    } catch {
      return [];
    }
  }

  getPublicUrl(storagePath: string): string {
    return `/storage/${storagePath.replace(/\\/g, '/')}`;
  }

  async getSignedUrl(storagePath: string, _expiresInSeconds = 3600): Promise<string> {
    return this.getPublicUrl(storagePath);
  }
}
