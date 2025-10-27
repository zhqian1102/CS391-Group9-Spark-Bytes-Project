# Spark Bytes 🍕⚡

A platform for Boston University students and faculty members to post events that provide food or snacks. The aim is to reduce food waste resulting from over-purchasing for events and at the same time, help students access free food.

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

## Future Enhancements

- Event posting and discovery
- Real-time notifications
- User profiles
- Event filtering by location and time
- Image uploads for events
- Admin dashboard
- Email verification

## License

MIT

## Contributors

CS391 Group 9


=======
# CS391-Group9-Spark-Bytes-Project
>>>>>>> 152ec868b4e1e9548140e5e91c8c3ef4b2cd5b93
