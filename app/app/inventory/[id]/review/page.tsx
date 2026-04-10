import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { SectionCard } from "@/components/app/section-card";
import { ReviewForm } from "@/components/inventory/review-form";
import { getClassificationForEntry } from "@/lib/inventory/workflow";
import { getInventoryEntry } from "@/lib/repositories/inventory";

export const dynamic = "force-dynamic";

export default async function ReviewInventoryPage({
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

  if (!entry.extractedResentment) {
    const classification = await getClassificationForEntry(entry);

    if (classification.needs_clarification) {
      redirect(`/app/inventory/${entry.id}/clarify`);
    }

    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Review your columns"
        description="Keep the facts clean and own only your side."
      />
      <SectionCard title="Structured resentment review" description="Short, direct, and editable.">
        <ReviewForm
          id={entry.id}
          initialValue={entry.extractedResentment}
          editRawHref={
            entry.clarificationText
              ? `/app/inventory/${entry.id}/clarify`
              : "/app/inventory/new"
          }
        />
      </SectionCard>
    </div>
  );
}
