import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import supabase from "../config/supabase.js";

const router = express.Router();

// Temporary in-memory storage (used only when Supabase is not connected)
const users = [];

// Register endpoint
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, userType } = req.body;

    // Validate BU email
    if (!email.endsWith("@bu.edu")) {
      return res
        .status(400)
        .json({ message: "Please use a valid BU email address" });
    }

    // Validate password length
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    if (!supabase) {
      // In-memory storage logic
      const existingUser = users.find((u) => u.email === email);
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "User already exists with this email" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = {
        id: users.length + 1,
        name,
        email,
        password: hashedPassword,
        userType,
        createdAt: new Date(),
      };

      users.push(newUser);

      const token = jwt.sign(
        { id: newUser.id, email: newUser.email },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "7d" }
      );

      return res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          userType: newUser.userType,
        },
      });
    }

    // Supabase logic would go here
    res.status(501).json({
      message: "Supabase authentication not yet implemented on backend",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate BU email
    if (!email.endsWith("@bu.edu")) {
      return res
        .status(400)
        .json({ message: "Please use a valid BU email address" });
    }

    if (!supabase) {
      // In-memory storage logic
      const user = users.find((u) => u.email === email);
      if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      user.lastLogin = new Date();

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "7d" }
      );

      return res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          userType: user.userType,
        },
      });
    }

    // Supabase logic would go here
    res.status(501).json({
      message: "Supabase authentication not yet implemented on backend",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

export default router;
