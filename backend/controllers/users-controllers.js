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
    return res.json({ message: "Connexion réussie.", utilisateur: data.role });
  }
};

const SignUp = async (req, res, next) => {
  const { nom, email, mdp, role } = req.body;

  const { data, error } = await supabase
    .from("utilisateur")
    .select("*")
    .eq("utilisateur_email", email)
    .single();

  if (error || !data) {
    try {
      const { data, error } = await supabase.from("utilisateurs").insert([
        {
          utilisateur_nom: nom,
          utilisateur_email: email,
          mdp: mdp,
          role: role,
        },
      ]);

      if (error) {
        return res
          .status(500)
          .json({ message: "Une erreur est survenu " + error.message });
      } else {
        return res
          .status(201)
          .json({ message: "Utilisateur creer avec succes" });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Une erreur est survenu " + error });
    }
  } else {
    return res.status(409).json({ message: "Cette utilisateur existe deja" });
  }
};

const Modification = async (req, res, next) => {
  const { id } = req.params;
  const { nom, email, mdp, role } = req.body;

  try {
    const { data, error } = await supabase
      .from("utilisateurs")
      .update({
        utilisateur_nom: nom,
        mdp,
        utilisateur_email: email,
        role,
      })
      .eq("id", id);

    if (error) {
      return res.status(500).json({
        error: "Erreur lors de la mise a jour : ",
        message: error.message,
      });
    } else {
      return res
        .status(200)
        .json({ message: "Utilisateur mis a jour : ", utilisateur: data });
    }
  } catch (e) {
    return res.status(500).json({
      error: "Erreur lors de la mis a jour de l'utilisateur",
      message: e.message,
    });
  }
};

const Supprimer = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("utilisateurs")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(500).json({
        error: "Erreur lors de la suppression",
        message: error.message,
      });
    } else {
      return res.status(200).json({
        message: "Utilisateur supprime avec succes",
        utilisateur: data,
      });
    }
  } catch (e) {
    return res.status(500).json({
      error: "Erreur lors de la suppression de l'utilisateur",
      message: e.message,
    });
  }
};

const GetTout = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("utilisateurs").select("*");
    if (error || !data) {
      return res
        .status(500)
        .json({ error: "Une erreur est survenu", message: error });
    } else {
      return res.status(200).json({ utilisateur: data });
    }
  } catch (e) {
    return res
      .status(500)
      .json({ error: "Une erreur est survenu", message: e.message });
  }
};

export default { Login, SignUp, Modification, Supprimer };
