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

const supprimerProduit = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
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

export default { getTousLesProduits, ajouterProduit, supprimerProduit };
