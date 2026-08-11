import { createClient } from "redis";
import { env } from "../config/env.js";

let client;

export const initCache = async () => {
  if (client) return client;

  if (!env.redisUrl) {
    console.log("Redis not configured. Continuing without cache.");
    return null;
  }

  client = createClient({
    url: env.redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        return retries > 1 ? null : 500;
      },
    },
  });

  client.on("error", (err) => console.error("Redis Client Error", err));

  try {
    await client.connect();
    console.log("Redis connected");
    return client;
  } catch (error) {
    console.warn("Redis unavailable; continuing without cache.", error.message || error);
    client = null;
    return null;
  }
};

export const getCache = () => client;

export const cacheSet = async (key, value, ttlSeconds = 300) => {
  try {
    const cacheClient = await initCache();
    if (!cacheClient) return null;
    await cacheClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
    return true;
  } catch (error) {
    console.error("Cache set failed", error);
    return null;
  }
};

export const cacheGet = async (key) => {
  try {
    const cacheClient = await initCache();
    if (!cacheClient) return null;
    const value = await cacheClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error("Cache get failed", error);
    return null;
  }
};
