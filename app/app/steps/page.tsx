import { PageHeader } from "@/components/app/page-header";
import { StepCard } from "@/components/steps/step-card";
import { STEP_COPY } from "@/lib/constants";
import { listStepProgress } from "@/lib/repositories/steps";
import { requireCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function StepsPage() {
  const user = await requireCurrentUser();
  const progress = await listStepProgress(user.id);
  const progressByStep = new Map(progress.map((item) => [item.stepNumber, item.status]));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Step work"
        title="Step hub"
        description="A practical view of the 12 steps, kept simple for MVP."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {STEP_COPY.map((step) => (
          <StepCard
            key={step.stepNumber}
            stepNumber={step.stepNumber}
            title={step.title}
            description={step.description}
            status={progressByStep.get(step.stepNumber) ?? "not_started"}
          />
        ))}
      </div>
    </div>
  );
}
