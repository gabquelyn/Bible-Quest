import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "../../lib/mongo";
import { THEME_IDS, User } from "../model/user";

// Mongoose and bcrypt need Node APIs, so don't run this on the Edge runtime.
// export const runtime = "nodejs";

const BCRYPT_ROUNDS = 12;

const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username must be 30 characters or fewer.")
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      "Username can only use letters, numbers, _ . and -.",
    ),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "Email is too long.")
    .email("Enter a valid email."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    // bcrypt only uses the first 72 *bytes*; reject longer input instead of silently truncating it.
    .refine(
      (p) => Buffer.byteLength(p, "utf8") <= 72,
      "Password is too long (72 bytes max).",
    ),
  theme: z.enum(THEME_IDS, { message: "Pick a valid theme." }),
});

type ConflictField = "email" | "username" | null;

function conflict(field: ConflictField) {
  const message =
    field === "email"
      ? "That email is already registered."
      : field === "username"
        ? "That username is taken."
        : "That username or email is already in use.";
  return NextResponse.json({ error: message }, { status: 409 });
}

/** MongoDB's duplicate-key error (E11000), raised by the unique indexes. */
function isDuplicateKeyError(
  err: unknown,
): err is { code: 11000; keyPattern?: Record<string, number> } {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: unknown }).code === 11000
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  // zod guarantees these are plain strings, so a body like { "email": { "$ne": null } }
  // is rejected here and can never reach a Mongo query as an operator.
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const { username, email, password, theme } = parsed.data;
  // Setup failures (bad connection string, an index that can't be built) are NOT user conflicts.
  // Keep them out of the duplicate-key handling below, or they get reported as "username is taken".
  try {
    await connectDB();
    await User.init(); // make sure the unique indexes exist before we rely on them
  } catch (err) {
    console.error("[register] database setup failed:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  try {
    // Cheap duplicate check first, so we don't spend ~250ms hashing a password we'll throw away.
    const existing = await User.findOne({
      $or: [{ email }, { username: username.toLowerCase() }],
    })
      .select("email username")
      .lean();
    if (existing) {
      if (existing.email === email) return conflict("email");
      if (existing.username === username) return conflict("username");
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await User.create({
      username: username.toLowerCase(),
      email,
      passwordHash,
      theme,
    });

    return NextResponse.json(
      {
        // never return the hash
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          theme: user.theme,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    // Two sign-ups racing past the check above: the unique indexes still catch it.
    if (isDuplicateKeyError(err)) {
      console.warn("[register] duplicate key:", err); // shows exactly which index/value collided
      const fields = Object.keys(err.keyPattern ?? {});
      return conflict(
        fields.includes("email")
          ? "email"
          : fields.includes("username")
            ? "username"
            : null,
      );
    }
    console.error("[register] failed:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
