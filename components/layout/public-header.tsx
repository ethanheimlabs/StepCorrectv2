import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { isPricingEnabled } from "@/lib/runtime-mode";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  const links = [
    { href: "/how-it-works", label: "How it works" },
    ...(isPricingEnabled() ? [{ href: "/pricing", label: "Pricing" }] : []),
    { href: "/safety", label: "Safety" },
    { href: "/login", label: "Log in" }
  ] as const;

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-3" href="/">
          <div className="rounded-full border border-border/70 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            StepCorrect
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            className={cn(
              buttonVariants({
                variant: "ghost",
                size: "sm"
              }),
              "hidden md:inline-flex"
            )}
            href="/app"
          >
            Open app
          </Link>
          <Link className={buttonVariants({ size: "sm" })} href="/signup">
            Start inventory
          </Link>
        </div>
      </div>
    </header>
  );
}
