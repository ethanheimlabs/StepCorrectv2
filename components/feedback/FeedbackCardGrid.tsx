import type { FeedbackCardSet } from "@/lib/types";

import { FeedbackCard } from "./FeedbackCard";

export function FeedbackCardGrid({
  cards
}: {
  cards: FeedbackCardSet;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <FeedbackCard title="Pattern" body={cards.pattern_card} />
      <FeedbackCard title="Impact" body={cards.impact_card} />
      <FeedbackCard title="Behavior" body={cards.behavior_card} />
      <FeedbackCard title="Next right action" body={cards.next_right_action_card} />
    </div>
  );
}
