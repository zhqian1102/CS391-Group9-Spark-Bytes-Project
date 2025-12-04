# Backend Tests

This folder contains Jest tests for the backend controllers with a lightweight, in-memory Supabase mock.

## Files
- `events.test.js`: Tests `createEvent` and `getAllEvents` from `server/controllers/eventsController.js`.
- `__mocks__/supabase.js`: Manual mock that simulates the Supabase client (`auth.getUser`, `from().select/insert/update/delete/eq/order/single`) with in-memory tables.

## Running the tests
From the repo root:
```bash
npm test
# or target a single file:
npm test -- tests/backend/events.test.js
```
Notes:
- The package uses ESM; the test script sets `NODE_OPTIONS=--experimental-vm-modules` so Jest can load `import`/`export`.
- If you run Jest directly, include that flag: `NODE_OPTIONS=--experimental-vm-modules npx jest`.

## Mock controls
The Supabase mock exports helpers you can use in tests:
- `supabase.__reset()`: Clear all tables and auth state (already run in `beforeEach`).
- `supabase.__setTable(tableName, rows)`: Seed a table (e.g., `events`, `event_attendees`, `profiles`, `notifications`).
- `supabase.__getTable(tableName)`: Read current table contents for assertions.
- `supabase.__setAuthUser(user)`: Set the user object returned by `auth.getUser`.

## Structure and behavior
- In-memory tables are plain arrays keyed by table name.
- Inserts auto-assign an `id` if not provided; updates and deletes honor `.eq()` filters.
- `.select().order("column")` sorts results; `.single()` returns one row or an error object when empty.
- Only the behaviors used by current tests/controllers are implemented; extend the mock if new queries appear.
