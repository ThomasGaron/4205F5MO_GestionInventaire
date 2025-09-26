import "./ItemCard.css";

export default function ItemCard({ item }) {
  return (
    <div className="item-card">
      <h3>{item.produit_nom}</h3>
      <p>
        <strong>ID:</strong> {item.id}
      </p>
      <p>
        <strong>Prix:</strong> {item.produit_prix} $
      </p>
      <p>
        <strong>Quantité:</strong> {item.produit_quantiter}
      </p>
    </div>
  );
}
