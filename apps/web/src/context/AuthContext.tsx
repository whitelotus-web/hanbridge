"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";
import { authApi, type AuthResult, type AuthUser } from "@/lib/api";

const ACCESS_KEY = "hb_access";
const REFRESH_KEY = "hb_refresh";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  setSession: (result: AuthResult) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const setSession = useCallback((result: AuthResult) => {
    localStorage.setItem(ACCESS_KEY, result.access_token);
    localStorage.setItem(REFRESH_KEY, result.refresh_token);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const access = localStorage.getItem(ACCESS_KEY);
      const refresh = localStorage.getItem(REFRESH_KEY);
      if (!access && !refresh) {
        setLoading(false);
        return;
      }
      try {
        if (access) {
          const me = await authApi.me(access);
          if (!cancelled) setUser(me);
          return;
        }
      } catch {
        // access expired — try refresh below
      }
      try {
        if (refresh) {
          const tokens = await authApi.refresh(refresh);
          localStorage.setItem(ACCESS_KEY, tokens.access_token);
          localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
          const me = await authApi.me(tokens.access_token);
          if (!cancelled) setUser(me);
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem(ACCESS_KEY);
          localStorage.removeItem(REFRESH_KEY);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
