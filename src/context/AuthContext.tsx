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
    let mounted = true;

    const initAuth = async () => {
      try {
        // Step 1. Always start from Supabase
        const { data, error } = await supabase.auth.getSession();
        if (error) console.error("Error getting session:", error);

        if (mounted) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
        
        // Step 2. Optional local persistence for faster reloads
        if (data.session) {
          await saveItem("session", JSON.stringify(data.session));
        } else {
          await removeItem("session");
        }

        // Step 3. Subscribe to future auth state changes
        const { data: subscription } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            console.log("Auth state changed:", _event);

            if (mounted) {
              setSession(session);
              setUser(session?.user ?? null);
            }

            if (session) {
              await saveItem("session", JSON.stringify(session));
            } else {
              await removeItem("session");
            }
          }
        );

        // Step 4. Mark as done
        if (mounted) setLoading(false);

        // Step 5. Cleanup
        return () => {
          mounted = false;
          subscription.subscription.unsubscribe();
        };
      } catch (err) {
        console.error("Error initializing auth:", err);
        if (mounted) setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Manual refresh helper
  const refreshSession = async () => {
    console.log("Manually refreshing session...");
    setLoading(true);

    try {
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
    } catch (err) {
      console.error("Error refreshing session:", err);
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