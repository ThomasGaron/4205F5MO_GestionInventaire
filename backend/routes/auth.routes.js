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

/** Connexion : username OU email (avec fallback clair temporaire) */
router.post(
  "/login",
  body("password").notEmpty(),
  // s'assurer qu'au moins l'un des deux est fourni
  body().custom((v) => {
    if (!v.username && !v.email) throw new Error("username ou email requis");
    return true;
  }),
  async (req, res) => {
    const erreurs = validationResult(req);
    if (!erreurs.isEmpty())
      return res.status(400).json({ erreurs: erreurs.array() });

    const ident = (req.body.username || req.body.email || "").trim();
    const byEmail = /\S+@\S+\.\S+/.test(ident);

    const { rows } = await db.query(
      `select id,
              utilisateur_nom as name,
              utilisateur_email as email,
              mdp as password_hash,
              role
         from utilisateurs
        where ${byEmail ? "utilisateur_email" : "utilisateur_nom"} = $1`,
      [ident]
    );

    if (!rows.length)
      return res.status(401).json({ message: "Identifiants invalides" });

    const u = rows[0];
    const supplied = String(req.body.password || "");
    const stored = String(u.password_hash || "");

    // Si c'est un hash bcrypt, on compare bcrypt. Sinon (mdp en clair) on compare en clair.
    const isBcrypt = /^\$2[aby]\$/.test(stored);
    const ok = isBcrypt ? await bcrypt.compare(supplied, stored)
                        : supplied === stored; // ⚠️ TEMPORAIRE : à retirer une fois les mdp hashés

    if (!ok) return res.status(401).json({ message: "Identifiants invalides" });

    const token = genererToken(u);
    delete u.password_hash;
    res.json({ user: u, token });
  }
);

export default router;
