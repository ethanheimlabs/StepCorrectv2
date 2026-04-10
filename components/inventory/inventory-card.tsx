import type { Route } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatLongDate, inventoryEntryHref, inventoryStatusLabel } from "@/lib/utils";
import type { InventoryEntry } from "@/lib/types";

export function InventoryCard({ entry }: { entry: InventoryEntry }) {
  return (
    <Link href={inventoryEntryHref(entry) as Route}>
      <Card className="transition-transform hover:-translate-y-0.5">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-4">
            <Badge>{inventoryStatusLabel(entry.status)}</Badge>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {formatLongDate(entry.createdAt)}
            </p>
          </div>
          <div>
            <p className="line-clamp-2 text-base font-semibold text-foreground">{entry.rawText}</p>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {entry.shareableSummary ?? "Still in progress. Keep going."}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
