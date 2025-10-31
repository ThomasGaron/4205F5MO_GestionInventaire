import { supabase } from "../util/db2.js";

// GET /api/clients  → renvoie la liste des clients
const getTousLesClients = async (req, res) => {
  try {
    // prends seulement les colonnes utiles pour la liste
    const { data, error } = await supabase
      .from("clients")
      .select("id, client_nom, client_prenom, client_email, client_cell");
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export default { getTousLesClients };
