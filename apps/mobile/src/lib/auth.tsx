import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import * as SecureStore from "expo-secure-store";
import { api, type AuthResult, type AuthUser } from "@/lib/api";

const ACCESS_KEY = "hb_access";
const REFRESH_KEY = "hb_refresh";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: {
    email?: string;
    phone?: string;
    password: string;
    display_name?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = useCallback(async (result: AuthResult) => {
    await SecureStore.setItemAsync(ACCESS_KEY, result.access_token);
    await SecureStore.setItemAsync(REFRESH_KEY, result.refresh_token);
    setToken(result.access_token);
    setUser(result.user);
  }, []);

  // Restore session on cold start.
  useEffect(() => {
    (async () => {
      try {
        const access = await SecureStore.getItemAsync(ACCESS_KEY);
        if (access) {
          const me = await api.me(access);
          setToken(access);
          setUser(me);
        }
      } catch {
        await SecureStore.deleteItemAsync(ACCESS_KEY);
        await SecureStore.deleteItemAsync(REFRESH_KEY);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      await persist(await api.login(identifier, password));
    },
    [persist]
  );

  const register = useCallback(
    async (payload: {
      email?: string;
      phone?: string;
      password: string;
      display_name?: string;
    }) => {
      await persist(await api.register(payload));
    },
    [persist]
  );

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
