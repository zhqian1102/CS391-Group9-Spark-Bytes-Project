import express from 'express';
import supabase from '../config/supabase.js';

const router = express.Router();

// Middleware to get user from token
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error('Auth error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.userId = user.id;
    req.userEmail = user.email;
    next();
  } catch (err) {
    console.error('Authentication failed:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// GET /api/user/profile
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    console.log('Fetching profile for user:', req.userId);
    
    const { data, error } = await supabase
      .from('profiles')  
      .select('*')
      .eq('id', req.userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return res.status(400).json({ error: error.message });
    }
    
    if (!data) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    const userProfile = {
      id: data.id,
      name: data.name,
      email: data.email,
      createdAt: data.created_at
    };
    
    console.log('Profile fetched successfully');
    res.json({ success: true, user: userProfile });
    
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/user/profile
router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const { name } = req.body;
    
    console.log('Updating profile for user:', req.userId);
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const { data, error } = await supabase
      .from('profiles')  // ← CHANGED FROM 'users' TO 'profiles'
      .update({ name: name.trim() })
      .eq('id', req.userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating profile:', error);
      return res.status(400).json({ error: error.message });
    }
    
    if (!data) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    const userProfile = {
      id: data.id,
      name: data.name,
      email: data.email,
      createdAt: data.created_at
    };
    
    console.log('Profile updated successfully');
    
    res.json({ 
      success: true, 
      user: userProfile, 
      message: 'Profile updated successfully' 
    });
    
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
