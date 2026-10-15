import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "../../lib/mongo";
import { User } from "../model/user";
import { createSessionToken, setSessionCookie } from "../../lib/session";


const BCRYPT_ROUNDS = 12;

// One message for every failure, so the response never reveals whether the account exists.
const INVALID_CREDENTIALS = "Incorrect email/username or password.";

const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your email or username.").max(254),
  // No minimum-length rule here: that's a sign-up rule. The cap just stops absurdly large inputs.
  password: z.string().min(1, "Enter your password.").max(200),
});

// Compared against when the account doesn't exist, so "no such user" takes as long as
// "wrong password" and response time can't be used to discover which accounts exist.
const dummyHash = bcrypt.hash("not-a-real-password", BCRYPT_ROUNDS);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // zod guarantees plain strings, so Mongo operators like { "$ne": null } can't get into the query.
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const { identifier, password } = parsed.data;

  // Usernames can't contain "@" (see register), so this split is unambiguous.
  const key = identifier.toLowerCase();
  const query = identifier.includes("@") ? { email: key } : { username: key };

  try {
    await connectDB();
    const user = await User.findOne(query).lean();

    const passwordOk = await bcrypt.compare(password, user?.passwordHash ?? (await dummyHash));
    if (!user || !passwordOk) {
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    const token = await createSessionToken(user._id.toString());
    const response = NextResponse.json(
      {
        // never return the hash
        user: { id: user._id.toString(), username: user.username, email: user.email, theme: user.theme },
      },
      { status: 200 },
    );
    setSessionCookie(response, token);
    return response;
  } catch (err) {
    console.error("[login] failed:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}