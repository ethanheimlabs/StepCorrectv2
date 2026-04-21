import { AppShell } from "@/components/app/app-shell";
import { getProfile } from "@/lib/repositories/profiles";
import { requireCurrentUser } from "@/lib/session";

export default async function AuthenticatedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await requireCurrentUser();
  const profile = await getProfile(user.id);

  return <AppShell fullName={profile?.fullName ?? user.fullName}>{children}</AppShell>;
}
