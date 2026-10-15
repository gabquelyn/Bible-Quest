import React, { SetStateAction } from "react";
import { motion, AnimatePresence } from "motion/react";

export default function Compose({
  theme,
  posted,
  todayPost,
  allTicked,
  MAX_POST_LENGTH,
  MIN_POST_LENGTH,
  draft,
  setDraft,
  posting,
  postError,
  handlePost,
  onClick
}: {
  theme: Theme;
  posted: boolean;
  todayPost: DailyPost;
  allTicked: boolean;
  MAX_POST_LENGTH: number;
  MIN_POST_LENGTH: number;
  draft: string;
  setDraft: (value: SetStateAction<string>) => void;
  posting: boolean;
  postError: string;
  handlePost: () => void;
  onClick: () => void
}) {
  return (
    <div className="mt-5">
      <AnimatePresence mode="wait" initial={false}>
        {posted && todayPost ? (
          <motion.div
            key="posted"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
            className={`rounded-2xl border-2 p-4 ${theme.selected}`}
          >
            <p className="mb-2 font-semibold text-slate-800">
              <motion.span
                className="mr-2 inline-block"
                animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                transition={{ duration: 0.7 }}
              >
                🎉
              </motion.span>
              All done for today! Your post is in.
            </p>
            <blockquote className="whitespace-pre-wrap rounded-xl bg-white/80 p-3 text-sm text-slate-700">
              {todayPost.content}
            </blockquote>
          </motion.div>
        ) : allTicked ? (
          <motion.div
            key="composer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="-m-1 overflow-hidden p-1"
          >
            <label
              htmlFor="takeaway"
              className="mb-1 block text-sm font-semibold text-slate-800"
            >
              What did you get from today&apos;s reading?
            </label>
            <p className="mb-2 text-xs text-slate-500">
              Write your takeaway to finish today. It&apos;s what keeps you
              accountable.
            </p>
            <textarea
              id="takeaway"
              rows={5}
              maxLength={MAX_POST_LENGTH}
              value={draft}
              disabled={posting}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="What stood out? What did you learn, or feel challenged by?"
              className={`w-full resize-none rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:ring-4 ${theme.focus}`}
            />
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-red-600">{postError}</span>
              <span
                className={
                  draft.trim().length >= MIN_POST_LENGTH
                    ? "text-slate-500"
                    : "text-slate-400"
                }
              >
                {draft.length}/{MAX_POST_LENGTH}
              </span>
            </div>
            <motion.button
              type="button"
              disabled={posting}
              onClick={handlePost}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={`mt-3 w-full rounded-xl px-4 py-3 font-semibold shadow-lg transition-colors disabled:opacity-60 ${theme.button}`}
            >
              {posting ? "Posting…" : "Post & finish today"}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="shortcut"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClick}
              className={`w-full rounded-xl px-4 py-3 font-semibold shadow-lg transition-colors ${theme.button}`}
            >
              Mark all as read
            </motion.button>
            <p className="mt-2 text-center text-xs text-slate-500">
              Tick every chapter, then share what you got from it to finish
              today.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
