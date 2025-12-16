import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PageCommandes from "../src/pageCommandes/PageCommandes.jsx";
import { wrapWithProviders } from "./testUtils.jsx";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("PageCommandes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockReset();
    vi.stubGlobal("alert", vi.fn());
    vi.stubGlobal("confirm", vi.fn(() => true));
    vi.stubGlobal("open", vi.fn());
    // window.open
    window.open = vi.fn();
  });

  it("redirige vers /login si pas connecté", async () => {
    vi.stubGlobal("fetch", vi.fn());
    render(wrapWithProviders(<PageCommandes />, { auth: { isLoggedIn: false } }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("affiche la liste + nom client (connu/inconnu) et ouvre facture", async () => {
    const commandes = [
      { id: "c1", client_id: "cl1", statut: "En cours" },
      { id: "c2", client_id: "clX", statut: "Livrée" },
    ];
    const clients = [
      { id: "cl1", client_prenom: "Jean", client_nom: "Dupont" },
    ];

    const fetchMock = vi
      .fn()
      // GET /commandes
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: commandes }) })
      // GET /clients
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: clients }) });

    vi.stubGlobal("fetch", fetchMock);

    render(wrapWithProviders(<PageCommandes />, { auth: { isLoggedIn: true, token: "t" } }));

    await waitFor(() => {
      expect(screen.getByText(/Commandes/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Jean Dupont/)).toBeInTheDocument();
    expect(screen.getByText(/Client inconnu/)).toBeInTheDocument();

    // télécharger facture
    fireEvent.click(screen.getAllByText(/Télécharger facture/i)[0]);
    expect(window.open).toHaveBeenCalled();
  });

  it("ouvre la modal, sélectionne client/produit, clamp quantité et submit", async () => {
    const commandes = [{ id: "c1", client_id: "cl1", statut: "En cours" }];
    const nomClients = [{ id: "cl1", client_prenom: "A", client_nom: "B" }];
    const clients = [{ id: "cl1", client_prenom: "A", client_nom: "B" }];
    const produits = [
      { id: "p1", produit_nom: "Pomme", produit_quantiter: 2, produit_prix: 3, disponible: true },
    ];

    const fetchMock = vi
      .fn()
      // initial getAllCommandesEtNomClient
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: commandes }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: nomClients }) })
      // openModal loads clients
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: clients }) })
      // openModal loads produits
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: produits }) })
      // POST /commandes
      .mockResolvedValueOnce({ ok: true, json: async () => ({ commande: { id: "cNEW" } }) })
      // refresh after create (getAllCommandesEtNomClient)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: commandes }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: nomClients }) })
      // getCommande(cNEW)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ commande: { id: "cNEW", client_id: "cl1", statut: "En cours" }, lignes: [] }) });

    vi.stubGlobal("fetch", fetchMock);

    render(wrapWithProviders(<PageCommandes />, { auth: { isLoggedIn: true, token: "t" } }));

    await waitFor(() => {
      expect(screen.getByText(/Ajouter commande/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Ajouter commande/i));

    await waitFor(() => {
      expect(screen.getByText(/Nouvelle commande/i)).toBeInTheDocument();
    });

    // choisir client
    fireEvent.change(screen.getByLabelText(/Client/i), { target: { value: "cl1" } });

    // choisir produit
    fireEvent.change(screen.getByLabelText(/^Produit/i), { target: { value: "p1" } });

    // quantite > stock => clamp à 2
    const qtyInput = screen.getByLabelText(/Quantité/i);
    fireEvent.change(qtyInput, { target: { value: "999" } });

    // submit
    fireEvent.click(screen.getByText(/Créer la commande/i));

    await waitFor(() => {
      expect(fetchMock.mock.calls.some((c) => c[1]?.method === "POST")).toBe(true);
    });

    // doit avoir appelé getCommande sur cNEW
    expect(fetchMock.mock.calls.some((c) => String(c[0]).includes("/api/commandes/cNEW"))).toBe(true);
  });

  it("patchStatut error -> alert", async () => {
    const commandes = [{ id: "c1", client_id: "cl1", statut: "En cours" }];
    const clients = [{ id: "cl1", client_prenom: "A", client_nom: "B" }];

    const fetchMock = vi
      .fn()
      // initial loads
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: commandes }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: clients }) })
      // patch statut fail
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "nope" }) });

    vi.stubGlobal("fetch", fetchMock);

    render(wrapWithProviders(<PageCommandes />, { auth: { isLoggedIn: true, token: "t" } }));

    await waitFor(() => {
      expect(screen.getByText(/#c1/i)).toBeInTheDocument();
    });

    const select = screen.getByDisplayValue(/En cours/i);
    fireEvent.change(select, { target: { value: "Livrée" } });

    await waitFor(() => {
      expect(alert).toHaveBeenCalled();
    });
  });

  it("deleteCommande confirm=false -> ne supprime pas", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false));
    const commandes = [{ id: "c1", client_id: "cl1", statut: "En cours" }];
    const clients = [{ id: "cl1", client_prenom: "A", client_nom: "B" }];

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: commandes }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: clients }) });

    vi.stubGlobal("fetch", fetchMock);

    render(wrapWithProviders(<PageCommandes />, { auth: { isLoggedIn: true, token: "t" } }));

    await waitFor(() => {
      expect(screen.getByText(/#c1/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Supprimer/i));
    expect(fetchMock.mock.calls.some((c) => c[1]?.method === "DELETE")).toBe(false);
  });

  it("affiche 'Aucune commande.' quand liste vide", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) }) // commandes
    .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) }); // clients

  vi.stubGlobal("fetch", fetchMock);

  render(wrapWithProviders(<PageCommandes />, { auth: { isLoggedIn: true, token: "t" } }));

  await waitFor(() => {
    expect(screen.getByText(/Aucune commande\./i)).toBeInTheDocument();
  });
});

