import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { SectionCard } from "@/components/app/section-card";
import { ClarifyForm } from "@/components/inventory/clarify-form";
import { getClassificationForEntry } from "@/lib/inventory/workflow";
import { getInventoryEntry } from "@/lib/repositories/inventory";

export const dynamic = "force-dynamic";

export default async function ClarifyInventoryPage({
  params
}: {
  params: { id: string };
}) {
  const entry = await getInventoryEntry(params.id);

  if (!entry) {
    notFound();
  }

  if (entry.status === "completed") {
    redirect(`/app/inventory/${entry.id}`);
  }

  const classification = await getClassificationForEntry(entry);

  if (!classification.needs_clarification) {
    redirect(`/app/inventory/${entry.id}/review`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Quick question"
        description="Get specific enough to work with."
      />
      <SectionCard title="Clarify the actual hit" description="Short and factual is enough.">
        <ClarifyForm
          id={entry.id}
          question={classification.clarifying_question ?? "What happened?"}
          defaultValue={entry.clarificationText}
        />
      </SectionCard>
    </div>
  );
}
