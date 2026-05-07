import Image from "next/image";

import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  variant = "header"
}: {
  className?: string;
  variant?: "header" | "sidebar";
}) {
  if (variant === "sidebar") {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        <Image
          alt="StepCorrect logo"
          className="h-12 w-auto shrink-0"
          height={495}
          priority
          src="/stepcorrect-logo.png"
          width={383}
        />
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
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        alt="StepCorrect logo"
        className="h-9 w-auto shrink-0"
        height={495}
        priority
        src="/stepcorrect-logo.png"
        width={383}
      />
      <div className="rounded-full border border-border/70 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        StepCorrect
      </div>
    </div>
  );
}
