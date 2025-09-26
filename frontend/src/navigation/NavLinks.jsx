import { useContext } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { AuthContext } from "../context/auth-context";
import "./NavLinks.css";

export default function NavLinks() {
  // Récupère les infos du contexte (loggedin, logout ...)
  const auth = useContext(AuthContext);

  return (
    <>
      <h1>Gestion d'inventaire</h1>
      <ul className="affichage-navigation">
        {/* Si connecté */}
        {auth.isLoggedIn && (
          <>
            <li>
              <NavLink to="/inventaire">
                <h2>Inventaire</h2>
              </NavLink>
            </li>
            <li>
              <NavLink to="/profil">
                <h2>Mon Profil</h2>
              </NavLink>
            </li>
            <li>
              <button className="bouton" onClick={auth.logout}>
                Déconnexion
              </button>
            </li>
          </>
        )}

        {/* Lien page acceuil */}
        <li>
          <NavLink to="/acceuil">
            <h2>Acceuil</h2>
          </NavLink>
        </li>

        {/** Si pas connecté -> lien vers connexion */}
        {!auth.isLoggedIn && (
          <li>
            <NavLink to="/login">
              <h2>Connexion</h2>
            </NavLink>
          </li>
        )}
      </ul>
      {/** Pour afficher les sous routes */}
      <Outlet />
    </>
  );
}
