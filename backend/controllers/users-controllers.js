// import User from "../models/user.js";
// import HttpError from "../util/http-error.js";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://sqepyvxpukmzclablfue.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZXB5dnhwdWttemNsYWJsZnVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNTYyNTQsImV4cCI6MjA3MjgzMjI1NH0.dEWHiKRWjYEkj_QFC6o3Oyc_Oj-JaOZO8srDHs4YYLU"
);

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
