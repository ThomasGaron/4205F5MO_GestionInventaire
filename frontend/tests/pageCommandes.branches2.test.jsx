import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PageCommandes from "../src/pageCommandes/PageCommandes.jsx";
import { wrapWithProviders } from "./testUtils.jsx";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("PageCommandes - branches supplémentaires", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    mockNavigate.mockReset();
    vi.stubGlobal("alert", vi.fn());
    vi.stubGlobal("confirm", vi.fn(() => true));
    vi.stubGlobal("open", vi.fn());
    vi.stubGlobal("window", window);
    window.open = vi.fn();
  });

  it("deleteCommande: confirm=false -> return (aucun DELETE)", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false));

    const fetchMock = vi.fn(async (url, options) => {
      const u = String(url);

      if (u.includes("/api/commandes") && (!options || options.method === "GET")) {
        return {
          ok: true,
          json: async () => ({ data: [{ id: "c1", client_id: "clX", statut: "En cours" }] }),
        };
      }
      if (u.includes("/api/clients") && (!options || options.method === "GET")) {
        return { ok: true, json: async () => ({ data: [] }) };
      }

      return { ok: true, json: async () => ({}) };
    });

    vi.stubGlobal("fetch", fetchMock);

    render(wrapWithProviders(<PageCommandes />, { auth: { isLoggedIn: true, token: "t" } }));

    await screen.findByText(/Client inconnu/i);

    fireEvent.click(screen.getByRole("button", { name: /Supprimer/i }));

    expect(fetchMock.mock.calls.some((c) => c[1]?.method === "DELETE")).toBe(false);
  });

  it("patchStatut: ok=true -> met à jour le statut + badge (livrée)", async () => {
    const fetchMock = vi.fn(async (url, options) => {
      const u = String(url);

      if (u.includes("/api/commandes") && (!options || options.method === "GET")) {
        return {
          ok: true,
          json: async () => ({ data: [{ id: "c1", client_id: "cl1", statut: "En cours" }] }),
        };
      }
      if (u.includes("/api/clients") && (!options || options.method === "GET")) {
        return { ok: true, json: async () => ({ data: [{ id: "cl1", client_prenom: "A", client_nom: "B" }] }) };
      }

      if (u.includes("/api/commandes/c1/statut") && options?.method === "PATCH") {
        return { ok: true, json: async () => ({}) };
      }

      return { ok: true, json: async () => ({}) };
    });

    vi.stubGlobal("fetch", fetchMock);

    render(wrapWithProviders(<PageCommandes />, { auth: { isLoggedIn: true, token: "t" } }));

    await screen.findByText(/Client nom/i);

    const statutSelect = screen.getByDisplayValue(/En cours/i);
    fireEvent.change(statutSelect, { target: { value: "Livrée" } });

    await waitFor(() => {
      expect(fetchMock.mock.calls.some((c) => c[1]?.method === "PATCH")).toBe(true);
    });

    await waitFor(() => {
      const badge = screen.getAllByText(/Livrée/i)[0];
      expect(badge.className).toContain("livree");
    });
  });

 it("getCommande: fetch throw -> catch (console.error) et la page reste stable", async () => {
  const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  const fetchMock = vi.fn(async (url, options) => {
    const u = String(url);

    // liste commandes (OK)
    if (u.includes("/api/commandes") && (!options || options.method === "GET") && !u.includes("c1")) {
      return {
        ok: true,
        json: async () => ({ data: [{ id: "c1", client_id: "cl1", statut: "En cours" }] }),
      };
    }

    // clients (OK)
    if (u.includes("/api/clients") && (!options || options.method === "GET")) {
      return { ok: true, json: async () => ({ data: [] }) };
    }

    if (u.includes("/api/commandes") && u.includes("c1") && (!options || options.method === "GET")) {
      throw new Error("boom");
    }

    return { ok: true, json: async () => ({}) };
  });

  vi.stubGlobal("fetch", fetchMock);

  render(wrapWithProviders(<PageCommandes />, { auth: { isLoggedIn: true, token: "t" } }));

  const voirBtn = await screen.findByRole("button", { name: /Voir/i });
  fireEvent.click(voirBtn);

  
  await waitFor(() => expect(consoleSpy).toHaveBeenCalled());

  expect(screen.getByRole("button", { name: /Voir/i })).toBeInTheDocument();

  consoleSpy.mockRestore();
});



  it("openModal: clients fetch fail -> catch => clients=[] -> champ UUID affiché", async () => {
    const fetchMock = vi.fn(async (url, options) => {
      const u = String(url);

      if (u.includes("/api/commandes") && (!options || options.method === "GET")) {
        return { ok: true, json: async () => ({ data: [] }) };
      }

      if (u.includes("/api/clients") && (!options || options.method === "GET")) {
        throw new Error("fail clients");
      }

      if (u.includes("/api/produit/tousLesProduits")) {
        return { ok: true, json: async () => ({ data: [] }) };
      }

      return { ok: true, json: async () => ({}) };
    });

    vi.stubGlobal("fetch", fetchMock);

    render(wrapWithProviders(<PageCommandes />, { auth: { isLoggedIn: true, token: "t" } }));

    fireEvent.click(await screen.findByRole("button", { name: /Ajouter commande/i }));
    await screen.findByText(/Nouvelle commande/i);

    expect(screen.getByText(/ID client \(UUID\)/i)).toBeInTheDocument();
  });

  it("setRowQuantite: clamp à stock max + canSubmit devient true", async () => {
    const fetchMock = vi.fn(async (url, options) => {
      const u = String(url);

      if (u.includes("/api/commandes") && (!options || options.method === "GET")) {
        return { ok: true, json: async () => ({ data: [] }) };
      }

      if (u.includes("/api/clients") && (!options || options.method === "GET")) {
        return { ok: true, json: async () => ({ data: [{ id: "cl1", client_prenom: "A", client_nom: "B" }] }) };
      }

      if (u.includes("/api/produit/tousLesProduits")) {
        return {
          ok: true,
          json: async () => ({
            data: [{ id: "p1", produit_nom: "Pomme", produit_quantiter: 2, produit_prix: 5, disponible: true }],
          }),
        };
      }

      return { ok: true, json: async () => ({}) };
    });

    vi.stubGlobal("fetch", fetchMock);

    render(wrapWithProviders(<PageCommandes />, { auth: { isLoggedIn: true, token: "t" } }));

    fireEvent.click(await screen.findByRole("button", { name: /Ajouter commande/i }));
    await screen.findByText(/Nouvelle commande/i);

    const combos = screen.getAllByRole("combobox");
    fireEvent.change(combos[0], { target: { value: "cl1" } });

    const combos2 = screen.getAllByRole("combobox");
    fireEvent.change(combos2[1], { target: { value: "p1" } });

    const qtyInput = screen.getByRole("spinbutton", { name: /Quantité/i });
    fireEvent.change(qtyInput, { target: { value: "99" } });

    await waitFor(() => {
      expect(String(qtyInput.value)).toBe("2");
    });

    const submitBtn = screen.getByRole("button", { name: /Créer la commande/i });
    expect(submitBtn).not.toBeDisabled();
  });
});
