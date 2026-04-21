import Link from "next/link";

import { DemoModeNotice } from "@/components/app/demo-mode-notice";
import { PublicShell } from "@/components/layout/public-shell";
import { SafetyNotice } from "@/components/app/safety-notice";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isLaunchDemoMode, isPricingEnabled } from "@/lib/runtime-mode";

const featureCards = [
  {
    title: "Daily inventory",
    description: "Write the resentment down, get specific, and turn it into clean columns."
  },
  {
    title: "Sponsor-style reflection",
    description: "Short, honest, practical guidance that points you back to action."
  },
  {
    title: "Step work made clearer",
    description: "Keep your daily work and the broader 12-step path in one calm place."
  },
  {
    title: "Action over rumination",
    description: "End each inventory with a next right action you can actually do today."
  }
] as const;

export default function HomePage() {
  const showDemoModeNotice = isLaunchDemoMode();
  const showPricing = isPricingEnabled();

  return (
    <PublicShell>
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-full border border-border/70 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              StepCorrect
            </div>
            <h1 className="mt-6 max-w-3xl font-serif text-5xl leading-none tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Clear your head. Take the next right action.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              A structured recovery companion for daily inventory, step work, and sponsor-style
              reflection.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className={buttonVariants({ size: "lg" })} href="/signup">
                Start inventory
              </Link>
              <Link
                className={buttonVariants({ size: "lg", variant: "outline" })}
                href="/how-it-works"
              >
                See how it works
              </Link>
            </div>
          </div>

          <Card>
            <CardContent className="space-y-5 p-6 sm:p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  What it is
                </p>
                <h2 className="mt-3 font-serif text-3xl leading-tight text-foreground">
                  A sponsor-style recovery companion.
                </h2>
              </div>
              <div className="grid gap-3">
                <div className="rounded-[1.25rem] bg-muted/70 p-4 text-sm leading-7 text-muted-foreground">
                  Structured inventory for real life.
                </div>
                <div className="rounded-[1.25rem] bg-muted/70 p-4 text-sm leading-7 text-muted-foreground">
                  Honest reflection. Practical action.
                </div>
                <div className="rounded-[1.25rem] bg-muted/70 p-4 text-sm leading-7 text-muted-foreground">
                  Recovery support, one day at a time.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {showDemoModeNotice ? <DemoModeNotice className="mt-6 max-w-3xl" /> : null}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="p-5">
                <h2 className="font-serif text-2xl text-foreground">{feature.title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8">
        <Card>
          <CardContent className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              How it works
            </p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
              <p>1. Name the resentment.</p>
              <p>2. Get one clarifying question if the story is still vague.</p>
              <p>3. Review your columns, own your side, and save a sponsor summary.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Safety and boundaries
            </p>
            <h2 className="mt-3 font-serif text-3xl text-foreground">
              Support for routines, not a replacement for recovery.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              StepCorrect supports recovery routines. It does not replace meetings, a sponsor,
              therapy, medical care, or emergency services.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <SafetyNotice />
      </section>

      {showPricing ? (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <Card className="overflow-hidden">
            <CardContent className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Pricing
                </p>
                <h2 className="mt-3 font-serif text-4xl text-foreground">
                  Simple premium access.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                  Start with the core inventory flow, daily check-in, step hub, and
                  sponsor-summary sharing in one calm workspace.
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-primary px-6 py-5 text-primary-foreground">
                <p className="text-sm font-semibold uppercase tracking-[0.16em]">MVP preview</p>
                <p className="mt-2 text-4xl font-semibold">$12</p>
                <p className="mt-2 text-sm text-primary-foreground/80">per month</p>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

    </PublicShell>
  );
}
