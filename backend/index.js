import express from "express";
import cors from "cors";
import "dotenv/config";
import authRoutes from "./routes/auth.routes.js";
import { requireAuth, requireRole } from "./middleware/auth.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("API OK"));

app.use("/api/auth", authRoutes);

// Exemple de route admin protégée
app.get("/api/admin/ping", requireAuth, requireRole("admin"), (req, res) => {
  res.json({ ok: true, user: req.user });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Backend lancé sur http://localhost:${PORT}`)
);
