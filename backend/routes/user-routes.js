import express from "express";
import userController from "../controllers/users-controllers.js";

const router = express.Router();

router.post("/login", userController.Login);

router.post("/signUp", userController.SignUp);

export default router;
