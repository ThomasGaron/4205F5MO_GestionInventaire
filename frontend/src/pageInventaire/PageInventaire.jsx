import { useEffect, useState } from "react";
import "./PageInventaire.css";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/auth-context";
import { useContext } from "react";
import ItemCard from "../components/ItemCard";

export default function PageInventaire() {
  const navigate = useNavigate();
  const { isLoggedIn } = useContext(AuthContext);

  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    getAllItems();
  }, [isLoggedIn, navigate]);

  const getAllItems = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/produit/tousLesProduits",
        {
          method: "GET",
        }
      );
      const json = await res.json();
      console.log("API data:", json);

      // Supabase renvoie { data: [...] }
      setItems(json.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div className="page-inventaire">
      <h1>Inventaire</h1>
      <div className="items-grid">
        {items.length > 0 ? (
          items.map((item) => <ItemCard key={item.id} item={item} />)
        ) : (
          <p>Aucun item en stock</p>
        )}
      </div>
    </div>
  );
}
