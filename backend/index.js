import express from "express";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("produits")
      .select("*")
      .limit(1);
    if (error) throw error;

    res.json({
      message: "Connexion réussie",
      data,
    });
  } catch (err) {
    res.status(500).json({
      message: "Erreur de connexion",
      error: err.message || err.toString(),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
