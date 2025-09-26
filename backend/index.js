import express from "express";
import dotenv from "dotenv";
import userRoute from "./routes/user-routes.js";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT;

app.use(cors());

app.use("/api/user", userRoute);

app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
