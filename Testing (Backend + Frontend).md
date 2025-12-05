# Testing (Backend + Frontend)

This repository uses a Jest multi-project config:

- Backend tests → `jest.backend.config.mjs` (Node + Supertest + Supabase mocks)
- Frontend tests → `jest.frontend.config.js` (jsdom + React + babel-jest)
- Root aggregator → `jest.config.mjs` (runs both projects together)

## One-Time Setup

From the repository root :

```bash
npm install

# If any test tooling is missing (belt-and-suspenders):
npm install -D jest supertest @testing-library/react @testing-library/jest-dom
```

## Running tests

- All backend + frontend: `npm test`
- Frontend (all): `npm test -- client  `
- Backend (all): `npm test -- backend`
- One single file: `npm test -- path/of/targetfile.test.js`

## Backend test files (tests/backend)

- `auth.test.js`: Auth route tests (local storage fallback, BU email validation, verification flow).
- `events.test.js`: Event controller tests for creation, listing, reservation, cancellation, update, deletion, attendee fetch.
- `notifications.test.js`: Notification route tests for listing, creating, and marking read/read-all.
- `userProfile.test.js`: Profile route tests for auth gating, fetch, update validation.
- `__mocks__/supabase.js`: In-memory Supabase mock (`auth.getUser`, `from().select/insert/update/delete/eq/order/single`).

Supabase mock helpers:

- `supabase.__reset()`: Clear all tables and auth state (runs in `beforeEach`).
- `supabase.__setTable(tableName, rows)`: Seed a table (e.g., `events`, `event_attendees`, `profiles`, `notifications`).
- `supabase.__getTable(tableName)`: Read current table contents.
- `supabase.__setAuthUser(user)`: Set the user object returned by `auth.getUser`.

## Frontend test files (client/src/pages)

- `EventsPage.test.js`: Fetch/merge reserved events, reserved/full states, filtering/search, modal open behavior, no-results message.
- `PostEvent.test.js`: Form validation (required fields, AM/PM, images, date) and submission flow.
- `EditEvent.test.js`: Edit validation (required fields, AM/PM, images required/max, login gating, load/save errors), dietary toggles, food rows, image removal/upload.
- `OrganizerDashboard.test.js`: Edit navigation, delete success/error alerts, category grouping.
- `UserDashboard.test.js`: Reserved fetch (upcoming only), load/cancel success/error alerts.
- `ViewAttendees.test.js`: Attendee fetch success, owner/403 error, missing session, export alert on empty.
- `NotificationPage.test.js`: Unauth error, fetch success, fetch failure.
- `Login.test.js`: BU email validation, mismatched passwords, login success nav, signup verification flow, direct signup success to login, invalid verification code error.
- `UserProfile.test.js`: Redirect when unauthenticated, edit/save success/error, logout navigation.
- `EventDetailModal.test.js`: Renders modal content, map, carousel navigation, reserve success/failure, reserved disable, backdrop/Escape close, image controls, body scroll lock.
