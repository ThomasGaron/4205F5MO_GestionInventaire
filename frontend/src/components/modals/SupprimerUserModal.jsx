import React from "react";
import "../Bouton.css";
import "../theme.css";

export default function SupprimerUserModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}) {
  if (!open) return null;
  return (
    <div
      className="su-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="su-title"
    >
      <div className="su-modal">
        <h2 id="su-title" className="su-title">
          {title || "Confirmer"}
        </h2>
        <p className="su-message">
          {message || "Êtes-vous sûr de vouloir continuer ?"}
        </p>
        <div className="su-actions">
          <button
            type="button"
            className="su-btn su-btn-cancel"
            onClick={onCancel}
          >
            Annuler
          </button>
          <button
            type="button"
            className="su-btn su-btn-confirm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Suppression..." : "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
}
