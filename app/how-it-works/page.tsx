import Link from "next/link";

import { PublicShell } from "@/components/layout/public-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    title: "Capture the resentment",
    description: "Start with the raw thought. Don’t clean it up yet."
  },
  {
    title: "Clarify the actual hit",
    description: "If it’s vague, StepCorrect asks one grounded follow-up question."
  },
  {
    title: "Review the columns",
    description: "Edit the facts, affects, patterns, and your part."
  },
  {
    title: "Take the next right action",
    description: "Finish with practical action and a sponsor-shareable summary."
  }
] as const;

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            How it works
          </p>
          <h1 className="mt-3 font-serif text-5xl leading-none tracking-tight text-foreground">
            Honest reflection, practical action.
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            StepCorrect is built to help you move from a live resentment to one clean action.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {steps.map((step, index) => (
            <Card key={step.title}>
              <CardContent className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Step {index + 1}
                </p>
                <h2 className="mt-3 font-serif text-3xl text-foreground">{step.title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10">
          <Link className={buttonVariants()} href="/signup">
            Start inventory
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
