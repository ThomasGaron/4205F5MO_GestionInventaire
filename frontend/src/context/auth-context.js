import { createContext } from "react";

export const AuthContext = createContext({
  token: null,
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  loading: false,
  login: async () => {},
  logout: () => {},
  refreshUser: async () => null,
});
