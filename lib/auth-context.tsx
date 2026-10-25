"use client";

import * as React from "react";
import { RoleType, UserSession } from "./types";
import { CLINICAL_PERSONAS } from "./mock-data";
import { apiLogin, apiLogout } from "./api";

interface AuthContextType {
  currentUser: UserSession | null;
  activeRole: RoleType;
  isAuthenticated: boolean;
  login: (role: RoleType, phone?: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchRole: (role: RoleType) => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = "aegis_user_session";
const STORAGE_KEY_ROLE = "aegis_active_role";

const defaultPersona = CLINICAL_PERSONAS["Doctor"];
const initialDefaultUser: UserSession = {
  user_id: 1,
  phone: defaultPersona.phone,
  name: defaultPersona.name,
  role: "Doctor",
  department: defaultPersona.dept,
  is_authenticated: true,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = React.useState<UserSession | null>(initialDefaultUser);
  const [activeRole, setActiveRole] = React.useState<RoleType>("Doctor");
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(true);

  React.useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem(STORAGE_KEY_USER);
      const savedRole = localStorage.getItem(STORAGE_KEY_ROLE) as RoleType | null;

      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        setCurrentUser(parsed);
        setIsAuthenticated(true);
        if (savedRole) {
          setActiveRole(savedRole);
        } else if (parsed.role) {
          setActiveRole(parsed.role);
        }
      } else {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(initialDefaultUser));
        localStorage.setItem(STORAGE_KEY_ROLE, "Doctor");
      }
    } catch {
      // Fallback
    }
  }, []);

  const login = async (role: RoleType, phone?: string, password?: string): Promise<boolean> => {
    try {
      const res = await apiLogin(phone || "", role, password);
      const user = res.user;
      setCurrentUser(user);
      setActiveRole(role);
      setIsAuthenticated(true);
      try {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEY_ROLE, role);
      } catch {}
      return true;
    } catch {
      // Guaranteed fallback
      const persona = CLINICAL_PERSONAS[role] || CLINICAL_PERSONAS["Doctor"];
      const fallbackUser: UserSession = {
        user_id: 1,
        phone: phone || persona.phone,
        name: persona.name,
        role,
        department: persona.dept,
        is_authenticated: true,
      };
      setCurrentUser(fallbackUser);
      setActiveRole(role);
      setIsAuthenticated(true);
      try {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(fallbackUser));
        localStorage.setItem(STORAGE_KEY_ROLE, role);
      } catch {}
      return true;
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch {}
    setCurrentUser(null);
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_ROLE);
    } catch {}
  };

  const switchRole = (role: RoleType) => {
    setActiveRole(role);
    const persona = CLINICAL_PERSONAS[role];
    if (persona) {
      const updatedUser: UserSession = {
        user_id: 1,
        phone: persona.phone,
        name: persona.name,
        role,
        department: persona.dept,
        is_authenticated: true,
      };
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
        localStorage.setItem(STORAGE_KEY_ROLE, role);
      } catch {}
    }
  };


  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeRole,
        isAuthenticated,
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
