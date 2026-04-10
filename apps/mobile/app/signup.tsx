import { useState } from "react";
import { Link } from "expo-router";

import { Button } from "@/components/button";
import { Field } from "@/components/field";
import { Screen } from "@/components/screen";
import { SectionCard } from "@/components/section-card";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <Screen
      eyebrow="Authentication shell"
      title="Create account"
      description="Use demo access for now while Supabase auth gets wired into mobile."
    >
      <SectionCard>
        <Field label="Name" value={name} onChangeText={setName} placeholder="Your name" />
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" />
        <Field label="Password" value={password} onChangeText={setPassword} placeholder="Password" />
        <Button label="Create account" />
        <Link asChild href="/(tabs)">
          <Button label="Use demo access" variant="secondary" />
        </Link>
      </SectionCard>
    </Screen>
  );
}
