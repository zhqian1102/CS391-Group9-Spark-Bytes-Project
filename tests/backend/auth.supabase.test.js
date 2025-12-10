import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import express from "express";
import request from "supertest";
import path from "path";
import bcrypt from "bcryptjs";

// Simple in-memory fs mock
const fileStore = new Map();
const dirStore = new Set();

const sendMail = jest.fn().mockResolvedValue({});

// Supabase mock helpers
const createUserMock = jest.fn();
const insertMock = jest.fn();
const selectMock = jest.fn();
const singleMock = jest.fn();
const fromMock = jest.fn();
const signInMock = jest.fn();

const supabaseMock = {
  auth: {
    admin: { createUser: createUserMock },
    signInWithPassword: signInMock,
  },
  from: fromMock,
};

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

jest.unstable_mockModule("../../server/config/supabase.js", () => ({
  default: supabaseMock,
}));

const USERS_FILE = path.join(process.cwd(), "server/data/users.json");

const createApp = async () => {
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
  createUserMock.mockReset();
  insertMock.mockReset();
  selectMock.mockReset();
  singleMock.mockReset();
  fromMock.mockReset();
  signInMock.mockReset();
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});

  fromMock.mockImplementation((table) => {
    if (table === "users") {
      return {
        insert: insertMock.mockReturnValue({
          select: () => ({ single: singleMock }),
        }),
        select: selectMock.mockReturnValue({
          eq: () => ({ single: singleMock }),
        }),
      };
    }
    return {};
  });

  singleMock.mockResolvedValue({ data: { id: "sup-1" }, error: null });
  insertMock.mockResolvedValue({ data: { id: "sup-1" }, error: null });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("auth routes with Supabase enabled", () => {
  test("verify-email creates user via Supabase path", async () => {
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0);
    createUserMock.mockResolvedValue({
      data: { user: { id: "sup-1", email: "sup@bu.edu", user_metadata: {} } },
      error: null,
    });

    const app = await createApp();

    await request(app).post("/api/auth/register").send({
      name: "Sup User",
      email: "sup@bu.edu",
      password: "secret123",
      userType: "student",
    });

    const res = await request(app)
      .post("/api/auth/verify-email")
      .send({ email: "sup@bu.edu", code: "100000" });

    expect(createUserMock).toHaveBeenCalled();
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      email: "sup@bu.edu",
      name: "Sup User",
      userType: "student",
    });
    randomSpy.mockRestore();
  });

  test("falls back to local storage when Supabase login fails", async () => {
    signInMock.mockRejectedValue(new Error("supabase down"));

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

    expect(signInMock).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("local@bu.edu");
  });

  test("returns db user data when Supabase login succeeds", async () => {
    signInMock.mockResolvedValue({
      data: {
        user: {
          id: "sup-2",
          email: "db@bu.edu",
          user_metadata: { name: "Meta Name", userType: "organizer" },
        },
      },
      error: null,
    });
    singleMock.mockResolvedValue({
      data: { name: "DB Name", user_type: "student" },
      error: null,
    });

    const app = await createApp();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "db@bu.edu", password: "secret" });

    expect(signInMock).toHaveBeenCalled();
    expect(selectMock).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      name: "DB Name",
      userType: "student",
    });
  });
});
