import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PageInventaire from "../src/pageInventaire/PageInventaire.jsx";
import { wrapWithProviders } from "./testUtils.jsx";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("PageInventaire", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    mockNavigate.mockReset();
    vi.stubGlobal("alert", vi.fn());
  });

  it("redirige vers /login si pas connecté", async () => {
    render(wrapWithProviders(<PageInventaire />, { auth: { isLoggedIn: false } }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("charge et affiche les items", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "1",
              produit_nom: "Pomme",
              produit_prix: 1.1,
              produit_quantiter: 2,
              disponible: true,
            },
          ],
        }),
      })
    );

    render(
      wrapWithProviders(<PageInventaire />, {
        auth: { isLoggedIn: true, token: "t" },
      })
    );

    const pommes = await screen.findAllByText(/Pomme/i);
    expect(pommes.length).toBeGreaterThan(0);
  });

  it("ajouter produit : validations + création ok", async () => {
    const fetchMock = vi.fn(async (_url, options) => {
      if (options?.method === "POST") {
        return { ok: true, json: async () => ({ id: "x" }) };
      }

      fetchMock._countGet = (fetchMock._countGet || 0) + 1;
      if (fetchMock._countGet === 1) {
        return { ok: true, json: async () => ({ data: [] }) };
      }

      return {
        ok: true,
        json: async () => ({
          data: [
            {
              id: "1",
              produit_nom: "Banane",
              produit_prix: 2,
              produit_quantiter: 3,
              disponible: true,
            },
          ],
        }),
      };
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      wrapWithProviders(<PageInventaire />, {
        auth: { isLoggedIn: true, token: "t" },
      })
    );

    fireEvent.click(await screen.findByText(/Ajouter un produit/i));
    await screen.findByRole("button", { name: /^Créer$/i });

    fireEvent.change(screen.getByLabelText(/Nom du produit/i), {
      target: { value: "Banane" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: /Prix/i }), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: /Quantité/i }), {
      target: { value: "3" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Créer$/i }));

    const bananes = await screen.findAllByText(/Banane/i);
    expect(bananes.length).toBeGreaterThan(0);
    expect(fetchMock.mock.calls.some((c) => c[1]?.method === "POST")).toBe(true);
  });

  it("validation: nom vide -> alert et pas de POST", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(wrapWithProviders(<PageInventaire />, { auth: { isLoggedIn: true, token: "t" } }));

    fireEvent.click(await screen.findByText(/Ajouter un produit/i));
    await screen.findByText(/Nouveau produit/i);

    fireEvent.change(screen.getByLabelText(/Nom du produit/i), {
      target: { value: "   " },
    });

    fireEvent.submit(screen.getByText(/Nom du produit/i).closest("form"));

    await waitFor(() => expect(alert).toHaveBeenCalled());
    expect(fetchMock.mock.calls.some((c) => c[1]?.method === "POST")).toBe(false);
  });

  it("validation: prix négatif -> alert et pas de POST", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(wrapWithProviders(<PageInventaire />, { auth: { isLoggedIn: true, token: "t" } }));

    fireEvent.click(await screen.findByText(/Ajouter un produit/i));
    await screen.findByText(/Nouveau produit/i);

    fireEvent.change(screen.getByLabelText(/Nom du produit/i), {
      target: { value: "Banane" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: /Quantité/i }), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: /Prix/i }), {
      target: { value: "-1" },
    });

    fireEvent.submit(screen.getByText(/Nom du produit/i).closest("form"));

    await waitFor(() => expect(alert).toHaveBeenCalled());
    expect(fetchMock.mock.calls.some((c) => c[1]?.method === "POST")).toBe(false);
  });

  it("validation: quantité non-entière -> alert et pas de POST", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(wrapWithProviders(<PageInventaire />, { auth: { isLoggedIn: true, token: "t" } }));

    fireEvent.click(await screen.findByText(/Ajouter un produit/i));
    await screen.findByText(/Nouveau produit/i);

    fireEvent.change(screen.getByLabelText(/Nom du produit/i), {
      target: { value: "Banane" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: /Prix/i }), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: /Quantité/i }), {
      target: { value: "1.5" },
    });

    fireEvent.submit(screen.getByText(/Nom du produit/i).closest("form"));

    await waitFor(() => expect(alert).toHaveBeenCalled());
    expect(fetchMock.mock.calls.some((c) => c[1]?.method === "POST")).toBe(false);
  });

  it("création: POST ok=false -> branche !res.ok + catch -> alert", async () => {
    const fetchMock = vi.fn(async (_url, options) => {
      if (!options || options.method === "GET") {
        return { ok: true, json: async () => ({ data: [] }) };
      }
      return { ok: false, json: async () => ({ error: "nope" }) };
    });

    vi.stubGlobal("fetch", fetchMock);

    render(wrapWithProviders(<PageInventaire />, { auth: { isLoggedIn: true, token: "t" } }));

    fireEvent.click(await screen.findByText(/Ajouter un produit/i));
    await screen.findByText(/Nouveau produit/i);

    fireEvent.change(screen.getByLabelText(/Nom du produit/i), { target: { value: "Banane" } });
    fireEvent.change(screen.getByRole("spinbutton", { name: /Prix/i }), { target: { value: "2" } });
    fireEvent.change(screen.getByRole("spinbutton", { name: /Quantité/i }), { target: { value: "3" } });

    fireEvent.submit(screen.getByText(/Nom du produit/i).closest("form"));

    await waitFor(() => expect(alert).toHaveBeenCalled());
  });
});
