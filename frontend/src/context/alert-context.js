import { createContext, useContext, useState, createElement } from "react";

const AlertContext = createContext();

export function AlertProvider({ children }) {
  const [alert, setAlert] = useState(null);

  return createElement(
    AlertContext.Provider,
    { value: { alert, setAlert } },
    children
  );
}

export function useAlert() {
  return useContext(AlertContext);
}
