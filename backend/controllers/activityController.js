import { Activity } from "../models/Activity.js";
import { logger } from "../utils/logger.js";
import { sendActivityCompletionEvent } from "../utils/inngestEvents.js";

// Log a new activity
export const logActivity = async (req, res, next) => {
  try {
    const { type, name, description, duration, difficulty, feedback } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const activity = new Activity({
      userId,
      type,
      name,
      description,
      duration,
      difficulty,
      feedback,
      timestamp: new Date(),
    });

    await activity.save();
    logger.info(`Activity logged for user ${userId}`);

    await sendActivityCompletionEvent({
      userId,
      id: activity._id,
      type,
      name,
      duration,
      difficulty,
      feedback,
      timestamp: activity.timestamp,
    });

    res.status(201).json({
      success: true,
      data: [activity], // must return array for frontend
    });
  } catch (error) {
    next(error);
  }
};


// --------------------------------------------
// ✅ FIXED: Get Today's Activities (Timezone Safe)
// --------------------------------------------
export const getTodaysActivities = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Browser sends inverted offset
    // IST = -330
    const offset = parseInt(req.headers["x-user-timezone-offset"] ?? "-330");

    const nowUTC = new Date();

    // Convert UTC → Local
    const localNow = new Date(nowUTC.getTime() - offset * 60000);

    // Get local day start/end
    const localStart = new Date(localNow);
    localStart.setHours(0, 0, 0, 0);

    const localEnd = new Date(localNow);
    localEnd.setHours(23, 59, 59, 999);

    // Convert Local → UTC for DB query
    const startUTC = new Date(localStart.getTime() + offset * 60000);
    const endUTC = new Date(localEnd.getTime() + offset * 60000);

    const activities = await Activity.find({
      userId,
      timestamp: { $gte: startUTC, $lte: endUTC },
    }).sort({ timestamp: -1 });

    res.status(200).json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};
