import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ItemCard from "../src/components/ItemCard.jsx";
import { wrapWithProviders } from "./testUtils.jsx";

describe("ItemCard - more branches", () => {
  const item = { id: "p1", produit_nom: "Pomme", produit_prix: 1.5, produit_quantiter: 2, disponible: true };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.stubGlobal("alert", vi.fn());
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  it("saveChanges: aucun changement -> return (Object.keys(up).length===0) sans fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(wrapWithProviders(<ItemCard item={item} />, { auth: { token: "t" } }));

    fireEvent.click(screen.getByRole("button", { name: /Modifier/i }));
    fireEvent.click(screen.getByRole("button", { name: /Enregistrer/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /Ajouter quantité/i })).toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("removeItem: DELETE ok=false ET res.json() throw -> catch(() => ({})) + alert", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error("json fail");
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    render(wrapWithProviders(<ItemCard item={item} />, { auth: { token: "t" } }));

    fireEvent.click(screen.getByRole("button", { name: /Supprimer/i }));

    await waitFor(() => expect(alert).toHaveBeenCalled());
    expect(fetchMock.mock.calls.some((c) => c[1]?.method === "DELETE")).toBe(true);
  });
});
