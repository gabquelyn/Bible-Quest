"use client";
import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { THEMES } from "../data/themes";
import Link from "next/link";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";

export interface LoginData {
  /** Email or username */
  identifier: string;
  password: string;
}

type Errors = Partial<Record<"identifier" | "password", string>>;

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const themeId = localStorage.getItem("bible:theme") as ThemeId;
  const theme = THEMES[themeId || "dawn"];
  const router = useRouter();
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    const found: Errors = {};
    if (!identifier.trim()) found.identifier = "Enter your email or username.";
    if (!password) found.password = "Enter your password.";
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setShakeKey((k) => k + 1);
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post("/api/login", {
        identifier: identifier.trim(),
        password,
      });
      router.push("/")
    } catch (err) {
      const message = (err as AxiosError<ErrorResponse>).response?.data?.error;
      setFormError(message || "Something went wrong.");
      setShakeKey((k) => k + 1);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = `w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:ring-4 ${theme.focus}`;

  return (
    <div
      className={`relative font-snig flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 transition-colors duration-700 ${theme.page}`}
    >
      {/* Floating background blobs */}
      <motion.div
        aria-hidden
        className={`absolute -right-24 -top-24 h-80 w-80 rounded-full blur-3xl ${theme.blob}`}
        animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className={`absolute -bottom-32 -left-20 h-96 w-96 rounded-full blur-3xl ${theme.blob}`}
        animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.main
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 16 }}
        className="relative w-full max-w-md"
      >
        {/* The shake wrapper re-mounts (via key) on every failed attempt */}
        <motion.div
          key={shakeKey}
          animate={
            shakeKey > 0 ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : undefined
          }
          transition={{ duration: 0.45 }}
          className="rounded-3xl bg-white/90 p-8 shadow-2xl backdrop-blur"
        >
          <header className="mb-6 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 15,
                delay: 0.15,
              }}
              className="mb-2 text-5xl"
            >
              📖
            </motion.div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500">
              Today&apos;s reading is waiting for you.
            </p>
          </header>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Identifier */}
            <div>
              <label
                htmlFor="identifier"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Email or username
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                placeholder="you@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className={inputClass}
              />
              <FieldError message={errors.identifier} />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-16`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <FieldError message={errors.password} />
            </div>

            {/* Form-level error */}
            <AnimatePresence>
              {formError && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  {formError}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={`w-full rounded-xl px-4 py-3 font-semibold shadow-lg transition-colors disabled:opacity-60 ${theme.button}`}
            >
              {submitting ? "Logging in…" : "Log in"}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            New here?{" "}
            <Link href="/register">
              <button
                type="button"
                className={`font-semibold underline-offset-2 hover:underline ${theme.link}`}
              >
                Create an account
              </button>
            </Link>
          </p>
        </motion.div>
      </motion.main>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-1 text-xs text-red-600"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
