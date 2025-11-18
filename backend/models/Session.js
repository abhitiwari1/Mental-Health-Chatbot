import mongoose from "mongoose";

const { Schema } = mongoose;

const SessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    deviceInfo: { type: String },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for automatic cleanup of expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.model("Session", SessionSchema);
