import mongoose from "mongoose";

const { Schema } = mongoose;

const chatMessageSchema = new Schema({
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    technique: String,
    goal: String,
    progress: [Schema.Types.Mixed],
  },
});

const chatSessionSchema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    messages: [chatMessageSchema],
  },
  {
    timestamps: true,
  }
);

export const ChatSession = mongoose.model("ChatSession", chatSessionSchema);
