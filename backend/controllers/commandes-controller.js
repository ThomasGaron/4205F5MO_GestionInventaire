import { supabase } from "../util/db2.js";

// UUID helper (même style)
const isUUID = (s) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

// Statuts autorisés (sans "Payée")
const STATUTS_VALIDES = new Set(["En cours", "Livrée", "Annulée"]);

/**
 * GET /api/commandes
 * Liste toutes les commandes (tri récent d'abord)
 */
const getToutesLesCommandes = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("commandes")
      .select("id, client_id, date, statut")
      .order("date", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/commandes
 * Body accepté:
 *  - { client_id, items: [{ produit_id, quantite }, ...] }
 *  - ou { client_id, produits: [{ produit_id, quantite }, ...] }  // compat
 * Crée la commande (statut = "En cours"), insère les lignes et décrémente le stock.
 */
const creerCommande = async (req, res) => {
  try {
    const { client_id } = req.body || {};
    const lignesInput = Array.isArray(req.body?.items)
      ? req.body.items
      : Array.isArray(req.body?.produits)
      ? req.body.produits
      : null;

    if (!isUUID(String(client_id || ""))) {
      return res.status(400).json({ error: "client_id invalide." });
    }
    if (!Array.isArray(lignesInput) || lignesInput.length === 0) {
      return res.status(400).json({ error: "items/produits doit être un tableau non vide." });
    }

    // Normaliser + valider items
    const cleanItems = lignesInput
      .map((it) => ({
        produit_id: String(it?.produit_id || "").trim(),
        quantite: Number(it?.quantite || 0),
      }))
      .filter((it) => isUUID(it.produit_id) && it.quantite > 0);

    if (cleanItems.length !== lignesInput.length) {
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

    // Charger produits concernés
    const ids = [...new Set(cleanItems.map((i) => i.produit_id))];
    const { data: produits, error: errProd } = await supabase
      .from("produits")
      .select("id, produit_nom, produit_prix, produit_quantiter, disponible")
      .in("id", ids);
    if (errProd) return res.status(400).json({ error: errProd.message });

    // Vérifier stocks
    const byId = new Map((produits || []).map((p) => [p.id, p]));
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

    // Créer l'en-tête (date + statut "En cours")
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const { data: cmd, error: errCmd } = await supabase
      .from("commandes")
      .insert([{ client_id, date: today, statut: "En cours" }])
      .select()
      .single();
    if (errCmd) return res.status(400).json({ error: errCmd.message });

    // Préparer lignes + total
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

    // Insérer lignes
    const { data: lignesInserees, error: errLignes } = await supabase
      .from("commande_produit")
      .insert(lignes)
      .select();
    if (errLignes) {
      // rollback soft
      await supabase.from("commandes").delete().eq("id", cmd.id);
      return res.status(400).json({ error: errLignes.message });
    }

    // Mettre à jour les stocks
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
 * Renvoie entête + lignes + total
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
 * Body: { "statut": "En cours" | "Livrée" | "Annulée" }
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

    // Existence
    const { data: exist, error: errExist } = await supabase
      .from("commandes")
      .select("id, statut")
      .eq("id", id)
      .single();
    if (errExist || !exist) return res.status(404).json({ error: "Commande introuvable." });

    const ancienStatut = exist.statut;
    if (ancienStatut === statut) {
      return res.status(200).json({ message: "Aucun changement.", data: { id, statut } });
    }

    // (Optionnel) si Annulée => restaurer stock, dé-commente si tu veux
    /*
    if (statut === "Annulée" && ancienStatut !== "Annulée") {
      const { data: lignes, error: errLignes } = await supabase
        .from("commande_produit")
        .select("produit_id, commande_produit_quantite")
        .eq("commande_id", id);
      if (!errLignes && lignes) {
        for (const l of lignes) {
          const q = Number(l.commande_produit_quantite || 0);
          if (q > 0) {
            const { data: prod } = await supabase
              .from("produits")
              .select("produit_quantiter")
              .eq("id", l.produit_id)
              .single();
            if (prod) {
              const newQty = Number(prod.produit_quantiter || 0) + q;
              await supabase
                .from("produits")
                .update({ produit_quantiter: newQty, disponible: newQty > 0 })
                .eq("id", l.produit_id);
            }
          }
        }
      }
    }
    */

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

// --- SUPPRIMER UNE COMMANDE (avec restauration du stock) ---
const supprimerCommande = async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!isUUID(id)) return res.status(400).json({ error: "Paramètre id invalide." });

    // Existence
    const { data: cmd, error: errCmd } = await supabase
      .from("commandes")
      .select("id, statut")
      .eq("id", id)
      .single();
    if (errCmd || !cmd) return res.status(404).json({ error: "Commande introuvable." });

    // (Option) bloquer suppression si finalisée
    if (cmd.statut && (cmd.statut === "Livrée" || cmd.statut === "Annulée")) {
      return res.status(400).json({ error: "Impossible de supprimer: commande finalisée." });
    }

    // Récupérer lignes
    const { data: lignes, error: errLignes } = await supabase
      .from("commande_produit")
      .select("produit_id, commande_produit_quantite")
      .eq("commande_id", id);
    if (errLignes) return res.status(400).json({ error: errLignes.message });

    // Restaurer stock
    for (const l of lignes || []) {
      const q = Number(l.commande_produit_quantite || 0);
      if (q > 0) {
        const { data: prod, error: errProd } = await supabase
          .from("produits")
          .select("produit_quantiter")
          .eq("id", l.produit_id)
          .single();
        if (!errProd && prod) {
          const newQty = Number(prod.produit_quantiter || 0) + q;
          await supabase
            .from("produits")
            .update({ produit_quantiter: newQty, disponible: newQty > 0 })
            .eq("id", l.produit_id);
        }
      }
    }

    // Supprimer lignes puis commande
    await supabase.from("commande_produit").delete().eq("commande_id", id);
    const { data: deleted, error: errDel } = await supabase
      .from("commandes")
      .delete()
      .eq("id", id)
      .select()
      .single();
    if (errDel) return res.status(400).json({ error: errDel.message });

    return res.status(200).json({ message: "Commande supprimée.", data: deleted });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// --- REMPLACER TOUTES LES LIGNES D’UNE COMMANDE ---
// Body: { items: [{ produit_id, quantite }, ...] }
const remplacerLignesCommande = async (req, res) => {
  try {
    const commandeId = String(req.params.id || "").trim();
    if (!isUUID(commandeId)) return res.status(400).json({ error: "Paramètre id invalide." });

    const { items } = req.body || {};
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "items doit être un tableau." });
    }

    // Vérifier commande
    const { data: cmd, error: errCmd } = await supabase
      .from("commandes")
      .select("id, statut")
      .eq("id", commandeId)
      .single();
    if (errCmd || !cmd) return res.status(404).json({ error: "Commande introuvable." });

    // (Option) bloquer si finalisée
    if (cmd.statut && (cmd.statut === "Livrée" || cmd.statut === "Annulée")) {
      return res.status(400).json({ error: "Commande finalisée: modification interdite." });
    }

    // Normaliser + valider items
    const cleanItems = items
      .map((it) => ({
        produit_id: String(it?.produit_id || "").trim(),
        quantite: Number(it?.quantite || 0),
      }))
      .filter((it) => isUUID(it.produit_id) && it.quantite >= 0);

    if (cleanItems.length !== items.length) {
      return res.status(400).json({ error: "Un ou plusieurs items sont invalides." });
    }

    // Lignes actuelles
    const { data: lignesActuelles, error: errLA } = await supabase
      .from("commande_produit")
      .select("produit_id, commande_produit_quantite, prix_unitaire")
      .eq("commande_id", commandeId);
    if (errLA) return res.status(400).json({ error: errLA.message });

    const actMap = new Map((lignesActuelles || []).map((l) => [l.produit_id, l]));
    const newMap = new Map(cleanItems.map((l) => [l.produit_id, l]));

    // Charger tous les produits impliqués
    const allIds = Array.from(new Set([...actMap.keys(), ...newMap.keys()]));
    const { data: produits, error: errProd } = await supabase
      .from("produits")
      .select("id, produit_nom, produit_prix, produit_quantiter, disponible")
      .in("id", allIds);
    if (errProd) return res.status(400).json({ error: errProd.message });
    const prodById = new Map((produits || []).map((p) => [p.id, p]));

    // 1) Supprimer lignes absentes -> restituer stock
    for (const [pid, l] of actMap.entries()) {
      if (!newMap.has(pid)) {
        const qOld = Number(l.commande_produit_quantite || 0);
        if (qOld > 0) {
          const p = prodById.get(pid);
          if (p) {
            const newQty = Number(p.produit_quantiter || 0) + qOld;
            await supabase
              .from("produits")
              .update({ produit_quantiter: newQty, disponible: newQty > 0 })
              .eq("id", pid);
          }
        }
        await supabase
          .from("commande_produit")
          .delete()
          .eq("commande_id", commandeId)
          .eq("produit_id", pid);
      }
    }

    // 2) Ajouter / modifier les lignes présentes
    for (const [pid, n] of newMap.entries()) {
      const p = prodById.get(pid);
      if (!p) {
        return res.status(404).json({ error: `Produit introuvable: ${pid}` });
      }

      const exists = actMap.get(pid);
      const qNew = Number(n.quantite || 0);
      const qOld = exists ? Number(exists.commande_produit_quantite || 0) : 0;
      const delta = qNew - qOld;

      if (qNew === 0) {
        // quantité 0 => suppression + restitution stock si existait
        if (exists) {
          const back = qOld;
          if (back > 0) {
            const newQty = Number(p.produit_quantiter || 0) + back;
            await supabase
              .from("produits")
              .update({ produit_quantiter: newQty, disponible: newQty > 0 })
              .eq("id", pid);
          }
          await supabase
            .from("commande_produit")
            .delete()
            .eq("commande_id", commandeId)
            .eq("produit_id", pid);
        }
        continue;
      }

      if (!exists) {
        // Nouvelle ligne -> check stock, insert, décrémenter stock
        if (Number(p.produit_quantiter || 0) < qNew) {
          return res.status(400).json({
            error: `Stock insuffisant pour ${p.produit_nom || pid} (stock=${p.produit_quantiter}, demandé=${qNew})`,
          });
        }
        const prix = Number(p.produit_prix || 0);
        await supabase
          .from("commande_produit")
          .insert([
            {
              commande_id: commandeId,
              produit_id: pid,
              commande_produit_quantite: qNew,
              prix_unitaire: prix,
            },
          ]);

        const newQty = Number(p.produit_quantiter || 0) - qNew;
        await supabase
          .from("produits")
          .update({ produit_quantiter: newQty, disponible: newQty > 0 })
          .eq("id", pid);
      } else {
        // Ligne existante -> appliquer delta
        if (delta > 0) {
          // Augmentation -> vérifier stock puis décrémenter
          if (Number(p.produit_quantiter || 0) < delta) {
            return res.status(400).json({
              error: `Stock insuffisant pour ${p.produit_nom || pid} (stock=${p.produit_quantiter}, ajouté=${delta})`,
            });
          }
          const newQty = Number(p.produit_quantiter || 0) - delta;
          await supabase
            .from("produits")
            .update({ produit_quantiter: newQty, disponible: newQty > 0 })
            .eq("id", pid);
        } else if (delta < 0) {
          // Diminution -> restituer
          const back = -delta;
          const newQty = Number(p.produit_quantiter || 0) + back;
          await supabase
            .from("produits")
            .update({ produit_quantiter: newQty, disponible: newQty > 0 })
            .eq("id", pid);
        }

        // Mettre à jour la quantité (on conserve prix_unitaire existant)
        await supabase
          .from("commande_produit")
          .update({ commande_produit_quantite: qNew })
          .eq("commande_id", commandeId)
          .eq("produit_id", pid);
      }
    }

    // État final
    const { data: lignesFinales } = await supabase
      .from("commande_produit")
      .select("produit_id, commande_produit_quantite, prix_unitaire")
      .eq("commande_id", commandeId);

    const total = (lignesFinales || []).reduce(
      (s, l) => s + Number(l.prix_unitaire || 0) * Number(l.commande_produit_quantite || 0),
      0
    );

    return res.status(200).json({
      message: "Commande mise à jour.",
      commande: { id: commandeId, statut: cmd.statut, total },
      lignes: lignesFinales || [],
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export default {
  
  getToutesLesCommandes,
  creerCommande,
  getCommandeParId,
  changerStatutCommande,
  supprimerCommande,
  remplacerLignesCommande,
};
