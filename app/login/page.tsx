import Link from "next/link";

import { PublicShell } from "@/components/layout/public-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Authentication shell
            </p>
            <h1 className="mt-3 font-serif text-4xl text-foreground">Log in</h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Auth is scaffolded for MVP flow work. Use demo access while Supabase auth is wired.
            </p>

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button className={buttonVariants()} type="button">
                Log in
              </button>
              <Link className={buttonVariants({ variant: "outline" })} href="/app">
                Continue to demo app
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </PublicShell>
  );
}
