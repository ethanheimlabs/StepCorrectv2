import { cn } from "@/lib/utils";

export function SafetyNotice({
  className,
  compact = false
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border border-border/70 bg-secondary/70 text-secondary-foreground",
        compact ? "p-4 text-sm leading-6" : "p-5 text-[15px] leading-7",
        className
      )}
    >
      StepCorrect supports recovery routines. It does not replace meetings, a sponsor,
      therapy, medical care, or emergency services.
    </div>
  );
}
