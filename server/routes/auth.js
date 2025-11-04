import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import supabase from "../config/supabase.js";

const router = express.Router();

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to store users data
const USERS_FILE = path.join(__dirname, "../data/users.json");

// Ensure data directory exists
const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load users from file or initialize empty array
let users = [];
try {
  if (fs.existsSync(USERS_FILE)) {
    const data = fs.readFileSync(USERS_FILE, "utf8");
    users = JSON.parse(data);
    console.log(`📚 Loaded ${users.length} users from storage`);
  }
} catch (error) {
  console.error("Error loading users:", error);
  users = [];
}

// Function to save users to file
const saveUsers = () => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Error saving users:", error);
  }
};

const verificationCodes = new Map(); // Store verification codes: email -> { code, name, password, userType, expiresAt }

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // You can use other services like SendGrid, Mailgun, etc.
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASSWORD, // Your email password or app-specific password
  },
});

// Generate a 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register endpoint - Step 1: Send verification code
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

    // Check if user already exists
    if (!supabase) {
      const existingUser = users.find((u) => u.email === email);
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "User already exists with this email" });
      }
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = Date.now() + 10 * 60 * 1000; // Code expires in 10 minutes

    // Store verification code with user data
    verificationCodes.set(email, {
      code: verificationCode,
      name,
      password,
      userType,
      expiresAt,
    });

    // Send verification email
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Spark Bytes - Email Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to Spark Bytes!</h2>
            <p>Hi ${name},</p>
            <p>Thank you for registering with Spark Bytes. To complete your registration, please use the verification code below:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #4CAF50; letter-spacing: 5px; margin: 0;">${verificationCode}</h1>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this verification, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">© 2025 Spark Bytes | Boston University</p>
          </div>
        `,
      });

      res.status(200).json({
        message: "Verification code sent to your email",
        email: email,
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      res.status(500).json({
        message:
          "Failed to send verification email. Please check your email configuration.",
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// Verify email and complete registration
router.post("/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;

    // Check if verification code exists
    const verificationData = verificationCodes.get(email);
    if (!verificationData) {
      return res
        .status(400)
        .json({ message: "No verification code found for this email" });
    }

    // Check if code has expired
    if (Date.now() > verificationData.expiresAt) {
      verificationCodes.delete(email);
      return res
        .status(400)
        .json({ message: "Verification code has expired. Please register again." });
    }

    // Verify the code
    if (verificationData.code !== code) {
      return res
        .status(400)
        .json({ message: "Invalid verification code" });
    }

    // Code is valid, create the user account
    const { name, password, userType } = verificationData;

    // Try to create user in Supabase first
    if (supabase) {
      try {
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Mark email as confirmed
          user_metadata: {
            name,
            userType
          }
        });

        if (authError) {
          console.error("Supabase auth error:", authError);
          throw authError;
        }

        // Also store in custom users table for easy querying
        const { data: userData, error: dbError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email,
              name,
              user_type: userType,
              email_verified: true,
              created_at: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (dbError) {
          console.error("Supabase database error:", dbError);
          // Continue anyway, user is created in auth
        }

        // Remove verification code
        verificationCodes.delete(email);

        // Generate JWT token
        const token = jwt.sign(
          { id: authData.user.id, email: authData.user.email },
          process.env.JWT_SECRET || "your-secret-key",
          { expiresIn: "7d" }
        );

        console.log("✅ User created in Supabase:", email);

        return res.status(201).json({
          message: "Email verified and user registered successfully",
          token,
          user: {
            id: authData.user.id,
            name,
            email,
            userType
          },
        });
      } catch (supabaseError) {
        console.error("Supabase error, falling back to local storage:", supabaseError);
        // Fall through to local storage
      }
    }

    // Fallback: Use local file storage
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: users.length + 1,
      name,
      email,
      password: hashedPassword,
      userType,
      createdAt: new Date(),
      emailVerified: true,
    };

    users.push(newUser);

    // Save users to file for persistence
    saveUsers();

    // Remove verification code
    verificationCodes.delete(email);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    console.log("✅ User created in local storage:", email);

    return res.status(201).json({
      message: "Email verified and user registered successfully",
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        userType: newUser.userType,
      },
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ message: "Server error during verification" });
  }
});

// Resend verification code
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    // Check if there's existing verification data
    const existingData = verificationCodes.get(email);
    if (!existingData) {
      return res
        .status(400)
        .json({ message: "No pending verification for this email" });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = Date.now() + 10 * 60 * 1000; // Code expires in 10 minutes

    // Update verification code
    verificationCodes.set(email, {
      ...existingData,
      code: verificationCode,
      expiresAt,
    });

    // Send verification email
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Spark Bytes - New Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">New Verification Code</h2>
            <p>Hi ${existingData.name},</p>
            <p>Here is your new verification code:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #4CAF50; letter-spacing: 5px; margin: 0;">${verificationCode}</h1>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">© 2025 Spark Bytes | Boston University</p>
          </div>
        `,
      });

      res.status(200).json({
        message: "New verification code sent to your email",
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      res.status(500).json({
        message: "Failed to send verification email",
      });
    }
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ message: "Server error" });
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

    // Try Supabase login first
    if (supabase) {
      try {
        // Authenticate with Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (!authError && authData.user) {
          // Get additional user data from users table
          const { data: userData, error: dbError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

          const user = userData || {
            name: authData.user.user_metadata?.name || email.split('@')[0],
            user_type: authData.user.user_metadata?.userType || 'student'
          };

          // Generate JWT token
          const token = jwt.sign(
            { id: authData.user.id, email: authData.user.email },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "7d" }
          );

          console.log("✅ User logged in via Supabase:", email);

          return res.json({
            message: "Login successful",
            token,
            user: {
              id: authData.user.id,
              name: user.name,
              email: authData.user.email,
              userType: user.user_type || user.userType || 'student',
            },
          });
        }
      } catch (supabaseError) {
        console.error("Supabase login error, trying local storage:", supabaseError);
        // Fall through to local storage
      }
    }

    // Fallback: Check local storage
    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Update last login
    user.lastLogin = new Date();
    saveUsers();

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    console.log("✅ User logged in via local storage:", email);

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
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

export default router;
