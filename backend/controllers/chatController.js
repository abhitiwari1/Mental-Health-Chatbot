import { ChatSession } from "../models/ChatSession.js";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger.js";
import { User } from "../models/User.js";
import { Types } from "mongoose";
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

// Initialize GROQ client
const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Create a new chat session for the user
 */
export const createChatSession = async (req, res) => {
  try {
    if (!req.user?._id && !req.user?.id)
      return res.status(401).json({ message: "Unauthorized" });

    const userId = new Types.ObjectId(req.user._id || req.user.id);
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const session = new ChatSession({
      sessionId: uuidv4(),
      userId,
      messages: [],
    });

    await session.save();
    res
      .status(201)
      .json({ message: "Chat session created", sessionId: session.sessionId });
  } catch (error) {
    logger.error("Error creating chat session:", error);
    res.status(500).json({ message: "Error creating chat session" });
  }
};

/**
 * Get all chat sessions for the authenticated user
 */
export const getAllChatSessions = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const userId = new Types.ObjectId(req.user._id || req.user.id);
    const sessions = await ChatSession.find({ userId }).sort({ startTime: -1 });

    res.json(sessions);
  } catch (error) {
    logger.error("Error fetching chat sessions:", error);
    res.status(500).json({ message: "Error fetching chat sessions" });
  }
};

/**
 * Send a message in a chat session and get AI response using GROQ
 */
export const sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;

    if (!message) return res.status(400).json({ message: "Message is required" });

    const userId = new Types.ObjectId(req.user._id || req.user.id);
    const session = await ChatSession.findOne({ sessionId });
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (!session.userId.equals(userId))
      return res.status(403).json({ message: "Unauthorized" });

    // Step 1: Send message to GROQ for AI completion
    const completion = await groqClient.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        { role: "user", content: message },
      ],
    });

    const response = completion.choices?.[0]?.message?.content?.trim() || "";

    // Save messages
    session.messages.push({ role: "user", content: message });
    session.messages.push({ role: "assistant", content: response });
    await session.save();

    res.json({ response });
  } catch (error) {
    logger.error("Error sending message:", error);
    res.status(500).json({ message: "Error sending message" });
  }
};

/**
 * Get a specific chat session by ID
 */
export const getChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const chatSession = await ChatSession.findOne({ sessionId });
    if (!chatSession) return res.status(404).json({ message: "Chat session not found" });
    res.json(chatSession);
  } catch (error) {
    logger.error("Error fetching chat session:", error);
    res.status(500).json({ message: "Error fetching chat session" });
  }
};

/**
 * Get chat history for a session
 */
export const getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = new Types.ObjectId(req.user._id || req.user.id);

    const session = await ChatSession.findOne({ sessionId }).lean();
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (!session.userId.equals(userId))
      return res.status(403).json({ message: "Unauthorized" });

    const messages = Array.isArray(session.messages)
      ? session.messages.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
          metadata: m.metadata || {},
        }))
      : [];

    res.json(messages);
  } catch (error) {
    logger.error("Error fetching chat history:", error);
    res.status(500).json({ message: "Error fetching chat history" });
  }
};
