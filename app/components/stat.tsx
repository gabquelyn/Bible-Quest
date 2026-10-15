import {motion} from "motion/react";
export default function Stat({
  emoji,
  value,
  label,
  delay,
}: {
  emoji: string;
  value: number;
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 140, damping: 16 }}
      whileHover={{ y: -3 }}
      className="rounded-2xl bg-white/90 p-4 text-center shadow-lg backdrop-blur"
    >
      <div className="text-2xl">{emoji}</div>
      <motion.div
        key={value}
        initial={{ scale: 1.4 }}
        animate={{ scale: 1 }}
        className="text-2xl font-bold text-slate-900"
      >
        {value}
      </motion.div>
      <div className="text-xs text-slate-500">{label}</div>
    </motion.div>
  );
}
