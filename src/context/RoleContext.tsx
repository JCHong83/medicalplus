import React, { createContext, useContext, useEffect, useState, ReactNode, } from 'react';
import * as SecureStore from "expo-secure-store";
import { supabase } from "../api/supabaseClient";

type Role = "patient" | "doctor";

interface RoleContextType {
  activeRole: Role | null;  // The current UI mode (can be switched by doctors)
  dbRole: Role | null;      // The permanent identity from the DB (cannot be switched)
  isLoading: boolean;
  hasSynced: boolean;
  setActiveRole: (role: Role) => Promise<void>;
  setActiveRoleAndWait: (role: Role) => Promise<void>;
  syncRoleWithUser: () => Promise<void>;
  resetRole: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [activeRole, setActiveRoleState] = useState<Role | null>(null);
  const [dbRole, setDbRole] = useState<Role | null>(null); // Track the permanent identity
  const [isLoading, setIsLoading] = useState(true);
  const [hasSynced, setHasSynced] = useState(false);

  // Initial Load: Try to get last used mode from SecureStore
  useEffect(() => {
    const initRole = async () => {
      try {
        const storedRole = await SecureStore.getItemAsync("activeRole");

        if (storedRole === "doctor" || storedRole === "patient") {
          setActiveRoleState(storedRole);
        } 
      } catch (err) {
        console.error("Error loading role from SecureStore:", err);
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

        // IDENTITY: Always set the DB role as the identity
        setDbRole(permanentRole);
        
        // RESET: Always force activeRole to match dbRole on sync
        setActiveRoleState(permanentRole);
        await SecureStore.setItemAsync("activeRole", permanentRole);
        console.log(`[RoleContext] Sync complete. Identity & Mode set to: ${permanentRole}`);
      }
    } finally {
      setHasSynced(true);
      setIsLoading(false);
    }
  };

  // Manual role update (toggle between modes)
  const setActiveRole = async (role: Role) => {
    try {
      await SecureStore.setItemAsync("activeRole", role);
      setActiveRoleState(role);
    } catch (err) {
      console.error("Error saving role:", err);
    }
  };

  // Save + Wait until persisted before continuing (for navigation)
  const setActiveRoleAndWait = async (role: Role) => {
    try {
      await SecureStore.setItemAsync("activeRole", role);
      setActiveRoleState(role);
      // Small buffer for persistence and state propagation
      await new Promise((res) => setTimeout(res, 100));
    } catch (err) {
      console.error("Error saving role with wait:", err)
    }
  };

  // Reset role on logout
  const resetRole = async () => {
    try {
      await SecureStore.deleteItemAsync("activeRole");
      setActiveRoleState("patient");
      setDbRole(null); // Clear identity on logout
      setHasSynced(false);
    } catch (err) {
      console.error("Error resetting role:", err);
    }
  };

  return (
    <RoleContext.Provider
      value={{
        activeRole,
        dbRole,
        isLoading,
        setActiveRole,
        setActiveRoleAndWait,
        syncRoleWithUser,
        resetRole,
        hasSynced
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

// Hook
export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (!context) throw new Error("useRole must be used within a RoleProvider");
  return context;
};