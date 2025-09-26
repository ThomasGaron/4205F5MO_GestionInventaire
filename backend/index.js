import express from "express";
import cors from "cors";
import "dotenv/config";
import authRoutes from "./routes/auth.routes.js";
import { requireAuth, requireRole } from "./middleware/auth.js";
import db from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());


app.get("/", (req, res) => res.send("API OK"));

// Auth
app.use("/api/auth", authRoutes);

// Exemple de route admin protégée
app.get("/api/admin/ping", requireAuth, requireRole("admin"), (req, res) => {
  res.json({ ok: true, user: req.user });
});

// Ping DB (debug)
app.get("/ping-db", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT NOW()");
    res.json({ ok: true, now: rows[0].now });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend lancé sur http://localhost:${PORT}`);
});
