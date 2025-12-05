import { config as loadEnv } from "dotenv";
import path from "path";

loadEnv({ path: path.resolve(process.cwd(), "client/.env.local") });
