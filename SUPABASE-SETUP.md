# 🚀 Supabase Setup Guide for Spark Bytes

## Why Supabase?
- ✅ Easy to set up (5 minutes!)
- ✅ Built-in authentication
- ✅ Free tier (perfect for development)
- ✅ No SSL/IP issues like MongoDB
- ✅ Automatic email verification
- ✅ Real-time database

---

## 📝 Step-by-Step Setup

### 1. Create a Supabase Account
Go to: https://supabase.com
- Click "Start your project"
- Sign up with GitHub or email
- It's FREE! ✨

### 2. Create a New Project
- Click "New Project"
- Choose your organization (or create one)
- Project Name: `spark-bytes`
- Database Password: (save this - you won't need it often)
- Region: Choose closest to you (e.g., East US)
- Click "Create new project" (takes ~2 minutes)

### 3. Get Your API Keys
After your project is created:
1. Go to **Settings** (⚙️ icon in sidebar)
2. Click on **API**
3. You'll see two keys:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (a long string starting with `eyJ...`)

### 4. Configure Your Project

#### A. Update Backend `.env` file:
```env
PORT=5001
JWT_SECRET=spark-bytes-secret-key-change-this-in-production
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

#### B. Create `client/.env.local` file:
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Set Up Authentication

In your Supabase dashboard:

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Go to **Authentication** → **URL Configuration**
4. Set **Site URL** to: `http://localhost:3000`
5. Add to **Redirect URLs**: `http://localhost:3000/**`

### 6. Configure Email Restrictions (BU Email Only)

In Supabase dashboard:
1. Go to **Authentication** → **Policies**
2. We'll handle BU email validation in the frontend code
3. (Or you can set up Row Level Security policies later)

### 7. Optional: Disable Email Confirmation (for development)

For easier testing during development:
1. Go to **Authentication** → **Email Templates**
2. Scroll to "Email Settings"
3. Toggle OFF "Enable email confirmations"
4. This lets you test without verifying emails

---

## 🧪 Test Your Setup

After updating your `.env` files:

1. Stop the running servers (Ctrl+C)
2. Run: `npm run dev`
3. Open: http://localhost:3000
4. Try to create an account with a `@bu.edu` email
5. You should be able to register and login!

---

## 📊 View Your Users

In Supabase dashboard:
1. Go to **Authentication** → **Users**
2. See all registered users
3. Can manually verify, delete, or edit users

---

## 🎯 What Works Now

✅ **User Registration** - Creates accounts in Supabase
✅ **User Login** - Authenticates against Supabase
✅ **Session Management** - Automatic token refresh
✅ **Email Validation** - Built-in email verification
✅ **User Metadata** - Stores name and userType

---

## 💡 Fallback Mode

If you haven't set up Supabase yet, the app will work in **localStorage mode**:
- Users stored temporarily in browser
- Perfect for testing the UI
- Data clears when you clear browser data

---

## 🔐 Security Notes

- The **anon key** is safe to use in frontend code
- Supabase has Row Level Security (RLS) policies
- We'll add RLS policies later for production
- Never commit `.env` files to Git (already in .gitignore)

---

## 📚 Next Steps

Once authentication works:
1. Create a database table for Events
2. Set up Row Level Security policies
3. Build the events feed
4. Add real-time subscriptions

---

## 🆘 Troubleshooting

**Issue**: "Invalid API key"
- Double-check you copied the **anon** key, not the **service_role** key

**Issue**: "CORS error"
- Make sure Site URL includes `http://localhost:3000`

**Issue**: Email not sending
- Check **Authentication** → **Email Templates** → SMTP settings

---

## 🎉 You're All Set!

Once you add your Supabase credentials, everything will work automatically!

Need help? Check: https://supabase.com/docs
