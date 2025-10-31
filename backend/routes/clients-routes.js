import express from "express";
import ClientsCtrl from "../controllers/clients-controller.js";

const router = express.Router();

// Liste des clients
router.get("/", ClientsCtrl.getTousLesClients);

export default router;
