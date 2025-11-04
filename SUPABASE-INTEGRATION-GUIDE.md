# Supabase Integration Setup Guide

## Overview
The application now integrates with Supabase to store user authentication data in the cloud. Users will appear in both:
1. **Supabase Authentication Tab** - For login credentials
2. **Users Table** - For additional profile information

## Setup Steps

### 1. Create the Users Table in Supabase

1. Go to your Supabase project: https://app.supabase.com/project/wgyrpqwzmruwvpqfpqpo
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the SQL from `SUPABASE-USERS-TABLE-SETUP.sql`
5. Click **Run** to execute the SQL

This will create:
- ✅ `users` table with proper schema
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for performance
- ✅ Automatic timestamp updates

### 2. Verify the Table

1. Go to **Table Editor** in Supabase
2. You should see a new table called `users`
3. The table should have these columns:
   - `id` (UUID) - Links to auth.users
   - `email` (Text)
   - `name` (Text)
   - `user_type` (Text)
   - `email_verified` (Boolean)
   - `created_at` (Timestamp)
   - `updated_at` (Timestamp)

### 3. Test the Integration

1. Make sure your server is running: `npm run dev`
2. Go to the signup page: http://localhost:3000
3. Register a new user with a @bu.edu email
4. Complete email verification
5. Check Supabase Dashboard:
   - **Authentication > Users** - You should see the user here
   - **Table Editor > users** - You should see the user's profile here

## How It Works

### Registration Flow
1. User signs up with email, name, and password
2. Verification code sent to email
3. User enters verification code
4. Backend creates user in **Supabase Auth** (`auth.users`)
5. Backend creates user profile in **users table**
6. User is logged in and redirected

### Login Flow
1. User enters email and password
2. Backend checks **Supabase Auth** first
3. If successful, fetches user profile from **users table**
4. Returns user data and JWT token
5. Falls back to local storage if Supabase fails

### Dual Storage System
The system now uses both:
- **Supabase** (primary) - Cloud-based, scalable
- **Local File Storage** (fallback) - `server/data/users.json`

If Supabase is unavailable, the system automatically falls back to local storage.

## Viewing Users in Supabase Dashboard

### Authentication Tab
Go to: **Authentication > Users**
- See all registered users
- View email verification status
- See last sign-in time
- Manually verify/block users if needed

### Users Table
Go to: **Table Editor > users**
- View user profiles
- See user type (student/organizer)
- Check registration dates
- Edit user information if needed

## Benefits of Supabase Integration

✅ **Centralized Data** - All user data in one place
✅ **Real-time Dashboard** - View users instantly
✅ **Scalability** - Handles thousands of users
✅ **Security** - Row Level Security enabled
✅ **Backup** - Automatic backups by Supabase
✅ **Multi-instance** - Works with multiple servers
✅ **Fallback** - Local storage backup if needed

## Troubleshooting

### Users not appearing in Supabase?
- Check that `SUPABASE_SERVICE_ROLE_KEY` is set in `.env`
- Verify the SQL script ran successfully
- Check server logs for errors
- Try registering a new test user

### Login not working?
- Verify email and password are correct
- Check Supabase **Authentication > Users** to see if user exists
- Check server console for error messages
- Try resetting password via Supabase dashboard

### Table permissions error?
- Ensure RLS policies are created (run SQL script again)
- Check that service role has permissions
- Verify table exists in **Table Editor**

## Next Steps

After setup:
1. ✅ Test registration with a new user
2. ✅ Verify user appears in Supabase dashboard
3. ✅ Test login with the registered user
4. ✅ Check that user data persists after server restart
5. ✅ Commit changes to git

## Migration from Local Storage

If you have existing users in `server/data/users.json`, you can migrate them:

1. Export existing users from the JSON file
2. For each user, create a Supabase auth user
3. Insert their profile into the users table
4. Test login to verify migration

Note: This is optional - the dual storage system allows both to coexist.
