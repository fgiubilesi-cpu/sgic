import type { Metadata } from "next";

import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Login | SGIC",
};

export default function LoginPage(): JSX.Element {
  return (
    <main className="min-h-screen flex items-center justify-center bg-muted px-4">
      <LoginForm />
    </main>
  );
}

