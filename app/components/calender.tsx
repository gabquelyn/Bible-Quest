import React from "react";
import { motion } from "motion/react";
export default function Calender({
  calendar,
  isComplete,
  ticks,
  theme,
  todayKey,
}: {
  calendar: {
    date: Date;
    key: string;
    future: boolean;
  }[];
  isComplete: (key: string) => boolean;
  ticks: Ticks;
  theme: Theme;
  todayKey: string;
}) {
  return (
    <>
      <div className="mb-1 grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold text-slate-400">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span className={`${theme.link}`} key={i}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {calendar.map(({ date, key, future }, i) => {
          const full = isComplete(key);
          const partial = !full && (ticks[key]?.length ?? 0) > 0;
          const label = date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });
          return (
            <motion.div
              key={key}
              title={`${label}${full ? ": completed" : ""}`}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: future ? 0.35 : 1, scale: 1 }}
              transition={{ delay: 0.35 + i * 0.012 }}
              className={`flex aspect-square items-center justify-center rounded-lg text-[10px] font-semibold ${
                full
                  ? `${theme.swatch} text-white`
                  : partial
                    ? `border-2 ${theme.selected} text-slate-700`
                    : "bg-slate-100 text-slate-400"
              } ${key === todayKey ? "ring-2 ring-slate-800 ring-offset-2" : ""}`}
            >
              {date.getDate()}
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
