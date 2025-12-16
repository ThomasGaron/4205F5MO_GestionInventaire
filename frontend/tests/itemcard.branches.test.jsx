import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PageCommandes from "../src/pageCommandes/PageCommandes.jsx";
import { wrapWithProviders } from "./testUtils.jsx";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("PageCommandes - branches", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    mockNavigate.mockReset();
    vi.stubGlobal("alert", vi.fn());
    vi.stubGlobal("confirm", vi.fn(() => true));
    vi.stubGlobal("open", vi.fn());
  });

  it("getCommande success: affiche detail avec Date/Total/Lignes (branches 'in')", async () => {
    const commandes = [{ id: "c1", client_id: "cl1", statut: "En cours" }];
    const clients = [{ id: "cl1", client_prenom: "A", client_nom: "B" }];

    const fetchMock = vi
      .fn()
      // useEffect: commandes + clients
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: commandes }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: clients }) })
      // click "Voir": /api/commandes/:id
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          commande: { id: "c1", statut: "En cours", client_id: "cl1", date: "2025-12-01", total: 12.34 },
          lignes: [{ produit_id: "p1", commande_produit_quantite: 2, prix_unitaire: 6.17 }],
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(wrapWithProviders(<PageCommandes />, { auth: { isLoggedIn: true, token: "t" } }));

    await waitFor(() => expect(screen.getByText(/#c1/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /Voir/i }));
    await waitFor(() => expect(screen.getAllByText(/Commande/i).length).toBeGreaterThan(0));
    expect(screen.getByText(/Date:/i)).toBeInTheDocument();
    expect(screen.getByText(/Total:/i)).toBeInTheDocument();
    expect(screen.getByText(/p1/i)).toBeInTheDocument();
  });

  it("patchStatut success ET detail ouvert -> déclenche PATCH + refresh getCommande()", async () => {
    const commandes = [{ id: "c1", client_id: "cl1", statut: "En cours" }];
    const clients = [{ id: "cl1", client_prenom: "A", client_nom: "B" }];

    const fetchMock = vi
      .fn()
      // useEffect: commandes + clients
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: commandes }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: clients }) })
      // open detail
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ commande: { id: "c1", statut: "En cours", client_id: "cl1" }, lignes: [] }),
      })
      // PATCH statut ok
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
      // refresh detail after patchStatut (branche: if detail?.commande?.id === id)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ commande: { id: "c1", statut: "Livrée", client_id: "cl1" }, lignes: [] }),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(wrapWithProviders(<PageCommandes />, { auth: { isLoggedIn: true, token: "t" } }));

    await waitFor(() => expect(screen.getByText(/#c1/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Voir/i }));
    await waitFor(() =>expect(screen.getAllByText(/Commande/i).length).toBeGreaterThan(0));

    const select = screen.getByDisplayValue(/En cours/i);
    fireEvent.change(select, { target: { value: "Livrée" } });

    await waitFor(() => {
      expect(fetchMock.mock.calls.some((c) => c[1]?.method === "PATCH")).toBe(true);
    });
    await waitFor(() => expect(screen.getAllByText(/Livrée/i).length).toBeGreaterThan(0));
  });

  it("openModal: clients fetch FAIL -> affiche champ 'ID client (UUID)' (branche catch + fallback)", async () => {
    const commandes = [{ id: "c1", client_id: "cl1", statut: "En cours" }];
    const clientsNom = [{ id: "cl1", client_prenom: "A", client_nom: "B" }];

    const fetchMock = vi
      .fn()
      // useEffect: commandes + clients (nomClients)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: commandes }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: clientsNom }) })
      // openModal: /api/clients FAIL -> catch -> setClients([])
      .mockRejectedValueOnce(new Error("fail clients"))
      // openModal: /api/produit/tousLesProduits OK
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ id: "p1", produit_nom: "Pomme", produit_quantiter: 3, produit_prix: 1, disponible: true }],
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(wrapWithProviders(<PageCommandes />, { auth: { isLoggedIn: true, token: "t" } }));

    await waitFor(() => expect(screen.getByText(/Commandes/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Ajouter commande/i }));

    await waitFor(() => expect(screen.getByText(/Nouvelle commande/i)).toBeInTheDocument());
    expect(screen.getByText(/ID client \(UUID\)/i)).toBeInTheDocument();
  });

  it("setRowQuantite clamp: qty > stock -> value devient stock", async () => {
    const commandes = [];
    const clientsNom = [];

    const fetchMock = vi
      .fn()
      // useEffect
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: commandes }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: clientsNom }) })
      // openModal clients OK (mais vide -> fallback)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
      // openModal produits OK
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ id: "p1", produit_nom: "Pomme", produit_quantiter: 3, produit_prix: 1, disponible: true }],
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(wrapWithProviders(<PageCommandes />, { auth: { isLoggedIn: true, token: "t" } }));

    await waitFor(() => expect(screen.getByText(/Commandes/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /Ajouter commande/i }));

    await waitFor(() => expect(screen.getByText(/Nouvelle commande/i)).toBeInTheDocument());

    // choisir produit
    const selectProduit = screen.getAllByRole("combobox")[0];
    fireEvent.change(selectProduit, { target: { value: "p1" } });

    // qty input > stock => clamp à 3
    const qtyInput = screen.getByRole("spinbutton");
    fireEvent.change(qtyInput, { target: { value: "99" } });

    await waitFor(() => {
      expect(qtyInput.value).toBe("3");
    });
  });
});
