import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import NavLinks from "../src/navigation/NavLinks.jsx";
import { AuthContext } from "../src/context/auth-context.jsx";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderNav(authValue, initialPath = "/acceuil") {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/" element={<NavLinks />}>
            <Route path="acceuil" element={<div>PAGE ACCEUIL</div>} />
            <Route path="inventaire" element={<div>PAGE INVENTAIRE</div>} />
            <Route path="commandes" element={<div>PAGE COMMANDES</div>} />
            <Route path="profil" element={<div>PAGE PROFIL</div>} />
            <Route path="login" element={<div>PAGE LOGIN</div>} />
            <Route path="signUp" element={<div>PAGE SIGNUP</div>} />
          </Route>
          <Route path="*" element={<div>NOT FOUND</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("NavLinks", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });


  it("si connecté: affiche Inventaire/Commandes/Profil + bouton Déconnexion", () => {
    renderNav({
      isLoggedIn: true,
      isAdmin: false,
      logout: vi.fn(),
    });

    expect(screen.getByRole("link", { name: /inventaire/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /commandes/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /profil/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /déconnexion/i })).toBeInTheDocument();

    // Connexion caché
    expect(screen.queryByRole("link", { name: /connexion/i })).not.toBeInTheDocument();
  });

  it("si admin: affiche le lien Créer un compte", () => {
    renderNav({
      isLoggedIn: true,
      isAdmin: true,
      logout: vi.fn(),
    });

    expect(screen.getByRole("link", { name: /créer un compte/i })).toBeInTheDocument();
  });

  it("clic Déconnexion: appelle logout() et navigate('/acceuil', {replace:true})", () => {
    const logout = vi.fn();

    renderNav({
      isLoggedIn: true,
      isAdmin: false,
      logout,
    });

    fireEvent.click(screen.getByRole("button", { name: /déconnexion/i }));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/acceuil", { replace: true });
  });
});
