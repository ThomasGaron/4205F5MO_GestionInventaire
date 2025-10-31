import { useEffect, useState, useContext, useCallback } from "react";
import "./PageInventaire.css";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/auth-context";
import ItemCard from "../components/ItemCard";

export default function PageInventaire() {
  const navigate = useNavigate();
  const { isLoggedIn } = useContext(AuthContext);

  const [items, setItems] = useState([]);

  //  useCallback pour garder la même référence (utile pour passer à ItemCard)
  const getAllItems = useCallback(async () => {
    try {
      const res = await fetch(
        import.meta.env.VITE_BACKEND_URI + "/api/produit/tousLesProduits",
        { method: "GET" }
      );
      const json = await res.json();
      setItems(json.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    getAllItems();
  }, [isLoggedIn, navigate, getAllItems]);

  return (
    <div className="page-inventaire">
      <h1>Inventaire</h1>
      <div className="items-grid">
        {items.length > 0 ? (
          items.map((item) => (
            //  passe la prop onChanged pour rafraîchir sans reload
            <ItemCard key={item.id} item={item} onChanged={getAllItems} />
          ))
        ) : (
          <p>Aucun item en stock</p>
        )}
      </div>
    </div>
  );
}
