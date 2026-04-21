import { PageHeader } from "@/components/app/page-header";
import { SectionCard } from "@/components/app/section-card";
import { SettingsForm } from "@/components/app/settings-form";
import { getProfile } from "@/lib/repositories/profiles";
import { requireCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireCurrentUser();
  const profile =
    (await getProfile(user.id)) ?? {
      id: user.id,
      createdAt: new Date().toISOString(),
      fullName: user.fullName,
      sobrietyDate: null,
      toneMode: user.toneMode
    };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Settings"
        description="Scaffold the basics without slowing the product down."
      />
      <SectionCard title="Profile and preferences" description="Short, practical, and editable.">
        <SettingsForm profile={profile} />
      </SectionCard>
    </div>
  );
}
