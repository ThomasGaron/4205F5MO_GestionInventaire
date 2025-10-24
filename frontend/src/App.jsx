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

function App() {
  // état de la connexion
  const connecter = localStorage.getItem("statutConnexion");
  const [isLoggedIn, setIsLoggedIn] = useState(
    connecter ? JSON.parse(connecter) : false
  );

  const tokenExist = localStorage.getItem("token");
  const [token, setToken] = useState(
    tokenExist ? JSON.parse(tokenExist) : null
  );

  const [isAdmin, setIsAdmin] = useState(false);

  // Fonctions de connexion
  const login = useCallback((token) => {
    setToken(token);
    setIsLoggedIn(true);
  }, []);

  const admin = useCallback(() => {
    setIsAdmin(true);
  });

  const logout = useCallback(() => {
    setToken(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
  }, []);

  // Stockage, sauvegarde local storage
  useEffect(() => {
    localStorage.setItem("statutConnexion", JSON.stringify(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem("token", JSON.stringify(token));
  }, [token]);

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
      <RouterProvider
        router={
          isLoggedIn
            ? isAdmin
              ? routerLoginAdmin // si connecté ET admin
              : routerLogin // si connecté ET non admin
            : router // si non connecté
        }
      />
    </AuthContext.Provider>
  );
}

export default App;
