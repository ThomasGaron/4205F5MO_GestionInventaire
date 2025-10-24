import express from "express";
import userController from "../controllers/users-controllers.js";

const router = express.Router();

router.post("/login", userController.Login);

router.post("/signUp", userController.SignUp);

router.patch("/modification/:id", userController.Modification);

router.delete("/supprimer/:id", userController.Supprimer);

export default router;
