import express from "express";
import CommandesCtrl from "../controllers/commandes-controller.js";

const router = express.Router();

// base = /api/commandes
router.get("/", CommandesCtrl.getToutesLesCommandes); // si présent
router.post("/", CommandesCtrl.creerCommande);
router.get("/:id", CommandesCtrl.getCommandeParId);
router.patch("/:id/statut", CommandesCtrl.changerStatutCommande);

router.delete("/:id", CommandesCtrl.supprimerCommande);
router.put("/:id/lignes", CommandesCtrl.remplacerLignesCommande);

export default router;
