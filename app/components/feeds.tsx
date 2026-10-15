"use client";
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { motion } from "motion/react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { THEMES } from "../data/themes";
import {
  isOwnPost,
  parsePage,

} from "@/app/lib/feed";

/* ---------- API ---------- */

// Change these if your routes live elsewhere.
const API = { me: "/api/ping", posts: "/api/posts" };
const PAGE_SIZE = 30;

type Theme = (typeof THEMES)[keyof typeof THEMES];

const isUnauthorized = (err: unknown) =>
  axios.isAxiosError(err) && err.response?.status === 401;

const apiErrorMessage = (err: unknown, fallback: string) =>
  (axios.isAxiosError(err) &&
    (err.response?.data as { error?: string } | undefined)?.error) ||
  fallback;

/** Unknown or missing theme ids fall back to dawn instead of crashing. */
const getTheme = (id?: string): Theme =>
  THEMES[id as keyof typeof THEMES] ?? THEMES.dawn;

/* ---------- Dates ---------- */

function formatTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

const dayKey = (value: string) => new Date(value).toDateString();

function dayLabel(value: string): string {
  const d = new Date(value);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/* ---------- Pieces ---------- */

function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex justify-center py-1">
      <span className="rounded-full bg-white/70 px-3 py-0.5 text-[0.7rem] font-semibold text-slate-500 shadow-sm backdrop-blur">
        {label}
      </span>
    </div>
  );
}

