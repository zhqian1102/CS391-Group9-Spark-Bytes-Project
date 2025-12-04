import { beforeEach, describe, expect, jest, test } from "@jest/globals";

// Use the manual mock for Supabase before importing controllers
const supabaseMockModule = await import("./__mocks__/supabase.js");
jest.unstable_mockModule("../../server/config/supabase.js", () => ({
  default: supabaseMockModule.default,
}));

const {
  createEvent,
  getAllEvents,
  reserveEvent,
  cancelReservation,
  updateEvent,
  deleteEvent,
  getEventById,
  getEventAttendees,
} = await import("../../server/controllers/eventsController.js");

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

  describe("reserveEvent", () => {
    const baseEvent = {
      id: 1,
      title: "Tacos",
      capacity: 2,
      attendees_count: 0,
      user_id: "host-1",
    };

    beforeEach(() => {
      supabaseMockModule.default.__setTable("events", [baseEvent]);
      supabaseMockModule.default.__setTable("profiles", [
        { id: "guest-1", name: "Guest One", email: "g1@test.com" },
        { id: "host-1", name: "Host", email: "host@test.com" },
      ]);
    });

    test("reserves an event and increments attendees", async () => {
      const req = {
        profile: { id: "guest-1" },
        params: { eventId: 1 },
        body: {},
      };
      const res = createMockRes();

      await reserveEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const attendees = supabaseMockModule.default.__getTable(
        "event_attendees"
      );
      expect(attendees).toHaveLength(1);
      expect(attendees[0]).toMatchObject({
        event_id: 1,
        user_id: "guest-1",
        status: "reserved",
      });

      const events = supabaseMockModule.default.__getTable("events");
      expect(events[0].attendees_count).toBe(1);

      const notifications = supabaseMockModule.default.__getTable(
        "notifications"
      );
      expect(notifications.length).toBe(2); // host + attendee confirmations
    });

    test("returns error when event is full", async () => {
      supabaseMockModule.default.__setTable("events", [
        { ...baseEvent, attendees_count: 2, capacity: 2 },
      ]);

      const req = {
        profile: { id: "guest-1" },
        params: { eventId: 1 },
        body: {},
      };
      const res = createMockRes();

      await reserveEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Event is full" });
    });
  });

  describe("cancelReservation", () => {
    beforeEach(() => {
      supabaseMockModule.default.__setTable("events", [
        {
          id: 5,
          title: "Sandwiches",
          user_id: "host-2",
          attendees_count: 1,
          capacity: 10,
        },
      ]);
      supabaseMockModule.default.__setTable("event_attendees", [
        { id: 10, event_id: 5, user_id: "guest-2", status: "reserved" },
      ]);
      supabaseMockModule.default.__setTable("profiles", [
        { id: "guest-2", name: "Canceller", email: "c@example.com" },
        { id: "host-2", name: "Host Two", email: "h@example.com" },
      ]);
    });

    test("cancels reservation and decrements count", async () => {
      const req = { profile: { id: "guest-2" }, params: { eventId: 5 } };
      const res = createMockRes();

      await cancelReservation(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(
        supabaseMockModule.default.__getTable("event_attendees")
      ).toHaveLength(0);
      expect(
        supabaseMockModule.default.__getTable("events")[0].attendees_count
      ).toBe(0);

      const notifications = supabaseMockModule.default.__getTable(
        "notifications"
      );
      expect(notifications).toHaveLength(1);
      expect(notifications[0]).toMatchObject({
        user_id: "host-2",
        type: "cancellation",
      });
    });
  });

  describe("updateEvent", () => {
    beforeEach(() => {
      supabaseMockModule.default.__setTable("events", [
        {
          id: 7,
          user_id: "owner-1",
          title: "Old Title",
          date: "2024-10-01",
        },
      ]);
    });

    test("rejects updates by non-owner", async () => {
      const req = {
        profile: { id: "someone-else" },
        params: { eventId: 7 },
        body: { title: "New Title" },
      };
      const res = createMockRes();

      await updateEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Unauthorized: Not your event",
      });
    });

    test("updates event for owner", async () => {
      const req = {
        profile: { id: "owner-1" },
        params: { eventId: 7 },
        body: { title: "New Title" },
      };
      const res = createMockRes();

      await updateEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const updated = supabaseMockModule.default.__getTable("events")[0];
      expect(updated.title).toBe("New Title");
    });
  });

  describe("deleteEvent", () => {
    beforeEach(() => {
      supabaseMockModule.default.__setTable("events", [
        { id: 9, user_id: "owner-9", title: "Delete Me" },
      ]);
      supabaseMockModule.default.__setTable("event_attendees", [
        { id: 50, event_id: 9, user_id: "guest-x" },
      ]);
    });

    test("rejects delete by non-owner", async () => {
      const req = { profile: { id: "intruder" }, params: { eventId: 9 } };
      const res = createMockRes();

      await deleteEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test("deletes event and attendees for owner", async () => {
      const req = { profile: { id: "owner-9" }, params: { eventId: 9 } };
      const res = createMockRes();

      await deleteEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(supabaseMockModule.default.__getTable("events")).toHaveLength(0);
      expect(
        supabaseMockModule.default.__getTable("event_attendees")
      ).toHaveLength(0);
    });
  });

  describe("getEventById", () => {
    test("returns event when found", async () => {
      supabaseMockModule.default.__setTable("events", [
        { id: 12, title: "Found Event" },
      ]);
      const req = { params: { eventId: 12 } };
      const res = createMockRes();

      await getEventById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: 12, title: "Found Event" })
      );
    });

    test("returns 404 when missing", async () => {
      supabaseMockModule.default.__setTable("events", []);
      const req = { params: { eventId: 99 } };
      const res = createMockRes();

      await getEventById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Event not found" });
    });
  });

  describe("getEventAttendees", () => {
    beforeEach(() => {
      supabaseMockModule.default.__setTable("events", [
        { id: 20, user_id: "host-20", title: "Host Event" },
      ]);
      supabaseMockModule.default.__setTable("profiles", [
        { id: "host-20", name: "Host", email: "h@test.com" },
        { id: "guest-20", name: "Guest", email: "g@test.com" },
      ]);
      supabaseMockModule.default.__setTable("event_attendees", [
        {
          id: 201,
          event_id: 20,
          user_id: "guest-20",
          status: "reserved",
          created_at: "2024-01-01T00:00:00Z",
        },
      ]);
    });

    test("blocks non-owner access", async () => {
      const req = { profile: { id: "someone" }, params: { eventId: 20 } };
      const res = createMockRes();

      await getEventAttendees(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Unauthorized: Not your event",
      });
    });

    test("returns attendees with profile info for owner", async () => {
      const req = { profile: { id: "host-20" }, params: { eventId: 20 } };
      const res = createMockRes();

      await getEventAttendees(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const { attendees } = res.json.mock.calls[0][0];
      expect(attendees).toHaveLength(1);
      expect(attendees[0]).toMatchObject({
        user_id: "guest-20",
        profiles: { id: "guest-20", name: "Guest" },
      });
    });
  });
});
