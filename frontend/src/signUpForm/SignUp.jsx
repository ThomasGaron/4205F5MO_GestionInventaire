import { useContext } from "react";
import { useState } from "react";
import { AuthContext } from "../context/auth-context";

export default function SignUp() {
  const [mdpPasEgale, setMdpPasEgale] = useState(false);

  const [userExist, setUserExist] = useState(false);

  const { token } = useContext(AuthContext);

  async function handleSubmit(event) {
    event.preventDefault();
    const fd = new FormData(event.target);
    const data = Object.fromEntries(fd.entries());

    if (data.mdp !== data["confirmer_mdp"]) {
      setMdpPasEgale(true);
      return;
    } else {
      setMdpPasEgale(false);
      const nouveauUser = {
        nom: data.nom,
        email: data.email,
        mdp: data.mdp,
        role: data.role,
      };

      const response = await fetch(
        import.meta.env.VITE_BACKEND_URI + "/api/user/signUp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(nouveauUser),
        }
      );
      const responseData = await response.json();
      if (responseData.status == 409) {
        event.target.reset();
        console.log(responseData.message);
        setUserExist(true);
      } else {
        setUserExist(false);
        console.log("Utilisateur creer : ", responseData);
        event.target.reset();
      }
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Ajouter un nouvel employe</h2>

      <div>
        <label htmlFor="email">Courriel</label>
        <input name="email" type="email" required />
        {userExist ? <p>Ce courriel exist deja</p> : null}
      </div>

      <div>
        <label htmlFor="password">Mot de passe</label>
        <input type="password" name="mdp" required />
      </div>

      <div>
        <label htmlFor="confirmer_mdp">Confirmer le mot de passe</label>
        <input type="password" name="confirmer_mdp" required />
        {mdpPasEgale ? <p>Les mots de passe doivent etre identique</p> : null}
      </div>

      <hr />

      <div>
        <label htmlFor="nom">Entrez votre nom complet</label>
        <input type="text" name="nom" required />
      </div>

      <div>
        <label htmlFor="role">Choisissez le role : </label>
        <label htmlFor="text">Employe</label>
        <input type="radio" name="role" value="emp" />
        <label htmlFor="text">Admin</label>
        <input type="radio" name="role" value="admin" />
      </div>

      <p>
        <button type="submit">Ajouter</button>
      </p>
    </form>
  );
}
