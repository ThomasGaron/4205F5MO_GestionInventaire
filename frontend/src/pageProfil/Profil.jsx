import { AuthContext } from "../context/auth-context";
import { useEffect } from "react";
import { useState } from "react";
import { useContext } from "react";
import { useMemo } from "react";
import SupprimerUserModal from "../components/modals/SupprimerUserModal";

export default function Profil() {
  // Récupère les infos du contexte (loggedin, logout ...)
  const { token, user: me } = useContext(AuthContext) || {};
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const reponse = await fetch(
        import.meta.env.VITE_BACKEND_URI + "/api/user/getTout",
        {
          method: "GET",
        }
      );
      const jsonData = await reponse.json();
      console.log(jsonData);
      setData(jsonData.utilisateurs);
    } catch (error) {
      console.error("Erreur lors du fetching de data : ", error.message);
    }
  };

  return (
    <>
      <h1>Profils</h1>
      <ul>
        {data.map((profil) => (
          <li key={profil.id}>
            <h2>Nom du profil : {profil.utilisateur_nom}</h2>
            <p>Role du profil : {profil.role}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
