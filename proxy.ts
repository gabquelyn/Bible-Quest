import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, clearSessionCookie, verifySessionToken } from "@/app/lib/session";


const PROTECTED_PAGES = ["/"]; // not signed in -> redirect to the login page
const PROTECTED_API = ["/api/posts"]; // not signed in -> 401 JSON

const LOGIN_PATH = "/login";

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isProtectedPage = matches(pathname, PROTECTED_PAGES);
  const isProtectedApi = matches(pathname, PROTECTED_API);
  if (!isProtectedPage && !isProtectedApi) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (session) return NextResponse.next();

  const response = isProtectedApi
    ? NextResponse.json({ error: "Not signed in." }, { status: 401 })
    : redirectToLogin(request, pathname + search);

  // A cookie that is present but invalid (expired, forged) is dead weight: remove it.
  if (token) clearSessionCookie(response);
  return response;
}

function redirectToLogin(request: NextRequest, returnTo: string) {
  const url = request.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  url.search = "";
  url.searchParams.set("next", returnTo); // so login can send them back to where they were headed
  return NextResponse.redirect(url);
}

export const config = {
  // Runs on every page and API route except static assets, and the lists above decide what's
  // protected. A narrow matcher would be a second list to keep in sync, and forgetting to update
  // it would leave a route silently unprotected.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};