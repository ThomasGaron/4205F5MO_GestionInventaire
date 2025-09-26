import { Router } from "express";
import db from "../db.js";
import { body, validationResult } from "express-validator";

const router = Router();


/** Ajouter un produit */
router.post(
  "/",
  body("nom").trim().notEmpty().isLength({ max: 120 }),
  body("prix").isFloat({ gt: 0 }),
  body("quantite").isInt({ min: 0 }),
  body("disponible").optional().isBoolean().toBoolean(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ erreurs: errors.array() });

    const { nom, prix, quantite, disponible } = req.body;

    //  Empêcher les doublons de nom (insensible à la casse)
    const { rows: exist } = await db.query(
      "select 1 from produits where lower(produit_nom)=lower($1)",
      [nom]
    );
    if (exist.length)
      return res.status(409).json({ message: "Un produit avec ce nom existe déjà." });

    // Insert 
    const { rows } = await db.query(
      `insert into produits (produit_nom, produit_prix, produit_quantiter, disponible)
       values ($1, $2, $3, coalesce($4, true))
       returning id,
                 produit_nom as nom,
                 produit_prix as prix,
                 produit_quantiter as quantite,
                 disponible`,
      [nom, prix, quantite, disponible]
    );

    res.status(201).json(rows[0]);
  }
);


/** Liste des produits */
router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, produit_nom, produit_prix, produit_quantiter, disponible
       FROM produits
       ORDER BY produit_nom ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Erreur récupération produits:", err.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
