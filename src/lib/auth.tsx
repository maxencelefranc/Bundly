import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { TABLES } from 'src/lib/dbTables';

export type Profile = {
  id: string;
  email?: string;
  couple_id?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  created_at?: string;
};

export type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  coupleId: string | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      setLoading(false);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, s: Session | null) => {
      setSession(s);
    });
    return () => sub?.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user) {
        setProfile(null);
        return;
      }
      const { data } = await supabase
        .from(TABLES.profiles)
        .select('id, email, couple_id, display_name, avatar_url, created_at')
        .eq('id', session.user.id)
        .maybeSingle();
      setProfile(data ?? null);
    };
    loadProfile();
  }, [session?.user?.id]);

  const value = useMemo(
    () => ({
      loading,
      session,
      profile,
      coupleId: profile?.couple_id ?? null,
      signOut: async () => {
        await supabase.auth.signOut();
      }
    }),
    [loading, session, profile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
