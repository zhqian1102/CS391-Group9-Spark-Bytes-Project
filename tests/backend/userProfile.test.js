import { beforeAll, beforeEach, describe, expect, jest, test } from "@jest/globals";
import express from "express";
import request from "supertest";

let supabaseMockModule;

beforeAll(async () => {
  supabaseMockModule = await import("./__mocks__/supabase.js");
  jest.unstable_mockModule("../../server/config/supabase.js", () => ({
    default: supabaseMockModule.default,
  }));
});

const createApp = async () => {
  jest.resetModules();
  const { default: userProfileRouter } = await import(
    "../../server/routes/userProfile.js"
  );
  const app = express();
  app.use(express.json());
  app.use("/api/user", userProfileRouter);
  return app;
};

const authHeader = { Authorization: "Bearer token" };

beforeEach(() => {
  supabaseMockModule.default.__reset();
  supabaseMockModule.default.__setAuthUser({
    id: "user-1",
    email: "user1@test.com",
  });
});

describe("userProfile routes", () => {
  test("rejects requests without a token", async () => {
    const app = await createApp();
    const res = await request(app).get("/api/user/profile");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "No token provided" });
  });

  test("returns profile for authenticated user", async () => {
    supabaseMockModule.default.__setTable("profiles", [
      {
        id: "user-1",
        name: "Jane Doe",
        email: "user1@test.com",
        profile_picture: "https://example.com/pic.jpg",
        dietary_preferences: ["vegan"],
        created_at: "2024-01-01T00:00:00Z",
      },
    ]);

    const app = await createApp();
    const res = await request(app)
      .get("/api/user/profile")
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      user: {
        id: "user-1",
        name: "Jane Doe",
        email: "user1@test.com",
        profilePicture: "https://example.com/pic.jpg",
        dietaryPreferences: ["vegan"],
        createdAt: "2024-01-01T00:00:00Z",
      },
    });
  });

  test("requires name when updating profile", async () => {
    const app = await createApp();
    const res = await request(app)
      .put("/api/user/profile")
      .set(authHeader)
      .send({ name: "" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Name is required" });
  });

  test("updates profile fields for authenticated user", async () => {
    supabaseMockModule.default.__setTable("profiles", [
      {
        id: "user-1",
        name: "Old Name",
        email: "user1@test.com",
        profile_picture: "https://example.com/old.jpg",
        dietary_preferences: ["vegan"],
        created_at: "2024-01-01T00:00:00Z",
      },
    ]);

    const app = await createApp();
    const res = await request(app)
      .put("/api/user/profile")
      .set(authHeader)
      .send({
        name: "  New Name  ",
        profilePicture: null,
        dietaryPreferences: ["gluten-free", "vegetarian"],
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: "user-1",
        name: "New Name",
        email: "user1@test.com",
        profilePicture: null,
        dietaryPreferences: ["gluten-free", "vegetarian"],
        createdAt: "2024-01-01T00:00:00Z",
      },
    });

    const updated = supabaseMockModule.default.__getTable("profiles")[0];
    expect(updated).toMatchObject({
      id: "user-1",
      name: "New Name",
      profile_picture: null,
      dietary_preferences: ["gluten-free", "vegetarian"],
    });
  });
});
