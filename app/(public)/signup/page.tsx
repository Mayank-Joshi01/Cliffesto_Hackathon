import { SignupForm } from "@/features/auth/SignupForm";
import { AuthFrame } from "@/components/layout/AuthFrame";

export default function SignupPage() {
  return (
    <AuthFrame title="Create your account" description="Join Cliffesto and make every find feel special.">
      <SignupForm />
    </AuthFrame>
  );
}
