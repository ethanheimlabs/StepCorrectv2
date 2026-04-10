import { notFound, redirect } from "next/navigation";

import { ActionsForm } from "@/components/inventory/actions-form";
import { PageHeader } from "@/components/app/page-header";
import { SectionCard } from "@/components/app/section-card";
import { getInventoryEntry, listInventoryActions } from "@/lib/repositories/inventory";

export const dynamic = "force-dynamic";

export default async function InventoryActionsPage({
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

  if (!entry.extractedResentment || !entry.shareableSummary) {
    redirect(`/app/inventory/${entry.id}/review`);
  }

  const actions = await listInventoryActions(entry.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Next right actions"
        description="Action over rumination."
      />
      <SectionCard title="Work the next clean move" description="Check these off as you go.">
        <ActionsForm id={entry.id} summary={entry.shareableSummary} initialActions={actions} />
      </SectionCard>
    </div>
  );
}
