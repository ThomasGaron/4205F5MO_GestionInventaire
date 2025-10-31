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

/* ---------- CORS (Render + Vercel) ---------- */
const PROD_VERCEL = "https://4205-f5-mo-gestion-inventaire.vercel.app";
const RENDER_FRONT = "https://four205f5mo-gestioninventaire-1.onrender.com";

// ce regex permet d’autoriser automatiquement tous les sous-domaines de preview Vercel
const vercelPreviewRegex =
  /^https:\/\/4205-f5-mo-gestion-inventaire(?:-[a-z0-9-]+)?\.thomasgarons-projects\.vercel\.app$/;

const allowedOrigins = ["http://localhost:5173", PROD_VERCEL, RENDER_FRONT];

const corsOptions = {
  origin(origin, cb) {
    // requêtes locales, scripts, outils (pas d’origine)
    if (!origin) return cb(null, true);

    // autorise les origines connues
    if (allowedOrigins.includes(origin) || vercelPreviewRegex.test(origin)) {
      return cb(null, true);
    }

    // sinon, bloque
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false, // mettre true seulement si tu utilises des cookies cross-site
};

/* ---------- Middlewares ---------- */
app.use(express.json());
app.use(cors(corsOptions));

/* --- Préflight universel compatible Express 5 --- */
app.use((req, res, next) => {
  if (req.method !== "OPTIONS") return next();

  const origin = req.headers.origin || "";
  const allowed =
    !origin ||
    allowedOrigins.includes(origin) ||
    vercelPreviewRegex.test(origin);

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
  }

  return res.sendStatus(204);
});

/* ---------- Routes API ---------- */
app.use("/api/user", userRoute);
app.use("/api/invoice", invoiceRoute);
app.use("/api/produit", produitRoute);
app.use("/api/commandes", commandesRoutes);
app.use("/api/clients", clientsRoute);

/* ---------- Static invoices (optionnel) ---------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/invoices", express.static(path.join(__dirname, "invoices")));

/* ---------- Health Check ---------- */
app.get("/health", (_req, res) => res.send("ok"));

/*---------- Factures ----------*/
app.use((err, req, res, next) => {
  console.error("API ERROR:", {
    method: req.method,
    url: req.originalUrl,
    message: err?.message,
  });
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: "Erreur génération facture" });
});

/* ---------- Start ---------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend lancé sur http://localhost:${PORT}`);
});

// import express from "express";

// import dotenv from "dotenv";
// import userRoute from "./routes/user-routes.js";
// import produitRoute from "./routes/produit-routes.js";

// import commandesRoutes from "./routes/commandes.routes.js";   // commandes
// import invoiceRoute from "./routes/invoice-routes.js";        // factures

// import cors from "cors";
// import path from "path";
// import { fileURLToPath } from "url";
// import clientsRoute from "./routes/clients-routes.js";

// dotenv.config();

// const app = express();

// // PDF facture
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// app.use(cors());
// app.use(express.json());

// app.use(cors());

// app.use("/api/user", userRoute);
// app.use("/api/invoice", invoiceRoute);
// app.use("/api/produit", produitRoute);
// app.use("/api/commandes", commandesRoutes);
// app.use("/api/clients", clientsRoute);

// // Factures
// app.use("/invoices", express.static(path.join(__dirname, "invoices")));

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Backend lancé sur http://localhost:${PORT}`);
// });
