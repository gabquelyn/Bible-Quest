import { SignJWT, jwtVerify } from "jose";
import type { NextResponse } from "next/server";

export const SESSION_COOKIE = "bq_session";
const SESSION_DAYS = 7;
const SESSION_SECONDS = SESSION_DAYS * 24 * 60 * 60;

function getKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

/** A signed token holding only the user id. Everything else is looked up fresh from the database. */
export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getKey());
}

/** Returns the user id if the token is genuine and unexpired, otherwise null. */
export async function verifySessionToken(token: string): Promise<{ userId: string } | null> {
  const key = getKey(); // outside the try: a missing secret is a server bug, not an invalid session
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return payload.sub ? { userId: payload.sub } : null;
  } catch {
    return null;
  }
}

const cookieBase = {
  httpOnly: true, // not readable from JavaScript, so an XSS bug can't steal the session
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE, token, { ...cookieBase, maxAge: SESSION_SECONDS });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { ...cookieBase, maxAge: 0 });
}