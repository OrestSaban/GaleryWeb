"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const DEFAULT_DESTINATION = "/admin/paintings";

/**
 * `redirectedFrom` is attacker-controllable — anyone can hand the artist a
 * login link carrying it — so a successful sign-in must never bounce off-site.
 *
 * A prefix check alone is not enough: the URL parser treats a backslash like a
 * slash for http(s), so "/\evil.example" and "//evil.example" both resolve to
 * a different origin. Resolve against a placeholder instead and keep the value
 * only if the origin survives.
 */
const PLACEHOLDER_ORIGIN = "https://gallery.invalid";

function safeDestination(value: string | null): string {
  if (!value || !value.startsWith("/")) return DEFAULT_DESTINATION;
  try {
    const url = new URL(value, PLACEHOLDER_ORIGIN);
    if (url.origin !== PLACEHOLDER_ORIGIN) return DEFAULT_DESTINATION;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_DESTINATION;
  }
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectedFrom = safeDestination(params.get("redirectedFrom"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setPending(false);
      return;
    }
    router.replace(redirectedFrom);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="block">
        <span className="mb-1.5 block text-[9px] uppercase tracking-[0.18em] text-muted">
          Email
        </span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-line bg-white px-3 py-2.5 text-[13px] outline-none focus:border-blue"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[9px] uppercase tracking-[0.18em] text-muted">
          Password
        </span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-line bg-white px-3 py-2.5 text-[13px] outline-none focus:border-blue"
        />
      </label>

      {error && (
        <p className="text-[12px] text-accent-deep" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 bg-ink px-3 py-3 text-[11px] uppercase tracking-[0.12em] text-surface disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
