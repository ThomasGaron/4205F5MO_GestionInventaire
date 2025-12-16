import React from "react";
import { AuthContext } from "../src/context/auth-context";
import { AlertProvider } from "../src/context/alert-context";

/**
 * Wrap a component with the providers used by the app.
 */
export function wrapWithProviders(ui, { auth = {}, withAlert = false } = {}) {
  const value = {
    isLoggedIn: false,
    isAdmin: false,
    token: "test-token",
    user: null,
    login: () => {},
    logout: () => {},
    ...auth,
  };

  const tree = (
    <AuthContext.Provider value={value}>{ui}</AuthContext.Provider>
  );

  return withAlert ? <AlertProvider>{tree}</AlertProvider> : tree;
}

export function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
