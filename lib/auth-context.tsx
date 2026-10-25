"use client";

import * as React from "react";
import { RoleType, UserSession } from "./types";
import { apiCheckSession, apiLogin, apiLogout, apiSwitchRole } from "./api";

interface AuthContextType {
  currentUser: UserSession | null;
  activeRole: RoleType;
  isAuthenticated: boolean;
  login: (role: RoleType, phone?: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchRole: (role: RoleType) => Promise<void>;
  sessionReady: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = React.useState<UserSession | null>(null);
  const [activeRole, setActiveRole] = React.useState<RoleType>("Doctor");
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);
  const [sessionReady, setSessionReady] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    apiCheckSession().then(({ user }) => {
      if (!mounted) return;
      setCurrentUser(user);
      setIsAuthenticated(Boolean(user));
      if (user) setActiveRole(user.role);
    }).catch(() => {
      if (!mounted) return;
      setCurrentUser(null);
      setIsAuthenticated(false);
    }).finally(() => { if (mounted) setSessionReady(true); });
    return () => { mounted = false; };
  }, []);

  const login = async (role: RoleType, phone?: string, password?: string): Promise<boolean> => {
    try {
      const { user } = await apiLogin(phone || "", role, password);
      setCurrentUser(user);
      setActiveRole(user.role);
      setIsAuthenticated(true);
      return true;
    } catch (error) { throw error; }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch {}
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveRole("Doctor");
  };

  const switchRole = async (role: RoleType) => {
    const user = await apiSwitchRole(role);
    setCurrentUser(user);
    setActiveRole(user.role);
  };


  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeRole,
        isAuthenticated,
        sessionReady,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
