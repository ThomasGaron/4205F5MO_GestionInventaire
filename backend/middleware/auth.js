import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Token manquant" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    console.error("JWT error:", err.message);
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
}

export const requireRole = (role) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Non authentifié" });
  if (req.user.role !== role)
    return res.status(403).json({ message: "Accès refusé" });
  next();
};
