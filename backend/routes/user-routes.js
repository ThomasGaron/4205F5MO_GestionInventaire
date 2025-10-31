import express from "express";
import userController from "../controllers/users-controllers.js";
import checkAuth from "../handlers/check-auth.js";

const router = express.Router();

router.post("/login", userController.Login);

router.post("/signUp", userController.SignUp);

router.use(checkAuth);

router.patch("/modification/:id", userController.Modification);

router.delete("/supprimer/:id", userController.Supprimer);

router.get("/getTout", userController.GetTout);

export default router;
