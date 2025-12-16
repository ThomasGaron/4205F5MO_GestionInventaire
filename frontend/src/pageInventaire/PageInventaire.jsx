import { useEffect, useState, useContext, useCallback } from "react";
import "./PageInventaire.css";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/auth-context";
import ItemCard from "../components/ItemCard";
import "../Bouton.css";
import LowStockAlert from "../components/LowStockAlert";

export default function PageInventaire() {
  const navigate = useNavigate();
  const { isLoggedIn } = useContext(AuthContext);

  const { token } = useContext(AuthContext);

  const [items, setItems] = useState([]);

  // Modal ajout produit
  const [openAdd, setOpenAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    produit_nom: "",
    produit_prix: 0,
    produit_quantiter: 0,
    disponible: true,
  });

  const backend = import.meta.env.VITE_BACKEND_URI;

  const getAllItems = useCallback(async () => {
    try {
      const res = await fetch(`${backend}/api/produit/tousLesProduits`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      setItems(json.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [backend]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    getAllItems();
  }, [isLoggedIn, navigate, getAllItems]);

  const openModal = () => {
    setForm({
      produit_nom: "",
      produit_prix: 0,
      produit_quantiter: 0,
      disponible: true,
    });
    setOpenAdd(true);
  };

  const closeModal = () => {
    setOpenAdd(false);
    setCreating(false);
  };

  const submitNewProduct = async (e) => {
    e.preventDefault();

    // validation simple
    const nom = String(form.produit_nom || "").trim();
    const prix = Number(form.produit_prix);
    const qty = Number(form.produit_quantiter);

    if (!nom) {
      alert("Le nom du produit est requis.");
      return;
    }
    if (!Number.isFinite(prix) || prix < 0) {
      alert("Le prix doit être un nombre >= 0.");
      return;
    }
    if (!Number.isInteger(qty) || qty < 0) {
      alert("La quantité doit être un entier >= 0.");
      return;
    }

    try {
      setCreating(true);
      // même style que ton contrôleur: POST /api/produit
      const res = await fetch(`${backend}/api/produit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          produit_nom: nom,
          produit_prix: prix,
          produit_quantiter: qty,
          disponible: form.disponible,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Échec de la création.");

      await getAllItems();
      closeModal();
    } catch (err) {
      console.error(err);
      alert(err.message);
      setCreating(false);
    }
  };

  return (
    <div className="page-inventaire">
      <LowStockAlert seuil={5} backendBase={backend} />
      <div className="inventaire-header">
        <h1>Inventaire</h1>
        <button className="btn btn-primary" onClick={openModal}>
          Ajouter un produit
        </button>
      </div>

      <div className="items-grid">
        {items.length > 0 ? (
          items.map((item) => (
            <ItemCard key={item.id} item={item} onChanged={getAllItems} />
          ))
        ) : (
          <p>Aucun item en stock</p>
        )}
      </div>

      {/* Modal ajout produit */}
      {openAdd && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="modal-card">
            <div className="modal-header">
              <h2>Nouveau produit</h2>
              <button className="btn btn-danger" onClick={closeModal}>
                X
              </button>
            </div>

            <form className="add-product-form" onSubmit={submitNewProduct}>
              <label>
                Nom du produit :
                <input
                  type="text"
                  value={form.produit_nom}
                  name="nom"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, produit_nom: e.target.value }))
                  }
                  required
                />
              </label>

              <div className="grid-2">
                <label>
                  Prix ($) :
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="prix"
                    value={form.produit_prix}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, produit_prix: e.target.value }))
                    }
                    required
                  />
                </label>

                <label>
                  Quantité :
                  <input
                    type="number"
                    min="0"
                    name="quant"
                    value={form.produit_quantiter}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        produit_quantiter: e.target.value,
                      }))
                    }
                    required
                  />
                </label>
              </div>

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

              <div
                className="actions-row"
                style={{ justifyContent: "flex-end" }}
              >
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                >
                  {creating ? "Création..." : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
