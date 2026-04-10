import Link from "next/link";

import { InventoryShell } from "@/components/inventory/shell";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <InventoryShell
      title="Inventory"
      helperText="That entry is missing or no longer available."
      step="capture"
    >
      <div className="space-y-5">
        <p className="max-w-xl text-muted-foreground">
          Start a fresh inventory and keep moving.
        </p>
        <Link className={buttonVariants()} href="/inventory/new">
          Start new inventory
        </Link>
      </div>
    </InventoryShell>
  );
}
