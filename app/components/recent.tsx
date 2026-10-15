import React from "react";
import { motion } from "motion/react";
import { getReadingForDate, toDateKey } from "../data/plan";

export default function Recent({
  recent,
  posts,
  ticks,
  theme,
}: {
  recent: Date[];
  posts: PostsByDate;
  ticks: Ticks;
  theme: Theme;
}) {
  return (
    <>
      <h3 className="mb-2 mt-5 text-sm font-semibold text-slate-700">
        Last 7 days
      </h3>
      <ul className="space-y-1">
        {recent.map((date, i) => {
          const key = toDateKey(date);
          const post = posts[key];
          const done = (ticks[key] ?? []).length;
          const total = getReadingForDate(date).chapters.length;
          return (
            <motion.li
              key={key}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 + i * 0.05 }}
              className="flex items-start justify-between gap-2 rounded-xl px-3 py-2 text-sm"
            >
              <span className="min-w-0">
                <span className="block font-medium text-slate-800">
                  {i === 0
                    ? "Today"
                    : i === 1
                      ? "Yesterday"
                      : date.toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                </span>
                {post ? (
                  <span className="block truncate text-xs italic text-slate-500">
                    &ldquo;{post.content}&rdquo;
                  </span>
                ) : (
                  <span className="block text-xs text-slate-400">
                    {i === 0 ? "Not finished yet" : "No post"}
                  </span>
                )}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  post
                    ? `${theme.swatch} text-white`
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {post ? "✓" : `${Math.min(done, total)}/${total}`}
              </span>
            </motion.li>
          );
        })}
      </ul>
    </>
  );
}
