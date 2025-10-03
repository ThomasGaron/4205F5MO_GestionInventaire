import { createContext } from "react";

export const AuthContext = createContext({
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
  admin: () => {},
  isAdmin: false,
  token: null,
});
