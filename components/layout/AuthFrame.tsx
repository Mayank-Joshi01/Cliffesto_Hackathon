import type { ReactNode } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export function AuthFrame({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="auth-panel" aria-labelledby="auth-heading">
          <Link href="/" className="auth-brand-mark" aria-label="Cliffesto home">
            <span>c.</span><Sparkles size={15} aria-hidden="true" />
          </Link>
          <div className="auth-panel-heading">
            <h1 id="auth-heading">{title}</h1>
            <p>{description}</p>
          </div>
          {children}
          <p className="auth-privacy-note">Your account details stay private and secure.</p>
        </section>
      </div>
    </main>
  );
}
