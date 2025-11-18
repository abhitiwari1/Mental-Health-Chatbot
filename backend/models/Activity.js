import mongoose from "mongoose";

const { Schema } = mongoose;

const activitySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "meditation",
        "exercise",
        "walking",
        "reading",
        "journaling",
        "therapy",
      ],
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    duration: {
      type: Number,
      min: 0,
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

// Index for efficient querying
activitySchema.index({ userId: 1, timestamp: -1 });

export const Activity = mongoose.model("Activity", activitySchema);
