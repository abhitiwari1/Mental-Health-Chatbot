import express from "express";
import { auth } from "../middleware/auth.js";
import { createMood } from "../controllers/moodController.js";

const router = express.Router();

// ✅ Protect all mood routes with authentication
router.use(auth);

// ✅ Create or log a new mood entry
router.post("/", createMood);

export default router;
