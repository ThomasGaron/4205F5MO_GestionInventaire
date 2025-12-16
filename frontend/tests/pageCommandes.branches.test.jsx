import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PageCommandes from "../src/pageCommandes/PageCommandes.jsx";
import { wrapWithProviders } from "./testUtils.jsx";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("PageCommandes - more branches", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    mockNavigate.mockReset();
    vi.stubGlobal("alert", vi.fn());
  });

  it("submitCommande: POST ok=false -> alert (branche !res.ok)", async () => {
    const fetchMock = vi.fn(async (url, options) => {
      const u = String(url);

      // useEffect (liste commandes)
      if (u.includes("/api/commandes") && (!options || !options.method || options.method === "GET")) {
        return { ok: true, json: async () => ({ data: [] }) };
      }

      // useEffect (nomClients)
      if (u.includes("/api/clients") && (!options || !options.method || options.method === "GET")) {
        // retourne 1 client pour avoir le <select> (branche clients.length > 0)
        return { ok: true, json: async () => ({ data: [{ id: "cl1", client_prenom: "A", client_nom: "B" }] }) };
      }

      // openModal produits
      if (u.includes("/api/produit/tousLesProduits")) {
        return {
          ok: true,
          json: async () => ({
            data: [{ id: "p1", produit_nom: "Pomme", produit_quantiter: 5, produit_prix: 2, disponible: true }],
          }),
        };
      }

      // submitCommande POST FAIL
      if (u.includes("/api/commandes") && options?.method === "POST") {
        return { ok: false, json: async () => ({ error: "boom" }) };
      }

      return { ok: true, json: async () => ({}) };
    });

    vi.stubGlobal("fetch", fetchMock);

    render(wrapWithProviders(<PageCommandes />, { auth: { isLoggedIn: true, token: "t" } }));

    // ouvre modal
    fireEvent.click(await screen.findByRole("button", { name: /Ajouter commande/i }));
    await screen.findByText(/Nouvelle commande/i);

    await waitFor(() => {
      expect(screen.getAllByRole("combobox").length).toBeGreaterThan(1);
    });

    const combos = screen.getAllByRole("combobox");
    fireEvent.change(combos[0], { target: { value: "cl1" } });
    fireEvent.change(combos[1], { target: { value: "p1" } });

    // submit
    fireEvent.click(
     screen.getByRole("button", { name: /Créer la commande/i })
     );


    await waitFor(() => expect(alert).toHaveBeenCalled());
    expect(String(alert.mock.calls[0][0]).toLowerCase()).toContain("boom");
  });

  it("openModal: produits fetch rejeté -> modal s'ouvre quand même (branche catch)", async () => {
    const fetchMock = vi.fn(async (url, options) => {
      const u = String(url);

      if (u.includes("/api/commandes") && (!options || !options.method || options.method === "GET")) {
        return { ok: true, json: async () => ({ data: [] }) };
      }

      if (u.includes("/api/clients") && (!options || !options.method || options.method === "GET")) {
        return { ok: true, json: async () => ({ data: [{ id: "cl1", client_prenom: "A", client_nom: "B" }] }) };
      }

      // produits FAIL => catch "Impossible de charger les produits"
      if (u.includes("/api/produit/tousLesProduits")) {
        throw new Error("fail produits");
      }

      return { ok: true, json: async () => ({}) };
    });

    vi.stubGlobal("fetch", fetchMock);

    render(wrapWithProviders(<PageCommandes />, { auth: { isLoggedIn: true, token: "t" } }));

    fireEvent.click(await screen.findByRole("button", { name: /Ajouter commande/i }));
    await screen.findByText(/Nouvelle commande/i);

    // il y a quand même le select Produit, même si liste vide
    const combos = screen.getAllByRole("combobox");
    expect(combos.length).toBeGreaterThanOrEqual(1);
  });

  it("modal: si clients=[] -> affiche le champ ID client (UUID) (branche else)", async () => {
  const fetchMock = vi.fn(async (url, options) => {
    const u = String(url);

    if (u.includes("/api/commandes") && (!options || !options.method || options.method === "GET"))
      return { ok: true, json: async () => ({ data: [] }) };

    // nomClients OK (useEffect)
    if (u.includes("/api/clients") && (!options || !options.method || options.method === "GET"))
      return { ok: true, json: async () => ({ data: [] }) };

    // produits OK (openModal)
    if (u.includes("/api/produit/tousLesProduits"))
      return { ok: true, json: async () => ({ data: [] }) };

    return { ok: true, json: async () => ({}) };
  });

  vi.stubGlobal("fetch", fetchMock);

  render(wrapWithProviders(<PageCommandes />, { auth: { isLoggedIn: true, token: "t" } }));

  fireEvent.click(await screen.findByRole("button", { name: /Ajouter commande/i }));
  await screen.findByText(/Nouvelle commande/i);

  expect(screen.getByText(/ID client \(UUID\)/i)).toBeInTheDocument();
});

});
