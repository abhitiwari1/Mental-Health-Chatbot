import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { serve } from "inngest/express";
import { errorHandler } from "./middleware/errorHandler.js";
import { logger } from "./utils/logger.js";
import authRouter from "./routes/auth.js";
import chatRouter from "./routes/chat.js";
import moodRouter from "./routes/mood.js";
import activityRouter from "./routes/activity.js";
import { connectDB } from "./utils/db.js";
import { inngest } from "./inngest/client.js";
import { functions as inngestFunctions } from "./inngest/functions.js";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(morgan("dev")); // HTTP request logger

// Set up Inngest endpoint
app.use(
  "/api/inngest",
  serve({ client: inngest, functions: inngestFunctions })
);
// OnaF6EGHhgYY9OPv

// Routes
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.use("/auth", authRouter);
app.use("/api/chat", chatRouter);
app.use("/api/mood", moodRouter);
app.use("/api/activity", activityRouter);

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();

    // Then start the server
    const PORT = process.env.PORT || 3004;
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(
        `Inngest endpoint available at http://localhost:${PORT}/api/inngest`
      );
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();