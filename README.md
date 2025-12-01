# Spark Bytes 🍕⚡

A platform for Boston University students and faculty members to post events that provide food or snacks. The aim is to reduce food waste resulting from over-purchasing for events and at the same time, help students access free food.

---

## 📚 Documentation & Setup Guides

| Guide | Description |
|-------|-------------|
| 📖 [**Backend Setup Guide**](./BACKEND-SETUP-GUIDE.md) | **START HERE!** Complete guide to get the backend running |
| 📧 [**Email Verification Setup**](./EMAIL-VERIFICATION-SETUP.md) | Configure email verification with Gmail for user registration |
| 🗄️ [**Supabase Integration**](./SUPABASE-INTEGRATION-GUIDE.md) | Set up cloud database and authentication |
| 🔧 [**Supabase Setup (Quick)**](./SUPABASE-SETUP.md) | Quick start guide for Supabase configuration |
| 📝 [**Changes Summary**](./CHANGES-SUMMARY.md) | Detailed technical documentation of recent updates |
| 💾 [**SQL Schema**](./SUPABASE-USERS-TABLE-SETUP.sql) | Database table setup script |

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

2. Install dependencies for both server and client:

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

### Authentication & Accounts
- BU-only email validation with password strength rules.
- Two-step email verification with 6-digit codes (resend + 10-minute expiry).
- Supabase Auth integration with JWT-based sessions; localStorage fallback for quick demos.
- Profile data persisted in Supabase when configured.

### Users & Roles
- Student and Event Organizer flows.
- Profile viewing/management and logout from the profile dropdown.

### Events & Reservations
- Event creation with title, description, location, date, time, food items, capacity, and dietary tags.
- Optional image uploads with graceful handling for failures.
- Event feed showing availability, capacity, dietary tags, and remaining spots.
- Detail modals for registration/cancellation and attendee management for organizers.

### Dashboard & Navigation
- Personalized dashboard showing reserved events and quick actions.
- Reusable navigation bar with logo, search, links, alerts toggle, and profile dropdown.
- Mobile-ready layouts with smooth transitions and BU gradient theming.

### Backend & API
- Express API with auth, events, and profile routes.
- JWT middleware for protected routes.
- Nodemailer-based email delivery for verification codes.
- Supabase service role integration for secure database access.

## Future Enhancements

- Admin dashboard
- Push notifications for mobile

## License

MIT

## Contributors

## CS391 Group 9

Ilias Zaher
Zhihui Qian
Merem Gabriel
Shu (Ivy) Shi
Liting Zheng

=======
## Figma Design
https://www.figma.com/design/II4Fde0YNereD6PHAr4e4W/First-Draft?node-id=0-1&t=qFtx8SNI9xJzuD6v-1

# CS391-Group9-Spark-Bytes-Project

> > > > > > > 152ec868b4e1e9548140e5e91c8c3ef4b2cd5b93
