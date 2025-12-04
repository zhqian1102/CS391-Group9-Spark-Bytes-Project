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
