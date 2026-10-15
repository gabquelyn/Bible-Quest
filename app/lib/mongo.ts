import mongoose from "mongoose";

/**
 * Next.js reloads modules in dev and runs route handlers in many short-lived workers.
 * Caching the connection on globalThis stops us opening a new connection per request / reload.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const g = globalThis as unknown as { mongooseCache?: MongooseCache };
const cache: MongooseCache = (g.mongooseCache ??= { conn: null, promise: null });

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  // Checked here, not at import time, so `next build` doesn't fail when the env var is absent.
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set.");

  cache.promise ??= mongoose.connect(uri, { bufferCommands: false });

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null; // let the next request retry instead of caching the failure
    throw err;
  }
  return cache.conn;
}