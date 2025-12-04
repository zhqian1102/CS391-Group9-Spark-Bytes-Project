import { beforeEach, describe, expect, jest, test } from "@jest/globals";

// Use the manual mock for Supabase before importing controllers
const supabaseMockModule = await import("./__mocks__/supabase.js");
jest.unstable_mockModule("../../server/config/supabase.js", () => ({
  default: supabaseMockModule.default,
}));

const { createEvent, getAllEvents } = await import(
  "../../server/controllers/eventsController.js"
);

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("eventsController", () => {
  beforeEach(() => {
    supabaseMockModule.default.__reset();
  });

  describe("createEvent", () => {
    test("returns 401 when profile is missing", async () => {
      const req = { body: {}, profile: null };
      const res = createMockRes();

      await createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test("validates required fields", async () => {
      const req = {
        profile: { id: "user-123" },
        body: { title: "No Location" },
      };
      const res = createMockRes();

      await createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Missing required fields.",
      });
      expect(supabaseMockModule.default.__getTable("events")).toHaveLength(0);
    });

    test("creates event and returns payload", async () => {
      const req = {
        profile: { id: "host-1" },
        body: {
          title: "Free Pizza",
          location: "Student Center",
          date: "2024-12-01",
          time: "18:00",
          capacity: 20,
          food_items: [{ item: "Pizza", qty: 10 }],
          dietary_options: ["vegetarian"],
          pickup_instructions: "Pick up at the lobby",
          description: "Pizza for everyone!",
          image_urls: ["https://example.com/pizza.jpg"],
        },
      };
      const res = createMockRes();

      await createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const responseBody = res.json.mock.calls[0][0];
      expect(responseBody?.event).toMatchObject({
        title: "Free Pizza",
        user_id: "host-1",
        attendees_count: 0,
      });

      const events = supabaseMockModule.default.__getTable("events");
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        title: "Free Pizza",
        location: "Student Center",
      });
    });
  });

  describe("getAllEvents", () => {
    const baseEvents = [
      {
        id: 1,
        title: "Bagels",
        location: "BU West",
        description: "Fresh bagels",
        date: "2024-11-10",
        time: "09:00",
        food_items: [{ item: "Bagel", qty: 12 }],
        dietary_options: ["vegetarian"],
      },
      {
        id: 2,
        title: "Pizza Party",
        location: "Student Center",
        description: "Cheese and pepperoni",
        date: "2024-10-05",
        time: "18:00",
        food_items: [{ item: "Pizza", qty: 8 }],
        dietary_options: ["vegetarian"],
      },
    ];

    beforeEach(() => {
      supabaseMockModule.default.__setTable("events", baseEvents);
    });

    test("returns events sorted by date", async () => {
      const req = { query: {} };
      const res = createMockRes();

      await getAllEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const { events } = res.json.mock.calls[0][0];
      expect(events.map((e) => e.id)).toEqual([2, 1]); // Oct comes before Nov
    });

    test("filters by search term across fields", async () => {
      const req = { query: { search: "bagel" } };
      const res = createMockRes();

      await getAllEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const { events } = res.json.mock.calls[0][0];
      expect(events).toHaveLength(1);
      expect(events[0].title).toBe("Bagels");
    });
  });
});
