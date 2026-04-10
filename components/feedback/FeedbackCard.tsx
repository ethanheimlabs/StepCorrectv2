import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function FeedbackCard({
  title,
  body,
  className
}: {
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,251,0.96))] shadow-[0_18px_48px_-28px_rgba(32,51,84,0.45)]",
        className
      )}
    >
      <CardContent className="space-y-3 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          {title}
        </p>
        <p className="font-serif text-xl leading-8 text-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}
