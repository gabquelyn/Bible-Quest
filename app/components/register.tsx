"use client";
import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { THEMES } from "../data/themes";
import Link from "next/link";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";

type Errors = Partial<Record<"username" | "email" | "password", string>>;
interface ErrorResponse {
  error: string;
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(d: Omit<RegisterData, "theme">): Errors {
  const errors: Errors = {};
  if (d.username.trim().length < 3) errors.username = "At least 3 characters.";
  else if (!/^[a-zA-Z0-9_.-]+$/.test(d.username.trim()))
    errors.username = "Letters, numbers, _ . - only.";
  if (!EMAIL_RE.test(d.email.trim())) errors.email = "Enter a valid email.";
  if (d.password.length < 8) errors.password = "At least 8 characters.";
  return errors;
}

/* ---------- Component ---------- */
export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [themeId, setThemeId] = useState<ThemeId>("dawn");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
const router = useRouter()
  const theme = THEMES[themeId];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const found = validate({ username, email, password });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      localStorage.setItem("bible:theme", themeId);
      const res = await axios.post("/api/register", {
        username,
        email,
        password,
        theme: themeId,
      });
      router.push("/login")
    } catch (err) {
      const message = (err as AxiosError<ErrorResponse>).response?.data?.error;
      setFormError(message || "Something went wrong.");
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
        className={`absolute -left-24 -top-24 h-80 w-80 rounded-full blur-3xl transition-colors duration-700 ${theme.blob}`}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className={`absolute -bottom-32 -right-20 h-96 w-96 rounded-full blur-3xl transition-colors duration-700 ${theme.blob}`}
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.main
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 16 }}
        className="relative w-full max-w-md rounded-3xl bg-white/90 p-8 shadow-2xl backdrop-blur"
      >
        <header className="mb-6 text-center">
          <motion.div
            key={theme.emoji}
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="mb-2 text-5xl"
          >
            {theme.emoji}
          </motion.div>
          <h1 className="text-2xl font-bold text-slate-900">
            Join the Bible Quest
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Read a little every day, together with your friends.
          </p>
        </header>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="grace_walker"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
            />
            <FieldError message={errors.username} />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
            <FieldError message={errors.email} />
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
                autoComplete="new-password"
                placeholder="At least 8 characters"
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

          {/* Theme picker */}
          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-slate-700">
              Pick your theme
            </legend>
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(THEMES) as ThemeId[]).map((id) => {
                const t = THEMES[id];
                const active = id === themeId;
                return (
                  <motion.button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={t.label}
                    onClick={() => setThemeId(id)}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.9 }}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 px-1 py-2 text-[11px] font-medium text-slate-700 transition-colors ${
                      active
                        ? t.selected
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span className={`h-5 w-5 rounded-full ${t.swatch}`} />
                    {t.label}
                  </motion.button>
                );
              })}
            </div>
          </fieldset>

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
            {submitting ? "Creating account…" : "Create account"}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login">
            <button
              type="button"
              onClick={() => {}}
              className={`font-semibold underline-offset-2 hover:underline ${theme.link}`}
            >
              Log in
            </button>
          </Link>
        </p>
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
