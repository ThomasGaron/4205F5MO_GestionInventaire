import { useEffect, useMemo, useState } from "react";
import "./LowStockAlert.css";

export default function LowStockAlert({ seuil = 5, backendBase }) {
  const [loading, setLoading] = useState(true);
  const [produits, setProduits] = useState([]);
  const [hiddenBatchKey, setHiddenBatchKey] = useState(null);

  const backend = backendBase || import.meta.env.VITE_BACKEND_URI;

  // clé d'ack stockée en localStorage pour masquer après "Confirmer"
  const batchKey = useMemo(() => `lowstock_ack_${seuil}`, [seuil]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${backend}/api/produit/faible-stock?seuil=${seuil}`, { method: "GET" });
        const json = await res.json();
        if (!mounted) return;
        const list = Array.isArray(json?.data) ? json.data : [];
        setProduits(list);
        // si un ack existe mais ne correspond plus (restock), on l’ignorera
        const saved = localStorage.getItem(batchKey);
        setHiddenBatchKey(saved || null);
      } catch (e) {
        console.error("LowStockAlert fetch error:", e);
        setProduits([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [backend, seuil, batchKey]);

  // Si l’utilisateur a déjà confirmé ce batch exact, on masque
  // On calcule un "hash" simple basé sur id:qty pour invalider l’ack dès que le stock change.
  const currentKey = useMemo(() => {
    const sig = produits
      .map((p) => `${p.id}:${Number(p.produit_quantiter || 0)}`)
      .sort()
      .join("|");
    return `${batchKey}:${sig}`;
  }, [batchKey, produits]);

  // Si pas de produits ou en chargement, ne rien afficher
  if (loading || produits.length === 0) return null;

  if (hiddenBatchKey && hiddenBatchKey === currentKey) {
    return null;
  }

  const onConfirm = () => {
    localStorage.setItem(batchKey, currentKey);
    setHiddenBatchKey(currentKey);
  };

  return (
    <div className="lowstock-overlay">
      <div className="lowstock-card">
        <div className="lowstock-header">
          <h3>Stock faible</h3>
        </div>

        <p className="lowstock-desc">
          Les produits suivants sont à ≤ {seuil} en stock. Veuillez réapprovisionner.
        </p>

        <ul className="lowstock-list">
          {produits.map((p) => (
            <li key={p.id} className="lowstock-item">
              <div className="lowstock-line">
                <span className="name">{p.produit_nom}</span>
                <span className="qty">Qté: {Number(p.produit_quantiter || 0)}</span>
                <span className="price">{Number(p.produit_prix || 0).toFixed(2)} $</span>
              </div>
            </li>
          ))}
        </ul>

        <div className="lowstock-actions">
          <button className="btn" onClick={onConfirm}>Confirmer</button>
        </div>
      </div>
    </div>
  );
}
