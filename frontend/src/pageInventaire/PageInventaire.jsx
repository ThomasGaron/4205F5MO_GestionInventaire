import { useEffect } from "react";
import "./PageInventaire.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { useInventaire } from "../context/InventaireContext";
import { useAlert } from "../context/AlertContext";
import { getAllItems } from "../api/inventaireApi";
import ItemCard from "../components/ItemCard";

export default function PageInventaire() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { items, setItems } = useInventaire();
  const { setAlert } = useAlert();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    // Charger les items depuis l’API
    getAllItems()
      .then((data) => {
        setItems(data);
      })
      .catch((err) => {
        setAlert("Erreur lors du chargement des items : " + err.message);
      });
  }, [isLoggedIn, navigate, setItems, setAlert]);

  return (
    <div className="page-inventaire">
      <h1>Inventaire</h1>
      <div className="items-grid">
        {items && items.length > 0 ? (
          items.map((item) => <ItemCard key={item.id} item={item} />)
        ) : (
          <p>Aucun item en stock</p>
        )}
      </div>
    </div>
  );
}
