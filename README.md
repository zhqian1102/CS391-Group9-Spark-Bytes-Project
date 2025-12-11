# Spark Bytes 🍕⚡

A platform for Boston University students and faculty members to post events that provide food or snacks. The aim is to reduce food waste resulting from over-purchasing for events and at the same time, help students access free food.

---

## 📚 Documentation & Setup Guides

| Guide                                                                            | Description                                                   |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 📖 [**Backend Setup Guide**](./BACKEND-SETUP-GUIDE.md)                           | **START HERE!** Complete guide to get the backend running     |
| 📧 [**Email Verification Setup**](./EMAIL-VERIFICATION-SETUP.md)                 | Configure email verification with Gmail for user registration |
| 🗄️ [**Supabase Integration**](./SUPABASE-INTEGRATION-GUIDE.md)                   | Set up cloud database and authentication                      |
| 🔧 [**Supabase Setup (Quick)**](./SUPABASE-SETUP.md)                             | Quick start guide for Supabase configuration                  |
| 💾 [**SQL Schema**](./SUPABASE-USERS-TABLE-SETUP.sql)                            | Database table setup script                                   |
| 🧪 [**Testing (Backend + Frontend)**](<./Testing%20(Backend%20+%20Frontend).md>) | How to run and interpret backend and frontend test suites     |

**👉 First time setup?** Follow these guides in order:

1. **[Backend Setup Guide](./BACKEND-SETUP-GUIDE.md)** (start here!) → 2. [Email Verification](./EMAIL-VERIFICATION-SETUP.md) → 3. [Supabase Integration](./SUPABASE-INTEGRATION-GUIDE.md)

---

## Project Snapshot

- 🔐 Secure login/signup with BU email validation
- 👥 Support for students and event organizers
- 🍔 Post and discover food events on campus
- ♻️ Help reduce food waste at BU
- 📱 Responsive BU-themed UI with navigation, search, alerts toggle, and profile menu.

## Tech Stack

- **Frontend**: React, React Router, Axios
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL + Authentication)
- **Authentication**: Supabase Auth with JWT
- **Styling**: Custom CSS with BU branding

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repo-url>
cd CS391-Group9-Spark-Bytes-Project
```

2. Environment Setup (.env and .env.local)

   a. From Root `.env` (backend)

   Location: `/.env`

   ```env
   # Server
   PORT=5001
   JWT_SECRET=...

   # Email (required for verification codes)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password  # use a Gmail App Password
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587

   # Supabase (optional for persistent data)
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # keep this private
   ```

   b. Frontend `client/.env.local`

   ```
   REACT_APP_API_URL=http://localhost:5001
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Install dependencies for both server and client:

```bash
npm run install-all
```

### Running the Application

#### Quick Start (runs both server and client)

```bash
npm run dev
```

The application will be available at:

- Client: http://localhost:3000
- Server: http://localhost:5001

**Note**: The app works out of the box with localStorage! For persistent data, follow the Supabase setup guide below.

### Testing the Application
This project includes both backend and frontend automated test suites using a multi-project Jest configuration. You can run all tests with a single command:

```bash
npm test
```
If you want to run either suite individually or explore coverage options,(./Testing(Backend+Frontend).md).

### Setting Up Supabase (Optional but Recommended)

For persistent user authentication, follow the detailed guide:
📖 **[SUPABASE-SETUP.md](./SUPABASE-SETUP.md)**

Quick version:

1. Create account at https://supabase.com
2. Create a new project
3. Copy your Project URL and anon key
4. Update `.env` and `client/.env.local` with your credentials
5. Restart the app

Without Supabase, the app uses browser localStorage (data clears on logout).

## ⚠️ Common Issues & Quick Fixes

### "Failed to fetch" Error When Logging In

**Problem:** Backend server is not running.

**Solution:**

```bash
# From project root
npm start
```

The backend MUST be running on `http://localhost:5001` for the app to work!

**Check if it's running:** Open `http://localhost:5001` in your browser. You should see the API welcome message.

**For detailed help:** See [BACKEND-SETUP-GUIDE.md](./BACKEND-SETUP-GUIDE.md)

### Port Already in Use

**Problem:** Error says port 5001 is already in use.

**Solution (Mac/Linux):**

```bash
lsof -ti:5001 | xargs kill -9
npm start
```

**Solution (Windows):**

```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5001).OwningProcess | Stop-Process
npm start
```

### Module Not Found Errors

**Solution:**

```bash
rm -rf node_modules package-lock.json
npm run install-all
```

**📚 More troubleshooting:** Check [BACKEND-SETUP-GUIDE.md](./BACKEND-SETUP-GUIDE.md#troubleshooting)

## Project Structure

```
CS391-Group9-Spark-Bytes-Project/
├── client/                 # React frontend
│   ├── public/             # Static assets
│   └── src/
│       ├── components/     # Navbar, modals, shared UI
│       ├── pages/          # Login, Dashboard, Events, etc.
│       ├── context/        # Auth context + API calls
│       └── config/         # Supabase client, location map
├── server/                 # Express backend
│   ├── routes/             # Auth, events, users
│   ├── controllers/        # Request handlers
│   ├── middleware/         # JWT/auth middleware
│   └── config/             # Supabase server client
├── *.md                    # Setup and integration guides
├── package*.json           # Scripts and dependencies
└── README.md               # Project overview (this file)
```

## Current Features

### ✅ Authentication & Accounts

- BU-only email validation with password strength rules.
- Two-step email verification with 6-digit codes (resend + 10-minute expiry).
- Supabase Auth integration with JWT-based sessions; localStorage fallback for quick demos.
- Profile data persisted in Supabase when configured.

### ✅ Users & Roles

- Student and Event Organizer flows.
- Profile viewing/management and logout from the profile dropdown.

### ✅ Events & Reservations

- Event creation with title, description, location, date, time, food items, capacity, and dietary tags.
- Optional image uploads with graceful handling for failures.
- Event feed showing availability, capacity, dietary tags, and remaining spots.
- Detail modals for registration/cancellation and attendee management for organizers.

### ✅ Dashboard & Navigation

- Personalized dashboard showing reserved events and quick actions.
- Reusable navigation bar with logo, search, links, alerts toggle, and profile dropdown.
- Mobile-ready layouts with smooth transitions and BU gradient theming.

### ✅ Backend & API

- Express API with auth, events, and profile routes.
- JWT middleware for protected routes.
- Nodemailer-based email delivery for verification codes.
- Supabase service role integration for secure database access.

## ✏️ Future Enhancements

- Admin dashboard
- Push notifications for mobile

## License

MIT

## Contributors

CS391 Group 9: 

Ilias Zaher,
Zhihui Qian,
Merem Gabriel,
Shu (Ivy) Shi,
Liting Zheng

# CS391-Group9-Spark-Bytes-Project
