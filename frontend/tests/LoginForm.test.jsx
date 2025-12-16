import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";

import LoginForm from "../src/loginForm/LoginForm.jsx";
import { AuthContext } from "../src/context/auth-context.jsx";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("LoginForm", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    vi.restoreAllMocks();
    delete globalThis.fetch;
  });

  const getEmailInput = () =>
    document.querySelector('input[name="email"]');

  const getPasswordInput = () =>
    document.querySelector('input[name="password"]');

  const getSubmitButton = () =>
    screen.getByRole("button", { name: /connexion/i });

  it("affiche les champs email + password + bouton", () => {
    render(
      <AuthContext.Provider value={{ login: vi.fn(), admin: vi.fn() }}>
        <MemoryRouter>
          <LoginForm />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(getEmailInput()).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
    expect(getSubmitButton()).toBeInTheDocument();
  });

  it("login OK: appelle auth.login(token) puis navigate", async () => {
    const login = vi.fn();
    const admin = vi.fn();

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        token: "TOKEN_TEST",
        user: { role: "user" },
      }),
    });

    render(
      <AuthContext.Provider value={{ login, admin }}>
        <MemoryRouter>
          <LoginForm />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    fireEvent.change(getEmailInput(), {
      target: { value: "test@test.com" },
    });

    fireEvent.change(getPasswordInput(), {
      target: { value: "123456" },
    });

    fireEvent.click(getSubmitButton());

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      expect(login).toHaveBeenCalledWith("TOKEN_TEST");
    });

    expect(mockNavigate).toHaveBeenCalled();
  });

it("login admin: appelle auth.login(token) (admin optionnel)", async () => {
  const login = vi.fn();
  const admin = vi.fn();

  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      token: "TOKEN_ADMIN",
      user: { role: "admin" },
    }),
  });

  render(
    <AuthContext.Provider value={{ login, admin }}>
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    </AuthContext.Provider>
  );

  const emailInput = document.querySelector('input[name="email"]');
  const passwordInput = document.querySelector('input[name="password"]');

  fireEvent.change(emailInput, { target: { value: "admin@test.com" } });
  fireEvent.change(passwordInput, { target: { value: "adminpass" } });

  fireEvent.click(screen.getByRole("button", { name: /connexion/i }));

  await waitFor(() => {
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(login).toHaveBeenCalledWith("TOKEN_ADMIN");
  });

  expect(mockNavigate).toHaveBeenCalled();
});


});

