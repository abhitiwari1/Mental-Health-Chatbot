import express from "express";
import { auth } from "../middleware/auth.js";
import { logActivity, getTodaysActivities } from "../controllers/activityController.js";

const router = express.Router();

// ✅ All routes below require authentication
router.use(auth);

// ✅ Route: Log a new user activity
router.post("/", logActivity);

router.get("/today", getTodaysActivities);

export default router;
