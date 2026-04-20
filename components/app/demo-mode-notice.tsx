import { cn } from "@/lib/utils";

export function DemoModeNotice({
  className,
  compact = false
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border border-sky-200 bg-sky-50/90 text-sky-950",
        compact ? "p-4 text-sm leading-6" : "p-5 text-[15px] leading-7",
        className
      )}
    >
      <p className="font-semibold">Guided demo mode</p>
      <p className="mt-1 text-sky-900/90">
        This preview is seeded with example inventory, pattern memory, and weekly reflection so
        people can see the full flow working right away.
      </p>
    </div>
  );
}
