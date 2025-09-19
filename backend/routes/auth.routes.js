import { Router } from "express";
import db from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";

const router = Router();
const rounds = Number(process.env.BCRYPT_ROUNDS || 12);

function genererToken(u) {
  return jwt.sign(
    { sub: u.id, email: u.email, role: u.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );
}

/** Créer un ADMIN si absent */
router.post(
  "/seed-admin",
  body("nom").notEmpty(),
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  async (req, res) => {
    const erreurs = validationResult(req);
    if (!erreurs.isEmpty())
      return res.status(400).json({ erreurs: erreurs.array() });

    const { nom, email, password } = req.body;

    const { rows: exist } = await db.query(
      "select id from utilisateurs where utilisateur_email=$1",
      [email]
    );
    if (exist.length)
      return res.status(409).json({ message: "Admin déjà existant" });

    const hash = await bcrypt.hash(password, rounds);
    const { rows } = await db.query(
      `insert into utilisateurs (utilisateur_nom, utilisateur_email, mdp, role)
       values ($1,$2,$3,'admin')
       returning id, utilisateur_nom as name, utilisateur_email as email, role`,
      [nom, email, hash]
    );
    const user = rows[0];
    const token = genererToken(user);
    res.status(201).json({ user, token });
  }
);

/** Connexion */
router.post(
  "/login",
  body("email").isEmail(),
  body("password").notEmpty(),
  async (req, res) => {
    const erreurs = validationResult(req);
    if (!erreurs.isEmpty())
      return res.status(400).json({ erreurs: erreurs.array() });

    const { email, password } = req.body;

    const { rows } = await db.query(
      `select id,
              utilisateur_nom as name,
              utilisateur_email as email,
              mdp as password_hash,
              role
         from utilisateurs
        where utilisateur_email=$1`,
      [email]
    );
    if (!rows.length)
      return res.status(401).json({ message: "Identifiants invalides" });

    const u = rows[0];
    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(401).json({ message: "Identifiants invalides" });

    const token = genererToken(u);
    delete u.password_hash;
    res.json({ user: u, token });
  }
);

export default router;
