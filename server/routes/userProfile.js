const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Middleware to get user from token
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error) return res.status(401).json({ error: 'Invalid token' });
  
  req.userId = user.id;
  next();
};

// GET profile
router.get('/profile', authenticateUser, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.userId)
    .single();
    
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, user: data });
});

// PUT profile
router.put('/profile', authenticateUser, async (req, res) => {
  const { name, phone, bio, dietaryPreferences, notificationSettings } = req.body;
  
  const { data, error } = await supabase
    .from('users')
    .update({ name, phone, bio, dietary_preferences: dietaryPreferences, notification_settings: notificationSettings })
    .eq('id', req.userId)
    .select()
    .single();
    
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, user: data, message: 'Profile updated' });
});

module.exports = router;