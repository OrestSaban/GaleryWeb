import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";
import { SetupNotice } from "@/components/SetupNotice";
import { SITE } from "@/lib/utils";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-[360px]">
        <div className="mb-1 font-serif text-[24px]">{SITE.artist}</div>
        <div className="mb-8 text-[10px] uppercase tracking-[0.2em] text-muted">
          Admin — sign in
        </div>
        <div className="mb-5 empty:mb-0">
          <SetupNotice />
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
