import "./ItemCard.css";

export default function ItemCard({ item }) {
  return (
    <div className="item-card">
      <h3>{item.nom}</h3>
      <p>
        <strong>ID:</strong> {item.id}
      </p>
      <p>
        <strong>Quantité:</strong> {item.quantite}
      </p>
      <p>
        <strong>Prix:</strong> {item.prix} $
      </p>
      <p>
        <strong>Description:</strong> {item.description}
      </p>
    </div>
  );
}
