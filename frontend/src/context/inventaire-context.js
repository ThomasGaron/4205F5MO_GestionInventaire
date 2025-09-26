import { createContext, useContext, useState, createElement } from "react";

const InventaireContext = createContext();

export function InventaireProvider({ children }) {
  const [items, setItems] = useState([]);

  return createElement(
    InventaireContext.Provider,
    { value: { items, setItems } },
    children
  );
}

export function useInventaire() {
  return useContext(InventaireContext);
}
