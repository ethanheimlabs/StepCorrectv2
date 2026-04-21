import Link from "next/link";

import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { InventoryCard } from "@/components/inventory/inventory-card";
import { buttonVariants } from "@/components/ui/button";
import { listInventoryEntries } from "@/lib/repositories/inventory";
import { requireCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function InventoryListPage() {
  const user = await requireCurrentUser();
  const entries = await listInventoryEntries(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Inventory"
        description="Recent resentment work, saved in one place."
        actions={
          <Link className={buttonVariants()} href="/app/inventory/new">
            New inventory
          </Link>
        }
      />

      {entries.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {entries.map((entry) => (
            <InventoryCard key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No inventories yet"
          description="Start with the raw resentment. We’ll help you shape it."
          action={
            <Link className={buttonVariants()} href="/app/inventory/new">
              New inventory
            </Link>
          }
        />
      )}
    </div>
  );
}
