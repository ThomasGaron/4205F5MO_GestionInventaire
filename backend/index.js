import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import userRoute from "./routes/user-routes.js";
import produitRoute from "./routes/produit-routes.js";
import commandesRoutes from "./routes/commandes.routes.js";
import invoiceRoute from "./routes/invoice-routes.js";
import clientsRoute from "./routes/clients-routes.js";

dotenv.config();

const app = express();

/* ---------- CORS (Render) ---------- */
const DEFAULT_ALLOWED = [
  "http://localhost:5173",
  "https://four205f5mo-gestioninventaire-1.onrender.com", // your frontend
];
// Allow override from env if you want (comma-separated)
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED.join(",")
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, cb) {
    // allow non-browser tools / same-origin / curl (no Origin header)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false, // set true ONLY if you use cookies across sites
};

// Handle JSON + CORS (including preflight)
app.use(express.json());
app.use(cors(corsOptions));

// Universal preflight handler (Express 5 safe)
app.use((req, res, next) => {
  if (req.method !== "OPTIONS") return next();

  const origin = req.headers.origin || "";
  const allowed = !origin || allowedOrigins.includes(origin);

  if (allowed) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Vary", "Origin");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PATCH,PUT,DELETE,OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    // If you use cookies across sites, also:
    // res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  return res.sendStatus(204);
});

/* ---------- Routes API ---------- */
app.use("/api/user", userRoute);
app.use("/api/invoice", invoiceRoute);
app.use("/api/produit", produitRoute);
app.use("/api/commandes", commandesRoutes);
app.use("/api/clients", clientsRoute);

/* ---------- Static invoices (optional) ---------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/invoices", express.static(path.join(__dirname, "invoices")));

/* ---------- Health ---------- */
app.get("/health", (_req, res) => res.send("ok"));

/* ---------- Start ---------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend lancé sur http://localhost:${PORT}`);
});
