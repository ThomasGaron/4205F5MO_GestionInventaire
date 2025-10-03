import "./ItemCard.css";

export default function ItemCard({ item }) {
  return (
    <div className="item-card">
      <h3 className="item-title">{item.produit_nom}</h3>
      <div className="item-details">
        <p className="detail">
          <span className="label">ID :</span> {item.id}
        </p>
        <p className="detail">
          <span className="label">Prix :</span> {item.produit_prix} $
        </p>
        <p className="detail">
          <span className="label">Quantité :</span> {item.produit_quantiter}
        </p>
      </div>
    </div>
  );
}
