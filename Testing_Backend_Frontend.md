# Testing (Backend + Frontend)

This repository uses a Jest multi-project config:

- Backend tests → `jest.backend.config.mjs` (Jest + Supertest + Supabase mock)
- Frontend tests → `jest.frontend.config.js` (Jest + React Testing Library)
- Root aggregator → `jest.config.mjs` (runs both projects together)

## One-Time Setup

From the repository root :

```bash
# Install root-level dependencies
npm install

# Install frontend dependencies
npm --prefix client install

# (Optional) Install missing test tooling for BOTH projects
npm install -D jest supertest @testing-library/react @testing-library/jest-dom jest-environment-jsdom

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

## Testing plan (what & how)

- **Authentication & verification**

  - What: BU email validation, password length, duplicate email guard, verification code send/resend/expiry, local JSON login fallback, token issuance.
  - How: backend integration (`tests/backend/auth.test.js`) with fs + nodemailer mocks; keep deterministic `Math.random` in tests; add malformed payload/lockout cases if implemented.

- **Profiles**

  - What: auth gating (401 without token), profile fetch shape, name required on update, trimming, dietary prefs/avatar updates.
  - How: backend integration (`tests/backend/userProfile.test.js`) using Supabase mock; extend to cover missing profile 404 and upload failures if added.

- **Events & reservations**

  - What: create requires all fields; list sorting/search; reserve increments counts and notifies; full-event rejection; cancel decrements counts + host notice; owner-only update/delete/attendee list; 404s for missing events.
  - How: backend controller tests (`tests/backend/events.test.js`) seeding tables via mock; add negative paths for bad payloads, past dates, duplicate reservations if logic grows.

- **Notifications**

  - What: user-scoped listing sorted desc, create defaults `is_read=false`, patch single read, patch read-all scoped to user.
  - How: backend integration (`tests/backend/notifications.test.js`); add delete/archive and channel failure cases if introduced.

- **Frontend pages (component/integration)**

  - Coverage already present for: EventsPage (fetch/merge, full state, filters, modal, empty state), Login (BU email, password match, login/signup/verification flows), PostEvent & EditEvent (validation, image rules, errors), Organizer/User dashboards (edit/delete, reserved fetch/cancel alerts), ViewAttendees (owner success/403/unauth, export alert), NotificationPage (unauth/error/success), UserProfile (redirect unauth, save success/error, logout), EventDetailModal (render, reserve success/failure, disable reserved, close/controls).
  - Gaps to consider: accessibility assertions (roles/labels), loading states, error toasts consistency, pagination/search params if added.

- **Cross-cutting**
  - Errors: keep 400/401/403/404 covered; add 409/422 when new validation rules appear.
  - Auth: mock Supabase session/JWT headers consistently; add expiry/refresh behaviors if built.
  - Data integrity: capacity vs attendees counts, duplicate reservation prevention, consistent date/time formats across backend/frontend.
  - Optional E2E: Playwright smoke flows (login → reserve/cancel; organizer create/edit/delete; profile edit/logout; notifications) once servers are easy to start.
