"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();

        if (!supabase) {
          setError("Supabase auth is not configured yet.");
          return;
        }

        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim()
            },
            emailRedirectTo:
              typeof window !== "undefined"
                ? `${window.location.origin}/auth/callback?next=/app`
                : undefined
          }
        });

        if (authError) {
          setError(authError.message);
          return;
        }

        if (data.session) {
          router.replace("/app");
          router.refresh();
          return;
        }

        setMessage("Check your email to confirm your account, then come back and log in.");
      } catch {
        setError("Could not create your account right now.");
      }
    });
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="fullName">Name</Label>
        <Input
          id="fullName"
          placeholder="Your name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
      </div>
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

      {message ? <p className="text-sm font-medium text-foreground">{message}</p> : null}
      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

      <div className="flex flex-col gap-3">
        <button className={buttonVariants()} disabled={isPending} type="submit">
          {isPending ? "Creating account..." : "Create account"}
        </button>
        <Link className={buttonVariants({ variant: "outline" })} href="/login">
          Back to login
        </Link>
      </div>
    </form>
  );
}
