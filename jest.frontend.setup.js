import { config as loadEnv } from "dotenv";
import path from "path";
import { jest } from "@jest/globals";

loadEnv({ path: path.resolve(process.cwd(), "client/.env.local") });

// Prevent accidental real network calls in frontend tests.
if (!global.fetch) {
  global.fetch = jest.fn(() =>
    Promise.reject(new Error("Global fetch not mocked in this test"))
  );
}
