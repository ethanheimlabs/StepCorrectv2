"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();

        if (!supabase) {
          setError("Supabase auth is not configured yet.");
          return;
        }

        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (authError) {
          setError(authError.message);
          return;
        }

        router.replace("/app");
        router.refresh();
      } catch {
        setError("Could not log in right now.");
      }
    });
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

      <div className="flex flex-col gap-3">
        <button className={buttonVariants()} disabled={isPending} type="submit">
          {isPending ? "Logging in..." : "Log in"}
        </button>
        <Link className={buttonVariants({ variant: "outline" })} href="/signup">
          Create account
        </Link>
      </div>
    </form>
  );
}
