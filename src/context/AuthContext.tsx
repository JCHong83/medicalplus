import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../api/supabaseClient';
import { Session, User } from "@supabase/supabase-js";

// Define types for clarity
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  refreshSession: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load stored session on startup and listen for auth changes
  useEffect(() => {
    // Get initial session on mount
    const initialize = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();

        if (error) console.error("[AuthContext] Error fetching initial session:", error);

        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (err) {
        console.error("[AuthContext] Unexpected error during init:", err);
      } finally {
        setLoading(false);
      }
    };

    initialize();

    // Listen for auth changes (Login, Logout, Token Refresh)
    // Supabase handles the persistence of these changes automatically via the storage adapter.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      console.log(`[AuthContext] Auth state changed: ${_event}`);

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshSession = async () => {
    try {
      setLoading(true);
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
      if (error) throw error;

      setSession(refreshedSession);
      setUser(refreshedSession?.user ?? null);
    } catch (err) {
      console.error("[AuthContext] Manual refresh failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Provide full context
  return (
    <AuthContext.Provider value={{ user, session, loading, refreshSession}}>
      {children}
    </AuthContext.Provider>
  );
};

// Convenience hook
export const useAuth = () => useContext(AuthContext);