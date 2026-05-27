import { redirect } from "next/navigation";

export default async function BreakdownRedirectPage({
  params
}: {
  params: { id: string };
}) {
  redirect(`/app/inventory/${params.id}/breakdown`);
}
