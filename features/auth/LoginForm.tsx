"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { validateEmail, validateLoginPassword } from "@/lib/auth-validation";

type ApiResult = { error?: string; code?: string };

async function readResponse(response: Response): Promise<ApiResult> {
  try {
    return await response.json() as ApiResult;
  } catch {
    return {};
  }
}

function safeReturnPath() {
  const value = new URLSearchParams(window.location.search).get("next");
  return value?.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : "/account";
}

export function LoginForm() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const emailError = (touched.email || submitted) ? validateEmail(email) : "";
  const passwordError = (touched.password || submitted) ? validateLoginPassword(password) : "";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setError("");
    const nextEmailError = validateEmail(email);
    const nextPasswordError = validateLoginPassword(password);
    if (nextEmailError || nextPasswordError) {
      (nextEmailError ? emailRef : passwordRef).current?.focus();
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const result = await readResponse(response);
      if (response.ok) {
        router.push(safeReturnPath());
        return;
      }
      setError(result.code === "RATE_LIMITED"
        ? "Too many sign-in attempts. Please wait a minute and try again."
        : result.code === "SERVICE_UNAVAILABLE"
          ? "We couldn't reach sign-in right now. Please try again shortly."
          : result.code === "INVALID_ORIGIN"
            ? "This sign-in request couldn't be verified. Reload the page and try again."
          : result.code === "INVALID_INPUT"
            ? result.error ?? "Check your email and password and try again."
            : "Incorrect email or password. Please try again.");
    } catch {
      setError("We couldn't connect. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="auth-form">
      <div className="auth-field">
        <label htmlFor="login-email">Email address</label>
        <div className={`auth-input-wrap ${emailError ? "has-error" : ""}`}>
          <Mail size={18} aria-hidden="true" />
          <input
            ref={emailRef}
            id="login-email"
            name="email"
            type="email"
            maxLength={254}
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => { setEmail(event.target.value); setError(""); }}
            onBlur={() => setTouched((current) => ({ ...current, email: true }))}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "login-email-error" : undefined}
          />
        </div>
        {emailError && <p id="login-email-error" className="auth-field-error">{emailError}</p>}
      </div>

      <div className="auth-field">
        <div className="auth-label-row">
          <label htmlFor="login-password">Password</label>
          <Link href="/forgot-password" className="auth-inline-link">Forgot password?</Link>
        </div>
        <div className={`auth-input-wrap ${passwordError ? "has-error" : ""}`}>
          <LockKeyhole size={18} aria-hidden="true" />
          <input
            ref={passwordRef}
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => { setPassword(event.target.value); setError(""); }}
            onBlur={() => setTouched((current) => ({ ...current, password: true }))}
            aria-invalid={Boolean(passwordError)}
            aria-describedby={passwordError ? "login-password-error" : undefined}
          />
          <button
            type="button"
            className="auth-password-toggle"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </div>
        {passwordError && <p id="login-password-error" className="auth-field-error">{passwordError}</p>}
      </div>

      {error && <p role="alert" aria-live="polite" className="auth-alert">{error}</p>}
      <button type="submit" disabled={busy} className="auth-submit">
        {busy ? <><span className="auth-spinner" aria-hidden="true" /> Signing in…</> : "Sign in"}
      </button>
      <p className="auth-switch">New to Cliffesto? <Link href="/signup">Create an account</Link></p>
    </form>
  );
}
