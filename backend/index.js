import express from "express";

import dotenv from "dotenv";
import userRoute from "./routes/user-routes.js";
import produitRoute from "./routes/produit-routes.js";
import commandesRoutes from "./routes/commandes.js";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(cors());

app.use("/api/user", userRoute);

app.use("/api/produit", produitRoute);

app.use("/api/commandes", commandesRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend lancé sur http://localhost:${PORT}`);
});
