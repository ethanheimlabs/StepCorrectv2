import { PublicShell } from "@/components/layout/public-shell";
import { Card, CardContent } from "@/components/ui/card";

const sections = [
  {
    title: "What StepCorrect is",
    description:
      "A recovery support tool for daily inventory, step work, reflection, and next right actions."
  },
  {
    title: "What it is not",
    description:
      "It is not a sponsor, not therapy, not medical care, not a diagnosis or treatment tool, and not an emergency response system."
  },
  {
    title: "When to contact a sponsor",
    description:
      "Reach out when you are stuck in resentment, close to acting out, isolating, or unsure what honest action looks like."
  },
  {
    title: "When to seek emergency help",
    description:
      "If you may hurt yourself or someone else, or you are in immediate danger, call emergency services or go to the nearest emergency room right away."
  }
] as const;

export default function SafetyPage({
  searchParams
}: {
  searchParams?: { from?: string };
}) {
  const showInventorySupport = searchParams?.from === "inventory";

  return (
    <PublicShell>
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Safety
          </p>
          <h1 className="mt-3 font-serif text-5xl leading-none tracking-tight text-foreground">
            Clear boundaries, calm language.
          </h1>
        </div>

        {showInventorySupport ? (
          <Card className="mt-8 border-destructive/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(252,244,244,0.96))]">
            <CardContent className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Pause here
              </p>
              <p className="mt-3 max-w-3xl font-serif text-2xl leading-tight text-foreground">
                This sounds heavier than a normal inventory. Get human support now: call your
                sponsor, get near safe people, or use emergency services if anyone is in immediate
                danger.
              </p>
            </CardContent>
          </Card>
        ) : null}

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {sections.map((section) => (
            <Card key={section.title}>
              <CardContent className="p-6">
                <h2 className="font-serif text-3xl text-foreground">{section.title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {section.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
