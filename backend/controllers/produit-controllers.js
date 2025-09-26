import { supabase } from "../util/db2.js";

const getTousLesProduits = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("produits").select("*");

    res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export default { getTousLesProduits };
