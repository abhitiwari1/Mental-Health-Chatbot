import mongoose from "mongoose";

const { Schema } = mongoose;

const moodSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    note: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying of user's mood history
moodSchema.index({ userId: 1, timestamp: -1 });

export const Mood = mongoose.model("Mood", moodSchema);
