import { useState } from "react";
import "./ItemCard.css";

export default function ItemCard({ item, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [addingQty, setAddingQty] = useState(false);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    produit_nom: item.produit_nom || "",
    produit_prix: Number(item.produit_prix || 0),
    produit_quantiter: Number(item.produit_quantiter || 0),
    disponible: Boolean(item.disponible ?? true),
  });

  const [addQty, setAddQty] = useState(1);

  const backend = import.meta.env.VITE_BACKEND_URI;

  /* ---------- MODIFIER (PATCH) ---------- */
  const saveChanges = async () => {
    try {
      setBusy(true);
      const up = {};
      if (form.produit_nom !== item.produit_nom) up.produit_nom = form.produit_nom;
      if (Number(form.produit_prix) !== Number(item.produit_prix))
        up.produit_prix = Number(form.produit_prix);
      if (Number(form.produit_quantiter) !== Number(item.produit_quantiter))
        up.produit_quantiter = Number(form.produit_quantiter);
      if (Boolean(form.disponible) !== Boolean(item.disponible))
        up.disponible = Boolean(form.disponible);

      if (Object.keys(up).length === 0) {
        setEditing(false);
        return;
      }

      const res = await fetch(`${backend}/api/produit/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(up),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Échec de la mise à jour.");

      setEditing(false);
      onChanged?.();
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  /* ---------- AJOUTER QUANTITÉ (PATCH inline) ---------- */
  const submitAddQty = async () => {
    const add = Number(addQty);
    if (!Number.isFinite(add) || add <= 0) {
      alert("Quantité invalide.");
      return;
    }
    try {
      setBusy(true);
      const newQty = Number(item.produit_quantiter || 0) + add;
      const res = await fetch(`${backend}/api/produit/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produit_quantiter: newQty,
          disponible: newQty > 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Échec d'ajout de quantité.");

      setAddingQty(false);
      setAddQty(1);
      onChanged?.();
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  /* ---------- SUPPRIMER (DELETE) ---------- */
  const removeItem = async () => {
    if (!confirm(`Supprimer le produit "${item.produit_nom}" ?`)) return;
    try {
      setBusy(true);
      const res = await fetch(`${backend}/api/produit/${item.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Échec de suppression.");
      onChanged?.();
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="item-card">
      <h3 className="item-title">{item.produit_nom}</h3>

      {/* Affichage normal */}
      {!editing && !addingQty && (
        <>
          <p><strong className="lbl">Prix :</strong> {Number(item.produit_prix).toFixed(2)} $</p>
          <p><strong className="lbl">Quantité :</strong> {Number(item.produit_quantiter || 0)}</p>
          <p><strong className="lbl">Disponible :</strong> {item.disponible ? "Oui" : "Non"}</p>
        </>
      )}

      {/* Mode édition (modifier) */}
      {editing && (
        <div className="edit-grid">
          <label>
            <span className="lbl">Nom :</span>
            <input
              type="text"
              value={form.produit_nom}
              onChange={(e) => setForm((f) => ({ ...f, produit_nom: e.target.value }))}
            />
          </label>
          <label>
            <span className="lbl">Prix :</span>
            <input
              type="number"
              step="0.01"
              value={form.produit_prix}
              onChange={(e) => setForm((f) => ({ ...f, produit_prix: e.target.value }))}
            />
          </label>
          <label>
            <span className="lbl">Quantité :</span>
            <input
              type="number"
              min="0"
              value={form.produit_quantiter}
              onChange={(e) => setForm((f) => ({ ...f, produit_quantiter: e.target.value }))}
            />
          </label>
          <label className="chk">
            <input
              type="checkbox"
              checked={form.disponible}
              onChange={(e) => setForm((f) => ({ ...f, disponible: e.target.checked }))}
            />
            <span>Disponible</span>
          </label>

          <div className="actions actions--edit">
            <button className="btn" onClick={saveChanges} disabled={busy}>
              Enregistrer
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                setEditing(false);
                setForm({
                  produit_nom: item.produit_nom || "",
                  produit_prix: Number(item.produit_prix || 0),
                  produit_quantiter: Number(item.produit_quantiter || 0),
                  disponible: Boolean(item.disponible ?? true),
                });
              }}
              disabled={busy}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Mode ajout quantité (inline) */}
      {addingQty && !editing && (
        <div className="addqty-box">
          <label>
            <span className="lbl">Ajouter quantité :</span>
            <input
              type="number"
              min="1"
              value={addQty}
              onChange={(e) => setAddQty(e.target.value)}
            />
          </label>
          <div className="actions actions--edit">
            <button className="btn" onClick={submitAddQty} disabled={busy}>
              Enregistrer
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                setAddingQty(false);
                setAddQty(1);
              }}
              disabled={busy}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Boutons principaux : toujours sur une seule ligne */}
      {!editing && !addingQty && (
        <div className="actions actions--row">
          <button className="btn" onClick={() => setAddingQty(true)} disabled={busy}>
            Ajouter quantité
          </button>
          <button className="btn btn-info" onClick={() => setEditing(true)} disabled={busy}>
            Modifier
          </button>
          <button className="btn btn-danger" onClick={removeItem} disabled={busy}>
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
}
