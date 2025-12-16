import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Footer from "../src/components/Footer.jsx";
import SupprimerUserModal from "../src/components/modals/SupprimerUserModal.jsx";


describe("Footer", () => {
  it("affiche la mention copyright", () => {
    render(<Footer />);
    expect(screen.getByText(/Gestion d'inventaire/i)).toBeInTheDocument();
    expect(screen.getByText(/Mentions légales/i)).toBeInTheDocument();
  });
});

describe("SupprimerUserModal", () => {
  it("ne rend rien si open=false", () => {
    const { container } = render(
      <SupprimerUserModal open={false} title="T" message="M" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("affiche titre, message et boutons si open=true", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <SupprimerUserModal
        open
        title="Confirmer"
        message="Voulez-vous?"
        onConfirm={onConfirm}
        onCancel={onCancel}
        loading={false}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^Confirmer$/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Voulez-vous/i)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /^Annuler$/i })
    );
    expect(onCancel).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getByRole("button", { name: /^Confirmer$/i })
    );
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("affiche 'Suppression...' si loading=true", () => {
    render(<SupprimerUserModal open loading={true} onConfirm={() => {}} />);
    expect(screen.getByText(/Suppression/i)).toBeInTheDocument();
  });
});
