import express from "express";
import { login, verify } from "../controllers/auth.js";
import { verifyToken } from "../middleware/auth.js"; // Assuming you have auth middleware

const router = express.Router();

router.post("/login", login);
router.get("/verify",verifyToken, verify);

export default router;
