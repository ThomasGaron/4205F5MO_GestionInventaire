import express from "express";
import produitController from "../controllers/produit-controllers.js";
import { body, validationResult } from "express-validator";

const router = express.Router();

// Liste
router.get("/tousLesProduits", produitController.getTousLesProduits);

// Création
router.post(
  "/",
  body("produit_nom").trim().notEmpty().isLength({ max: 120 }),
  body("produit_prix").notEmpty().isFloat({ gt: 0 }),
  body("produit_quantiter").notEmpty().isInt({ min: 0 }),
  body("disponible").optional().isBoolean(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    return produitController.ajouterProduit(req, res);
  }
);

export default router;
