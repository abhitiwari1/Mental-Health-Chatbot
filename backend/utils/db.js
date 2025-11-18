import mongoose from "mongoose";
import { logger } from "./logger.js";
import dotenv from "dotenv";
dotenv.config();


export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    logger.info("Connected to MongoDB successfully");
  } catch (error) {
    logger.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

