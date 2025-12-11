import React, { createContext, useState, useContext, useEffect } from "react";
import supabase from "../config/supabase";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if Supabase is configured
    if (!supabase) {
      console.log("Supabase not configured, using localStorage fallback");
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
      return;
    }

    // INSTANT LOAD: Load from localStorage immediately (no flicker!)
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Get initial session and fetch fresh data from database
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Fetch complete profile from database
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const fallbackName =
          session.user.user_metadata?.name ||
          session.user.email.split("@")[0];
        const fallbackUserType =
          session.user.user_metadata?.userType || "student";

        const userData = profile
          ? {
              id: session.user.id,
              email: session.user.email,
              name: profile.name || fallbackName,
              userType: profile.user_type || fallbackUserType,
              profilePicture: profile.profile_picture || null,
              dietaryPreferences: profile.dietary_preferences || [],
            }
          : {
              id: session.user.id,
              email: session.user.email,
              name: fallbackName,
              userType: fallbackUserType,
              profilePicture: null,
              dietaryPreferences: [],
            };
        
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Just trigger a refresh instead of setting basic data
        refreshUser();
      } else {
        setUser(null);
        localStorage.removeItem("user");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Refresh profile when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && user) {
        await refreshUser();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const login = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { success: false, error: error.message };

    const user = data.user;
    const userData = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email.split("@")[0],
      userType: user.user_metadata?.userType || "student",
      profilePicture: null,  // Add these as null for now
      dietaryPreferences: [], // Add empty array
    };

    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    return { success: true, user: userData };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

  const register = async (name, email, password, userType) => {
    try {
      // Always use backend API for registration to ensure email verification
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, userType }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || "Registration failed" };
      }

      // Return success, but don't set user yet - they need to verify
      return {
        success: true,
        needsVerification: true,
        message: "Verification code sent to your email",
        email: email,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Registration failed",
      };
    }
  };

  const verifyEmail = async (email, code) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";
      const response = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || "Verification failed" };
      }

      // Do not auto-login; let the user sign in after verification
      return {
        success: true,
        message: data.message || "Email verified successfully!",
        user: data.user,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Verification failed",
      };
    }
  };

  const resendVerificationCode = async (email) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";
      const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || "Failed to resend code",
        };
      }

      return {
        success: true,
        message: "New verification code sent to your email",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Failed to resend code",
      };
    }
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem("user");
  };

  const updateProfile = async (updates) => {
    try {
      // Update name and/or profilePicture via backend API
      if (updates.name || updates.profilePicture !== undefined) {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
        
        let token = null;
        
        if (supabase) {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.error('Error getting session:', error);
          }
          token = session?.access_token;
        }
        
        if (!token) {
          console.error('No authentication token available');
          return { success: false, error: 'No authentication token' };
        }
        
        // Build request body
        const requestBody = {};
        if (updates.name) requestBody.name = updates.name;
        if (updates.profilePicture !== undefined) requestBody.profilePicture = updates.profilePicture;
        if (updates.dietaryPreferences !== undefined) requestBody.dietaryPreferences = updates.dietaryPreferences;
        
        const response = await fetch(`${API_URL}/api/user/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          console.error('Profile update failed:', data);
          return { success: false, error: data.error || 'Failed to update profile' };
        }
        
        // Update local state
        const updatedUser = {
          ...user,
          name: data.user.name,
          profilePicture: data.user.profilePicture,
          dietaryPreferences: data.user.dietaryPreferences || user.dietaryPreferences
        };
        
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        return { success: true, user: updatedUser };
      }
      
      // For other fields (dietaryPreferences only), just store in localStorage
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return { success: true, user: updatedUser };
    } catch (err) {
      console.error('Update profile error:', err);
      return { success: false, error: err.message };
    }
  };

  const refreshUser = async () => {
    try {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Load profile from database
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

          if (profile) {
            const fallbackName =
              session.user.user_metadata?.name ||
              user?.name ||
              session.user.email.split("@")[0];
            const fallbackUserType =
              session.user.user_metadata?.userType ||
              user?.userType ||
              "student";

            const userData = {
              id: session.user.id,
              email: session.user.email,
              name: profile.name || fallbackName,
              userType: profile.user_type || fallbackUserType,
              profilePicture: profile.profile_picture || user?.profilePicture || null,
              dietaryPreferences: profile.dietary_preferences || user?.dietaryPreferences || [],
            };
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
            return { success: true };
          }
        }
      }

      // Fallback to localStorage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        return { success: true };
      }
      return { success: false };
    } catch (err) {
      console.error('Error refreshing user:', err);
      return { success: false };
    }
  };

  const value = {
    user,
    login,
    register,
    verifyEmail,
    resendVerificationCode,
    logout,
    updateProfile,
    refreshUser,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
