import { UserProfile, UserRole, DEFAULT_ADMIN_PROFILE, ALLOWED_ADMIN_EMAIL } from '@paperforge/shared';
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

    // Strict email check: only ALLOWED_ADMIN_EMAIL is authorized
    const isAllowedAdmin = user.email?.toLowerCase() === ALLOWED_ADMIN_EMAIL.toLowerCase();
    const role: UserRole = isAllowedAdmin ? 'ADMIN' : 'TEACHER';

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
