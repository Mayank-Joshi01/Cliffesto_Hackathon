import { LoginForm } from "@/features/auth/LoginForm";
import { AuthFrame } from "@/components/layout/AuthFrame";

export default function LoginPage() {
  return (
    <AuthFrame title="Welcome back" description="Sign in to continue discovering your favorites.">
      <LoginForm />
    </AuthFrame>
  );
}