function PostBubble({
  post,
  own,
  animateIn,
  themeId
}: {
  post: FeedPost;
  own: boolean;
  animateIn: boolean;
  themeId: ThemeId
}) {
  // The bubble wears the theme of the USER who wrote the post, not the viewer's.
  const theme = THEMES[themeId];

  return (
    <motion.div
      initial={
        animateIn
          ? { opacity: 0, y: 14, x: own ? 24 : -24, scale: 0.96 }
          : false
      }
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className={`flex w-full ${own ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex max-w-[82%] flex-col sm:max-w-130 ${
          own ? "items-end" : "items-start"
        }`}
      >
        {/* Username on top, with a dot in the author's theme colour */}
        <span className="mx-2 mb-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <span className={`h-2 w-2 rounded-full ${theme.swatch}`} />
          {post.author.username ?? "Unknown"}
          {own && <span className="font-normal text-slate-400">(you)</span>}
        </span>

        <div
          className={`wrap-break-words rounded-2xl border-2 px-3.5 pb-2 pt-2.5 text-slate-800 shadow-sm ${
            theme.selected
          } ${own ? "rounded-tr-sm" : "rounded-tl-sm"}`}
        >
          <p className="whitespace-pre-wrap text-[0.95rem] leading-snug">
            {post.content}
          </p>
          <div className="mt-1.5 flex items-center justify-between gap-3 text-[0.68rem] text-slate-500">
            {post.passage && <span className="truncate">📖 {post.passage}</span>}
            <time dateTime={post.createdAt} className="ml-auto shrink-0">
              {formatTime(post.createdAt)}
            </time>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- Page ---------- */

export default function PostsPage() {
  const router = useRouter();

  const [me, setMe] = useState<SessionUser | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]); // oldest first, like a chat
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [attempt, setAttempt] = useState(0);

  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState("");
  // Bubbles animate in on first load, but not when older posts are added above them.
  const [animateRows, setAnimateRows] = useState(true);

  const scrollRef = useRef<HTMLElement>(null);
  const anchor = useRef<{ height: number; top: number } | null>(null);
  const scrolledToBottom = useRef(false);

  // Who am I (id, username, theme) and the newest posts, loaded together.
  useEffect(() => {
    let cancelled = false;

    Promise.all([
      axios.get<{ user: SessionUser }>(API.me),
      axios.get<RawPage | RawPost[]>(API.posts, { params: { limit: PAGE_SIZE } }),
    ])
      .then(([meRes, postsRes]) => {
        if (cancelled) return;
        const page = parsePage(postsRes.data);
        setMe(meRes.data.user);
        setPosts(page.posts);
        setNextCursor(page.nextCursor);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isUnauthorized(err)) router.replace("/login");
        else setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [router, attempt]);

  // Scroll handling, before the browser paints so there is no visible jump:
  //  - first load: start at the newest post (the bottom)
  //  - older posts added above: keep the post you were reading exactly where it was
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || status !== "ready") return;

    if (anchor.current) {
      el.scrollTop = el.scrollHeight - anchor.current.height + anchor.current.top;
      anchor.current = null;
    } else if (!scrolledToBottom.current) {
      el.scrollTop = el.scrollHeight;
      scrolledToBottom.current = true;
    }
  }, [posts, status]);

  const loadEarlier = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setMoreError("");
    try {
      const { data } = await axios.get<RawPage | RawPost[]>(API.posts, {
        params: { limit: PAGE_SIZE, cursor: nextCursor },
      });
      const page = parsePage(data);
      const el = scrollRef.current;
      if (el) anchor.current = { height: el.scrollHeight, top: el.scrollTop };
      setAnimateRows(false);
      setPosts((prev) => {
        const have = new Set(prev.map((p) => p.id));
        return [...page.posts.filter((p) => !have.has(p.id)), ...prev];
      });
      setNextCursor(page.nextCursor);
    } catch (err) {
      if (isUnauthorized(err)) router.replace("/login");
      else setMoreError(apiErrorMessage(err, "Couldn't load earlier posts."));
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, router]);

  // Resetting for a retry happens here, in the click handler, rather than inside the effect:
  // the effect only starts the request and sets state when the response arrives.
  const retry = () => {
    setStatus("loading");
    setAnimateRows(true);
    scrolledToBottom.current = false;
    setAttempt((a) => a + 1);
  };

  // The page itself wears YOUR theme; each bubble wears its author's.
  const theme = getTheme(me?.theme);

  return (
    <div
      className={`flex h-dvh flex-col transition-colors duration-700 ${theme.page}`}
    >
      <header className="border-b border-white/60 bg-white/80 px-4 py-3.5 backdrop-blur">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <span>{theme.emoji}</span>
          Bible Study Feeds
        </h1>
      </header>

      <main
        ref={scrollRef}
        className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-3 pb-6 pt-4"
      >
        {status === "loading" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="m-auto text-sm text-slate-600"
          >
            Loading posts…
          </motion.p>
        )}

        {status === "error" && (
          <div className="m-auto text-center">
            <p className="mb-3 text-sm text-red-700">
              We couldn&apos;t load the feed.
            </p>
            <button
              onClick={retry}
              className={`rounded-xl px-4 py-2 text-sm font-semibold shadow ${theme.button}`}
            >
              Try again
            </button>
          </div>
        )}

        {status === "ready" && posts.length === 0 && (
          <p className="m-auto text-sm text-slate-600">
            No posts yet. Be the first to share.
          </p>
        )}

        {status === "ready" && nextCursor && (
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={loadEarlier}
              disabled={loadingMore}
              className="rounded-full bg-white/80 px-4 py-1.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur hover:bg-white disabled:opacity-60"
            >
              {loadingMore ? "Loading…" : "Load earlier posts"}
            </button>
            {moreError && <p className="text-xs text-red-700">{moreError}</p>}
          </div>
        )}

        {status === "ready" &&
          posts.map((post, i) => (
            <Fragment key={post.id}>
              {(i === 0 ||
                dayKey(post.createdAt) !== dayKey(posts[i - 1].createdAt)) && (
                <DayDivider label={dayLabel(post.createdAt)} />
              )}
              <PostBubble
                post={post}
                own={isOwnPost(post, me)}
                animateIn={animateRows}
                themeId = {me?.theme as ThemeId}
              />
            </Fragment>
          ))}
      </main>
    </div>
  );
}