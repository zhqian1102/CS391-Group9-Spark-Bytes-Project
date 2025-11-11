import supabase from "../config/supabase.js";

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      console.error("Supabase token validation failed:", error);
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    req.user = data.user;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
};
