import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import express from "express";
import request from "supertest";

// Use the Supabase manual mock for all queries in the router
const supabaseMockModule = await import("./__mocks__/supabase.js");
jest.unstable_mockModule("../../server/config/supabase.js", () => ({
  default: supabaseMockModule.default,
}));

const createApp = async () => {
  jest.resetModules();
  const { default: notificationsRouter } = await import(
    "../../server/routes/notifications.js"
  );
  const app = express();
  app.use(express.json());
  app.use("/api/notifications", notificationsRouter);
  return app;
};

beforeEach(() => {
  supabaseMockModule.default.__reset();
});

describe("notifications routes", () => {
  test("returns notifications for a user in descending order", async () => {
    supabaseMockModule.default.__setTable("notifications", [
      {
        id: 1,
        user_id: "user-1",
        title: "Old",
        message: "Old message",
        type: "info",
        created_at: "2024-01-01T10:00:00Z",
        is_read: false,
      },
      {
        id: 2,
        user_id: "user-1",
        title: "New",
        message: "New message",
        type: "alert",
        created_at: "2024-02-01T10:00:00Z",
        is_read: true,
      },
      {
        id: 3,
        user_id: "other-user",
        title: "Other",
        message: "Ignore",
        type: "info",
        created_at: "2024-03-01T10:00:00Z",
        is_read: false,
      },
    ]);

    const app = await createApp();
    const res = await request(app).get("/api/notifications/user/user-1");

    expect(res.status).toBe(200);
    expect(res.body.map((n) => n.id)).toEqual([2, 1]); // sorted desc
    expect(res.body.every((n) => n.user_id === "user-1")).toBe(true);
  });

  test("creates a notification with is_read defaulting to false", async () => {
    const app = await createApp();
    const payload = {
      user_id: "user-2",
      type: "reservation",
      title: "Reserved",
      message: "You reserved an event",
      event_id: 10,
    };

    const res = await request(app)
      .post("/api/notifications")
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      ...payload,
      is_read: false,
    });

    const table = supabaseMockModule.default.__getTable("notifications");
    expect(table).toHaveLength(1);
    expect(table[0]).toMatchObject({ ...payload, is_read: false });
  });

  test("marks a single notification as read", async () => {
    supabaseMockModule.default.__setTable("notifications", [
      {
        id: 5,
        user_id: "user-3",
        type: "info",
        title: "Unread",
        message: "Mark me read",
        is_read: false,
      },
      {
        id: 6,
        user_id: "user-3",
        type: "info",
        title: "Already read",
        message: "Stay read",
        is_read: true,
      },
    ]);

    const app = await createApp();
    const res = await request(app).patch("/api/notifications/5/read");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 5, is_read: true });

    const table = supabaseMockModule.default.__getTable("notifications");
    const updated = table.find((n) => n.id === 5);
    const untouched = table.find((n) => n.id === 6);
    expect(updated.is_read).toBe(true);
    expect(untouched.is_read).toBe(true);
  });

  test("marks all notifications as read for a user", async () => {
    supabaseMockModule.default.__setTable("notifications", [
      { id: 7, user_id: "bulk", type: "info", title: "First", is_read: false },
      { id: 8, user_id: "bulk", type: "info", title: "Second", is_read: false },
      { id: 9, user_id: "bulk", type: "info", title: "Third", is_read: true },
      { id: 10, user_id: "other", type: "info", title: "Other", is_read: false },
    ]);

    const app = await createApp();
    const res = await request(app).patch(
      "/api/notifications/user/bulk/read-all"
    );

    expect(res.status).toBe(200);
    expect(res.body.map((n) => n.id)).toEqual([7, 8]);

    const table = supabaseMockModule.default.__getTable("notifications");
    const bulk = table.filter((n) => n.user_id === "bulk");
    const other = table.find((n) => n.user_id === "other");

    expect(bulk.every((n) => n.is_read)).toBe(true);
    expect(other.is_read).toBe(false);
  });
});
