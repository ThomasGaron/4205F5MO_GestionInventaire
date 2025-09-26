import express from "express";
import userController from "../controllers/users-controllers.js";

const router = express.Router();

router.post("/login", userController.Login);

export default router;
