import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageProvider, StorageItem, StorageUploadResult } from './types';

export interface SupabaseStorageConfig {
  url?: string;
  key?: string;
  bucket?: string;
}

export class SupabaseStorageProvider implements StorageProvider {
  private client: SupabaseClient;
  private bucket: string;

  constructor(config?: SupabaseStorageConfig) {
    const url = config?.url || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      config?.key ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const bucket =
      config?.bucket ||
      process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ||
      'paperforge';

    if (!url || !key) {
      throw new Error(
        'SupabaseStorageProvider requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).'
      );
    }

    this.bucket = bucket;
    this.client = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  async upload(
    storagePath: string,
    buffer: Buffer,
    contentType = 'application/pdf'
  ): Promise<StorageUploadResult> {
    const cleanPath = storagePath.replace(/^\/+/, '');
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(cleanPath, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase Storage upload failed for "${cleanPath}": ${error.message}`);
    }

    const { data: publicUrlData } = this.client.storage
      .from(this.bucket)
      .getPublicUrl(cleanPath);

    return {
      storageKey: cleanPath,
      publicUrl: publicUrlData.publicUrl,
    };
  }

  async download(storagePath: string): Promise<Buffer> {
    const cleanPath = storagePath.replace(/^\/+/, '');
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .download(cleanPath);

    if (error || !data) {
      throw new Error(
        `Supabase Storage download failed for "${cleanPath}": ${error?.message || 'Empty response'}`
      );
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async exists(storagePath: string): Promise<boolean> {
    const cleanPath = storagePath.replace(/^\/+/, '');
    const lastSlash = cleanPath.lastIndexOf('/');
    const dir = lastSlash >= 0 ? cleanPath.substring(0, lastSlash) : '';
    const filename = lastSlash >= 0 ? cleanPath.substring(lastSlash + 1) : cleanPath;

    const { data, error } = await this.client.storage
      .from(this.bucket)
      .list(dir, { search: filename });

    if (error || !data) return false;
    return data.some((item) => item.name === filename);
  }

  async delete(storagePath: string): Promise<void> {
    const cleanPath = storagePath.replace(/^\/+/, '');
    const { error } = await this.client.storage
      .from(this.bucket)
      .remove([cleanPath]);

    if (error) {
      throw new Error(`Supabase Storage delete failed for "${cleanPath}": ${error.message}`);
    }
  }

  async list(prefix: string): Promise<StorageItem[]> {
    const cleanPrefix = prefix.replace(/^\/+/, '').replace(/\/+$/, '');
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .list(cleanPrefix);

    if (error) {
      throw new Error(`Supabase Storage list failed for "${cleanPrefix}": ${error.message}`);
    }

    return (data || []).map((item) => ({
      name: item.name,
      path: cleanPrefix ? `${cleanPrefix}/${item.name}` : item.name,
      size: item.metadata?.size || 0,
      updatedAt: item.updated_at || item.created_at || new Date().toISOString(),
    }));
  }

  getPublicUrl(storagePath: string): string {
    const cleanPath = storagePath.replace(/^\/+/, '');
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(cleanPath);
    return data.publicUrl;
  }

  async getSignedUrl(storagePath: string, expiresInSeconds = 3600): Promise<string> {
    const cleanPath = storagePath.replace(/^\/+/, '');
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(cleanPath, expiresInSeconds);

    if (error || !data) {
      throw new Error(`Failed to generate signed URL for "${cleanPath}": ${error?.message}`);
    }

    return data.signedUrl;
  }
}
