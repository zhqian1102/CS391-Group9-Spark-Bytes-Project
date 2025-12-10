import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

// Middleware to get user from token
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.userId = user.id;
    req.userEmail = user.email;
    next();
  } catch (err) {
    console.error("Authentication failed:", err);
    return res.status(401).json({ error: "Authentication failed" });
  }
};

// GET /api/user/profile
router.get("/profile", authenticateUser, async (req, res) => {
  try {
    // console.log('📥 Fetching profile for user:', req.userId);

    // Try profiles table first
    let { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", req.userId)
      .single();

    // If profile doesn't exist, try users table and create profile
    if (error && error.code === "PGRST116") {
      console.log("⚠️ Profile not found, checking users table...");

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", req.userId)
        .single();

      if (userData) {
        console.log("✅ Found user in users table, creating profile...");

        // Create profile from users table
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: userData.id,
            name: userData.name,
            email: userData.email,
            created_at: userData.created_at || new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error("❌ Failed to create profile:", insertError);
          return res.status(500).json({ error: "Failed to create profile" });
        }

        data = newProfile;
        error = null;
      } else {
        return res.status(404).json({ error: "User not found in any table" });
      }
    }

    if (error) {
      console.error("❌ Profile fetch error:", error);
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Map to camelCase for frontend
    const userProfile = {
      id: data.id,
      name: data.name,
      email: data.email,
      userType: data.user_type || "student",
      profilePicture: data.profile_picture || null,
      dietaryPreferences: data.dietary_preferences || [],
      createdAt: data.created_at,
    };

    // console.log('✅ Profile fetched successfully');
    res.json({ success: true, user: userProfile });
  } catch (err) {
    console.error("❌ Profile fetch error:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// PUT /api/user/profile
router.put("/profile", authenticateUser, async (req, res) => {
  try {
    const { name, profilePicture, dietaryPreferences } = req.body;

    // console.log('📝 Updating profile for user:', req.userId);
    // console.log('Updates:', {
    //   name,
    //   profilePicture: profilePicture ? 'URL provided' : 'null',
    //   dietaryPreferences
    // });

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Name is required" });
    }

    // Build update object with snake_case for database
    const updates = {
      name: name.trim(),
      updated_at: new Date().toISOString(),
    };

    // Add profile picture URL (not base64!)
    if (profilePicture !== undefined) {
      updates.profile_picture = profilePicture;
    }

    // Add dietary preferences
    if (dietaryPreferences !== undefined) {
      updates.dietary_preferences = dietaryPreferences;
    }

    // Update in profiles table
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", req.userId)
      .select()
      .single();

    if (error) {
      console.error("❌ Profile update error:", error);
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Map to camelCase for frontend
    const userProfile = {
      id: data.id,
      name: data.name,
      email: data.email,
      userType: data.user_type || "student",
      profilePicture: data.profile_picture || null,
      dietaryPreferences: data.dietary_preferences || [],
      createdAt: data.created_at,
    };

    // console.log("✅ Profile updated successfully");
    res.json({
      success: true,
      user: userProfile,
      message: "Profile updated successfully",
    });
  } catch (err) {
    console.error("❌ Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
