import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || 5001,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET || "dev_jwt_secret",
  streamApiKey: process.env.STREAM_API_KEY,
  streamApiSecret: process.env.STREAM_API_SECRET,
  redisUrl:
    process.env.REDIS_URL || (process.env.NODE_ENV === "production" ? "" : "redis://localhost:6379"),
  nodeEnv: process.env.NODE_ENV || "development",
};
