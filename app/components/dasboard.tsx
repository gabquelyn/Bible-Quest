"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { PLAN_DAYS, getReadingForDate, toDateKey } from "../data/plan";
import { MAX_POST_LENGTH, MIN_POST_LENGTH } from "../data/posts";
import { THEMES } from "../data/themes";
import { Legend } from "./legend";
import Stat from "./stat";
import Recent from "./recent";
import Calender from "./calender";
import Compose from "./compose";
import { useRouter } from "next/navigation";
import axios, { AxiosResponse } from "axios";

const API = {
  me: "/api/ping",
  posts: "/api/posts",
  logout: "/api/logout",
};



const toDailyPost = (p: ApiPost): DailyPost => ({
  id: p.id,
  username: p.username,
  theme: p.theme as DailyPost["theme"],
  dateKey: p.dateKey,
  planDay: p.planDay,
  passage: p.passage,
  chapterCount: p.chapterCount,
  content: p.content,
  createdAt: p.createdAt,
});

const isUnauthorized = (err: unknown) =>
  axios.isAxiosError(err) && err.response?.status === 401;

const apiErrorMessage = (err: unknown, fallback: string) =>
  (axios.isAxiosError(err) &&
    (err.response?.data as { error?: string } | undefined)?.error) ||
  fallback;

/** Safety cap on history pages (50 posts each), so a bug can never loop forever. */
const MAX_PAGES = 20;

/** date key ("YYYY-MM-DD") -> ids of the chapters ticked that day (kept on this device only) */
type Ticks = Record<string, string[]>;
type Theme = (typeof THEMES)[keyof typeof THEMES];

/* ---------- Helpers ---------- */

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function useTicks(username: string) {
  const storageKey = `bible-quest:progress:${username}`;

  const [ticks, setTicks] = useState<Ticks>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as Ticks) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(ticks));
    } catch {
      /* ignore */
    }
  }, [ticks, storageKey]);

  const toggle = useCallback((dateKey: string, chapterId: string) => {
    setTicks((prev) => {
      const set = new Set(prev[dateKey] ?? []);
      if (set.has(chapterId)) set.delete(chapterId);
      else set.add(chapterId);
      return { ...prev, [dateKey]: [...set] };
    });
  }, []);

  const setAll = useCallback((dateKey: string, ids: string[]) => {
    setTicks((prev) => ({ ...prev, [dateKey]: ids }));
  }, []);

  return { ticks, toggle, setAll };
}

