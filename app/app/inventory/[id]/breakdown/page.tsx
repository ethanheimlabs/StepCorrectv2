import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { DeleteInventoryButton } from "@/components/inventory/delete-inventory-button";
import { ResentmentBreakdownCard } from "@/components/inventory/resentment-breakdown-card";
import { buttonVariants } from "@/components/ui/button";
import { getInventoryEntry } from "@/lib/repositories/inventory";

export const dynamic = "force-dynamic";

export default async function InventoryBreakdownPage({
  params
}: {
  params: { id: string };
}) {
  const entry = await getInventoryEntry(params.id);

  if (!entry || !entry.extractedResentment) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Resentment breakdown"
        description="Built from the inventory you just reviewed."
        actions={
          <>
            <Link className={buttonVariants()} href={`/app/inventory/${entry.id}/review`}>
              Edit columns
            </Link>
            <DeleteInventoryButton inventoryId={entry.id} />
          </>
        }
      />

      <ResentmentBreakdownCard extraction={entry.extractedResentment} />

      <div className="flex justify-end">
        <Link className={buttonVariants()} href={`/app/inventory/${entry.id}/actions`}>
          Continue to actions
        </Link>
      </div>
    </div>
  );
}
