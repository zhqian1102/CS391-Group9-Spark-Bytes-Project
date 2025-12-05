import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import express from "express";
import request from "supertest";
import path from "path";
import bcrypt from "bcryptjs";

// Simple in-memory fs mock
const fileStore = new Map();
const dirStore = new Set();

const sendMail = jest.fn().mockResolvedValue({});

// Mock dependencies before importing the router
jest.unstable_mockModule("fs", () => {
  const existsSync = (target) => {
    if (dirStore.has(target)) return true;
    if (fileStore.has(target)) return true;

    if (typeof target === "string") {
      const isDataDir =
        target.endsWith(`${path.sep}data`) ||
        target.endsWith(`${path.sep}data${path.sep}`);
      if (isDataDir) return true;
    }
    return false;
  };

  return {
    default: {
      existsSync,
      mkdirSync: (dir) => dirStore.add(dir),
      readFileSync: (file, encoding) => {
        if (!fileStore.has(file)) throw new Error(`ENOENT: ${file}`);
        return fileStore.get(file);
      },
      writeFileSync: (file, data) => {
        fileStore.set(file, data);
      },
    },
  };
});

jest.unstable_mockModule("nodemailer", () => ({
  default: { createTransport: () => ({ sendMail }) },
  createTransport: () => ({ sendMail }),
}));

// Force auth router to use local storage path (supabase null)
jest.unstable_mockModule("../../server/config/supabase.js", () => ({
  default: null,
}));

const USERS_FILE = path.join(process.cwd(), "server/data/users.json");

const createApp = async () => {
  // Reset module registry so auth.js picks up fresh mocks and state
  jest.resetModules();
  const { default: authRouter } = await import("../../server/routes/auth.js");
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRouter);
  return app;
};

beforeEach(() => {
  fileStore.clear();
  dirStore.clear();
  sendMail.mockClear();
  jest.useRealTimers();
});

describe("auth routes", () => {
  test("register rejects non-BU email", async () => {
    const app = await createApp();
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test",
        email: "user@example.com",
        password: "secret",
        userType: "student",
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      message: "Please use a valid BU email address",
    });
  });

  test("register sends verification for BU email", async () => {
    const app = await createApp();
    jest.spyOn(Math, "random").mockReturnValue(0); // deterministic code 100000
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test",
        email: "user@bu.edu",
        password: "secret",
        userType: "student",
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      message: "Verification code sent to your email",
      email: "user@bu.edu",
    });
    expect(sendMail).toHaveBeenCalled();
    Math.random.mockRestore();
  });

  test("verify-email without code returns 400", async () => {
    const app = await createApp();
    const res = await request(app)
      .post("/api/auth/verify-email")
      .send({ email: "missing@bu.edu", code: "123456" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      message: "No verification code found for this email",
    });
  });

  test("verify-email succeeds after registering with code", async () => {
    jest.spyOn(Math, "random").mockReturnValue(0); // code = 100000
    const app = await createApp();

    await request(app).post("/api/auth/register").send({
      name: "Tester",
      email: "verify@bu.edu",
      password: "secret123",
      userType: "student",
    });

    const res = await request(app)
      .post("/api/auth/verify-email")
      .send({ email: "verify@bu.edu", code: "100000" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      message: "Email verified and user registered successfully",
      user: { email: "verify@bu.edu", name: "Tester", userType: "student" },
    });
    expect(res.body.token).toBeTruthy();
    Math.random.mockRestore();
  });

  test("verification code expires after 10 minutes", async () => {
    const base = new Date("2025-01-01T00:00:00Z");
    jest.useFakeTimers().setSystemTime(base);
    jest.spyOn(Math, "random").mockReturnValue(0);
    const app = await createApp();

    await request(app).post("/api/auth/register").send({
      name: "Tester",
      email: "expire@bu.edu",
      password: "secret123",
      userType: "student",
    });

    jest.setSystemTime(new Date(base.getTime() + 11 * 60 * 1000));

    const res = await request(app)
      .post("/api/auth/verify-email")
      .send({ email: "expire@bu.edu", code: "100000" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/expired/i);
    Math.random.mockRestore();
    jest.useRealTimers();
  });

  test("resend-verification issues new code", async () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    const app = await createApp();

    await request(app).post("/api/auth/register").send({
      name: "Tester",
      email: "resend@bu.edu",
      password: "secret123",
      userType: "student",
    });
    Math.random.mockRestore();

    const res = await request(app)
      .post("/api/auth/resend-verification")
      .send({ email: "resend@bu.edu" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/New verification code sent/i);
    expect(sendMail).toHaveBeenCalledTimes(2);
  });

  test("register rejects short password", async () => {
    const app = await createApp();
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test",
        email: "short@bu.edu",
        password: "123",
        userType: "student",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/at least 6 characters/i);
  });

  test("register rejects duplicate email in local storage", async () => {
    const hashed = await bcrypt.hash("secret", 10);
    fileStore.set(
      USERS_FILE,
      JSON.stringify([
        {
          id: 1,
          name: "Existing",
          email: "dup@bu.edu",
          password: hashed,
          userType: "student",
          emailVerified: true,
        },
      ])
    );

    const app = await createApp();
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "New",
        email: "dup@bu.edu",
        password: "secret123",
        userType: "student",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test("login rejects non-BU email", async () => {
    const app = await createApp();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@example.com", password: "secret" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      message: "Please use a valid BU email address",
    });
  });

  test("login succeeds using local storage fallback", async () => {
    const hashed = await bcrypt.hash("secret", 10);
    fileStore.set(
      USERS_FILE,
      JSON.stringify([
        {
          id: 1,
          name: "Local User",
          email: "local@bu.edu",
          password: hashed,
          userType: "student",
          emailVerified: true,
        },
      ])
    );

    const app = await createApp();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "local@bu.edu", password: "secret" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      message: "Login successful",
      user: {
        email: "local@bu.edu",
        name: "Local User",
        userType: "student",
      },
    });
    expect(res.body.token).toBeTruthy();
  });
});
