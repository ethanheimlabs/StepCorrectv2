import { redirect } from "next/navigation";
import Link from "next/link";

import { PublicShell } from "@/components/layout/public-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isPricingEnabled } from "@/lib/runtime-mode";

export default function PricingPage() {
  if (!isPricingEnabled()) {
    redirect("/");
  }

  return (
    <PublicShell>
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Pricing
          </p>
          <h1 className="mt-3 font-serif text-5xl leading-none tracking-tight text-foreground">
            Premium, calm, and straightforward.
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            One plan for the core routines: inventory, check-ins, step hub, and sponsor summaries.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Card>
            <CardContent className="p-6 sm:p-8">
              <h2 className="font-serif text-3xl text-foreground">MVP access</h2>
              <p className="mt-3 text-5xl font-semibold text-foreground">$12</p>
              <p className="mt-2 text-sm text-muted-foreground">per month</p>
              <div className="mt-6 space-y-3 text-sm leading-7 text-muted-foreground">
                <p>Daily resentment inventory</p>
                <p>Daily check-in</p>
                <p>12-step hub</p>
                <p>Sponsor summary sharing</p>
              </div>
              <Link className={buttonVariants({ className: "mt-8" })} href="/signup">
                Start inventory
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 sm:p-8">
              <h2 className="font-serif text-3xl text-foreground">Boundaries first</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                This is not a replacement for meetings, a sponsor, therapy, medical care, or
                emergency services.
              </p>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                The value is structure, reflection, and next-action clarity between meetings and
                conversations.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicShell>
  );
}
