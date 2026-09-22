import { UserProfile, UserRole, ALLOWED_ADMIN_EMAIL } from '@paperforge/shared';
import { createServerSupabaseClient } from './supabase/server';

/**
 * Retrieves the currently authenticated Supabase user profile from server cookies.
 * Returns null if no valid authenticated session exists.
 * Strictly derives the user role: ADMIN if matching admin email, otherwise assigned role.
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    const adminEmail = (process.env.ADMIN_DEFAULT_EMAIL || ALLOWED_ADMIN_EMAIL).toLowerCase();
    const isAllowedAdmin = user.email?.toLowerCase() === adminEmail;
    const role: UserRole = isAllowedAdmin
      ? 'ADMIN'
      : ((user.user_metadata?.role as UserRole) || 'TEACHER');

    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Educator',
      role,
      avatarUrl: user.user_metadata?.avatar_url,
    };
  } catch {
    return null;
  }
}
