import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PageCommandes from "../src/pageCommandes/PageCommandes.jsx";
import { wrapWithProviders } from "./testUtils.jsx";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("PageCommandes - branches manquantes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockReset();
    vi.stubGlobal("alert", vi.fn());
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  it("BadgeStatut: classes livrée / annulée / en-cours", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        // GET commandes
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [
              { id: "c1", client_id: "cl1", statut: "Livrée" },
              { id: "c2", client_id: "cl1", statut: "Annulée" },
              { id: "c3", client_id: "cl1" }, // => En cours
            ],
          }),
        })
        // GET clients (nomClients)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [
              { id: "cl1", client_prenom: "A", client_nom: "B" },
            ],
          }),
        })
    );

    render(
      wrapWithProviders(<PageCommandes />, {
        auth: { isLoggedIn: true, token: "t" },
      })
    );

    expect(await screen.findByText(/Commandes/i)).toBeInTheDocument();

    const pickBadgeEl = (label) => {
      const all = screen.getAllByText(new RegExp(label, "i"));
      return (
        all.find((el) => el.className && el.className.trim().length > 0) ||
        all.find((el) => el.closest("[class]")?.className?.trim()?.length > 0) ||
        all[0]
      );
    };

    const livree = pickBadgeEl("Livrée");
    const annulee = pickBadgeEl("Annulée");
    const encours = pickBadgeEl("En cours");

    const cls = (el) =>
      el.className?.trim()
        ? el.className
        : el.closest("[class]")?.className || "";

    expect(cls(livree)).toMatch(/livree/i);
    expect(cls(annulee)).toMatch(/annulee/i);
    expect(cls(encours)).toMatch(/en-cours/i);
  });

  it("open modal: option client fallback prenom/nom + overlay click ferme", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        // mount: GET commandes
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        })
        // mount: GET clients (nomClients)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        })
        // openModal: GET clients (clients list)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [
              {
                id: "clX",
                client_prenom: "",
                client_nom: "",
              },
            ],
          }),
        })
        // openModal: GET produits
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [
              {
                id: "p1",
                produit_nom: "P",
                produit_prix: 1,
                produit_quantiter: 1,
                disponible: true,
              },
            ],
          }),
        })
    );

    render(
      wrapWithProviders(<PageCommandes />, {
        auth: { isLoggedIn: true, token: "t" },
      })
    );

    fireEvent.click(await screen.findByText(/Ajouter commande/i));

    // option "Client — <id>"
    expect(await screen.findByText(/Client — clX/i)).toBeInTheDocument();

    // overlay click ferme
    const overlay = document.querySelector(".modal-overlay");
    expect(overlay).toBeTruthy();

    fireEvent.click(overlay);

    await waitFor(() => {
      expect(document.querySelector(".modal-overlay")).toBeNull();
    });
  });
});
