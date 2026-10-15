import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/app/lib/auth";
import { SESSION_COOKIE, clearSessionCookie } from "@/app/lib/session";


const NO_STORE = { "Cache-Control": "no-store" };

/** Who am I? The frontend calls this on load to restore a session after a refresh. */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);

    if (!user) {
      const response = NextResponse.json(
        { error: "Not signed in." },
        { status: 401, headers: NO_STORE },
      );
      // A cookie that's expired, forged, or points at a deleted account is useless: remove it.
      if (request.cookies.has(SESSION_COOKIE)) clearSessionCookie(response);
      return response;
    }

    return NextResponse.json({ user }, { status: 200, headers: NO_STORE });
  } catch (err) {
    console.error("[me] failed:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}