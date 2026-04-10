import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { STEP_STATUS_LABELS } from "@/lib/constants";
import type { StepProgress } from "@/lib/types";

export function StepCard({
  stepNumber,
  title,
  description,
  status
}: {
  stepNumber: number;
  title: string;
  description: string;
  status: StepProgress["status"];
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Step {stepNumber}
            </p>
            <h3 className="mt-2 font-serif text-2xl text-foreground">{title}</h3>
          </div>
          <Badge>{STEP_STATUS_LABELS[status]}</Badge>
        </div>
        <p className="text-sm leading-7 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
