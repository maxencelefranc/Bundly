import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
declare const process: any;

const getEnv = () => {
  // Prefer app.config.ts extras; fallback to Expo public env vars
  const extra = (Constants.expoConfig?.extra || {}) as any;
  return {
    url: extra.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    anonKey: extra.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
  };
};

export const getDevCreds = () => {
  const extra = (Constants.expoConfig?.extra || {}) as any;
  return {
    email: extra.DEV_EMAIL || process.env.EXPO_PUBLIC_DEV_EMAIL || '',
    password: extra.DEV_PASSWORD || process.env.EXPO_PUBLIC_DEV_PASSWORD || ''
  };
};

const { url, anonKey } = getEnv();

// Export minimal diagnostics for runtime checks (do not export the key)
export const supabaseUrl = url;
export const supabaseAnonKey = anonKey; // public anon key (safe to expose in client)

if (!url || !anonKey) {
  console.warn(
    'Supabase URL/Anon key missing. Set SUPABASE_URL/SUPABASE_ANON_KEY or EXPO_PUBLIC_SUPABASE_URL/EXPO_PUBLIC_SUPABASE_ANON_KEY in .env, then restart Expo.'
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];
