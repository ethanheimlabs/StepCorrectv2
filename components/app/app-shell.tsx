"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { LogoutButton } from "@/components/app/logout-button";
import { APP_NAV_ITEMS } from "@/lib/constants";
import { hasSupabaseAuthEnv } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  fullName
}: {
  children: ReactNode;
  fullName: string;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(251,251,249,0.92),rgba(240,243,247,0.96))]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 pb-10 pt-4 sm:px-6 lg:flex-row lg:px-8 lg:pt-8">
        <aside className="lg:w-[280px] lg:flex-none">
          <div className="rounded-[2rem] border border-border/70 bg-white/85 p-5 shadow-panel backdrop-blur">
            <div className="flex items-center justify-between gap-4 lg:block">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  StepCorrect
                </p>
                <h1 className="mt-2 font-serif text-2xl leading-tight text-foreground">
                  Clear your head.
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Take the next right action.
                </p>
              </div>

              <div className="rounded-full border border-border/70 bg-secondary/60 px-4 py-2 text-sm font-medium text-secondary-foreground">
                {fullName}
              </div>
            </div>

            <nav className="mt-6 grid gap-2">
              {APP_NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-6 rounded-[1.5rem] bg-muted/80 p-4 text-sm leading-6 text-muted-foreground">
              StepCorrect supports recovery routines. It does not replace meetings, a sponsor,
              therapy, medical care, or emergency services.
            </div>

            {hasSupabaseAuthEnv() ? (
              <div className="mt-4">
                <LogoutButton />
              </div>
            ) : null}
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
