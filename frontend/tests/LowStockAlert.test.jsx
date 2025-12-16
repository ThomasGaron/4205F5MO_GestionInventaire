import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import LowStockAlert from "../src/components/LowStockAlert.jsx";
import { AuthContext } from "../src/context/auth-context.jsx";

describe("LowStockAlert", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    delete globalThis.fetch;
  });

  it("affiche 'Stock faible' et la liste quand API retourne des produits", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { produit_id: 1, produit_nom: "Clavier", produit_quantiter: 2 },
          { produit_id: 2, produit_nom: "Souris", produit_quantiter: 1 },
        ],
      }),
    });

    render(
      <AuthContext.Provider value={{ token: "TOKEN" }}>
        <LowStockAlert seuil={5} backendBase="http://localhost:5000" />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/stock faible/i)).toBeInTheDocument();
      expect(screen.getByText(/clavier/i)).toBeInTheDocument();
      expect(screen.getByText(/souris/i)).toBeInTheDocument();
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

 it("clic 'Confirmer' masque l'alerte", async () => {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      data: [{ produit_id: 1, produit_nom: "Clavier", produit_quantiter: 2 }],
    }),
  });

  render(
    <AuthContext.Provider value={{ token: "TOKEN" }}>
      <LowStockAlert seuil={5} backendBase="http://localhost:5000" />
    </AuthContext.Provider>
  );

  // 1) l’alerte apparaît
  await waitFor(() => {
    expect(screen.getByText(/stock faible/i)).toBeInTheDocument();
  });

  // 2) clic sur Confirmer
  const btn = screen.getByRole("button", { name: /confirmer/i });
  fireEvent.click(btn);

  // 3) l’alerte disparaît
  await waitFor(() => {
    expect(screen.queryByText(/stock faible/i)).not.toBeInTheDocument();
  });
});

});

