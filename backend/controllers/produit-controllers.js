import { supabase } from "../util/db2.js";

const getTousLesProduits = async (req, res) => {
  try {
    const { data, error } = await supabase.from("produits").select("*");
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const ajouterProduit = async (req, res) => {
  try {
    const { produit_nom, produit_prix, produit_quantiter, disponible } =
      req.body;

    const insertRow = {
      produit_nom,
      produit_prix,
      produit_quantiter,
      // si non fourni, on met true par défaut
      disponible: typeof disponible === "boolean" ? disponible : true,
    };

    const { data, error } = await supabase
      .from("produits")
      .insert([insertRow])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const isUUID = (s) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

const supprimerProduit = async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!isUUID(id)) {
      return res.status(400).json({ error: "Paramètre id invalide." });
    }

    // Vérifier d'abord l'existence (retourne 404 si inexistant)
    const { data: exist, error: errExist } = await supabase
      .from("produits")
      .select("id")
      .eq("id", id)
      .single();

    if (errExist || !exist) {
      return res.status(404).json({ error: "Produit introuvable." });
    }

    // Suppression + retour de la ligne supprimée
    const { data, error } = await supabase
      .from("produits")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: "Produit supprimé.", data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const modifierProduit = async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!isUUID(id)) {
      return res.status(400).json({ error: "Paramètre id invalide." });
    }

    // Construire le payload dynamiquement (seulement les champs présents)
    const up = {};
    const allowed = [
      "produit_nom",
      "produit_prix",
      "produit_quantiter",
      "disponible",
    ]; // adapte si tu as d'autres colonnes
    for (const k of allowed) {
      if (k in req.body) up[k] = req.body[k];
    }

    if (Object.keys(up).length === 0) {
      return res.status(400).json({ error: "Aucun champ à mettre à jour." });
    }

    // Vérifier l'existence
    const { data: exist, error: errExist } = await supabase
      .from("produits")
      .select("id")
      .eq("id", id)
      .single();

    if (errExist || !exist) {
      return res.status(404).json({ error: "Produit introuvable." });
    }

    // Mettre à jour et retourner la ligne modifiée
    const { data, error } = await supabase
      .from("produits")
      .update(up)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ message: "Produit modifié.", data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export default {
  getTousLesProduits,
  ajouterProduit,
  supprimerProduit,
  modifierProduit,
};
