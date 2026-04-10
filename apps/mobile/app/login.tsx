import { useState } from "react";
import { Link } from "expo-router";

import { Button } from "@/components/button";
import { Field } from "@/components/field";
import { Screen } from "@/components/screen";
import { SectionCard } from "@/components/section-card";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <Screen
      eyebrow="Authentication shell"
      title="Log in"
      description="Auth is scaffolded for the mobile MVP while the recovery flow gets built out."
    >
      <SectionCard>
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" />
        <Field label="Password" value={password} onChangeText={setPassword} placeholder="Password" />
        <Button label="Log in" />
        <Link asChild href="/(tabs)">
          <Button label="Continue to demo app" variant="secondary" />
        </Link>
      </SectionCard>
    </Screen>
  );
}
