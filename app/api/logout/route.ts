import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/app/lib/session";

// POST only: a GET logout could be triggered by any page embedding an <img src="/api/auth/logout">.
export async function POST() {
  const response = NextResponse.json({ ok: true }, { status: 200 });
  clearSessionCookie(response);
  return response;
}