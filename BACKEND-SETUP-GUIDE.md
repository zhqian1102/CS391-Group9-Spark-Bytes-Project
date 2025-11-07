# 🚀 Backend Setup Guide - Spark Bytes

This guide will help you get the backend server running for the Spark Bytes application.

---

## 📋 Table of Contents
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Installation Steps](#installation-steps)
- [Starting the Backend](#starting-the-backend)
- [Troubleshooting](#troubleshooting)
- [Environment Variables](#environment-variables)
- [Testing the Backend](#testing-the-backend)

---

## ⚡ Quick Start

**For experienced developers:**

```bash
# From project root
npm install
npm start
```

The server should now be running at `http://localhost:5001`

---

## 📦 Prerequisites

Before starting, make sure you have:

- ✅ **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- ✅ **npm** (comes with Node.js)
- ✅ **Terminal/Command Line** access
- ✅ **Text Editor** (VS Code recommended)

### Check if you have Node.js installed:

```bash
node --version
npm --version
```

You should see version numbers. If not, install Node.js first.

---

## 🔧 Installation Steps

### Step 1: Navigate to Project Directory

Open your terminal and navigate to the project folder:

```bash
cd /path/to/CS391-Group9-Spark-Bytes-Project-main
```

### Step 2: Install Dependencies

Install all required packages for both backend and frontend:

```bash
npm run install-all
```

**OR** install them separately:

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### Step 3: Verify `.env` File

Make sure you have a `.env` file in the project root with these variables:

```env
PORT=5001
JWT_SECRET=spark-bytes-secret-key-change-this-in-production
NODE_ENV=development

# Supabase Configuration (optional - app works without it)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email Configuration (required for email verification)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

> **Note:** The app will work without Supabase using local storage. See [Email Setup](#email-setup) for email verification.

---

## 🚀 Starting the Backend

### Option 1: Start Backend Only

From the project root directory:

```bash
npm start
```

You should see:
```
🚀 Server is running on port 5001
📡 API available at http://localhost:5001
📚 Loaded X users from storage
```

### Option 2: Start Both Backend & Frontend (Recommended)

This starts both servers with one command:

```bash
npm run dev
```

This will:
- Start the backend on `http://localhost:5001`
- Start the frontend on `http://localhost:3000`
- Show output from both in the same terminal

### Option 3: Development Mode (Auto-restart)

If you're making changes to the code:

```bash
npm run server
```

This uses `nodemon` which automatically restarts the server when you save changes.

---

## 🔍 Testing the Backend

### 1. Basic Health Check

Open your browser and go to:
```
http://localhost:5001
```

You should see:
```json
{
  "message": "Welcome to Spark Bytes API",
  "version": "1.0.0",
  "endpoints": {
    "register": "POST /api/auth/register",
    "login": "POST /api/auth/login",
    "createEvent": "POST /api/events"
  }
}
```

### 2. Health Endpoint

Check:
```
http://localhost:5001/api/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2025-11-07T..."
}
```

### 3. Test with Frontend

1. Start the backend: `npm start`
2. Start the frontend: `cd client && npm start`
3. Go to `http://localhost:3000`
4. Try to login or register

If you see **"Failed to fetch"**, the backend isn't running!

---

## 🐛 Troubleshooting

### Problem: "Failed to fetch" error when logging in

**Cause:** Backend server is not running.

**Solution:**
```bash
# Make sure you're in the project root
cd /path/to/CS391-Group9-Spark-Bytes-Project-main

# Start the backend
npm start
```

---

### Problem: "Port 5001 is already in use"

**Cause:** Another process is using port 5001.

**Solution 1:** Kill the process using port 5001:

**On Mac/Linux:**
```bash
lsof -ti:5001 | xargs kill -9
```

**On Windows (PowerShell):**
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5001).OwningProcess | Stop-Process
```

**Solution 2:** Change the port in `.env`:
```env
PORT=5002
```

Then update `client/package.json` proxy:
```json
"proxy": "http://localhost:5002"
```

---

### Problem: "Cannot find module" errors

**Cause:** Dependencies not installed.

**Solution:**
```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

### Problem: Email verification not working

**Cause:** Email credentials not configured or incorrect.

**Solutions:**

1. **Check `.env` file** - Make sure `EMAIL_USER` and `EMAIL_PASSWORD` are set
2. **Use Gmail App Password** (not your regular password):
   - Go to Google Account → Security
   - Enable 2-Step Verification
   - Go to App Passwords
   - Generate password for "Mail"
   - Copy the 16-character password (remove spaces!)
   - Put it in `.env` as `EMAIL_PASSWORD`

3. **Test email configuration:**
```bash
# The server logs will show if email sending fails
# Look for: "Email sending error:" in the terminal
```

---

### Problem: "CORS" errors

**Cause:** Frontend and backend not communicating properly.

**Solution:**
1. Make sure `client/package.json` has:
   ```json
   "proxy": "http://localhost:5001"
   ```

2. Restart both servers:
   ```bash
   # Stop all terminals (Ctrl+C)
   npm run dev
   ```

---

## 🔐 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend server port | `5001` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key` |
| `NODE_ENV` | Environment mode | `development` |

### Optional Variables (Email Verification)

| Variable | Description | How to Get |
|----------|-------------|------------|
| `EMAIL_USER` | Gmail address | Your Gmail |
| `EMAIL_PASSWORD` | Gmail app password | [Gmail App Passwords](https://myaccount.google.com/apppasswords) |

### Optional Variables (Supabase)

| Variable | Description | How to Get |
|----------|-------------|------------|
| `SUPABASE_URL` | Supabase project URL | [Supabase Dashboard](https://app.supabase.com) |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key | Project Settings → API |

> See [SUPABASE-SETUP.md](./SUPABASE-SETUP.md) for detailed Supabase configuration.

---

## 📧 Email Setup

### Setting up Gmail for Email Verification

1. **Enable 2-Step Verification:**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable "2-Step Verification"

2. **Create App Password:**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and your device
   - Click "Generate"
   - Copy the 16-character password (remove spaces!)

3. **Update `.env` file:**
   ```env
   EMAIL_USER=youremail@gmail.com
   EMAIL_PASSWORD=abcdefghijklmnop
   ```

4. **Restart the server:**
   ```bash
   npm start
   ```

> **Important:** Never commit your `.env` file to Git! It's already in `.gitignore`.

---

## 📁 Backend Structure

```
server/
├── index.js              # Main server file
├── config/
│   └── supabase.js       # Supabase configuration
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── event.js          # Event routes
│   └── userProfile.js    # User profile routes
├── controllers/
│   └── eventsController.js
└── data/
    └── users.json        # Local user storage (fallback)
```

---

## 🔑 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user (sends verification code) |
| POST | `/api/auth/verify-email` | Verify email with code |
| POST | `/api/auth/resend-verification` | Resend verification code |
| POST | `/api/auth/login` | Login user |

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | Get all events |
| POST | `/api/events` | Create new event |
| GET | `/api/events/:id` | Get event by ID |

---

## 🚦 Server Status Indicators

### ✅ Server Running Successfully
```
🚀 Server is running on port 5001
📡 API available at http://localhost:5001
📚 Loaded 5 users from storage
```

### ✅ User Registration Success
```
✅ User created in Supabase: user@bu.edu
```
or
```
✅ User created in local storage: user@bu.edu
```

### ✅ User Login Success
```
✅ User logged in via Supabase: user@bu.edu
```

### ❌ Common Errors

**Port in use:**
```
Error: listen EADDRINUSE: address already in use :::5001
```
→ Kill the process or change port

**Email error:**
```
Email sending error: [error details]
```
→ Check email credentials in `.env`

**Supabase error:**
```
Supabase error, falling back to local storage
```
→ This is OK! App will use local storage

---

## 💡 Tips for Team Members

1. **Always start the backend first** before testing the frontend
2. **Check `http://localhost:5001`** in browser to verify backend is running
3. **Use `npm run dev`** to start both servers at once
4. **Check terminal for errors** - error messages are helpful!
5. **Ask for help** if you see errors you don't understand

---

## 🆘 Still Having Issues?

### Quick Checklist:
- [ ] Node.js is installed (`node --version`)
- [ ] Dependencies are installed (`npm install`)
- [ ] `.env` file exists in project root
- [ ] Port 5001 is available
- [ ] You're in the project root directory
- [ ] Backend server is running (`npm start`)

### Get Help:
1. Check the error message in terminal
2. Look for the error in this guide's [Troubleshooting](#troubleshooting) section
3. Ask a team member
4. Share the error message with the team

---

## 🎯 Next Steps

Once your backend is running:

1. ✅ Test the health endpoint: `http://localhost:5001/api/health`
2. ✅ Start the frontend: `cd client && npm start`
3. ✅ Try registering a new user
4. ✅ Check your email for verification code
5. ✅ Complete registration and login

---

## 📚 Additional Resources

- [Main README](./README.md) - Project overview
- [Supabase Setup](./SUPABASE-SETUP.md) - Database configuration
- [Email Verification Setup](./EMAIL-VERIFICATION-SETUP.md) - Email setup details
- [Changes Summary](./CHANGES-SUMMARY.md) - Recent updates

---

**Happy Coding! 🚀**

*If you find any issues with this guide, please update it for your teammates!*
