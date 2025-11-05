import express from 'express';
import supabase from '../config/supabase.js';

const router = express.Router();

// Middleware to get user from token
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) return res.status(401).json({ error: 'Invalid token' });
    
    req.userId = user.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Auth failed' });
  }
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
  const { name, phone, dietaryPreferences } = req.body;
  
  const { data, error } = await supabase
    .from('users')
    .update({ 
      name, 
      phone, 
      dietary_preferences: dietaryPreferences 
    })
    .eq('id', req.userId)
    .select()
    .single();
    
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, user: data, message: 'Profile updated' });
});

export default router;