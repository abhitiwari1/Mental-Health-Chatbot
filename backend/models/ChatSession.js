import mongoose from "mongoose";

const { Schema } = mongoose;

const chatMessageSchema = new Schema({
  role: { type: String, required: true, enum: ["user", "assistant"] },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: {
    analysis: Schema.Types.Mixed,
    currentGoal: String,
    progress: {
      emotionalState: String,
      riskLevel: Number,
    },
  },
});

const chatSessionSchema = new Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  startTime: { type: Date, default: Date.now },
  status: { type: String, enum: ["active", "completed", "archived"], default: "active" },
  messages: [chatMessageSchema],
});

export const ChatSession = mongoose.model("ChatSession", chatSessionSchema);
