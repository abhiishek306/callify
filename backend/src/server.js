import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import fs from "fs";
import path from "path";
import helmet from "helmet";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";

import { connectDB } from "./lib/db.js";
import { initSocket } from "./lib/socket.js";
import { createServer } from "http";
import { generalLimiter, authLimiter } from "./middleware/rateLimiter.js";
import { initCache } from "./lib/cache.js";
import { env } from "./config/env.js";
import { logger, requestLogger } from "./lib/logger.js";
import { getMetricsSnapshot } from "./lib/metrics.js";
import { createErrorResponse } from "./lib/http.js";

const app = express();
const PORT = env.port;
const server = createServer(app);

const __dirname = path.resolve();
const uploadsPath = path.join(__dirname, "uploads");

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://callify-ki5o.onrender.com",
];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  return allowedOrigins.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
};

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(generalLimiter);
app.use(requestLogger);
app.use("/uploads", express.static(uploadsPath));

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

app.get("/api/metrics", (req, res) => {
  res.status(200).json({ success: true, metrics: getMetricsSnapshot() });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

app.use((err, req, res, next) => {
  logger.error({ err, requestId: req.id }, "Unhandled error");

  const statusCode = err.statusCode || 500;
  const errorCode = err.code || "INTERNAL_SERVER_ERROR";
  const message = err.message || "Internal server error";

  res.status(statusCode).json(createErrorResponse(errorCode, message, err.details || undefined));
});

await initSocket(server);

server.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  connectDB();
  initCache().catch((error) => logger.error({ error }, "Redis init failed"));
});