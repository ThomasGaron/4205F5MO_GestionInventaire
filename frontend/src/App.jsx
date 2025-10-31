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
    // si le token n'est pas un JWT valide, on renvoie null
    console.warn("decodeToken failed:", err);
    return null;
  }
}

function App() {
  // --- initial load : lire token et statut depuis localStorage (si présent) ---
  const tokenFromStorage = localStorage.getItem("token"); // token stocké comme string
  const [token, setToken] = useState(tokenFromStorage || null);

  // isLoggedIn peut être dérivé du token (presence), on garde un état pour la logique UI
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(tokenFromStorage));

  // isAdmin : soit décodé depuis le token, soit défini après appel /me
  const [isAdmin, setIsAdmin] = useState(false);

  /* ---------- fonctions auth ---------- */

  // login : recevoir un token (string). Optionnel : on peut aussi accepter "user" object.
  // on stocke token, on met isLoggedIn true et on calcule isAdmin depuis le token.
  const login = useCallback((newToken) => {
    if (!newToken) return;
    setToken(newToken);
    localStorage.setItem("token", newToken);
    setIsLoggedIn(true);

    // si le token contient un role/is_admin dans son payload, on peut le récupérer :
    const payload = decodeToken(newToken);
    if (payload) {
      // adapt selon ton payload : payload.role === "admin" ou payload.is_admin === true
      if (payload.role === "admin" || payload.is_admin === true) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } else {
      // si token non décodable, tu peux appeler /me pour récupérer le user et son role
      setIsAdmin(false);
    }
  }, []);

  // logout : efface tout
  const logout = useCallback(() => {
    setToken(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
    localStorage.removeItem("token");
  }, []);

  useEffect(() => {
    // Au montage, si on a un token mais pas de statut admin renseigné, on le détermine
    if (token && !isAdmin) {
      const payload = decodeToken(token);
      if (payload) {
        if (payload.role === "admin" || payload.is_admin === true)
          setIsAdmin(true);
      }
    }

    // synchroniser isLoggedIn au cas où tokenFromStorage existe
    setIsLoggedIn(Boolean(token));
  }, [token, isAdmin]);

  /* ---------- ROUTES ---------- */

  // Routes pour utilisateur connecté (non-admin)
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
        { path: "/commandes", element: <PageCommandes /> },

      ],
    },
  ]);

  // Routes pour admin connecté
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
        { path: "/commandes", element: <PageCommandes /> },
      ],
    },
  ]);

  // Routes public (non connecté)
  const router = createBrowserRouter([
    {
      path: "/",
      element: <NavLinks />,
      errorElement: <ErrorPage />,
      children: [
        { path: "", element: <Acceuil /> },
        { path: "/acceuil", element: <Acceuil /> },
        { path: "/login", element: <LoginForm /> }, // LoginForm devrait appeler login(token)
      ],
    },
  ]);

  /* ---------- CONTEXT PROVIDER ---------- */
  // token, login, logout et isAdmin pour que les pages puissent s'en servir.
  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: isLoggedIn,
        login: login,
        logout: logout,
        isAdmin: isAdmin,
        token: token,
      }}
    >
      <AlertProvider>
        <RouterProvider
          router={
            isLoggedIn ? (isAdmin ? routerLoginAdmin : routerLogin) : router
          }
        />
      </AlertProvider>
    </AuthContext.Provider>
  );
}

export default App;
