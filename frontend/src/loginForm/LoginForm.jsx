import { useContext } from "react";
import "./LoginForm.css";
import { AuthContext } from "../context/auth-context";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Bouton.css";

export default function LoginForm() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fd = new FormData(event.target);
    const data = Object.fromEntries(fd.entries());

    const connexion = {
      email: data.email,
      mdp: data.password,
    };

    try {
      // APPEL BACKEND
      const response = await fetch(
        import.meta.env.VITE_BACKEND_URI + "/api/user/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(connexion),
        }
      );

      if (!response.ok) {
        throw new Error("Identifiants invalides");
      }

      const res = await response.json();

      auth.login(res.token);

      if (res.token.role == "admin") {
        auth.admin();
      }

      navigate("/acceuil");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <h2>Connexion</h2>
      <div>
        <label htmlFor="email">Nom d'utilisateur</label>
        <input
          name="email"
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="password">Mot de passe</label>
        <input
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button className="btn btn-primary" type="submit">
        Connexion
      </button>

      {error && <p className="error">{error}</p>}
    </form>
  );
}
