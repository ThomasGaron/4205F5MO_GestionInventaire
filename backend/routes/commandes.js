import express from "express";
import { creerCommande } from "../controllers/commandes-controller.js";

const router = express.Router();

// POST /api/commandes
router.post("/", creerCommande);

export default router;
