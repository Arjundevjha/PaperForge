import { StorageProvider } from './types';
import { LocalStorageProvider } from './local-provider';
import { SupabaseStorageProvider } from './supabase-provider';

export * from './types';
export * from './local-provider';
export * from './supabase-provider';

let cachedProvider: StorageProvider | null = null;

export function getStorageProvider(forceDriver?: 'supabase' | 'local'): StorageProvider {
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
