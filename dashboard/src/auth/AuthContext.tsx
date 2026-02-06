import React, { createContext, useContext, useMemo, useState } from "react";

type AuthContextValue = {
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "demo_auth_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });

  const value = useMemo<AuthContextValue>(() => {
    return {
      isAuthenticated: !!token,
      token,

      // Replace these with real API calls later
      login: async (email: string, password: string) => {
        if (!email || !password) throw new Error("Missing credentials.");
        // fake latency
        await new Promise((r) => setTimeout(r, 500));
        const fakeToken = `token_${Date.now()}`;
        localStorage.setItem(STORAGE_KEY, fakeToken);
        setToken(fakeToken);
      },

      signup: async (name: string, email: string, password: string) => {
        if (!name || !email || !password) throw new Error("Missing fields.");
        await new Promise((r) => setTimeout(r, 600));
        const fakeToken = `token_${Date.now()}`;
        localStorage.setItem(STORAGE_KEY, fakeToken);
        setToken(fakeToken);
      },

      logout: () => {
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
      },
    };
  }, [token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
