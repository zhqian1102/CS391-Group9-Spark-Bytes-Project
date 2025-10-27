import React, { createContext, useState, useContext, useEffect } from 'react';
import supabase from '../config/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if Supabase is configured
    if (!supabase) {
      console.log('Supabase not configured, using localStorage fallback');
      // Check localStorage for existing session
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email.split('@')[0],
          userType: session.user.user_metadata?.userType || 'student'
        });
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email.split('@')[0],
          userType: session.user.user_metadata?.userType || 'student'
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      if (!supabase) {
        // Fallback to localStorage (for demo without Supabase)
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const foundUser = storedUsers.find(u => u.email === email && u.password === password);
        
        if (foundUser) {
          const userData = { ...foundUser };
          delete userData.password;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          return { success: true, user: userData };
        }
        return { success: false, error: 'Invalid email or password' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email.split('@')[0],
        userType: data.user.user_metadata?.userType || 'student'
      };

      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  };

  const register = async (name, email, password, userType) => {
    try {
      if (!supabase) {
        // Fallback to localStorage (for demo without Supabase)
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Check if user exists
        if (storedUsers.find(u => u.email === email)) {
          return { success: false, error: 'User already exists with this email' };
        }

        const newUser = {
          id: Date.now().toString(),
          name,
          email,
          password, // In real app, this would be hashed
          userType,
          createdAt: new Date().toISOString()
        };

        storedUsers.push(newUser);
        localStorage.setItem('users', JSON.stringify(storedUsers));

        const userData = { ...newUser };
        delete userData.password;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        return { success: true, user: userData };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            userType
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const userData = {
        id: data.user.id,
        email: data.user.email,
        name,
        userType
      };

      setUser(userData);
      return { 
        success: true, 
        user: userData,
        message: 'Please check your email to verify your account'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