it("deleteCommande confirm=true + ok => DELETE et carte disparait", async () => {
  vi.stubGlobal("confirm", vi.fn(() => true));

  const commandes = [{ id: "c1", client_id: "cl1", statut: "Annulée", date: "2025-12-01" }];
  const clients = [{ id: "cl1", client_prenom: "A", client_nom: "B" }];

  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ data: commandes }) }) // commandes
    .mockResolvedValueOnce({ ok: true, json: async () => ({ data: clients }) })  // clients
    .mockResolvedValueOnce({ ok: true, text: async () => "" });                  // DELETE

  vi.stubGlobal("fetch", fetchMock);

  render(wrapWithProviders(<PageCommandes />, { auth: { isLoggedIn: true, token: "t" } }));

  await waitFor(() => expect(screen.getByText(/Commandes/i)).toBeInTheDocument());

  // supprimer
  fireEvent.click(screen.getByText(/Supprimer/i));

  await waitFor(() => {
    expect(fetchMock.mock.calls.some((c) => c[1]?.method === "DELETE")).toBe(true);
  });

  await waitFor(() => {
    expect(screen.queryByText(/#c1/i)).toBeNull();
  });
});

it("deleteCommande confirm=true + fail => alert", async () => {
  vi.stubGlobal("confirm", vi.fn(() => true));

  const commandes = [{ id: "c1", client_id: "cl1", statut: "En cours" }];
  const clients = [{ id: "cl1", client_prenom: "A", client_nom: "B" }];

  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ data: commandes }) }) // commandes
    .mockResolvedValueOnce({ ok: true, json: async () => ({ data: clients }) })  // clients
    .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "nope delete" }) }); // DELETE fail

  vi.stubGlobal("fetch", fetchMock);

  render(wrapWithProviders(<PageCommandes />, { auth: { isLoggedIn: true, token: "t" } }));

  await waitFor(() => expect(screen.getByText(/#c1/i)).toBeInTheDocument());

  fireEvent.click(screen.getByText(/Supprimer/i));

  await waitFor(() => {
    expect(alert).toHaveBeenCalled();
  });
});


it("patchStatut OK -> fait un PATCH sans alert", async () => {
  const commandes = [{ id: "c1", client_id: "cl1", statut: "En cours" }];
  const clients = [{ id: "cl1", client_prenom: "A", client_nom: "B" }];

  const fetchMock = vi
    .fn()
    // initial loads
    .mockResolvedValueOnce({ ok: true, json: async () => ({ data: commandes }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ data: clients }) })
    // patch statut ok
    .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });

  vi.stubGlobal("fetch", fetchMock);

  render(wrapWithProviders(<PageCommandes />, { auth: { isLoggedIn: true, token: "t" } }));

  await waitFor(() => expect(screen.getByText(/#c1/i)).toBeInTheDocument());

  const select = screen.getByDisplayValue(/En cours/i);
  fireEvent.change(select, { target: { value: "Livrée" } });

  await waitFor(() => {
    expect(fetchMock.mock.calls.some((c) => c[1]?.method === "PATCH")).toBe(true);
  });

  expect(alert).not.toHaveBeenCalled();
});

it("deleteCommande confirm=true -> DELETE", async () => {
  vi.stubGlobal("confirm", vi.fn(() => true));

  const commandes = [{ id: "c1", client_id: "cl1", statut: "En cours" }];
  const clients = [{ id: "cl1", client_prenom: "A", client_nom: "B" }];

  const fetchMock = vi
    .fn()
    // initial loads
    .mockResolvedValueOnce({ ok: true, json: async () => ({ data: commandes }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ data: clients }) })
    // delete ok
    .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });

  vi.stubGlobal("fetch", fetchMock);

  render(wrapWithProviders(<PageCommandes />, { auth: { isLoggedIn: true, token: "t" } }));

  await waitFor(() => expect(screen.getByText(/#c1/i)).toBeInTheDocument());

  fireEvent.click(screen.getByText(/Supprimer/i));

  await waitFor(() => {
    expect(fetchMock.mock.calls.some((c) => c[1]?.method === "DELETE")).toBe(true);
  });
});


});
