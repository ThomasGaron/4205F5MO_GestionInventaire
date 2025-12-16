import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Footer from "../src/components/Footer.jsx";
import ItemCard from "../src/components/ItemCard.jsx";
import LowStockAlert from "../src/components/LowStockAlert.jsx";
import SupprimerUserModal from "../src/components/modals/SupprimerUserModal.jsx";
import { wrapWithProviders } from "./testUtils.jsx";

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
  vi.stubGlobal("alert", vi.fn());
  vi.stubGlobal("confirm", vi.fn(() => true));
});

describe("Footer", () => {
  it("affiche le copyright et le lien mentions", () => {
    render(<Footer />);
    expect(screen.getByText(/Gestion d'inventaire/i)).toBeInTheDocument();
    expect(screen.getByText(/Mentions légales/i)).toBeInTheDocument();
  });
});

describe("SupprimerUserModal", () => {
  it("retourne null si open=false", () => {
    const { container } = render(
      <SupprimerUserModal open={false} title="t" message="m" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("affiche les boutons et l'état loading", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    const { rerender } = render(
      <SupprimerUserModal
        open
        title="Confirmer"
        message="Supprimer?"
        onCancel={onCancel}
        onConfirm={onConfirm}
        loading={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Annuler/i }));
    expect(onCancel).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Confirmer/i }));
    expect(onConfirm).toHaveBeenCalled();

    rerender(
      <SupprimerUserModal
        open
        title="Confirmer"
        message="Supprimer?"
        onCancel={onCancel}
        onConfirm={onConfirm}
        loading={true}
      />
    );

    expect(
      screen.getByRole("button", { name: /Suppression/i })
    ).toBeDisabled();
  });
});

describe("ItemCard", () => {
  const item = {
    id: "p1",
    produit_nom: "Pomme",
    produit_prix: 2.5,
    produit_quantiter: 3,
    disponible: true,
  };

  it("affiche les infos de base", () => {
    render(wrapWithProviders(<ItemCard item={item} />));
    expect(screen.getByText("Pomme")).toBeInTheDocument();
    expect(screen.getByText(/Prix/i)).toBeInTheDocument();
    expect(screen.getByText("Quantité :")).toBeInTheDocument();
  });

  it("mode modifier: aucun changement => ne fetch pas", async () => {
    vi.stubGlobal("fetch", vi.fn());
    render(wrapWithProviders(<ItemCard item={item} />));

    fireEvent.click(screen.getByRole("button", { name: /Modifier/i }));
    fireEvent.click(screen.getByRole("button", { name: /Enregistrer/i }));

    expect(fetch).not.toHaveBeenCalled();
  });

  it("mode modifier: changement => PATCH puis onChanged", async () => {
    const onChanged = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    }));

    render(wrapWithProviders(<ItemCard item={item} onChanged={onChanged} />));

    fireEvent.click(screen.getByRole("button", { name: /Modifier/i }));
    fireEvent.change(screen.getByLabelText(/Nom/i), {
      target: { value: "Pomme verte" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enregistrer/i }));

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(onChanged).toHaveBeenCalled();
  });

  it("ajout quantité invalide => alert", async () => {
    render(wrapWithProviders(<ItemCard item={item} />));
    fireEvent.click(screen.getByRole("button", { name: /Ajouter quantité/i }));
    fireEvent.change(screen.getByLabelText(/Ajouter quantité/i), {
      target: { value: 0 },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enregistrer/i }));
    expect(alert).toHaveBeenCalled();
  });

  it("supprimer: confirm=false => ne fetch pas", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false));
    vi.stubGlobal("fetch", vi.fn());

    render(wrapWithProviders(<ItemCard item={item} />));
    fireEvent.click(screen.getByRole("button", { name: /Supprimer/i }));

    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("LowStockAlert", () => {
  it("affiche la carte si produits <= seuil et se masque après confirmer", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { id: "p1", produit_nom: "A", produit_quantiter: 2, produit_prix: 1 },
          { id: "p2", produit_nom: "B", produit_quantiter: 5, produit_prix: 2 },
        ],
      }),
    }));

    render(wrapWithProviders(<LowStockAlert seuil={5} backendBase="http://x" />));

    // attendre affichage
    await screen.findByText(/Stock faible/i);
    expect(screen.getByText(/A/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Confirmer/i }));

    await waitFor(() => {
      expect(screen.queryByText(/Stock faible/i)).toBeNull();
    });
  });

  it("ne rend rien si aucun produit", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    }));

    const { container } = render(
      wrapWithProviders(<LowStockAlert seuil={5} backendBase="http://x" />)
    );

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});
