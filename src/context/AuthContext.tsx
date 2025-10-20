import { createContext, useState, useEffect } from 'react';
import { supabase } from '../api/supabaseClient';
import { saveItem, getItem, removeItem } from '../utils/storage';
import { View, Text } from 'react-native';
import React from 'react';

export const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await getItem('session');
      if (stored) setSession(JSON.parse(stored));
      setLoading(false);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) saveItem('session', JSON.stringify(session));
      else removeItem('session');
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return null;

  return <AuthContext.Provider value={{ session }}>{children}</AuthContext.Provider>;
}