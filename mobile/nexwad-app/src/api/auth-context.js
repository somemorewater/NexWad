import { createContext, useContext, useEffect, useState } from "react";
import { auth, userStore, tokenStore } from "./client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          tokenStore.get(),
          userStore.get(),
        ]);
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(savedUser);
          auth.me().then(({ user: fresh }) => {
            setUser(fresh);
            userStore.set(fresh);
          }).catch(() => logout());
        }
      } catch (err) {
        console.error("[AuthProvider]", err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const data = await auth.login(email, password);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const signup = async (fields) => {
    const data = await auth.signup(fields);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await auth.logout();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const { user: fresh } = await auth.me();
    setUser(fresh);
    await userStore.set(fresh);
    return fresh;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, refreshUser, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
