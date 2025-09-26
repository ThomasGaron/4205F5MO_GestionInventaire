// import User from "../models/user.js";
// import HttpError from "../util/http-error.js";

import { supabase } from "../util/db2.js";

const Login = async (req, res, next) => {
  const { email, mdp } = req.body;

  const { data, error } = await supabase
    .from("utilisateurs")
    .select("*")
    .eq("utilisateur_email", email)
    .single();

  if (error || !data) {
    return res.status(401).json({
      message: "Utilisateur introuvable ou email incorrect.",
    });
  }

  if (data.mdp !== mdp) {
    return res.status(401).json({
      message: "Mot de passe incorrect.",
    });
  } else {
    res.json({ message: "Connexion réussie.", utilisateur: data });
  }
};

export default { Login };
