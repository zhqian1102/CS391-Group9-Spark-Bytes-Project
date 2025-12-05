import { createRequire } from "module";

const require = createRequire(import.meta.url);

const reactPreset = require.resolve(
  "./client/node_modules/babel-preset-react-app"
);
const identityProxy = require.resolve(
  "./client/node_modules/identity-obj-proxy"
);

export default {
  displayName: "frontend",
  rootDir: ".",
  testEnvironment: "jsdom",
  testMatch: [
    "<rootDir>/client/src/**/*.test.[jt]s?(x)",
    "<rootDir>/client/src/**/*.spec.[jt]s?(x)",
  ],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": identityProxy,
  },
  transform: {
    "^.+\\.[jt]sx?$": [
      "babel-jest",
      {
        presets: [reactPreset],
        babelrc: false,
        configFile: false,
      },
    ],
  },
  transformIgnorePatterns: [
    "/node_modules/(?!@supabase/supabase-js|@supabase/auth-js|@supabase/functions-js)/",
  ],
  moduleDirectories: ["node_modules", "<rootDir>/client/node_modules"],
  setupFiles: ["<rootDir>/jest.frontend.setup.js"],
};
