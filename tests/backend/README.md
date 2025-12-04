# Backend API tests : Jest + Supertest (mock Supabase)

This folder contains Jest tests for the backend controllers with a lightweight, in-memory Supabase mock.

## Running the tests

From the repo root:

```bash
# Install dev test dependencies (if not installed)
npm install --save-dev jest supertest @testing-library/react @testing-library/jest-dom jest-environment-jsdom

# Run all backend tests
npm test

# Run only one specific test
npm test -- tests/backend/targetFile.test.js

```

Notes:

- The package uses ESM; the test script sets `NODE_OPTIONS=--experimental-vm-modules` so Jest can load `import`/`export`.
- If you run Jest directly, include that flag: `NODE_OPTIONS=--experimental-vm-modules npx jest`.

## Files

- `auth.test.js`: Auth route tests (local storage fallback, BU email validation, verification flow).
- `events.test.js`: Event controller tests for creation, listing, reservation, cancellation, update, deletion, and attendee fetch.
- `notifications.test.js`: Notification route tests for listing, creating, and marking read/read-all.
- `userProfile.test.js`: Profile route tests for auth gating, fetch, and update validation.
- `__mocks__/supabase.js`: Manual mock that simulates the Supabase client (`auth.getUser`, `from().select/insert/update/delete/eq/order/single`) with in-memory tables.

## Mock controls

The Supabase mock exports helpers you can use in tests:

- `supabase.__reset()`: Clear all tables and auth state (already run in `beforeEach`).
- `supabase.__setTable(tableName, rows)`: Seed a table (e.g., `events`, `event_attendees`, `profiles`, `notifications`).
- `supabase.__getTable(tableName)`: Read current table contents for assertions.
- `supabase.__setAuthUser(user)`: Set the user object returned by `auth.getUser`.
