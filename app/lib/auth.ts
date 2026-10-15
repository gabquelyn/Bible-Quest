import type { NextRequest } from "next/server";
import { connectDB } from "@/app/lib/mongo";
import { User } from "@/app/api/model/user";
import { SESSION_COOKIE, verifySessionToken } from "@/app/lib/session";

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  theme: string;
}

/**
 * The signed-in user for this request, or null if there's no valid session.
 * Use this at the top of any route that needs a logged-in user (e.g. posting a daily takeaway).
 *
 * It loads the user from the database on every call rather than trusting the cookie's contents,
 * so a deleted account stops working immediately and a changed theme shows up straight away.
 */
export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  await connectDB();
  const user = await User.findById(session.userId).select("username email theme").lean();
  if (!user) return null;

  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    theme: user.theme,
  };
}