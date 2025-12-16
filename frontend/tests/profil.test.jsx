import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Profil from "../src/pageProfil/Profil.jsx";
import { wrapWithProviders } from "./testUtils.jsx";

describe("Profil", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("non-admin affiche message profil personnel", () => {
    render(
      wrapWithProviders(<Profil />, {
        withAlert: true,
        auth: { isAdmin: false },
      })
    );

    expect(screen.getByText(/non admin/i)).toBeInTheDocument();
  });

  it("admin charge et affiche les utilisateurs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          utilisateurs: [
            { id: "u1", utilisateur_nom: "Alice", role: "admin" },
          ],
        }),
      })
    );

    render(
      wrapWithProviders(<Profil />, {
        withAlert: true,
        auth: { isAdmin: true, token: "t", user: { id: "me" } },
      })
    );

    await waitFor(() => {
      expect(screen.getByText(/Alice/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Rôle/i)).toBeInTheDocument();
  });

  it("empêche suppression de soi-même", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          utilisateurs: [
            { id: "me", utilisateur_nom: "Moi", role: "admin" },
          ],
        }),
      })
    );

    render(
      wrapWithProviders(<Profil />, {
        withAlert: true,
        auth: { isAdmin: true, token: "t", user: { id: "me" } },
      })
    );

    await waitFor(() => {
      expect(screen.getByText(/Moi/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Supprimer/i)).toBeDisabled();
  });

  it("supprime un utilisateur : ouvre modal puis confirm -> DELETE", async () => {
    const fetchMock = vi
      .fn()
      // GET users
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          utilisateurs: [
            { id: "u1", utilisateur_nom: "Bob", role: "user" },
          ],
        }),
      })
      // DELETE ok
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      });

    vi.stubGlobal("fetch", fetchMock);

    render(
      wrapWithProviders(<Profil />, {
        withAlert: true,
        auth: { isAdmin: true, token: "t", user: { id: "me" } },
      })
    );

    await waitFor(() => {
      expect(screen.getByText(/Bob/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Supprimer/i));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/^Confirmer$/i));

    await waitFor(() => {
      const delCall = fetchMock.mock.calls.find(
        (c) => c[1]?.method === "DELETE"
      );
      expect(delCall).toBeTruthy();
    });
  });

  it("delete error -> rollback", async () => {
    const fetchMock = vi
      .fn()
      // GET users
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          utilisateurs: [{ id: "u1", utilisateur_nom: "Bob" }],
        }),
      })
      // DELETE fail
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "boom",
      });

    vi.stubGlobal("fetch", fetchMock);

    render(
      wrapWithProviders(<Profil />, {
        withAlert: true,
        auth: { isAdmin: true, token: "t", user: { id: "me" } },
      })
    );

    await waitFor(() => {
      expect(screen.getByText(/Bob/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Supprimer/i));
    fireEvent.click(screen.getByText(/^Confirmer$/i));

    await waitFor(() => {
      expect(screen.getByText(/Bob/i)).toBeInTheDocument();
    });
  });

  it("annuler suppression -> ferme modal et ne DELETE pas", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        utilisateurs: [
          { id: "u1", utilisateur_nom: "Bob", role: "user" },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      wrapWithProviders(<Profil />, {
        withAlert: true,
        auth: { isAdmin: true, token: "t", user: { id: "me" } },
      })
    );

    await waitFor(() => {
      expect(screen.getByText(/Bob/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Supprimer/i));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Annuler/i })
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    expect(
      fetchMock.mock.calls.some((c) => c[1]?.method === "DELETE")
    ).toBe(false);
  });

  it("admin: si fetchUsers ok mais utilisateurs manquant => affiche 'Aucun utilisateur trouvé'", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ utilisateurs: null }),
      })
    );

    render(
      wrapWithProviders(<Profil />, {
        withAlert: true,
        auth: { isAdmin: true, token: "t", user: { id: "me" } },
      })
    );

    expect(
      await screen.findByText(/Aucun utilisateur trouvé/i)
    ).toBeInTheDocument();
  });

  it("admin: si fetchUsers res.ok=false => déclenche une alerte et liste vide", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ utilisateurs: [{ id: "x" }] }),
      })
    );

    render(
      wrapWithProviders(<Profil />, {
        withAlert: true,
        auth: { isAdmin: true, token: "t", user: { id: "me" } },
      })
    );

    expect(
      await screen.findByText(/Aucun utilisateur trouvé/i)
    ).toBeInTheDocument();
  });

  it("delete: si token vide => pas de header Authorization dans DELETE", async () => {
    const fetchMock = vi
      .fn()
      // GET users
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          utilisateurs: [
            { id: "u1", utilisateur_nom: "Bob", role: "user" },
          ],
        }),
      })
      // DELETE ok
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      });

    vi.stubGlobal("fetch", fetchMock);

    render(
      wrapWithProviders(<Profil />, {
        withAlert: true,
        auth: { isAdmin: true, token: "", user: { id: "me" } },
      })
    );

    await waitFor(() => {
      expect(screen.getByText(/Bob/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Supprimer/i));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Confirmer/i })
    );

    await waitFor(() => {
      const delCall = fetchMock.mock.calls.find(
        (c) => c[1]?.method === "DELETE"
      );
      expect(delCall).toBeTruthy();
      expect(delCall[1]?.headers?.Authorization).toBeUndefined();
    });
  });
});
