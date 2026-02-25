import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Custom adapter to handle Expo's SecureStore
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => {
    // Check for 2048-byte warning debug
    if (value.length > 2048) {
      console.warn(`[Supabase Storage] Warning: Key "${key}" is ${value.length} bytes. SecureStore may fail.`);
    }
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});