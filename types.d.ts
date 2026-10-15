type ThemeId = "dawn" | "ocean" | "forest" | "rose" | "midnight";

interface Theme {
  label: string;
  emoji: string;
  page: string; // page background
  blob: string; // floating blobs
  button: string; // primary button
  focus: string; // input focus styles
  selected: string; // selected theme card
  swatch: string; // colour dot in picker
  link: string; // text links
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  theme: ThemeId;
}

type PostsByDate = Record<string, DailyPost>;

/** date key ("YYYY-MM-DD") -> ids of the chapters ticked that day */
type Ticks = Record<string, string[]>;

interface DailyPost {
  /** `${username}-${dateKey}`: unique because there is one post per user per day */
  id: string;
  username: string;
  theme: ThemeId;
  /** Local "YYYY-MM-DD" the post is for */
  dateKey: string;
  planDay: number;
  /** e.g. "Genesis 1–3 · Exodus 1" */
  passage: string;
  chapterCount: number;
  /** The takeaway the user wrote */
  content: string;
  /** ISO timestamp */
  createdAt: string;
}

  interface ErrorResponse {
  error: string;
}

interface SessionUser {
  id: string;
  username: string;
  email: string;
  theme: string;
}


interface ApiPost {
  id: string;
  username: string;
  theme: string;
  dateKey: string;
  planDay: number;
  passage: string;
  chapterCount: number;
  content: string;
  createdAt: string;
  mine: boolean;
}

interface PostsPage {
  posts: ApiPost[];
  nextCursor: string | null;
}

interface SessionUser {
  id: string;
  username: string;
  email: string;
  theme: string;
}

/** A post as returned by GET /api/posts. */
interface ApiPost {
  id: string;
  username: string;
  theme: string; // the poster's theme id, e.g. "ocean"
  dateKey: string;
  planDay: number;
  passage: string;
  chapterCount: number;
  content: string;
  createdAt: string; // ISO date
  mine: boolean; // true when the signed-in user wrote it
}

interface PostsResponse {
  posts: ApiPost[]; // newest first
  nextCursor: string | null; // pass back as ?cursor= to get older posts
}




 interface RawAuthor {
  id?: string;
  _id?: string;
  username?: string;
  theme?: string;
}

 interface RawPost {
  id?: string;
  _id?: string;
  content: string;
  createdAt: string; // ISO date
  passage?: string;
  user?: RawAuthor | string | null;
  userId?: RawAuthor | string | null;
  username?: string;
}

/** What GET /api/posts returns (newest first); a bare array is accepted too. */
 interface RawPage {
  posts: RawPost[];
  nextCursor?: string | null;
}

 interface FeedAuthor {
  id?: string;
  username?: string;
  theme?: string;
}

 interface FeedPost {
  id: string;
  content: string;
  createdAt: string;
  passage?: string;
  author: FeedAuthor;
}