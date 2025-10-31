import express from "express";
import produitController from "../controllers/produit-controllers.js";
import { body, validationResult } from "express-validator";

const router = express.Router();

// Liste
router.get("/tousLesProduits", produitController.getTousLesProduits);
router.get("/faible-stock", ProduitCtrl.getProduitsFaibleStock);

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

// Suppresion
router.delete("/:id", (req, res) =>
  produitController.supprimerProduit(req, res)
);

// Modification
router.patch(
  "/:id",
  // validations optionnelles pour les champs présents
  body("produit_nom").optional().trim().notEmpty().isLength({ max: 120 }),
  body("produit_prix").optional().isFloat({ gt: 0 }),
  body("produit_quantiter").optional().isInt({ min: 0 }),
  body("disponible").optional().isBoolean(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    return produitController.modifierProduit(req, res);
  }
);

export default router;
