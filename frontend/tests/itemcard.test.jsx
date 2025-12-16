import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ItemCard from "../src/components/ItemCard.jsx";
import { wrapWithProviders } from "./testUtils.jsx";

const baseItem = {
  id: "p1",
  produit_nom: "Pomme",
  produit_prix: 1.5,
  produit_quantiter: 2,
  disponible: true,
};

describe("ItemCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("alert", vi.fn());
    vi.stubGlobal("confirm", vi.fn(() => true));
    vi.stubGlobal("fetch", vi.fn());
  });

  it("affiche les infos du produit", () => {
    render(
      wrapWithProviders(<ItemCard item={baseItem} />, { auth: { token: "t" } })
    );
    expect(screen.getByText(/Pomme/i)).toBeInTheDocument();
    expect(screen.getByText(/Prix/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Quantité/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Disponible/i)).toBeInTheDocument();
  });

  it("modifier -> aucune modification : ferme l'édition sans appeler fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      wrapWithProviders(<ItemCard item={baseItem} />, {
        auth: { token: "t" },
      })
    );

    fireEvent.click(screen.getByText(/Modifier/i));
    expect(screen.getByText(/Enregistrer/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Enregistrer/i));

    await waitFor(() => {
      expect(screen.queryByText(/Nom :/i)).not.toBeInTheDocument();
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("modifier -> change le prix : PATCH puis onChanged", async () => {
    const onChanged = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });

    vi.stubGlobal("fetch", fetchMock);

    render(
      wrapWithProviders(<ItemCard item={baseItem} onChanged={onChanged} />, {
        auth: { token: "t" },
      })
    );

    fireEvent.click(screen.getByText(/Modifier/i));

    const priceInput = screen.getByDisplayValue("1.5");
    fireEvent.change(priceInput, { target: { value: "2.25" } });

    fireEvent.click(screen.getByText(/Enregistrer/i));

    await waitFor(() => {
      expect(onChanged).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalled();
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toMatchObject({ produit_prix: 2.25 });
  });

  it("ajouter quantité -> quantité invalide : alerte", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      wrapWithProviders(<ItemCard item={baseItem} />, { auth: { token: "t" } })
    );

    fireEvent.click(screen.getByText(/Ajouter quantité/i));
    const qtyInput = screen.getByDisplayValue("1");
    fireEvent.change(qtyInput, { target: { value: "0" } });

    fireEvent.click(screen.getByText(/Enregistrer/i));
    expect(alert).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ajouter quantité -> PATCH ok puis onChanged", async () => {
    const onChanged = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });

    vi.stubGlobal("fetch", fetchMock);

    render(
      wrapWithProviders(<ItemCard item={baseItem} onChanged={onChanged} />, {
        auth: { token: "t" },
      })
    );

    fireEvent.click(screen.getByText(/Ajouter quantité/i));
    const qtyInput = screen.getByDisplayValue("1");
    fireEvent.change(qtyInput, { target: { value: "3" } });
    fireEvent.click(screen.getByText(/Enregistrer/i));

    await waitFor(() => {
      expect(onChanged).toHaveBeenCalledTimes(1);
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toMatchObject({
      produit_quantiter: 5,
      disponible: true,
    });
  });

  it("supprimer -> confirm=false : ne call pas fetch", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      wrapWithProviders(<ItemCard item={baseItem} />, { auth: { token: "t" } })
    );

    fireEvent.click(screen.getByText(/Supprimer/i));

    await waitFor(() => {
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  it("supprimer -> confirm=true : DELETE ok puis onChanged", async () => {
    const onChanged = vi.fn();
    vi.stubGlobal("confirm", vi.fn(() => true));

    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });

    vi.stubGlobal("fetch", fetchMock);

    render(
      wrapWithProviders(<ItemCard item={baseItem} onChanged={onChanged} />, {
        auth: { token: "t" },
      })
    );

    fireEvent.click(screen.getByText(/Supprimer/i));

    await waitFor(() => {
      expect(onChanged).toHaveBeenCalledTimes(1);
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("DELETE");
  });

  it("modifier -> PATCH fail => alert", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "nope patch" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      wrapWithProviders(<ItemCard item={baseItem} />, { auth: { token: "t" } })
    );

    fireEvent.click(screen.getByText(/Modifier/i));

    const priceInput = screen.getByDisplayValue("1.5");
    fireEvent.change(priceInput, { target: { value: "9.99" } });

    fireEvent.click(screen.getByText(/Enregistrer/i));

    await waitFor(() => {
      expect(alert).toHaveBeenCalled();
    });
  });

  it("ajouter quantité -> PATCH fail => alert", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "nope qty" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      wrapWithProviders(<ItemCard item={baseItem} />, { auth: { token: "t" } })
    );

    fireEvent.click(screen.getByText(/Ajouter quantité/i));
    const qtyInput = screen.getByDisplayValue("1");
    fireEvent.change(qtyInput, { target: { value: "2" } });
    fireEvent.click(screen.getByText(/Enregistrer/i));

    await waitFor(() => {
      expect(alert).toHaveBeenCalled();
    });
  });

  it("supprimer -> confirm=true mais DELETE fail => alert et ne call pas onChanged", async () => {
    const onChanged = vi.fn();
    vi.stubGlobal("confirm", vi.fn(() => true));

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "nope delete" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      wrapWithProviders(<ItemCard item={baseItem} onChanged={onChanged} />, {
        auth: { token: "t" },
      })
    );

    fireEvent.click(screen.getByText(/Supprimer/i));

    await waitFor(() => {
      expect(alert).toHaveBeenCalled();
    });

    expect(onChanged).not.toHaveBeenCalled();
  });
});

describe("ItemCard - branches manquantes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("alert", vi.fn());
    vi.stubGlobal("confirm", vi.fn());
    vi.stubGlobal("fetch", vi.fn());
  });

  it("defaults: si champs manquants => form a des valeurs par défaut", () => {
    const item = { id: "p1" };
    render(wrapWithProviders(<ItemCard item={item} />, { auth: { token: "t" } }));

    fireEvent.click(screen.getByText(/Modifier/i));

    expect(screen.getByDisplayValue("")).toBeInTheDocument();
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("saveChanges: si aucune modif => pas de fetch, sort du mode edit", () => {
    const item = {
      id: "p1",
      produit_nom: "A",
      produit_prix: 10,
      produit_quantiter: 2,
      disponible: true,
    };

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(wrapWithProviders(<ItemCard item={item} />, { auth: { token: "t" } }));

    fireEvent.click(screen.getByText(/Modifier/i));
    fireEvent.click(screen.getByText(/Enregistrer/i));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("addQty: si quantité invalide (0) => alert et pas de fetch", () => {
    const item = { id: "p1", produit_nom: "A", produit_quantiter: 2 };
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(wrapWithProviders(<ItemCard item={item} />, { auth: { token: "t" } }));

    fireEvent.click(screen.getByText(/Ajouter quantité/i));
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "0" } });
    fireEvent.click(screen.getByText(/Enregistrer/i));

    expect(alert).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
