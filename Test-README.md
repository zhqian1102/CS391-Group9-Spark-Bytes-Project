# Test README (Backend + Frontend)

This repo uses Jest multi-project config:
- `jest.backend.config.mjs` (Node + Supertest + Supabase mock)
- `jest.frontend.config.js` (jsdom + React + babel-jest)
- `jest.config.mjs` points to both.

## Setup (one-time)
From repo root:
```bash
npm install
cd client && npm install
cd .. && npm install -D jest-environment-jsdom
# If dependencies are missing (fresh clone), ensure dev test deps:
# npm install -D jest supertest @testing-library/react @testing-library/jest-dom
```

## Running tests
- All backend + frontend: `npm test`
- Backend only: `npm test -- --selectProjects backend`
- Frontend only: `npm test -- --selectProjects frontend`
- Single file: `npm test -- --selectProjects backend tests/backend/targetFile.test.js`
- Single frontend file: `npm test -- --selectProjects frontend client/src/pages/Events/EventsPage.test.js`

Notes:
- The project is ESM; the `test` script already sets `NODE_OPTIONS=--experimental-vm-modules`.
- Frontend tests use jsdom and CRA’s Babel preset (configured in `jest.frontend.config.js`).
- In restricted environments, backend tests that bind to a port via supertest may need elevated permissions; if blocked, run frontend-only or allow binding.

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
- `EventsPage.test.js`: Fetch/merge reserved events and render reserved status.
- `PostEvent.test.js`: Form submission flow (no images) posts payload and navigates on success.
