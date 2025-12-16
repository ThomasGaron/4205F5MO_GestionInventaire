import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import Header from "../src/components/Header.jsx";

describe("Header", () => {
  it("affiche les liens de navigation attendus", () => {
    render(<Header />);

    expect(screen.getByRole("link", { name: /accueil/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /inventaire/i })).toHaveAttribute("href", "/inventaire");
    expect(screen.getByRole("link", { name: /produits/i })).toHaveAttribute("href", "/produits");
    expect(screen.getByRole("link", { name: /clients/i })).toHaveAttribute("href", "/clients");
  });
});
