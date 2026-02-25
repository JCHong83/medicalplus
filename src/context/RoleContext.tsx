import React, { createContext, useContext, useEffect, useState, ReactNode, } from 'react';
import * as SecureStore from "expo-secure-store";
import { supabase } from "../api/supabase";

type Role = "patient" | "doctor";

interface RoleContextType {
  activeRole: Role | null;  // The current UI mode (can be switched by doctors)
  dbRole: Role | null;      // The permanent identity from the DB (cannot be switched)
  isLoading: boolean;
  hasSynced: boolean;
  setActiveRole: (role: Role) => Promise<void>;
  syncRoleWithUser: () => Promise<void>;
  resetRole: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [activeRole, setActiveRoleState] = useState<Role | null>(null);
  const [dbRole, setDbRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSynced, setHasSynced] = useState(false);

  // Listen for Auth Changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        resetRole(); // Automatically wipe everything on logout
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Initial Load from storage
  useEffect(() => {
    const initRole = async () => {
      try {
        const storedRole = await SecureStore.getItemAsync("activeRole");
        if (storedRole === "doctor" || storedRole === "patient") {
          setActiveRoleState(storedRole as Role);
        }
      } finally {
        setIsLoading(false);
      }
    };
    initRole();
  }, []);

  // The Logic Engine: Sync with DB
  const syncRoleWithUser = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      
      if (profile) {
        const permanentRole = profile.role as Role;
        setDbRole(permanentRole);
        
        // Only override activeRole if it's currently null
        if (!activeRole) {
          setActiveRoleState(permanentRole);
          await SecureStore.setItemAsync("activeRole", permanentRole);
        }

        console.log(`[RoleContext] Synced: ${permanentRole}, Active=${activeRole || permanentRole}`);
      }
    } finally {
      setHasSynced(true);
      setIsLoading(false);
    }
  };

  // Manual role update (toggle between modes)
  const setActiveRole = async (role: Role) => {
  console.log("[RoleContext] START Switch to:", role);
  try {
    setIsLoading(true);
    // 1. Update Storage
    await SecureStore.setItemAsync("activeRole", role);
    console.log("[RoleContext] 1. SecureStore Updated");

    // 2. Update State
    setActiveRoleState(role);
    console.log("[RoleContext] 2. State Updated");
    
    // 3. Small delay to ensure state propagates before redirect
    await new Promise(resolve => setTimeout(resolve, 50)); 
  } catch (err) {
    console.error("[RoleContext] SWITCH CRASHED:", err);
    throw err;
  } finally {
    setIsLoading(false);
    console.log("[RoleContext] END Switch");
  }
};
  
  const resetRole = async () => {
    try {
      await SecureStore.deleteItemAsync("activeRole");
      setActiveRoleState(null); // Don't default to 'patient', keep null until next login
      setDbRole(null);
      setHasSynced(false);
      console.log("[RoleContext] State wiped clean.");
    } catch (err) {
      console.error("Error resetting role:", err)
    }
  };

  return (
    <RoleContext.Provider
      value={{
        activeRole,
        dbRole,
        isLoading,
        hasSynced,
        setActiveRole,
        syncRoleWithUser,
        resetRole,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

// Hook
export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) throw new Error("useRole must be used within a RoleProvider");
  return context;
};