/** A draft that survives a refresh, so a half-written takeaway isn't lost. */
function useDraft(storageKey: string) {
  const [draft, setDraft] = useState(() => {
    try {
      return localStorage.getItem(storageKey) ?? "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    try {
      if (draft) localStorage.setItem(storageKey, draft);
      else localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }, [draft, storageKey]);

  return [draft, setDraft] as const;
}

/** Full-screen loading / error state shown before the dashboard has its data. */
function Splash({
  theme,
  message,
  onRetry,
}: {
  theme: Theme;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className={`flex min-h-screen items-center justify-center px-4 ${theme.page}`}
    >
      <div className="rounded-3xl bg-white/90 p-8 text-center shadow-xl backdrop-blur">
        {message ? (
          <>
            <p className="mb-4 text-sm text-slate-700">{message}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className={`rounded-xl px-4 py-2 text-sm font-semibold shadow ${theme.button}`}
              >
                Try again
              </button>
            )}
          </>
        ) : (
          <motion.div
            className="text-4xl"
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          >
            📖
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    axios
      .get<{ user: SessionUser }>(API.me)
      .then((res) => {
        if (!cancelled) setUser(res.data.user);
      })
      .catch((err) => {
        if (cancelled) return;

        if (isUnauthorized(err)) {
          router.replace("/login");
        } else {
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router, attempt]);

  if (failed) {
    return (
      <Splash
        theme={THEMES.dawn}
        message="We couldn't load your account. Check your connection and try again."
        onRetry={() => {
          setFailed(false);
          setAttempt((a) => a + 1);
        }}
      />
    );
  }
  if (!user) return <Splash theme={THEMES.dawn} />;

  return <DashboardContent user={user} />;
}

/* ---------- Page: the dashboard ---------- */

function DashboardContent({ user }: { user: SessionUser }) {
  const { username } = user;
  const theme = THEMES[user.theme as keyof typeof THEMES] ?? THEMES.dawn;
  const router = useRouter();
  const { ticks, toggle, setAll } = useTicks(username);

  const today = useMemo(() => startOfDay(new Date()), []);
  const todayKey = toDateKey(today);
  const reading = useMemo(() => getReadingForDate(today), [today]);

  /* The user's whole post history comes from the server. Streak, totals and the
     calendar are all derived from it. */
  const [posts, setPosts] = useState<PostsByDate>({});
  const [postsStatus, setPostsStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const byDate: PostsByDate = {};
        let cursor: string | null = null;

        for (let page = 0; page < MAX_PAGES; page++) {
          const res: AxiosResponse<PostsPage> = await axios.get<PostsPage>(
            API.posts,
            {
              params: {
                mine: true,
                limit: 50,
                cursor: cursor ?? undefined,
              },
            },
          );

          for (const p of res.data.posts) {
            byDate[p.dateKey] = toDailyPost(p);
          }

          cursor = res.data.nextCursor;
          if (!cursor) break;
        }

        if (!cancelled) {
          setPosts(byDate);
          setPostsStatus("ready");
        }
      } catch (err) {
        if (cancelled) return;

        if (isUnauthorized(err)) {
          router.replace("/login");
        } else {
          setPostsStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, reloadKey]);

  const [draft, setDraft] = useDraft(
    `bible-quest:draft:${username}:${todayKey}`,
  );
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  const todayPost = posts[todayKey];
  const posted = Boolean(todayPost);
  const doneIds = new Set(ticks[todayKey] ?? []);
  const doneCount = reading.chapters.filter((c) => doneIds.has(c.id)).length;
  const allTicked =
    reading.chapters.length > 0 && doneCount === reading.chapters.length;
  const pct = reading.chapters.length
    ? Math.round((doneCount / reading.chapters.length) * 100)
    : 0;
  const locked = posted || posting;

  /* A day only counts once its takeaway has been posted. */
  const isComplete = useCallback((key: string) => Boolean(posts[key]), [posts]);

  const stats = useMemo(() => {
    // Today still counts as "alive" until the day is over.
    let streak = 0;
    let cursor = isComplete(todayKey) ? today : addDays(today, -1);
    while (isComplete(toDateKey(cursor)) && streak < 3650) {
      streak++;
      cursor = addDays(cursor, -1);
    }
    const all = Object.values(posts);
    return {
      streak,
      daysCompleted: all.length,
      chaptersRead: all.reduce((sum, p) => sum + p.chapterCount, 0),
    };
  }, [posts, today, todayKey, isComplete]);

  /* Calendar: 5 weeks, Sunday-aligned, ending with the current week. View-only. */
  const calendar = useMemo(() => {
    const start = addDays(today, -(today.getDay() + 28));
    return Array.from({ length: 35 }, (_, i) => {
      const date = addDays(start, i);
      return { date, key: toDateKey(date), future: date > today };
    });
  }, [today]);

  const recent = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(today, -i)),
    [today],
  );

  async function handlePost() {
    const content = draft.trim();
    if (content.length < MIN_POST_LENGTH) {
      setPostError(
        `Share a little more, at least ${MIN_POST_LENGTH} characters (${content.length} so far).`,
      );
      return;
    }
    setPostError("");
    setPosting(true);

    try {
      // The server adds who you are (username, theme) from your session.
      const { data } = await axios.post<{ post: ApiPost }>(API.posts, {
        dateKey: todayKey,
        planDay: reading.planDay,
        passage: reading.passage,
        chapterCount: reading.chapters.length,
        content,
      });
      setPosts((prev) => ({ ...prev, [todayKey]: toDailyPost(data.post) }));
      setDraft("");
    } catch (err) {
      if (isUnauthorized(err)) {
        router.replace("/login");
        return;
      }
      setPostError(
        apiErrorMessage(err, "Couldn't share your post. Please try again."),
      );
    } finally {
      setPosting(false);
    }
  }

  const onLogout = async () => {
    await axios.post(API.logout);
    router.replace("/login");
  };

  // Don't flash zeros while history loads: streak and totals would jump a moment later.
  if (postsStatus === "loading") return <Splash theme={theme} />;
  if (postsStatus === "error") {
    return (
      <Splash
        theme={theme}
        message="We couldn't load your reading history."
        onRetry={() => setReloadKey((k) => k + 1)}
      />
    );
  }

  const card = "rounded-3xl bg-white/90 p-6 shadow-xl backdrop-blur";
  const dateLabel = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className={`relative min-h-screen overflow-hidden px-4 py-8 transition-colors duration-700 ${theme.page}`}
    >
      <motion.div
        aria-hidden
        className={`absolute -left-24 -top-24 h-80 w-80 rounded-full blur-3xl ${theme.blob}`}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className={`absolute -bottom-32 -right-20 h-96 w-96 rounded-full blur-3xl ${theme.blob}`}
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto max-w-5xl space-y-5">
        {/* Header */}
    <motion.header
  initial={{ opacity: 0, y: -16 }}
  animate={{ opacity: 1, y: 0 }}
  className={`${card} flex items-center justify-between py-4!`}
>
  <div className="flex items-center gap-3">
    <span className="text-3xl">{theme.emoji}</span>
    <div>
      <h1 className="text-lg font-bold text-slate-900">Hello, {username}</h1>
      <p className="text-xs text-slate-500">
        Day {reading.planDay} of {PLAN_DAYS}
      </p>
    </div>
  </div>

  <div className="flex items-center gap-2">
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => router.push("/feed")}
      aria-label="Open chat"
      className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold shadow ${theme.button}`}
    >
      <span>💬</span>
      <span className="hidden sm:inline">Feed</span>
    </motion.button>

    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.95 }}
      onClick={onLogout}
      className="rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
    >
      Log out
    </motion.button>
  </div>
</motion.header>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Stat
            emoji="🔥"
            value={stats.streak}
            label="day streak"
            delay={0.05}
          />
          <Stat
            emoji="✅"
            value={stats.daysCompleted}
            label="days completed"
            delay={0.1}
          />
          <Stat
            emoji="📖"
            value={stats.chaptersRead}
            label="chapters read"
            delay={0.15}
          />
        </div>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-5 lg:gap-6">
          {/* Today's reading */}
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 110,
              damping: 16,
            }}
            className={`${card} min-w-0 lg:col-span-3`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Today&apos;s reading
            </p>
            <h2 className="text-xl font-bold text-slate-900">{dateLabel}</h2>
            <p className="mb-4 text-sm text-slate-600">{reading.passage}</p>
            {/* Progress bar */}
            <div className="mb-5">
              <div className="mb-1 flex justify-between text-xs font-medium text-slate-500">
                <span>
                  {doneCount} of {reading.chapters.length} chapters
                </span>
                <span>{pct}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className={`h-full rounded-full ${theme.swatch}`}
                  initial={false}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                />
              </div>
            </div>
            {/* Chapter checklist */}
            <ul className="space-y-2.5">
              {reading.chapters.map((c, i) => {
                const done = posted || doneIds.has(c.id);
                return (
                  <motion.li
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <motion.button
                      type="button"
                      role="checkbox"
                      aria-checked={done}
                      disabled={locked}
                      onClick={() => toggle(todayKey, c.id)}
                      whileHover={locked ? undefined : { scale: 1.015 }}
                      whileTap={locked ? undefined : { scale: 0.97 }}
                      className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors ${
                        done
                          ? theme.selected
                          : "border-slate-200 bg-white hover:border-slate-300"
                      } ${locked ? "cursor-default" : ""}`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                          done
                            ? `${theme.swatch} border-transparent`
                            : "border-slate-300"
                        }`}
                      >
                        {done && (
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4 text-white"
                            fill="none"
                          >
                            <motion.path
                              d="M5 12l5 5L20 7"
                              stroke="currentColor"
                              strokeWidth={3.5}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 0.25 }}
                            />
                          </svg>
                        )}
                      </span>
                      <span
                        className={`font-medium transition-colors ${
                          done
                            ? "text-slate-400 line-through"
                            : "text-slate-800"
                        }`}
                      >
                        {c.id}
                      </span>
                    </motion.button>
                  </motion.li>
                );
              })}
            </ul>
            {/* Below the checklist: shortcut -> post composer -> finished */}

            <Compose
              theme={theme}
              posted={posted}
              todayPost={todayPost}
              allTicked={allTicked}
              MAX_POST_LENGTH={MAX_POST_LENGTH}
              MIN_POST_LENGTH={MIN_POST_LENGTH}
              draft={draft}
              setDraft={setDraft}
              postError={postError}
              posting={posting}
              handlePost={handlePost}
              onClick={() =>
                setAll(
                  todayKey,
                  reading.chapters.map((c) => c.id),
                )
              }
            />
          </motion.section>

          {/* Records (view-only) */}
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.3,
              type: "spring",
              stiffness: 110,
              damping: 16,
            }}
            className={`${card} lg:col-span-2`}
          >
            <h2 className="text-lg font-bold text-slate-900">
              Reading records
            </h2>
            <p className="mb-4 text-xs text-slate-500">
              A day counts once you&apos;ve read it and shared your takeaway.
            </p>

            {/* Calendar heat map */}
            <Calender
              calendar={calendar}
              isComplete={isComplete}
              ticks={ticks}
              theme={theme}
              todayKey={todayKey}
            />

            <div className="mt-2 flex items-center justify-end gap-3 text-[10px] text-slate-500">
              <Legend className="bg-slate-100" label="none" />
              <Legend className={`border ${theme.selected}`} label="started" />
              <Legend className={theme.swatch} label="posted" />
            </div>

            {/* Last 7 days */}
            <Recent recent={recent} posts={posts} ticks={ticks} theme={theme} />
          </motion.section>
        </div>
      </div>
    </div>
  );
}
