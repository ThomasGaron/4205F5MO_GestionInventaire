import { render, screen } from "@testing-library/react";
import Header from "../src/components/Header.jsx";

describe("Header", () => {
  it("affiche les liens de navigation principaux", () => {
    render(<Header />);

    expect(screen.getByText(/Accueil/i)).toBeInTheDocument();
    expect(screen.getByText(/Inventaire/i)).toBeInTheDocument();
    expect(screen.getByText(/Produits/i)).toBeInTheDocument();
    expect(screen.getByText(/Clients/i)).toBeInTheDocument();
  });
});
