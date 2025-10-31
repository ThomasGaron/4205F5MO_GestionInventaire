import { useContext } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/auth-context";
import "./NavLinks.css";
import Footer from "../components/Footer";

export default function NavLinks() {
  // Récupère les infos du contexte (loggedin, logout ...)
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.logout(); // efface le token, etc.
    navigate("/acceuil", { replace: true }); // redirige toujours vers /acceuil
  };

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
                  <NavLink to="/inventaire">Inventaire</NavLink>
                </li>
                <li>
                  <NavLink to="/commandes">Commandes</NavLink>
                </li>
                <li>
                  <NavLink to="/profil">Profil</NavLink>
                </li>
              </>
            )}

            {auth.isAdmin && (
              <li>
                <NavLink to="/signUp">Créer un compte</NavLink>
              </li>
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
            {auth.isLoggedIn && (
              <li>
                <button className="bouton" onClick={handleLogout}>
                  Déconnexion
                </button>
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
