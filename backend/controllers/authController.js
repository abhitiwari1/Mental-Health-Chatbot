import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Session } from "../models/Session.js";

// Register a new user
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({
      user: { _id: user._id, name: user.name, email: user.email },
      message: "User registered successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password." });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Invalid email or password." });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    // Create session
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    const session = new Session({
      userId: user._id,
      token,
      expiresAt,
      deviceInfo: req.headers["user-agent"],
    });
    await session.save();

    // ✅ Return access_token (frontend expects this key)
    res.json({
      user: { _id: user._id, name: user.name, email: user.email },
      access_token: token,
      message: "Login successful",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Logout user
export const logout = async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (token) await Session.deleteOne({ token });
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
