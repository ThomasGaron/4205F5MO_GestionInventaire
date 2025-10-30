import { supabase } from "../util/db2.js";

const STATUTS_VALIDES = new Set(["En cours", "Livrée", "Annulée"]);

const isUUID = (s) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

const creerCommande = async (req, res) => {
  try {
    const { client_id, items } = req.body || {};

    if (!isUUID(String(client_id || ""))) {
      return res.status(400).json({ error: "client_id invalide." });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items doit être un tableau non vide." });
    }

    // Normaliser + valider items
    const cleanItems = items
      .map((it) => ({
        produit_id: String(it?.produit_id || "").trim(),
        quantite: Number(it?.quantite || 0),
      }))
      .filter((it) => isUUID(it.produit_id) && it.quantite > 0);

    if (cleanItems.length !== items.length) {
      return res.status(400).json({ error: "Un ou plusieurs items sont invalides." });
    }

    // Client existe ?
    const { data: clientExist, error: errClient } = await supabase
      .from("clients")
      .select("id")
      .eq("id", client_id)
      .single();
    if (errClient || !clientExist) {
      return res.status(404).json({ error: "Client introuvable." });
    }

    // Charger tous les produits concernés
    const ids = [...new Set(cleanItems.map((i) => i.produit_id))];
    const { data: produits, error: errProd } = await supabase
      .from("produits")
      .select("id, produit_nom, produit_prix, produit_quantiter, disponible")
      .in("id", ids);
    if (errProd) return res.status(400).json({ error: errProd.message });

    // Vérifier stock
    const byId = new Map(produits.map((p) => [p.id, p]));
    for (const it of cleanItems) {
      const p = byId.get(it.produit_id);
      if (!p) return res.status(404).json({ error: `Produit introuvable: ${it.produit_id}` });
      const stock = Number(p.produit_quantiter || 0);
      if (stock < it.quantite) {
        return res.status(400).json({
          error: `Stock insuffisant pour ${p.produit_nom || it.produit_id} (stock=${stock}, demandé=${it.quantite})`,
        });
      }
    }

    // Insérer l'en-tête (statut "En cours" + date du jour)
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const { data: cmd, error: errCmd } = await supabase
      .from("commandes")
      .insert([{ client_id, date: today, statut: "En cours" }])
      .select()
      .single();
    if (errCmd) return res.status(400).json({ error: errCmd.message });

    // Préparer les lignes + total
    let total = 0;
    const lignes = cleanItems.map((it) => {
      const p = byId.get(it.produit_id);
      const prix = Number(p.produit_prix || 0);
      total += prix * it.quantite;
      return {
        commande_id: cmd.id,
        produit_id: it.produit_id,
        commande_produit_quantite: it.quantite,
        prix_unitaire: prix,
      };
    });

    // Insérer les lignes
    const { data: lignesInserees, error: errLignes } = await supabase
      .from("commande_produit")
      .insert(lignes)
      .select();
    if (errLignes) {
      // rollback "soft" de l'en-tête si erreur d'insertion des lignes
      await supabase.from("commandes").delete().eq("id", cmd.id);
      return res.status(400).json({ error: errLignes.message });
    }

    // Mettre à jour les stocks produits
    for (const it of cleanItems) {
      const p = byId.get(it.produit_id);
      const newQty = Number(p.produit_quantiter || 0) - it.quantite;
      const newDisponible = newQty > 0;
      const { error: errUp } = await supabase
        .from("produits")
        .update({ produit_quantiter: newQty, disponible: newDisponible })
        .eq("id", it.produit_id);
      if (errUp) {
        return res.status(207).json({
          warning: "Commande créée mais une mise à jour de stock a échoué.",
          commande: { id: cmd.id, statut: cmd.statut, date: cmd.date, total },
          lignes: lignesInserees,
          erreur_stock: errUp.message,
        });
      }
    }

    // Réponse UC-07
    return res.status(201).json({
      message: "Commande créée (statut: En cours).",
      commande: { id: cmd.id, client_id: cmd.client_id, date: cmd.date, statut: cmd.statut, total },
      lignes: lignesInserees,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/commandes/:id
 * Renvoie entête + lignes + total (utile après création)
 */
const getCommandeParId = async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!isUUID(id)) return res.status(400).json({ error: "Paramètre id invalide." });

    const { data: cmd, error: errCmd } = await supabase
      .from("commandes")
      .select("*")
      .eq("id", id)
      .single();
    if (errCmd || !cmd) return res.status(404).json({ error: "Commande introuvable." });

    const { data: lignes, error: errLignes } = await supabase
      .from("commande_produit")
      .select("produit_id, commande_produit_quantite, prix_unitaire")
      .eq("commande_id", id);
    if (errLignes) return res.status(400).json({ error: errLignes.message });

    const total = (lignes || []).reduce(
      (s, l) => s + Number(l.prix_unitaire || 0) * Number(l.commande_produit_quantite || 0),
      0
    );

    return res.status(200).json({ commande: { ...cmd, total }, lignes: lignes || [] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * PATCH /api/commandes/:id/statut
 * Body: { "statut": "Annulée" | "Livrée" | "En cours" }
 */
const changerStatutCommande = async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    const { statut } = req.body || {};

    if (!isUUID(id)) return res.status(400).json({ error: "Paramètre id invalide." });
    if (typeof statut !== "string" || !STATUTS_VALIDES.has(statut)) {
      return res
        .status(400)
        .json({ error: "Statut invalide. Valeurs permises: En cours, Livrée, Annulée." });
    }

    // Vérifier existence
    const { data: exist, error: errExist } = await supabase
      .from("commandes")
      .select("id, statut")
      .eq("id", id)
      .single();

    if (errExist || !exist) return res.status(404).json({ error: "Commande introuvable." });

    const ancienStatut = exist.statut;
    if (ancienStatut === statut) {
      return res.status(200).json({
        message: "Aucun changement de statut (déjà identique).",
        data: { id, statut },
      });
    }

    // Mise à jour du statut
    const { data, error } = await supabase
      .from("commandes")
      .update({ statut })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({
      message: "Statut mis à jour.",
      data: { id: data.id, ancienStatut, nouveauStatut: data.statut },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getToutesLesCommandes = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("commandes")
      .select("id, client_id, date, statut")   // ajoute statut si tu l’as dans la table
      .order("date", { ascending: false });    // tri les plus récentes d’abord

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export default {
  creerCommande,
  getCommandeParId,
  changerStatutCommande,
  getToutesLesCommandes,
};
