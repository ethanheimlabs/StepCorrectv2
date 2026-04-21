import { redirect } from "next/navigation";

import { SignupForm } from "@/components/auth/signup-form";
import { PublicShell } from "@/components/layout/public-shell";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/session";

export default async function SignupPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/app");
  }

  return (
    <PublicShell>
      <section className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Authentication shell
            </p>
            <h1 className="mt-3 font-serif text-4xl text-foreground">Create account</h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Create your own account so your inventory stays attached to you and no one else.
            </p>

            <SignupForm />
          </CardContent>
        </Card>
      </section>
    </PublicShell>
  );
}
