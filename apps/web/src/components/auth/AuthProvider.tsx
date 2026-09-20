'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserRole, DEFAULT_ADMIN_PROFILE, DEFAULT_TEACHER_PROFILE } from '@paperforge/shared';
import { createClient } from '../../lib/supabase/client';

interface AuthContextType {
  user: UserProfile;
  role: UserRole;
  isAdmin: boolean;
  isTeacher: boolean;
  isSupabaseConfigured: boolean;
  signOut: () => Promise<void>;
  switchPersona?: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: DEFAULT_ADMIN_PROFILE,
  role: 'ADMIN',
  isAdmin: true,
  isTeacher: false,
  isSupabaseConfigured: false,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(DEFAULT_ADMIN_PROFILE);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    if (!supabase) {
      setIsConfigured(false);
      return;
    }

    setIsConfigured(true);

    // Initial session load
    supabase.auth.getUser().then(({ data: { user: sbUser } }) => {
      if (sbUser) {
        const role: UserRole = (sbUser.user_metadata?.role as UserRole) || 'ADMIN';
        setUser({
          id: sbUser.id,
          email: sbUser.email || '',
          name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Educator',
          role,
        });
      }
    });

    // Listen to Supabase auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const role: UserRole = (session.user.user_metadata?.role as UserRole) || 'ADMIN';
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Educator',
          role,
        });
      } else {
        setUser(DEFAULT_ADMIN_PROFILE);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(DEFAULT_ADMIN_PROFILE);
  };

  const handleSwitchPersona = (newRole: UserRole) => {
    if (newRole === 'ADMIN') {
      setUser(DEFAULT_ADMIN_PROFILE);
    } else {
      setUser(DEFAULT_TEACHER_PROFILE);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user.role,
        isAdmin: user.role === 'ADMIN',
        isTeacher: user.role === 'TEACHER',
        isSupabaseConfigured: isConfigured,
        signOut: handleSignOut,
        switchPersona: handleSwitchPersona,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
