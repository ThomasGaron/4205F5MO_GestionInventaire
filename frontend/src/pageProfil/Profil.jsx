import { useContext } from "react";
import { AuthContext } from "../context/auth-context";
import { useEffect } from "react";

export default function Profil() {
  const auth = useContext(AuthContext);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const reponse = await fetch(import.meta.VITE_BACKEND_URL + "api/user/");
    } catch (error) {}
  };
}
