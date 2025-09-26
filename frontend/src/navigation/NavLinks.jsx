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
        {/* Bouton logout seulement affiché si connecté*/}
        <Link to="/login">
          {auth.isLoggedIn && (
            <button className="bouton" onClick={auth.logout}>
              Déconnexion
            </button>
          )}
        </Link>

        {/* Lien page acceuil */}
        <li>
          <NavLink to="/acceuil">
            <h2>Acceuil</h2>
          </NavLink>
        </li>

        {/** Si pas connecté -> lien vers connexion */}
        {!auth.isLoggedIn && (
          <>
            <li>
              <NavLink to="/login">
                <h2>Connexion</h2>
              </NavLink>
            </li>
          </>
        )}
      </ul>
      {/** Pour afficher les sous routes */}
      <Outlet />
    </>
  );
}
