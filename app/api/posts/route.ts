import { NextResponse, type NextRequest } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { connectDB } from "@/app/lib/mongo";
import { getSessionUser } from "@/app/lib/auth";
import { SESSION_COOKIE, clearSessionCookie } from "@/app/lib/session";
import { Post } from "@/app/api/model/post";

const NO_STORE = { "Cache-Control": "no-store" };

const querySchema = z.object({
  limit: z.coerce.number().int().min(1, "limit must be at least 1.").max(50, "limit can be at most 50.").default(20),
  /** The `nextCursor` from the previous page. Omit for the first page. */
  cursor: z.string().regex(/^[a-f\d]{24}$/i, "Invalid cursor.").optional(),
  /** "true" returns only the signed-in user's own posts. */
  mine: z.enum(["true", "false"]).default("false"),
  /** Only posts for this day, e.g. 2026-10-14. */
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dateKey must look like 2026-10-14.").optional(),
});

/**
 * GET /api/posts?limit=20&cursor=<id>&mine=true&dateKey=2026-10-14
 * Newest first. Returns { posts, nextCursor }; nextCursor is null on the last page.
 */
export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid query." },
      { status: 400, headers: NO_STORE },
    );
  }
  const { limit, cursor, mine, dateKey } = parsed.data;

  try {
    const me = await getSessionUser(request);
    if (!me) {
      const response = NextResponse.json(
        { error: "Not signed in." },
        { status: 401, headers: NO_STORE },
      );
      if (request.cookies.has(SESSION_COOKIE)) clearSessionCookie(response);
      return response;
    }

    await connectDB();

    const filter: { userId?: Types.ObjectId; dateKey?: string; _id?: { $lt: Types.ObjectId } } = {};
    if (mine === "true") filter.userId = new Types.ObjectId(me.id);
    if (dateKey) filter.dateKey = dateKey;
    if (cursor) filter._id = { $lt: new Types.ObjectId(cursor) };

    const rows = await Post.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return NextResponse.json(
      {
        posts: page.map((p) => ({
          id: p._id.toString(),
          username: p.username,
          dateKey: p.dateKey,
          planDay: p.planDay,
          passage: p.passage,
          chapterCount: p.chapterCount,
          content: p.content,
          createdAt: p.createdAt.toISOString(),
          mine: p.userId.toString() === me.id, // lets the UI show "yours" / future edit & delete
        })),
        nextCursor: hasMore ? page[page.length - 1]._id.toString() : null,
      },
      { status: 200, headers: NO_STORE },
    );
  } catch (err) {
    console.error("[posts:get] failed:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}



const createSchema = z.object({
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dateKey must look like 2026-10-14."),
  planDay: z.coerce.number().int().min(1, "planDay must be at least 1."),
  passage: z.string().trim().min(1, "passage is required.").max(200),
  chapterCount: z.coerce.number().int().min(1, "chapterCount must be at least 1.").max(150),
  content: z.string().trim().min(1, "Post can't be empty.").max(5000, "Post can be at most 5000 characters."),
});

/**
 * POST /api/posts
 * Body: { dateKey, planDay, passage, chapterCount, content }
 * Returns the created post (same shape as the GET items) with status 201.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400, headers: NO_STORE },
    );
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400, headers: NO_STORE },
    );
  }

  try {
    const me = await getSessionUser(request);
    if (!me) {
      const response = NextResponse.json(
        { error: "Not signed in." },
        { status: 401, headers: NO_STORE },
      );
      if (request.cookies.has(SESSION_COOKIE)) clearSessionCookie(response);
      return response;
    }

    await connectDB();

    const created = await Post.create({
      ...parsed.data,
      userId: new Types.ObjectId(me.id),
      username: me.username, // taken from the session, never from the client
    });

    return NextResponse.json(
      {
        post: {
          id: created._id.toString(),
          username: created.username,
          dateKey: created.dateKey,
          planDay: created.planDay,
          passage: created.passage,
          chapterCount: created.chapterCount,
          content: created.content,
          createdAt: created.createdAt.toISOString(),
          mine: true,
        },
      },
      { status: 201, headers: NO_STORE },
    );
  } catch (err) {
    console.error("[posts:post] failed:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500, headers: NO_STORE },
    );
  }
}