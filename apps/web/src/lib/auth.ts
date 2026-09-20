import { UserProfile, UserRole, DEFAULT_ADMIN_PROFILE } from '@paperforge/shared';
import { createServerSupabaseClient } from './supabase/server';

export async function getCurrentUser(): Promise<UserProfile> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    // In-memory / development fallback mode
    return DEFAULT_ADMIN_PROFILE;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return DEFAULT_ADMIN_PROFILE;
    }

    const role: UserRole =
      (user.user_metadata?.role as UserRole) ||
      (user.email === process.env.ADMIN_DEFAULT_EMAIL ? 'ADMIN' : 'TEACHER');

    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Educator',
      role,
      avatarUrl: user.user_metadata?.avatar_url,
    };
  } catch {
    return DEFAULT_ADMIN_PROFILE;
  }
}
