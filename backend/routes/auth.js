import { Router } from "express";
import { register, login, logout } from "../controllers/authController.js";
import { auth } from "../middleware/auth.js";

const router = Router();

// ✅ Register a new user
router.post("/register", register);

// ✅ User login
router.post("/login", login);

// ✅ User logout (protected)
router.post("/logout", auth, logout);

// ✅ Get authenticated user info
router.get("/me", auth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
