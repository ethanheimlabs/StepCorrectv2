import { PageHeader } from "@/components/app/page-header";
import { SectionCard } from "@/components/app/section-card";
import { hasAdminEmailsConfigured } from "@/lib/admin";
import { getAdminMetrics } from "@/lib/repositories/admin";
import { requireAdminUser } from "@/lib/session";
import { formatLongDate, formatStepDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdminUser();
  const metrics = await getAdminMetrics();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="User backend"
        description="A grounded view of signups and usage across the app."
      />

      {!hasAdminEmailsConfigured() ? (
        <SectionCard
          title="Admin access not configured"
          description="Add your admin emails in env so only you can open this page."
        >
          <p className="text-sm leading-7 text-muted-foreground">
            Set <code>STEPCORRECT_ADMIN_EMAILS</code> to a comma-separated list like{" "}
            <code>you@example.com</code>.
          </p>
        </SectionCard>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Signed up"
          value={metrics.totalSignedUp}
          detail="Total auth accounts created"
        />
        <MetricCard
          label="Confirmed email"
          value={metrics.confirmedUsers}
          detail="Accounts with confirmed email"
        />
        <MetricCard
          label="Logged in"
          value={metrics.usersWhoLoggedIn}
          detail="Users who signed in at least once"
        />
        <MetricCard
          label="Active in 7 days"
          value={metrics.activeLast7Days}
          detail="Based on last sign-in time"
        />
        <MetricCard
          label="Active in 30 days"
          value={metrics.activeLast30Days}
          detail="Based on last sign-in time"
        />
        <MetricCard
          label="Profiles saved"
          value={metrics.usersWithProfiles}
          detail="Users with profile rows in app data"
        />
      </div>

      <SectionCard
        title="How to read this"
        description="Honest counts are better than inflated ones."
      >
        <p className="text-sm leading-7 text-muted-foreground">{metrics.note}</p>
        {metrics.usesFallback ? (
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            This app is currently showing local fallback counts instead of real Supabase auth data.
          </p>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Recent users"
        description="Newest accounts first, with confirmation and sign-in activity."
      >
        {metrics.recentUsers.length ? (
          <div className="space-y-3">
            {metrics.recentUsers.map((user) => (
              <div
                key={user.id}
                className="rounded-[1.25rem] border border-border/70 bg-white px-4 py-4"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{user.fullName}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Joined {formatLongDate(user.createdAt)}
                  </p>
                </div>

                <div className="mt-3 grid gap-3 text-sm leading-6 text-muted-foreground md:grid-cols-3">
                  <p>
                    <span className="font-semibold text-foreground">Created:</span>{" "}
                    {formatStepDate(user.createdAt)}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Confirmed:</span>{" "}
                    {user.emailConfirmedAt ? formatStepDate(user.emailConfirmedAt) : "Not yet"}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Last sign-in:</span>{" "}
                    {user.lastSignInAt ? formatStepDate(user.lastSignInAt) : "No sign-in yet"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-7 text-muted-foreground">
            No users to show yet.
          </p>
        )}
      </SectionCard>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-white px-5 py-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 font-serif text-4xl leading-none text-foreground">{value}</p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{detail}</p>
    </div>
  );
}
