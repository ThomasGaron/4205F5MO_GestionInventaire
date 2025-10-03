import { useContext } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { AuthContext } from "../context/auth-context";
import "./NavLinks.css";
import Footer from "../components/Footer";

export default function NavLinks() {
  // Récupère les infos du contexte (loggedin, logout ...)
  const auth = useContext(AuthContext);

  return (
    <>
      <header className="header">
        <h1 className="logo">Gestion d'inventaire</h1>
        <nav>
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
                  <NavLink to="/profil">Mon Profil</NavLink>
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
              <NavLink to="/acceuil">Acceuil</NavLink>
            </li>

            {/** Si pas connecté -> lien vers connexion */}
            {!auth.isLoggedIn && (
              <li>
                <NavLink to="/login">Connexion</NavLink>
              </li>
            )}
          </ul>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      {/** Pour afficher les sous routes */}

      <Footer />
    </>
  );
}
