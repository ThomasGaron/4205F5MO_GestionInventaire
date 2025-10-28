import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { useCallback, useState } from "react";
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

function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch {
    return null;
  }
}

function App() {
  // lecture directe du token brut
  const tokenExist = localStorage.getItem("token");
  const parsedToken = tokenExist ? JSON.parse(tokenExist) : null;

  // décodage du token JWT (si présent)
  const payload = parsedToken ? decodeToken(parsedToken) : null;

  // initialisation de l'état à partir du payload
  const [token, setToken] = useState(parsedToken);
  const [isLoggedIn, setIsLoggedIn] = useState(!!parsedToken);
  const [isAdmin, setIsAdmin] = useState(
    !!(payload && (payload.role === "admin" || payload.is_admin))
  );

  // Fonctions de connexion
  const login = useCallback((newToken) => {
    if (!newToken) return;
    setToken(newToken);
    setIsLoggedIn(true);

    const payload = decodeToken(newToken);
    setIsAdmin(!!(payload && (payload.role === "admin" || payload.is_admin)));
    localStorage.setItem("token", JSON.stringify(newToken));
    localStorage.setItem("statutConnexion", JSON.stringify(true));
  }, []);

  const admin = useCallback(() => {
    setIsAdmin(true);
  });

  const logout = useCallback(() => {
    setToken(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
  }, []);

  // Routes connecté
  const routerLogin = createBrowserRouter([
    {
      path: "/",
      element: <NavLinks />,
      errorElement: <ErrorPage />,
      children: [
        { path: "", element: <Acceuil /> },
        { path: "/login", element: <Navigate to="/acceuil" replace /> },
        { path: "/acceuil", element: <Acceuil /> },
        { path: "/inventaire", element: <PageInventaire /> },
        { path: "/profil", element: <Profil /> },
      ],
    },
  ]);

  // Routes connecte avec admin

  const routerLoginAdmin = createBrowserRouter([
    {
      path: "/",
      element: <NavLinks />,
      errorElement: <ErrorPage />,
      children: [
        { path: "", element: <Acceuil /> },
        { path: "/login", element: <Navigate to="/acceuil" replace /> },
        { path: "/acceuil", element: <Acceuil /> },
        { path: "/inventaire", element: <PageInventaire /> },
        { path: "/signUp", element: <SignUp /> },
        { path: "/profil", element: <Profil /> },
      ],
    },
  ]);

  // Routes pas connecté
  const router = createBrowserRouter([
    {
      path: "/",
      element: <NavLinks />,
      errorElement: <ErrorPage />,
      children: [
        { path: "", element: <Acceuil /> },
        { path: "/acceuil", element: <Acceuil /> },
        { path: "/login", element: <LoginForm /> },
      ],
    },
  ]);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: isLoggedIn,
        login: login,
        logout: logout,
        admin: admin,
        isAdmin: isAdmin,
        token: token,
      }}
    >
      <AlertProvider>
        <RouterProvider
          router={
            isLoggedIn
              ? isAdmin
                ? routerLoginAdmin // si connecté ET admin
                : routerLogin // si connecté ET non admin
              : router // si non connecté
          }
        />
      </AlertProvider>
    </AuthContext.Provider>
  );
}

export default App;
