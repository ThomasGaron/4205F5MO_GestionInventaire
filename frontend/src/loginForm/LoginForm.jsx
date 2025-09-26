import { useContext } from "react";
import "./LoginForm.css";
import { AuthContext } from "../context/auth-context";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginForm() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // APPEL BACKEND (corrigé: /api/auth/login)
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

     if (!response.ok) {
        throw new Error("Identifiants invalides");
      }

      const data = await response.json();

     
      auth.login(data.token);

      navigate("/acceuil");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <h2>Connexion</h2>
      <div>
        <label htmlFor="username">Nom d'utilisateur</label>
        <input
          name="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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

      <button type="submit">Connexion</button>

      {error && <p className="error">{error}</p>}
    </form>
  );
}
