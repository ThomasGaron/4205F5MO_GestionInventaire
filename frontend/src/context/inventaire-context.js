import { createContext, useContext, useState } from "react";

const InventaireContext = createContext();

export function InventaireProvider({ children }) {
  const [items, setItems] = useState([]);

  return (
    <InventaireContext.Provider value={{ items, setItems }}>
      {children}
    </InventaireContext.Provider>
  );
}

export function useInventaire() {
  return useContext(InventaireContext);
}
