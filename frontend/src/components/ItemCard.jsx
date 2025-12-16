import { useState, useContext, useCallback } from "react";
import "./ItemCard.css";
import "../Bouton.css";
import { AuthContext } from "../context/auth-context";

function LabeledInput({ label, type = "text", value, onChange, min, step }) {
  return (
    <label>
      <span className="lbl">{label}</span>
      <input type={type} value={value} onChange={onChange} min={min} step={step} />
    </label>
  );
}

function ActionButtons({ onPrimary, onCancel, primaryLabel, busy }) {
  return (
    <div className="actions actions--edit">
      <button className="btn btn-primary" onClick={onPrimary} disabled={busy}>
        {primaryLabel}
      </button>
      <button className="btn btn-danger" onClick={onCancel} disabled={busy}>
        Annuler
      </button>
    </div>
  );
}

export default function ItemCard({ item, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [addingQty, setAddingQty] = useState(false);
  const [busy, setBusy] = useState(false);

  const { token } = useContext(AuthContext);

  const [form, setForm] = useState({
    produit_nom: item.produit_nom || "",
    produit_prix: Number(item.produit_prix || 0),
    produit_quantiter: Number(item.produit_quantiter || 0),
    disponible: Boolean(item.disponible ?? true),
  });

  const [addQty, setAddQty] = useState(1);

  const backend = import.meta.env.VITE_BACKEND_URI;

  const resetForm = useCallback(() => {
    setForm({
      produit_nom: item.produit_nom || "",
      produit_prix: Number(item.produit_prix || 0),
      produit_quantiter: Number(item.produit_quantiter || 0),
      disponible: Boolean(item.disponible ?? true),
    });
  }, [item]);

  const buildPayloadDiff = useCallback(() => {
    const up = {};
    if (form.produit_nom !== item.produit_nom) up.produit_nom = form.produit_nom;
    if (Number(form.produit_prix) !== Number(item.produit_prix))
      up.produit_prix = Number(form.produit_prix);
    if (Number(form.produit_quantiter) !== Number(item.produit_quantiter))
      up.produit_quantiter = Number(form.produit_quantiter);
    if (Boolean(form.disponible) !== Boolean(item.disponible))
      up.disponible = Boolean(form.disponible);
    return up;
  }, [form, item]);

  const doFetch = useCallback(
    async (path, init) => {
      const res = await fetch(`${backend}${path}`, {
        headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
        ...init,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Opération impossible.");
      return json;
    },
    [backend]
  );

  const saveChanges = async () => {
    const up = buildPayloadDiff();
    if (Object.keys(up).length === 0) {
      setEditing(false);
      return;
    }
    try {
      setBusy(true);
      await doFetch(`/api/produit/${item.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(up),
      });
      setEditing(false);
      onChanged?.();
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const submitAddQty = async () => {
    const add = Number(addQty);
    if (!Number.isFinite(add) || add <= 0) {
      alert("Quantité invalide.");
      return;
    }
    try {
      setBusy(true);
      const newQty = Number(item.produit_quantiter || 0) + add;
      await doFetch(`/api/produit/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          produit_quantiter: newQty,
          disponible: newQty > 0,
        }),
      });
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

  const removeItem = async () => {
    if (!confirm(`Supprimer le produit "${item.produit_nom}" ?`)) return;
    try {
      setBusy(true);
      await doFetch(`/api/produit/${item.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
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

      {!editing && !addingQty && (
        <>
          <p>
            <strong className="lbl">Prix :</strong>{" "}
            {Number(item.produit_prix).toFixed(2)} $
          </p>
          <p>
            <strong className="lbl">Quantité :</strong>{" "}
            {Number(item.produit_quantiter || 0)}
          </p>
          <p>
            <strong className="lbl">Disponible :</strong>{" "}
            {item.disponible ? "Oui" : "Non"}
          </p>
        </>
      )}

      {editing && (
        <div className="edit-grid">
          <LabeledInput
            label="Nom :"
            value={form.produit_nom}
            onChange={(e) => setForm((f) => ({ ...f, produit_nom: e.target.value }))}
          />
          <LabeledInput
            label="Prix :"
            type="number"
            step="0.01"
            value={form.produit_prix}
            onChange={(e) => setForm((f) => ({ ...f, produit_prix: e.target.value }))}
          />
          <LabeledInput
            label="Quantité :"
            type="number"
            min="0"
            value={form.produit_quantiter}
            onChange={(e) =>
              setForm((f) => ({ ...f, produit_quantiter: e.target.value }))
            }
          />
          <label className="chk">
            <input
              type="checkbox"
              checked={form.disponible}
              onChange={(e) =>
                setForm((f) => ({ ...f, disponible: e.target.checked }))
              }
            />
            <span>Disponible</span>
          </label>

          <ActionButtons
            onPrimary={saveChanges}
            primaryLabel="Enregistrer"
            onCancel={() => {
              setEditing(false);
              resetForm();
            }}
            busy={busy}
          />
        </div>
      )}

      {addingQty && !editing && (
        <div className="addqty-box">
          <LabeledInput
            label="Ajouter quantité :"
            type="number"
            min="1"
            value={addQty}
            onChange={(e) => setAddQty(e.target.value)}
          />
          <ActionButtons
            onPrimary={submitAddQty}
            primaryLabel="Enregistrer"
            onCancel={() => {
              setAddingQty(false);
              setAddQty(1);
            }}
            busy={busy}
          />
        </div>
      )}

      {!editing && !addingQty && (
        <div className="actions actions--row">
          <button
            className="btn btn-primary"
            onClick={() => setAddingQty(true)}
            disabled={busy}
          >
            Ajouter quantité
          </button>
          <button
            className="btn btn-info"
            onClick={() => setEditing(true)}
            disabled={busy}
          >
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
