import "./Header.css";

export default function Header() {
  return (
    <header className="header">
      <nav className="nav">
        <a href="/" className="nav-btn">
          Accueil
        </a>
        <a href="/inventaire" className="nav-btn">
          Inventaire
        </a>
        <a href="/produits" className="nav-btn">
          Produits
        </a>
        <a href="/clients" className="nav-btn">
          Clients
        </a>
      </nav>
    </header>
  );
}
