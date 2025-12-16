import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ErrorPage from "../src/pageErreur/PageErreur.jsx";

// NavLinks utilise Outlet (router), on mock juste NavLinks.
vi.mock("../src/navigation/NavLinks", () => ({
  default: () => <div>NavLinksMock</div>,
}));

describe("ErrorPage", () => {
  it("affiche le message d'erreur", () => {
    render(<ErrorPage />);
    expect(screen.getByText(/NavLinksMock/)).toBeInTheDocument();
    expect(screen.getByText(/An error occurred/i)).toBeInTheDocument();
    expect(screen.getByText(/Could not find this page/i)).toBeInTheDocument();
  });
});
