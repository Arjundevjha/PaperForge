'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, UserRole, ALLOWED_ADMIN_EMAIL } from '@paperforge/shared';
import { createClient } from '../../lib/supabase/client';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isLoading: boolean;
  isSupabaseConfigured: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isAdmin: false,
  isTeacher: false,
  isLoading: true,
  isSupabaseConfigured: false,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);

  useEffect(() => {
    const supabase = createClient();

    if (!supabase) {
      setIsConfigured(false);
      const devRole = typeof document !== 'undefined'
        ? document.cookie
            .split('; ')
            .find((row) => row.startsWith('paperforge_dev_role='))
            ?.split('=')[1]
        : undefined;

      if (devRole) {
        const adminEmail = (process.env.ADMIN_DEFAULT_EMAIL || ALLOWED_ADMIN_EMAIL).toLowerCase();
        setUser({
          id: 'dev-user-01',
          email: devRole === 'ADMIN' ? adminEmail : 'teacher@paperforge.local',
          name: devRole === 'ADMIN' ? 'Local Admin (Dev)' : 'Local Teacher (Dev)',
          role: devRole === 'ADMIN' ? 'ADMIN' : 'TEACHER',
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
      return;
    }

    setIsConfigured(true);

    const resolveUserProfile = (sbUser: any): UserProfile => {
      const adminEmail = (process.env.ADMIN_DEFAULT_EMAIL || ALLOWED_ADMIN_EMAIL).toLowerCase();
      const isAllowedAdmin = sbUser.email?.toLowerCase() === adminEmail;
      const role: UserRole = isAllowedAdmin
        ? 'ADMIN'
        : ((sbUser.user_metadata?.role as UserRole) || 'TEACHER');

      return {
        id: sbUser.id,
        email: sbUser.email || '',
        name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Educator',
        role,
        avatarUrl: sbUser.user_metadata?.avatar_url,
      };
    };

    // Initial session load
    supabase.auth.getUser().then(({ data: { user: sbUser }, error }) => {
      if (!error && sbUser) {
        setUser(resolveUserProfile(sbUser));
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // Listen to Supabase auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(resolveUserProfile(session.user));
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (typeof document !== 'undefined') {
      document.cookie = 'paperforge_dev_role=; path=/; max-age=0;';
    }
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAdmin: user?.role === 'ADMIN',
        isTeacher: user?.role === 'TEACHER',
        isLoading,
        isSupabaseConfigured: isConfigured,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
