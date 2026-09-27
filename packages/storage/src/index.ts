import * as fs from 'node:fs';
import * as path from 'node:path';
import { StorageProvider } from './types';
import { LocalStorageProvider } from './local-provider';
import { SupabaseStorageProvider } from './supabase-provider';

export * from './types';
export * from './local-provider';
export * from './supabase-provider';

let cachedProvider: StorageProvider | null = null;

function ensureEnvLoaded() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const candidates = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), 'apps', 'web', '.env.local'),
  ];
  for (const file of candidates) {
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf-8');
      for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq > 0) {
          const key = trimmed.substring(0, eq).trim();
          let val = trimmed.substring(eq + 1).trim();
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          if (!process.env[key]) process.env[key] = val;
        }
      }
    }
  }
}

export function getStorageProvider(forceDriver?: 'supabase' | 'local'): StorageProvider {
  ensureEnvLoaded();
  if (cachedProvider && !forceDriver) {
    return cachedProvider;
  }

  const driver =
    forceDriver ||
    process.env.STORAGE_DRIVER ||
    process.env.STORAGE_TYPE ||
    (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      ? 'supabase'
      : 'local');

  let provider: StorageProvider;

  if (driver === 'supabase') {
    try {
      provider = new SupabaseStorageProvider();
    } catch {
      // Graceful fallback to LocalStorage if Supabase credentials are misconfigured
      provider = new LocalStorageProvider();
    }
  } else {
    provider = new LocalStorageProvider();
  }

  if (!forceDriver) {
    cachedProvider = provider;
  }

  return provider;
}
