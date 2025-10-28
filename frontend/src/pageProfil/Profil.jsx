// src/pageProfil/Profil.jsx
import { AuthContext } from "../context/auth-context";
import { useEffect, useContext, useState } from "react";
import SupprimerUserModal from "../components/modals/SupprimerUserModal";
import { useAlert } from "../context/alert-context";

import "./Profil.css";

export default function Profil() {
  const { token, isAdmin, user: me } = useContext(AuthContext);
  const { setAlert } = useAlert();
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const BASE = import.meta.env.VITE_BACKEND_URI || "";

  useEffect(() => {
    if (isAdmin) fetchUsers();
    // si tu veux afficher le profil courant quand non-admin, tu peux fetch /api/user/profile ici
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(BASE + "/api/user/getTout", {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setUtilisateurs(data.utilisateurs || []);
    } catch (err) {
      console.error("fetchUsers:", err);
      setAlert?.({
        type: "error",
        message: "Impossible de charger les utilisateurs.",
      });
    }
  };

  // ouverture de la modal pour confirmer la suppression
  const openDeleteModal = (user, ev) => {
    if (ev) ev.stopPropagation();
    setSelectedUser(user);
    setShowModal(true);
  };

  // suppression réelle (avec état deleting)
  const handleDelete = async () => {
    if (!selectedUser) return;
    // Empêcher suppression de soi-même (UX) — backend doit aussi vérifier
    if (me && selectedUser.id === me.id) {
      setAlert?.({
        type: "error",
        message: "Vous ne pouvez pas vous supprimer vous-même.",
      });
      setShowModal(false);
      return;
    }

    setDeleting(true);
    const snapshot = [...utilisateurs];

    // optimistic UI : retirer localement
    setUtilisateurs(snapshot.filter((u) => u.id !== selectedUser.id));
    if (selectedUser && selectedUser.id === selectedUser.id)
      setSelectedUser(null);

    try {
      const res = await fetch(BASE + `/api/user/${selectedUser.id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        // rollback
        setUtilisateurs(snapshot);
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${text}`);
      }

      setAlert?.({ type: "success", message: "Utilisateur supprimé." });
      // optionnel : refetch si tu veux récupérer l'état officiel depuis le serveur
      // await fetchUsers();
    } catch (err) {
      console.error("delete error:", err);
      setAlert?.({ type: "error", message: "Erreur lors de la suppression." });
    } finally {
      setDeleting(false);
      setShowModal(false);
      setSelectedUser(null);
    }
  };

  return (
    <div className="profil-container">
      <h1>Gestion des profils</h1>

      {isAdmin ? (
        <div className="profil-list">
          {utilisateurs.length === 0 ? (
            <p>Aucun utilisateur trouvé.</p>
          ) : (
            utilisateurs.map((u) => (
              <div key={u.id} className="profil-card">
                <h3>{u.utilisateur_nom || u.name}</h3>
                <p>Rôle : {u.role || (u.is_admin ? "Admin" : "Utilisateur")}</p>
                <div className="profil-card-actions">
                  <button
                    onClick={(ev) => openDeleteModal(u, ev)}
                    disabled={me && u.id === me.id} // empêche suppression de soi-même côté UI
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <p>Voici vos informations de profil personnelles (non admin).</p>
      )}

      <SupprimerUserModal
        open={showModal}
        title="Confirmer la suppression"
        message={`Voulez-vous vraiment supprimer ${
          selectedUser?.utilisateur_nom || selectedUser?.name || ""
        } ?`}
        onConfirm={handleDelete}
        onCancel={() => {
          setShowModal(false);
          setSelectedUser(null);
        }}
        loading={deleting}
      />
    </div>
  );
}
