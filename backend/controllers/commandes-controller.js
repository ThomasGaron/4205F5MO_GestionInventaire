import { supabase } from "../util/db2.js";

export const creerCommande = async (req, res) => {
  try {
    const { client_id, produits } = req.body;

    // 0) Validations d'entrée
    if (!client_id || !Array.isArray(produits) || produits.length === 0) {
      return res
        .status(400)
        .json({ error: "client_id et produits[] sont requis." });
    }
    for (const p of produits) {
      if (!p.produit_id || !Number.isInteger(p.quantite) || p.quantite <= 0) {
        return res.status(400).json({
          error: "Chaque item doit avoir produit_id (uuid) et quantite (>0).",
        });
      }
    }

    // 1) Vérifier que le client existe
    const { data: client, error: errClient } = await supabase
      .from("clients")
      .select("id")
      .eq("id", client_id)
      .single();
    if (errClient || !client) {
      return res.status(404).json({ error: "Client introuvable." });
    }

    // 2) Charger les produits demandés
    const ids = [...new Set(produits.map((p) => p.produit_id))];
    const { data: produitsDB, error: errProd } = await supabase
      .from("produits")
      .select("id, produit_prix, produit_quantiter, disponible")
      .in("id", ids);

    if (errProd) return res.status(400).json({ error: errProd.message });
    if (!produitsDB || produitsDB.length !== ids.length) {
      return res
        .status(404)
        .json({ error: "Un ou plusieurs produits sont introuvables." });
    }

    // 3) Vérifier stock & construire les lignes
    let total = 0;
    const lignes = [];
    for (const item of produits) {
      const prod = produitsDB.find((p) => p.id === item.produit_id);
      if (!prod) {
        return res
          .status(404)
          .json({ error: `Produit introuvable: ${item.produit_id}` });
      }
      if (prod.disponible === false) {
        return res
          .status(400)
          .json({ error: `Produit non disponible: ${item.produit_id}` });
      }
      if (item.quantite > prod.produit_quantiter) {
        return res.status(400).json({
          error: `Stock insuffisant pour le produit ${item.produit_id}`,
        });
      }

      const prix_unitaire = Number(prod.produit_prix);
      total += prix_unitaire * item.quantite;

      lignes.push({
        produit_id: item.produit_id,
        commande_produit_quantiter: item.quantite,
        prix_unitaire,
      });
    }

    // 4) Créer l'en-tête de commande (date = default current_date)
    const { data: cmd, error: errCmd } = await supabase
      .from("commandes")
      .insert([{ client_id }])
      .select()
      .single();

    if (errCmd) return res.status(400).json({ error: errCmd.message });

    // 5) Insérer les lignes
    const lignesAvecCommande = lignes.map((l) => ({
      ...l,
      commande_id: cmd.id,
    }));
    const { data: lignesInserees, error: errLignes } = await supabase
      .from("commande_produit")
      .insert(lignesAvecCommande)
      .select();

    if (errLignes) {
      // rollback logique si l'insertion des lignes échoue
      await supabase.from("commandes").delete().eq("id", cmd.id);
      return res.status(400).json({ error: errLignes.message });
    }

    // 6) Décrémenter les stocks
    // On utilise la quantité courante lue plus haut → race condition possible
    for (const item of produits) {
      const prod = produitsDB.find((p) => p.id === item.produit_id);
      const newQty = Number(prod.produit_quantiter) - Number(item.quantite);

      const { error: errMaj } = await supabase
        .from("produits")
        .update({ produit_quantiter: newQty })
        .eq("id", item.produit_id);

      if (errMaj) {
        // rollback logique
        await supabase
          .from("commande_produit")
          .delete()
          .eq("commande_id", cmd.id);
        await supabase.from("commandes").delete().eq("id", cmd.id);
        return res
          .status(500)
          .json({ error: "Erreur mise à jour stock: " + errMaj.message });
      }
    }

    // 7) Réponse OK
    return res.status(201).json({
      message: "Commande créée avec succès",
      commande: {
        ...cmd,
        total,
        lignes: lignesInserees,
      },
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
