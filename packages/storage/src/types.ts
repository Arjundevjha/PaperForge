/**
 * PaperForge — Storage Abstraction Interface & Types
 * Vendor-agnostic storage contract supporting Supabase Storage, S3/R2, and Local Disk
 */

export interface StorageItem {
  name: string;
  path: string;
  size: number;
  updatedAt: string;
}

export interface StorageUploadResult {
  storageKey: string;
  publicUrl?: string;
}

export interface StorageProvider {
  /**
   * Uploads file buffer to storage under the specified path.
   * Path should be relative, e.g. "incoming/2024/RI_P1.pdf" or "diagrams/hash/q01.png".
   */
  upload(
    path: string,
    buffer: Buffer,
    contentType?: string
  ): Promise<StorageUploadResult>;

  /**
   * Downloads raw file buffer from storage.
   */
  download(path: string): Promise<Buffer>;

  /**
   * Checks whether a file exists at the given path.
   */
  exists(path: string): Promise<boolean>;

  /**
   * Deletes a file from storage.
   */
  delete(path: string): Promise<void>;

  /**
   * Lists items under a path prefix.
   */
  list(prefix: string): Promise<StorageItem[]>;

  /**
   * Returns a publicly accessible URL for the asset (e.g. for diagram PNGs).
   */
  getPublicUrl(path: string): string;

  /**
   * Generates a time-limited signed download URL.
   */
  getSignedUrl(path: string, expiresInSeconds?: number): Promise<string>;
}
