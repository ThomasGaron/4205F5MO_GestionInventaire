import { useEffect, useState, useContext } from "react";
import "./PageCommandes.css";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/auth-context";

export default function PageCommandes() {
  const navigate = useNavigate();
  const { isLoggedIn } = useContext(AuthContext);

  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Modal création
  const [openNew, setOpenNew] = useState(false);
  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);
  const [clientId, setClientId] = useState("");
  const [rows, setRows] = useState([{ produit_id: "", quantite: 1 }]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    getAllCommandes();
  }, [isLoggedIn, navigate]);

  const getAllCommandes = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        import.meta.env.VITE_BACKEND_URI + "/api/commandes",
        { method: "GET" }
      );
      const json = await res.json();
      setCommandes(json.data || []);
    } catch (error) {
      console.error("Erreur chargement commandes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCommande = async (id) => {
    try {
      const res = await fetch(
        import.meta.env.VITE_BACKEND_URI + `/api/commandes/${id}`,
        { method: "GET" }
      );
      const json = await res.json();
      setDetail(json || null);
    } catch (err) {
      console.error("Erreur chargement commande:", err);
      alert("Impossible de charger cette commande.");
    }
  };

  const patchStatut = async (id, statut) => {
    try {
      setUpdatingId(id);
      const res = await fetch(
        import.meta.env.VITE_BACKEND_URI + `/api/commandes/${id}/statut`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statut }),
        }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Échec de mise à jour du statut.");
      }
      setCommandes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, statut } : c))
      );
      if (detail?.commande?.id === id) getCommande(id);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteCommande = async (id) => {
    if (!confirm("Supprimer cette commande ?")) return;
    try {
      setUpdatingId(id);
      const res = await fetch(
        import.meta.env.VITE_BACKEND_URI + `/api/commandes/${id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Échec de suppression.");
      }
      setCommandes((prev) => prev.filter((c) => c.id !== id));
      if (detail?.commande?.id === id) setDetail(null);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Modal création
  const openModal = async () => {
    setOpenNew(true);
    if (clients.length === 0) {
      try {
        const resC = await fetch(
          import.meta.env.VITE_BACKEND_URI + "/api/clients",
          { method: "GET" }
        );
        const jC = await resC.json();
        setClients(jC.data || []);
      } catch (e) {
        console.warn("Impossible de charger les clients.", e);
        setClients([]);
      }
    }
    if (produits.length === 0) {
      try {
        const resP = await fetch(
          import.meta.env.VITE_BACKEND_URI + "/api/produit/tousLesProduits",
          { method: "GET" }
        );
        const jP = await resP.json();
        setProduits(jP.data || []);
      } catch (e) {
        console.error("Impossible de charger les produits", e);
      }
    }
  };

  const closeModal = () => {
    setOpenNew(false);
    setClientId("");
    setRows([{ produit_id: "", quantite: 1 }]);
    setCreating(false);
  };

  const setRowProduit = (idx, produit_id) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, produit_id, quantite: 1 } : r))
    );
  };

  const setRowQuantite = (idx, q) => {
    const row = rows[idx];
    const p = produits.find((x) => x.id === row.produit_id);
    const max = Math.max(0, Number(p?.produit_quantiter || 0));
    const val = Math.max(0, Math.min(Number(q || 0), max));
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, quantite: val } : r))
    );
  };

  const addRow = () =>
    setRows((prev) => [...prev, { produit_id: "", quantite: 1 }]);
  const removeRow = (idx) =>
    setRows((prev) => prev.filter((_, i) => i !== idx));

  const total = rows.reduce((sum, r) => {
    const p = produits.find((x) => x.id === r.produit_id);
    const prix = Number(p?.produit_prix || 0);
    return sum + prix * Number(r.quantite || 0);
  }, 0);

  const canSubmit =
    clientId &&
    rows.length > 0 &&
    rows.every((r) => {
      if (!r.produit_id) return false;
      const p = produits.find((x) => x.id === r.produit_id);
      const stock = Number(p?.produit_quantiter || 0);
      return Number(r.quantite || 0) > 0 && Number(r.quantite) <= stock;
    });

  const submitCommande = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setCreating(true);
      const payload = {
        client_id: clientId,
        items: rows
          .filter((r) => r.produit_id && Number(r.quantite) > 0)
          .map((r) => ({
            produit_id: r.produit_id,
            quantite: Number(r.quantite),
          })),
      };

      const res = await fetch(
        import.meta.env.VITE_BACKEND_URI + "/api/commandes",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Erreur création commande.");

      await getAllCommandes();
      setDetail(null);
      closeModal();

      if (json?.commande?.id) getCommande(json.commande.id);
    } catch (err) {
      console.error(err);
      alert(err.message);
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="page-commandes">
        <h1>Commandes</h1>
        <p>Chargement…</p>
      </div>
    );
  }

  return (
    <div className="page-commandes">
      <h1>Commandes</h1>

      <div className="actions-row" style={{ marginBottom: 14 }}>
        <button className="btn" onClick={openModal}>
          Ajouter commande
        </button>
      </div>

      {openNew && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="modal-card">
            <div className="modal-header">
              <h2>Nouvelle commande</h2>
              <button className="btn btn-danger" onClick={closeModal}>
                X
              </button>
            </div>

            <form className="ajout-commande-form" onSubmit={submitCommande}>
              {clients.length > 0 ? (
                <label>
                  Client :
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="select-statut"
                    required
                  >
                    <option value="">— Sélectionner —</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.client_prenom ? `${c.client_prenom} ` : ""}
                        {c.client_nom || "Client"} — {c.id.slice(0, 8)}…
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label>
                  ID client (UUID) :
                  <input
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="UUID du client"
                    required
                  />
                </label>
              )}

              <div className="rows">
                {rows.map((r, idx) => {
                  const p = produits.find((x) => x.id === r.produit_id);
                  const stock = Number(p?.produit_quantiter || 0);
                  const prix = Number(p?.produit_prix || 0);
                  return (
                    <div className="row-line" key={idx}>
                      <div className="row-prod">
                        <label>
                          Produit :
                          <select
                            value={r.produit_id}
                            onChange={(e) => setRowProduit(idx, e.target.value)}
                            className="select-statut"
                            required
                          >
                            <option value="">— Choisir —</option>
                            {produits
                              .slice()
                              .sort((a, b) => {
                                const da =
                                  Number(a.produit_quantiter || 0) > 0 &&
                                  a.disponible !== false
                                    ? 0
                                    : 1;
                                const db =
                                  Number(b.produit_quantiter || 0) > 0 &&
                                  b.disponible !== false
                                    ? 0
                                    : 1;
                                return da - db;
                              })
                              .map((prod) => {
                                const st = Number(prod.produit_quantiter || 0);
                                const indispo =
                                  st <= 0 || prod.disponible === false;
                                const label = `${prod.produit_nom} (stock: ${st}, ${Number(
                                  prod.produit_prix
                                )} $)${indispo ? " — (épuisé)" : ""}`;
                                return (
                                  <option
                                    key={prod.id}
                                    value={prod.id}
                                    disabled={indispo}
                                  >
                                    {label}
                                  </option>
                                );
                              })}
                          </select>
                        </label>
                      </div>

                      <div className="row-qty">
                        <label>
                          Quantité :
                          <input
                            type="number"
                            min="1"
                            max={stock || 0}
                            value={r.quantite}
                            onChange={(e) =>
                              setRowQuantite(idx, e.target.value)
                            }
                            disabled={!r.produit_id}
                          />
                          {r.produit_id && <small>max: {stock}</small>}
                        </label>
                      </div>

                      <div className="row-sub">
                        <span>Sous-total:</span>
                        <strong>
                          {(prix * Number(r.quantite || 0)).toFixed(2)} $
                        </strong>
                      </div>

                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => removeRow(idx)}
                        disabled={rows.length === 1}
                      >
                        Retirer
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="actions-row">
                <button type="button" className="btn" onClick={addRow}>
                  + Ajouter un produit
                </button>
              </div>

              <div className="total-box">
                <span>Total:</span>
                <strong>{total.toFixed(2)} $</strong>
              </div>

              <div className="actions-row" style={{ justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  className="btn"
                  disabled={!canSubmit || creating}
                >
                  {creating ? "Création..." : "Créer la commande"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detail && (
        <div className="commande-card commande-detail">
          <div className="commande-header">
            <h3>Commande {detail?.commande?.id?.slice(0, 8)}…</h3>
            <BadgeStatut statut={detail?.commande?.statut || "En cours"} />
          </div>
          <div className="commande-infos">
            <p><strong>Client:</strong> {detail?.commande?.client_id}</p>
            {"date" in (detail?.commande || {}) && (
              <p><strong>Date:</strong> {detail?.commande?.date}</p>
            )}
            {"total" in (detail?.commande || {}) && (
              <p><strong>Total:</strong> {Number(detail?.commande?.total || 0)} $</p>
            )}
          </div>
          <ul className="commande-lignes">
            {(detail?.lignes || []).map((l) => (
              <li key={l.produit_id}>
                {l.produit_id} — qté: {l.commande_produit_quantite} × {l.prix_unitaire} $
              </li>
            ))}
          </ul>
          <div className="actions-row">
            <button className="btn" onClick={() => setDetail(null)}>Fermer</button>
          </div>
        </div>
      )}

      <div className="commandes-grid">
        {commandes.length === 0 ? (
          <p>Aucune commande.</p>
        ) : (
          commandes.map((c) => (
            <div className="commande-card" key={c.id}>
              <div className="commande-header">
                <h3>#{c.id.slice(0, 8)}…</h3>
                <BadgeStatut statut={c.statut || "En cours"} />
              </div>

              <div className="commande-infos">
                <p><strong>Client:</strong> {c.client_id}</p>
                {"date" in c && <p><strong>Date:</strong> {c.date}</p>}
              </div>

              <div className="actions-row">
                <button className="btn btn-info" onClick={() => getCommande(c.id)}>
                  Voir
                </button>

                <select
                  className="select-statut"
                  value={c.statut || "En cours"}
                  onChange={(e) => patchStatut(c.id, e.target.value)}
                  disabled={updatingId === c.id}
                >
                  <option>En cours</option>
                  <option>Livrée</option>
                  <option>Annulée</option>
                </select>

                <button
                  className="btn btn-danger"
                  onClick={() => deleteCommande(c.id)}
                  disabled={updatingId === c.id}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function BadgeStatut({ statut }) {
  const s = (statut || "").toLowerCase();
  const cls =
    s.includes("livr") ? "badge livree" :
    s.includes("annul") ? "badge annulee" : "badge en-cours";
  return <span className={cls}>{statut}</span>;
}
