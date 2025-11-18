import express from "express";
import {
  createChatSession,
  getChatSession,
  sendMessage,
  getChatHistory,
  getAllChatSessions,
} from "../controllers/chatController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// ✅ Apply authentication middleware to all chat routes
router.use(auth);

// ✅ Create a new chat session
router.post("/session", createChatSession);

// ✅ Get all chat sessions for logged-in user
router.get("/sessions", getAllChatSessions);

// ✅ Get a specific chat session by ID
router.get("/sessions/:sessionId", getChatSession);

// ✅ Send a message in a specific chat session
router.post("/sessions/:sessionId/messages", auth, sendMessage);

// ✅ Get complete chat history for a session
router.get("/sessions/:sessionId/history", getChatHistory);

export default router;
