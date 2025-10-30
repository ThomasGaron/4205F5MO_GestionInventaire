// routes/commandes.routes.js
import express from "express";
import CommandesCtrl from "../controllers/commandes-controller.js";

const router = express.Router();

// base = /api/commandes
router.get("/", CommandesCtrl.getToutesLesCommandes)
router.post("/", CommandesCtrl.creerCommande);           // POST /api/commandes
router.get("/:id", CommandesCtrl.getCommandeParId);      // GET  /api/commandes/:id
router.patch("/:id/statut", CommandesCtrl.changerStatutCommande); // PATCH /api/commandes/:id/statut

export default router;
