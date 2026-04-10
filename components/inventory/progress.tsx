import { cn } from "@/lib/utils";

const steps = [
  { id: "capture", label: "Capture" },
  { id: "clarify", label: "Clarify" },
  { id: "review", label: "Review" },
  { id: "actions", label: "Actions" },
  { id: "done", label: "Done" }
] as const;

const stepIndex: Record<string, number> = {
  capture: 0,
  clarify: 1,
  review: 2,
  actions: 3,
  done: 4
};

export function InventoryProgress({
  current
}: {
  current: keyof typeof stepIndex;
}) {
  const activeIndex = stepIndex[current];
  const percent = ((activeIndex + 1) / steps.length) * 100;
  const currentStep = steps[activeIndex];

  return (
    <>
      <div className="sm:hidden">
        <div className="rounded-[1.35rem] border border-border/80 bg-white/75 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Step {activeIndex + 1} of {steps.length}
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {currentStep.label}
              </p>
            </div>
            <div className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              {Math.round(percent)}%
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="hidden gap-3 sm:grid sm:grid-cols-5">
        {steps.map((step, index) => {
          const isActive = index === activeIndex;
          const isComplete = index < activeIndex;

          return (
            <div
              key={step.id}
              className={cn(
                "rounded-2xl border px-4 py-3 text-sm transition-colors",
                isActive && "border-primary bg-primary text-primary-foreground",
                isComplete && "border-accent bg-accent text-accent-foreground",
                !isActive &&
                  !isComplete &&
                  "border-border/80 bg-white/70 text-muted-foreground"
              )}
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="mt-1 font-semibold">{step.label}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
