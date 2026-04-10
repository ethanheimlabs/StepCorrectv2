import { Card, CardContent } from "@/components/ui/card";
import type { InventoryProgressStatus } from "@/lib/inventory/progress-stream";

export function LoadingStateCard({
  title,
  description,
  history,
  previewText
}: {
  title: string;
  description: string;
  history?: InventoryProgressStatus[];
  previewText?: string;
}) {
  const recentHistory = (history ?? []).slice(-3, -1);

  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5">
        <div className="mt-1 h-10 w-10 animate-pulse rounded-full bg-primary/15" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>

          {recentHistory.length ? (
            <div className="mt-4 space-y-2">
              {recentHistory.map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  className="rounded-2xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground"
                >
                  <p className="font-semibold text-foreground/80">{item.title}</p>
                  <p className="mt-1 leading-5">{item.description}</p>
                </div>
              ))}
            </div>
          ) : null}

          {previewText?.trim() ? (
            <div className="mt-4 rounded-[1.25rem] border border-border/70 bg-white/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Live draft
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
                {previewText}
              </p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
