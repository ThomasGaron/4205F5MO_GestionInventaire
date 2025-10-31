import express from "express";

import dotenv from "dotenv";
import userRoute from "./routes/user-routes.js";
import produitRoute from "./routes/produit-routes.js";


import commandesRoutes from "./routes/commandes.routes.js";   // commandes
import invoiceRoute from "./routes/invoice-routes.js";        // factures


import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import clientsRoute from "./routes/clients-routes.js";   


dotenv.config();

const app = express();

// PDF facture
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

app.use(cors());

app.use("/api/user", userRoute);
app.use("/api/invoice", invoiceRoute);
app.use("/api/produit", produitRoute);
app.use("/api/commandes", commandesRoutes); 
app.use("/api/clients", clientsRoute);             


// Factures
app.use("/invoices", express.static(path.join(__dirname, "invoices")));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend lancé sur http://localhost:${PORT}`);
});
