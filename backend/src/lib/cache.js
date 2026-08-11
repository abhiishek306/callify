import { createClient } from "redis";

let client;

export const initCache = async () => {
  if (client) return client;

  client = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
  });

  client.on("error", (err) => console.error("Redis Client Error", err));

  await client.connect();
  return client;
};

export const getCache = () => client;

export const cacheSet = async (key, value, ttlSeconds = 300) => {
  try {
    const cacheClient = await initCache();
    await cacheClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch (error) {
    console.error("Cache set failed", error);
  }
};

export const cacheGet = async (key) => {
  try {
    const cacheClient = await initCache();
    const value = await cacheClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error("Cache get failed", error);
    return null;
  }
};
