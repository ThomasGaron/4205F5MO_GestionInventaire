import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./auth-context.js";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(token));
  const [isAdmin, setIsAdmin] = useState(false);

  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  // helper pour sauvegarder token/user
  const saveAuth = useCallback((newToken, newUser, newRole) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
      setToken(newToken);
    } else {
      localStorage.removeItem("token");
      setToken(null);
    }
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);
    } else {
      localStorage.removeItem("user");
      setUser(null);
    }
    if (newRole) {
      localStorage.setItem("role", JSON.stringify(newRole));
    } else {
      localStorage.removeItem("role");
    }
  }, []);

  const login = useCallback(
    async (email, mdp) => {
      setLoading(true);
      try {
        // adapte l'URL et le body selon ton backend
        const resp = await fetch(
          `${import.meta.env.VITE_BACKEND_URI}/api/user/login`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, mdp }),
          }
        );
        if (!resp.ok) {
          const text = await resp.text().catch(() => "");
          throw new Error(`Login failed: ${resp.status} ${text}`);
        }
        const data = await resp.json();
        console.log(data);
        // attendu : { token: "...", user: {...} }
        saveAuth(data.token, data.user, data.role);
        console.log(localStorage.getItem("role"));
        const role = localStorage.getItem("role");
        console.log(role);
        if (role == "admin") {
          console.log("ici");
          setIsAdmin(true);
        }
        setIsLoggedIn(true);
        return { ok: true, user: data.user };
      } catch (err) {
        console.error("login error", err);
        return { ok: false, error: err.message || String(err) };
      } finally {
        setLoading(false);
      }
    },
    [saveAuth]
  );

  const logout = useCallback(() => {
    saveAuth(null, null);
    setIsLoggedIn(false);
    setIsAdmin(false);
  }, [saveAuth]);

  // Optionnel : recharger l'objet user depuis une route /me
  // const refreshUser = useCallback(async () => {
  //   if (!token) return null;
  //   try {
  //     const resp = await fetch(
  //       `${import.meta.env.VITE_BACKEND_URI}/api/auth/me`,
  //       {
  //         headers: { Authorization: `Bearer ${token}` },
  //       }
  //     );

  //     if (!resp.ok) throw new Error("Cannot refresh user");
  //     const data = await resp.json();
  //     saveAuth(token, data.user || data);
  //     return data.user || data;
  //   } catch (err) {
  //     console.warn("refreshUser failed", err);
  //     logout();
  //     return null;
  //   }
  // }, [token, saveAuth, logout]);

  // si besoin → auto refresh / validate token au montage
  // useEffect(() => {
  //   if (token && !user) {
  //     // essayer de récupérer l'utilisateur
  //     refreshUser();
  //   }
  // }, [token, user, refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        token,
        isLoggedIn,
        isAdmin,
        user,
        isAuthenticated: !!token,
        login,
        logout,
        loading,
        // refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
