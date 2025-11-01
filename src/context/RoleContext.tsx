import React, { createContext, useContext, useEffect, useState, ReactNode, } from 'react';
import * as SecureStore from "expo-secure-store";
import { supabase } from "../api/supabaseClient";

type Role = "patient" | "doctor";

interface RoleContextType {
  activeRole: Role;
  setActiveRole: (role: Role) => Promise<void>;
  isLoading: boolean;
  syncRoleWithUser: () => Promise<void>;
  resetRole: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [activeRole, setActiveRoleState] = useState<Role>("patient");
  const [isLoading, setIsLoading] = useState(true);

  // Load saved role from SecureStore when app starts
  useEffect(() => {
    const initRole = async () => {
      try {
        const storedRole = await SecureStore.getItemAsync("activeRole");

        if (storedRole === "doctor" || storedRole === "patient") {
          setActiveRoleState(storedRole);
        } else {
          // default to patient mode
          await SecureStore.setItemAsync("activeRole", "patient");
          setActiveRoleState("patient");
        }
      } catch (err) {
        console.error("Error loading role:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initRole();
  }, []);

  // Manual role update (toggle between modes)
  const setActiveRole = async (role: Role) => {
    try {
      await SecureStore.setItemAsync("activeRole", role);
      setActiveRoleState(role);
    } catch (err) {
      console.error("Error saving role:", err);
    }
  };

  // Sync the role with Supabase profile
  const syncRoleWithUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if(!user) return;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.warn("Role sync error:", error);
        return;
      }

      const dbRole = profile?.role === "doctor" ? "doctor" : "patient";
      await setActiveRole(dbRole);
    } catch (err) {
      console.error("Failed to sync role:", err);
    }
  };

  // Reset role on logout
  const resetRole = async () => {
    try {
      await SecureStore.deleteItemAsync("activeRole");
      setActiveRoleState("patient");
    } catch (err) {
      console.error("Error resetting role:", err);
    }
  };

  return (
    <RoleContext.Provider value={{ activeRole, setActiveRole, isLoading, syncRoleWithUser, resetRole }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
};