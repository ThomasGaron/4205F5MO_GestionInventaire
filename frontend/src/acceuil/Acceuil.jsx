// frontend/src/accueil/Acceuil.jsx
import React from "react";
import "./Acceuil.css";
import "../Bouton.css";
import "../theme.css";
import logo from "/src/images/warehouse1.jpg";

export default function Acceuil() {
  return (
    <div className="acceuil-container">
      <header>
        <img src={logo} alt="Logo compagnie" className="acceuil-logo" />
        <h1 className="acceuil-titre">
          Bienvenue sur votre Gestionnaire d'Inventaire
        </h1>
        <p className="acceuil-subtitle">
          Simplifiez la gestion de vos produits, stocks et équipes avec notre
          plateforme performante, fiable et intuitive.
        </p>
        <button className="acceuil-button">Découvrir la plateforme</button>
      </header>

      <section className="features-section">
        <div className="feature-item">
          <div className="feature-icon">📦</div>
          <div>Suivi de stocks en temps réel</div>
        </div>
        <div className="feature-item">
          <div className="feature-icon">🔒</div>
          <div>Sécurité et confidentialité</div>
        </div>
        <div className="feature-item">
          <div className="feature-icon">🤝</div>
          <div>Soutien personnalisé</div>
        </div>
      </section>

      <section className="testimonial-section">
        <h3 className="testimonial-title">+500 entreprises partenaires</h3>
        <p className="testimonial-text">
          “Une plateforme intuitive et efficace !” — Témoignage client
        </p>
      </section>
    </div>
  );
}
