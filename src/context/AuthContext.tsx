import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../api/supabaseClient';
import { saveItem, getItem, removeItem } from '../utils/storage';
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
    const initAuth = async () => {
      try {
        const stored = await getItem("session");
        if (stored) {
          const parsed = JSON.parse(stored);
          setSession(parsed);
          setUser(parsed?.user ?? null);
        } else {
          // fallback to Supabase session if available
          const { data } = await supabase.auth.getSession();
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
      } catch (err) {
        console.error("Error initializing session:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        saveItem("session", JSON.stringify(session));
      } else {
        removeItem("session");
      }
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Manual refresh helper
  const refreshSession = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.getSession();
    if (error) console.error("Error refreshing session:", error);
    if (data.session) {
      setSession(data.session);
      setUser(data.session.user);
      await saveItem("session", JSON.stringify(data.session));
    } else {
      setSession(null);
      setUser(null);
      await removeItem("session");
    }
    setLoading(false);
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