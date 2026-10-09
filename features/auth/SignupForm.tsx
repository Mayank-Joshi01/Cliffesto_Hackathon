"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, LockKeyhole, Mail, UserRound, X } from "lucide-react";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { validateEmail, validateFullName, validatePasswordConfirmation, validateSignupPassword } from "@/lib/auth-validation";

type ApiResult = { error?: string; code?: string };
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

async function readResponse(response: Response): Promise<ApiResult> {
  try {
    return await response.json() as ApiResult;
  } catch {
    return {};
  }
}

function passwordStrength(password: string) {
  if (!password) return { score: 0, label: "Use at least 8 characters" };
  const length = [...password].length;
  let score = length >= 8 ? 1 : 0;
  if (length >= 12) score += 1;
  if (length >= 16) score += 1;
  const characterGroups = [/[a-z]/.test(password), /[A-Z]/.test(password), /\d/.test(password), /[^a-zA-Z0-9]/.test(password)].filter(Boolean).length;
  if (characterGroups >= 3) score += 1;
  return {
    score: Math.min(score, 4),
    label: ["Keep going", "Fair", "Good", "Strong", "Very strong"][Math.min(score, 4)],
  };
}

export function SignupForm() {
  const router = useRouter();
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmationRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [touched, setTouched] = useState({ fullName: false, email: false, password: false, confirmation: false });
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const strength = useMemo(() => passwordStrength(password), [password]);
  const errors = {
    fullName: (touched.fullName || submitted) ? validateFullName(fullName) : "",
    email: (touched.email || submitted) ? validateEmail(email) : "",
    password: (touched.password || submitted) ? validateSignupPassword(password) : "",
    confirmation: (touched.confirmation || submitted) ? validatePasswordConfirmation(password, confirmation) : "",
  };

  function markTouched(field: keyof typeof touched) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setError("");
    const nameError = validateFullName(fullName);
    const emailError = validateEmail(email);
    const passwordError = validateSignupPassword(password);
    const confirmationError = validatePasswordConfirmation(password, confirmation);
    if (nameError || emailError || passwordError || confirmationError) {
      (nameError ? nameRef : emailError ? emailRef : passwordError ? passwordRef : confirmationRef).current?.focus();
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), email: email.trim(), password, confirmation }),
      });
      const result = await readResponse(response);
      if (response.ok) {
        router.push("/account");
        return;
      }
      setError(result.code === "RATE_LIMITED"
        ? "Too many account attempts. Please wait a minute and try again."
        : result.code === "SERVICE_UNAVAILABLE"
          ? "We couldn't create your account right now. Please try again shortly."
          : result.code === "INVALID_ORIGIN"
            ? "This account request couldn't be verified. Reload the page and try again."
          : result.code === "DUPLICATE_ACCOUNT"
            ? "An account may already exist with this email. Try signing in or resetting your password."
          : result.code === "INVALID_INPUT"
            ? result.error ?? "Please check the information you entered."
            : "We couldn't create this account. Check your details or try signing in.");
    } catch {
      setError("We couldn't connect. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="auth-form auth-form-signup">
      <div className="auth-field">
        <label htmlFor="signup-name">Full name</label>
        <div className={`auth-input-wrap ${errors.fullName ? "has-error" : ""}`}>
          <UserRound size={18} aria-hidden="true" />
          <input
            ref={nameRef}
            id="signup-name"
            name="fullName"
            type="text"
            autoComplete="name"
            maxLength={100}
            placeholder="Your name"
            value={fullName}
            onChange={(event) => { setFullName(event.target.value); setError(""); }}
            onBlur={() => markTouched("fullName")}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? "signup-name-error" : undefined}
          />
        </div>
        {errors.fullName && <p id="signup-name-error" className="auth-field-error">{errors.fullName}</p>}
      </div>

      <div className="auth-field">
        <label htmlFor="signup-email">Email address</label>
        <div className={`auth-input-wrap ${errors.email ? "has-error" : ""}`}>
          <Mail size={18} aria-hidden="true" />
          <input
            ref={emailRef}
            id="signup-email"
            name="email"
            type="email"
            maxLength={254}
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => { setEmail(event.target.value); setError(""); }}
            onBlur={() => markTouched("email")}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "signup-email-error" : undefined}
          />
        </div>
        {errors.email && <p id="signup-email-error" className="auth-field-error">{errors.email}</p>}
      </div>

      <div className="auth-field">
        <label htmlFor="signup-password">Password</label>
        <div className={`auth-input-wrap ${errors.password ? "has-error" : ""}`}>
          <LockKeyhole size={18} aria-hidden="true" />
          <input
            ref={passwordRef}
            id="signup-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            maxLength={PASSWORD_MAX_LENGTH}
            placeholder="Create a password"
            value={password}
            onChange={(event) => { setPassword(event.target.value); setError(""); }}
            onBlur={() => markTouched("password")}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "signup-password-error" : "signup-password-help"}
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
        {errors.password
          ? <p id="signup-password-error" className="auth-field-error">{errors.password}</p>
          : <div id="signup-password-help" className="auth-strength" aria-live="polite">
              <div className="auth-strength-meter" role="meter" aria-label="Password strength" aria-valuemin={0} aria-valuemax={4} aria-valuenow={strength.score}>
                {[1, 2, 3, 4].map((item) => <span key={item} className={item <= strength.score ? `strength-${strength.score}` : ""} />)}
              </div>
              <span>{strength.label}</span>
            </div>}
        <ul className="auth-password-rules" aria-label="Password requirements">
          <li className={[...password].length >= PASSWORD_MIN_LENGTH ? "rule-met" : ""}>{[...password].length >= PASSWORD_MIN_LENGTH ? <Check size={14} /> : <span className="rule-dot" />}At least 8 characters</li>
          <li className={[...password].length <= PASSWORD_MAX_LENGTH ? "rule-met" : "rule-unmet"}>{[...password].length <= PASSWORD_MAX_LENGTH ? <Check size={14} /> : <X size={14} />}Up to 128 characters</li>
        </ul>
      </div>

      <div className="auth-field">
        <label htmlFor="signup-confirm-password">Confirm password</label>
        <div className={`auth-input-wrap ${errors.confirmation ? "has-error" : ""}`}>
          <LockKeyhole size={18} aria-hidden="true" />
          <input
            ref={confirmationRef}
            id="signup-confirm-password"
            name="confirmPassword"
            type={showConfirmation ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Enter your password again"
            value={confirmation}
            onChange={(event) => { setConfirmation(event.target.value); setError(""); }}
            onBlur={() => markTouched("confirmation")}
            aria-invalid={Boolean(errors.confirmation)}
            aria-describedby={errors.confirmation ? "signup-confirm-error" : undefined}
          />
          <button
            type="button"
            className="auth-password-toggle"
            onClick={() => setShowConfirmation((visible) => !visible)}
            aria-label={showConfirmation ? "Hide confirmation password" : "Show confirmation password"}
            aria-pressed={showConfirmation}
          >
            {showConfirmation ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </div>
        {errors.confirmation && <p id="signup-confirm-error" className="auth-field-error">{errors.confirmation}</p>}
        {!errors.confirmation && confirmation && confirmation === password && <p className="auth-field-success"><Check size={14} /> Passwords match</p>}
      </div>

      {error && <p role="alert" aria-live="polite" className="auth-alert">{error}</p>}
      <button type="submit" disabled={busy} className="auth-submit">
        {busy ? <><span className="auth-spinner" aria-hidden="true" /> Creating your account…</> : "Create account"}
      </button>
      <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
    </form>
  );
}
