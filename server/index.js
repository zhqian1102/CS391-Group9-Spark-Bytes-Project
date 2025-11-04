import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/auth.js";
import eventsRouter from "./routes/event.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/events", eventsRouter);

// Basic route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Spark Bytes API",
    version: "1.0.0",
    endpoints: {
      register: "POST /api/auth/register",
      login: "POST /api/auth/login",
      createEvent: "POST /api/events",
    },
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}`);
});
