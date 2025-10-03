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

export default { getTousLesProduits, ajouterProduit };
