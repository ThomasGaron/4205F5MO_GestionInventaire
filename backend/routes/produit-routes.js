import express from "express";
import produitController from "../controllers/produit-controllers.js";

const router = express.Router();

router.get("/tousLesProduits", produitController.getTousLesProduits);

export default router;
