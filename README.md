# Spark Bytes 🍕⚡

A platform for Boston University students and faculty members to post events that provide food or snacks. The aim is to reduce food waste resulting from over-purchasing for events and at the same time, help students access free food.

---

## 📚 Documentation & Setup Guides

| Guide | Description |
|-------|-------------|
| 📧 [**Email Verification Setup**](./EMAIL-VERIFICATION-SETUP.md) | Configure email verification with Gmail for user registration |
| 🗄️ [**Supabase Integration**](./SUPABASE-INTEGRATION-GUIDE.md) | Set up cloud database and authentication |
| 🔧 [**Supabase Setup (Quick)**](./SUPABASE-SETUP.md) | Quick start guide for Supabase configuration |
| 📝 [**Changes Summary**](./CHANGES-SUMMARY.md) | Detailed technical documentation of recent updates |
| 💾 [**SQL Schema**](./SUPABASE-USERS-TABLE-SETUP.sql) | Database table setup script |

**👉 First time setup?** Follow these guides in order:
1. Basic setup (below) → 2. [Email Verification](./EMAIL-VERIFICATION-SETUP.md) → 3. [Supabase Integration](./SUPABASE-INTEGRATION-GUIDE.md)

---

## Features

- 🔐 Secure login/signup with BU email validation
- 👥 Support for students and event organizers
- 🍔 Post and discover food events on campus
- ♻️ Help reduce food waste at BU
- 📱 Modern, responsive design

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
cd CS391-Group9-Spark-Bytes-Project-main
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

## Project Structure

```
CS391-Group9-Spark-Bytes-Project-main/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js
│   │   │   └── Login.css
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
├── server/                 # Node.js backend
│   ├── routes/
│   │   └── auth.js
│   └── index.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

## Current Features

### Login Page

- Professional split-screen design with BU colors (red gradient and white)
- Toggle between login and signup modes
- BU email validation (@bu.edu)
- User type selection (Student/Event Organizer)
- Password strength requirements
- Responsive design for mobile and desktop
- Smooth animations and transitions
- Supabase authentication integration

### User Dashboard Page

- Personalized welcome message with user name
- Grid display of reserved events
- Event cards showing title, location, date, time, dietary tags and spots left
- "View Details" button opens event detail modal
- "Cancel" button cancels reservations
- "View Events" button to browse all events

### Navigation Bar Component

- Reusable header component
- Logo, search bar, navigation link and profile dropdown
- Profile dropdown with alerts toggle and logout functionality
- Responsive design
- BU colors (red gradient and white)

## Implemented Features

### ✅ Authentication System
- Secure login/signup with BU email validation (@bu.edu)
- **Email verification with 6-digit codes** (NEW!)
- Supabase Auth integration with cloud storage
- JWT token-based authentication
- Dual storage system (Supabase + local fallback)
- User profiles with customizable data

### ✅ User Management
- User type support (students and event organizers)
- Profile management and viewing
- Password encryption with bcrypt
- Email verification system with expiration
- Resend verification code functionality

## Future Enhancements

- Event posting and discovery
- Real-time notifications
- Event filtering by location and time
- Image uploads for events
- Admin dashboard
- Push notifications for mobile

## License

MIT

## Contributors

## CS391 Group 9

Ilias Zaher
Zhihui Qian
Merem Gabriel
Ivy Shi
Liting Zheng

=======
## Figma Design
https://www.figma.com/design/II4Fde0YNereD6PHAr4e4W/First-Draft?node-id=0-1&t=qFtx8SNI9xJzuD6v-1

# CS391-Group9-Spark-Bytes-Project

> > > > > > > 152ec868b4e1e9548140e5e91c8c3ef4b2cd5b93
