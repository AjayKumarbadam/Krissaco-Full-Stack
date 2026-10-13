import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { User, Role } from "../types";
import { DEMO_CREDENTIALS } from "../constants";
import { getAuthToken, setAuthToken } from "../api/client";
import { login as apiLogin, getMe } from "../api/auth";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: Role | null;
  loginUser: (username: string, password: string) => Promise<User>;
  logoutUser: () => void;
  switchDemoRole: (role: Role) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("krissaco_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const currentToken = getAuthToken();
      if (currentToken) {
        try {
          const currentUser = await getMe();
          setUser(currentUser);
          localStorage.setItem("krissaco_user", JSON.stringify(currentUser));
        } catch {
          setAuthToken(null);
          setToken(null);
          setUser(null);
          localStorage.removeItem("krissaco_user");
        }
      } else {
        // Auto-login default Accountant for instantaneous demo experience
        try {
          const defaultAccountant = DEMO_CREDENTIALS.Accountant;
          const res = await apiLogin(defaultAccountant.username, defaultAccountant.password);
          setUser(res.user);
          setToken(res.access_token);
          localStorage.setItem("krissaco_user", JSON.stringify(res.user));
        } catch {
          // Backend may be starting up
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  async function loginUser(username: string, password: string): Promise<User> {
    const res = await apiLogin(username, password);
    setUser(res.user);
    setToken(res.access_token);
    localStorage.setItem("krissaco_user", JSON.stringify(res.user));
    return res.user;
  }

  function logoutUser() {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    localStorage.removeItem("krissaco_user");
  }

  async function switchDemoRole(role: Role) {
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      await loginUser(creds.username, creds.password);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        role: user?.role || null,
        loginUser,
        logoutUser,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
