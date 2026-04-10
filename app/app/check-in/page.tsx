import { CheckInForm } from "@/components/check-in/check-in-form";
import { PageHeader } from "@/components/app/page-header";
import { SectionCard } from "@/components/app/section-card";

export default function CheckInPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Daily check-in"
        title="Check in"
        description="Keep it short. Tell the truth about the temperature of the day."
      />
      <SectionCard title="Today’s check-in" description="A small honest read beats a blind day.">
        <CheckInForm />
      </SectionCard>
    </div>
  );
}
