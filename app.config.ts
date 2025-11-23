import 'dotenv/config';
// Avoid TS errors when Node types are not installed in the editor
declare const process: any;

export default ({ config }: { config: any }): any => ({
  ...config,
  name: 'Notre App Couple',
  slug: 'app-couple',
  version: '0.1.0',
  scheme: 'appcouple',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  plugins: [
    'expo-font',
    'expo-router'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.example.appcouple'
  },
  android: {
    package: 'com.example.appcouple',
    permissions: []
  },
  web: {
    bundler: 'metro'
  },
  experiments: {
    typedRoutes: true
  },
  extra: {
    // Support both private and EXPO_PUBLIC_ env names
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    // Dev convenience credentials (public) for quick login
    DEV_EMAIL: process.env.EXPO_PUBLIC_DEV_EMAIL,
    DEV_PASSWORD: process.env.EXPO_PUBLIC_DEV_PASSWORD,
    eas: { projectId: 'ff05c9a5-7776-42d9-864a-18f51c49b3df' }
  }
});
