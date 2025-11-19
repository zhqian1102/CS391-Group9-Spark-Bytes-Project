import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

// GET all notifications for a user
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return res.status(500).json({ error: err.message });
  }
});

// POST create a new notification
router.post("/", async (req, res) => {
  const { user_id, type, title, message, event_id } = req.body;
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert([{ user_id, type, title, message, event_id, is_read: false }])
      .select();

    if (error) {
      console.error("Error creating notification:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data[0]);
  } catch (err) {
    console.error("Error creating notification:", err);
    return res.status(500).json({ error: err.message });
  }
});

// PATCH mark single notification as read
router.patch("/:id/read", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Error marking notification as read:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json(data[0]);
  } catch (err) {
    console.error("Error marking notification as read:", err);
    return res.status(500).json({ error: err.message });
  }
});

// PATCH mark all notifications as read for a user
router.patch("/user/:userId/read-all", async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)
      .select();

    if (error) {
      console.error("Error marking all as read:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  } catch (err) {
    console.error("Error marking all as read:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
