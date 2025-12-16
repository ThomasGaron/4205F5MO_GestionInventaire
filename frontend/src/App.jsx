import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { useCallback, useState, useEffect } from "react";
import NavLinks from "./navigation/NavLinks";
import Acceuil from "./acceuil/Acceuil";
import LoginForm from "./loginForm/LoginForm";
import ErrorPage from "./pageErreur/PageErreur";
import PageInventaire from "./pageInventaire/PageInventaire";
import { AuthContext } from "./context/auth-context";
import { AlertProvider } from "./context/alert-context";
import SignUp from "./signUpForm/SignUp";

import "./App.css";
import Profil from "./pageProfil/Profil";
import PageCommandes from "./pageCommandes/PageCommandes";
import LowStockAlert from "./components/LowStockAlert";

function decodeToken(jwt) {
  try {
    if (!jwt) return null;
    const parts = jwt.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
    return decoded;
  } catch (err) {
    console.warn("decodeToken failed:", err);
    return null;
  }
}

function App() {
  const tokenFromStorage = localStorage.getItem("token");
  const [token, setToken] = useState(tokenFromStorage || null);
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(tokenFromStorage));
  const [isAdmin, setIsAdmin] = useState(false);

  const login = useCallback((newToken) => {
    if (!newToken) return;
    setToken(newToken);
    localStorage.setItem("token", newToken);
    setIsLoggedIn(true);

    const payload = decodeToken(newToken);
    if (payload && (payload.role === "admin" || payload.is_admin === true)) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
    localStorage.removeItem("token");
  }, []);

  useEffect(() => {
    if (token && !isAdmin) {
      const payload = decodeToken(token);
      if (payload && (payload.role === "admin" || payload.is_admin === true)) {
        setIsAdmin(true);
      }
    }
    setIsLoggedIn(Boolean(token));
  }, [token, isAdmin]);

  // ----- ROUTES -----
  const baseChildren = [
    { path: "", element: <Acceuil /> },
    { path: "/acceuil", element: <Acceuil /> },
  ];

  const authedChildren = [
    { path: "/login", element: <Navigate to="/acceuil" replace /> },
    { path: "/inventaire", element: <PageInventaire /> },
    { path: "/profil", element: <Profil /> },
    { path: "/commandes", element: <PageCommandes /> },
  ];

  const buildRouter = (children) =>
    createBrowserRouter([
      {
        path: "/",
        element: <NavLinks />,
        errorElement: <ErrorPage />,
        children,
      },
    ]);

  const routerPublic = buildRouter([
    ...baseChildren,
    { path: "/login", element: <LoginForm /> },
  ]);

  const routerUser = buildRouter([...baseChildren, ...authedChildren]);

  const routerAdmin = buildRouter([
    ...baseChildren,
    ...authedChildren,
    { path: "/signUp", element: <SignUp /> },
  ]);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        login,
        logout,
        isAdmin,
        token,
      }}
    >
      <AlertProvider>
        <LowStockAlert seuil={5} />
        <RouterProvider
          router={isLoggedIn ? (isAdmin ? routerAdmin : routerUser) : routerPublic}
        />
      </AlertProvider>
    </AuthContext.Provider>
  );
}

export default App;
