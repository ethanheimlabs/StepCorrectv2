import { readStore, updateStore } from "@/lib/data/store";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type AdminUserSummary = {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  emailConfirmedAt: string | null;
  lastSignInAt: string | null;
};

export type AdminMetrics = {
  totalSignedUp: number;
  confirmedUsers: number;
  usersWhoLoggedIn: number;
  activeLast7Days: number;
  activeLast30Days: number;
  usersWithProfiles: number;
  recentUsers: AdminUserSummary[];
  usesFallback: boolean;
  note: string;
};

function isWithinDays(value: string | null, days: number) {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
  return date.getTime() >= threshold;
}

function deriveFullName(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}) {
  const metadata = user.user_metadata ?? {};
  const fullName =
    typeof metadata.full_name === "string" && metadata.full_name.trim()
      ? metadata.full_name.trim()
      : typeof metadata.name === "string" && metadata.name.trim()
        ? metadata.name.trim()
        : null;

  return fullName ?? user.email?.split("@")[0] ?? "Member";
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const allUsers: Array<{
      id: string;
      email?: string | null;
      created_at?: string;
      email_confirmed_at?: string | null;
      last_sign_in_at?: string | null;
      user_metadata?: Record<string, unknown> | null;
    }> = [];

    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await supabase.auth.admin.listUsers({
        page,
        perPage
      });

      if (response.error) {
        throw response.error;
      }

      allUsers.push(...response.data.users);

      if (response.data.users.length < perPage) {
        break;
      }

      page += 1;
    }

    const profilesResponse = await supabase.from("profiles").select("id", {
      count: "exact",
      head: true
    });

    if (profilesResponse.error) {
      throw profilesResponse.error;
    }

    const recentUsers = [...allUsers]
      .sort((left, right) => {
        const leftTime = new Date(left.created_at ?? 0).getTime();
        const rightTime = new Date(right.created_at ?? 0).getTime();
        return rightTime - leftTime;
      })
      .slice(0, 12)
      .map((user) => ({
        id: user.id,
        email: user.email ?? "No email",
        fullName: deriveFullName(user),
        createdAt: user.created_at ?? new Date(0).toISOString(),
        emailConfirmedAt: user.email_confirmed_at ?? null,
        lastSignInAt: user.last_sign_in_at ?? null
      }));

    return {
      totalSignedUp: allUsers.length,
      confirmedUsers: allUsers.filter((user) => Boolean(user.email_confirmed_at)).length,
      usersWhoLoggedIn: allUsers.filter((user) => Boolean(user.last_sign_in_at)).length,
      activeLast7Days: allUsers.filter((user) => isWithinDays(user.last_sign_in_at ?? null, 7))
        .length,
      activeLast30Days: allUsers.filter((user) =>
        isWithinDays(user.last_sign_in_at ?? null, 30)
      ).length,
      usersWithProfiles: profilesResponse.count ?? 0,
      recentUsers,
      usesFallback: false,
      note:
        "“Logged in” here means at least one successful sign-in. Active counts are based on the user's last sign-in timestamp, not live sessions."
    };
  }

  const store = await readStore();
  const recentUsers = Object.values(store.profiles)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 12)
    .map((profile) => ({
      id: profile.id,
      email: "Local demo user",
      fullName: profile.fullName ?? "Member",
      createdAt: profile.createdAt,
      emailConfirmedAt: profile.createdAt,
      lastSignInAt: profile.createdAt
    }));

  return {
    totalSignedUp: recentUsers.length,
    confirmedUsers: recentUsers.length,
    usersWhoLoggedIn: recentUsers.length,
    activeLast7Days: recentUsers.length,
    activeLast30Days: recentUsers.length,
    usersWithProfiles: recentUsers.length,
    recentUsers,
    usesFallback: true,
    note:
      "This is local fallback data. For real auth user counts, keep Supabase service-role access configured."
  };
}

export async function deleteUserAccount(userId: string) {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const deleteInventoryEntries = await supabase
      .from("inventory_entries")
      .delete()
      .eq("user_id", userId);

    if (deleteInventoryEntries.error) {
      throw deleteInventoryEntries.error;
    }

    const deletions = await Promise.all([
      supabase.from("inventory_actions").delete().eq("user_id", userId),
      supabase.from("inventory_entry_embeddings").delete().eq("user_id", userId),
      supabase.from("pattern_feedback").delete().eq("user_id", userId),
      supabase.from("daily_checkins").delete().eq("user_id", userId),
      supabase.from("step_progress").delete().eq("user_id", userId),
      supabase.from("profiles").delete().eq("id", userId)
    ]);

    for (const result of deletions) {
      if (result.error) {
        throw result.error;
      }
    }

    const deleteAuthUser = await supabase.auth.admin.deleteUser(userId);

    if (deleteAuthUser.error) {
      throw deleteAuthUser.error;
    }

    return;
  }

  await updateStore((store) => {
    const profiles = { ...store.profiles };
    const inventoryEntries = { ...store.inventoryEntries };
    const inventoryActions = { ...store.inventoryActions };
    const inventoryEntryEmbeddings = { ...store.inventoryEntryEmbeddings };
    const patternFeedback = { ...store.patternFeedback };
    const dailyCheckins = { ...store.dailyCheckins };
    const stepProgress = { ...store.stepProgress };

    delete profiles[userId];

    for (const [entryId, entry] of Object.entries(inventoryEntries)) {
      if (entry.userId === userId) {
        delete inventoryEntries[entryId];
      }
    }

    for (const [actionId, action] of Object.entries(inventoryActions)) {
      if (action.userId === userId || !inventoryEntries[action.entryId]) {
        delete inventoryActions[actionId];
      }
    }

    for (const [embeddingId, embedding] of Object.entries(inventoryEntryEmbeddings)) {
      if (embedding.userId === userId || !inventoryEntries[embedding.entryId]) {
        delete inventoryEntryEmbeddings[embeddingId];
      }
    }

    for (const [feedbackId, feedback] of Object.entries(patternFeedback)) {
      if (feedback.userId === userId) {
        delete patternFeedback[feedbackId];
      }
    }

    for (const [checkInId, checkIn] of Object.entries(dailyCheckins)) {
      if (checkIn.userId === userId) {
        delete dailyCheckins[checkInId];
      }
    }

    for (const [stepId, step] of Object.entries(stepProgress)) {
      if (step.userId === userId) {
        delete stepProgress[stepId];
      }
    }

    return {
      ...store,
      profiles,
      inventoryEntries,
      inventoryActions,
      inventoryEntryEmbeddings,
      patternFeedback,
      dailyCheckins,
      stepProgress
    };
  });
}
